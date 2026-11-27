-- Application-owned, service-only stock logic. Applied via the migration tool.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_capacity integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reservation_scarcity_expires_at timestamptz,
 ADD COLUMN IF NOT EXISTS reservation_released_at timestamptz,
 ADD COLUMN IF NOT EXISTS payment_started_at timestamptz,
 ADD COLUMN IF NOT EXISTS payment_reconciliation_required boolean NOT NULL DEFAULT false;
UPDATE public.orders SET payment_started_at=created_at WHERE status='pending' AND reservation_expires_at IS NULL AND payment_provider IS NOT NULL;

CREATE OR REPLACE FUNCTION public.reservation_inventory(p_event uuid, p_now timestamptz DEFAULT now(), p_exclude uuid DEFAULT NULL)
RETURNS TABLE(ticket_category_id uuid, sold bigint, reserved bigint, available bigint, scarce boolean, event_available bigint, event_sold bigint, event_reserved bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 WITH issued AS (
  SELECT t.ticket_category_id, count(*) n FROM tickets t WHERE t.event_id=p_event AND t.status IN ('valid','checked_in') AND t.order_id IS DISTINCT FROM p_exclude GROUP BY t.ticket_category_id
 ), unissued_paid AS (
  SELECT NULLIF(x->>'ticketId','')::uuid cat, sum((x->>'quantity')::int * greatest(1,coalesce((x->>'group_size')::int,1))) n
  FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) x
  WHERE o.event_id=p_event AND o.status='paid' AND NOT o.payment_reconciliation_required AND o.id IS DISTINCT FROM p_exclude
  AND NOT EXISTS(SELECT 1 FROM tickets t WHERE t.order_id=o.id)
  GROUP BY NULLIF(x->>'ticketId','')::uuid
 ), holds AS (
  SELECT NULLIF(x->>'ticketId','')::uuid cat, sum((x->>'quantity')::int * greatest(1,coalesce((x->>'group_size')::int,c.group_size,1))) n
  FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) x LEFT JOIN ticket_categories c ON c.id=NULLIF(x->>'ticketId','')::uuid
  WHERE o.event_id=p_event AND o.status='pending' AND o.reservation_released_at IS NULL AND o.id IS DISTINCT FROM p_exclude
  -- Unverified provider starts are payment holds, not safely reusable stock.
  AND (o.reservation_expires_at IS NULL OR o.reservation_expires_at>p_now OR o.payment_started_at IS NOT NULL OR o.mollie_payment_id IS NOT NULL OR o.stripe_payment_id IS NOT NULL)
  GROUP BY NULLIF(x->>'ticketId','')::uuid
 ), totals AS (
  SELECT coalesce((SELECT sum(n) FROM issued),0)+coalesce((SELECT sum(n) FROM unissued_paid),0) s, coalesce((SELECT sum(n) FROM holds),0) r,
  (SELECT max_capacity FROM events WHERE id=p_event) lim
 ), cats AS (
  SELECT c.id,c.max_capacity,coalesce(i.n,0)+coalesce(u.n,0) s,coalesce(h.n,0) r FROM ticket_categories c
  LEFT JOIN issued i ON i.ticket_category_id=c.id LEFT JOIN unissued_paid u ON u.cat=c.id LEFT JOIN holds h ON h.cat=c.id WHERE c.event_id=p_event
 )
 SELECT c.id,c.s,c.r,
 CASE WHEN c.max_capacity>0 OR t.lim>0 THEN greatest(0,least(CASE WHEN c.max_capacity>0 THEN c.max_capacity-c.s-c.r ELSE NULL END,CASE WHEN t.lim>0 THEN t.lim-t.s-t.r ELSE NULL END)) ELSE NULL END::bigint,
 coalesce(c.max_capacity>0 AND (c.max_capacity-c.s-c.r)*10<c.max_capacity,false) OR coalesce(t.lim>0 AND (t.lim-t.s-t.r)*10<t.lim,false),
 CASE WHEN t.lim>0 THEN greatest(0,t.lim-t.s-t.r) ELSE NULL END::bigint,t.s::bigint,t.r::bigint
 FROM cats c CROSS JOIN totals t;
$$;
REVOKE ALL ON FUNCTION public.reservation_inventory(uuid,timestamptz,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reservation_inventory(uuid,timestamptz,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_reservation_scarcity(p_event uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE scarce_ids uuid[];
BEGIN
 PERFORM id FROM events WHERE id=p_event FOR UPDATE;
 SELECT array_agg(ticket_category_id) INTO scarce_ids FROM reservation_inventory(p_event) WHERE scarce;
 IF scarce_ids IS NULL THEN RETURN; END IF;
 UPDATE orders o SET reservation_scarcity_expires_at=least(o.reservation_scarcity_expires_at,o.created_at+interval '20 minutes'),
 reservation_expires_at=least(o.reservation_expires_at,o.created_at+interval '20 minutes')
 WHERE o.event_id=p_event AND o.status='pending' AND o.reservation_released_at IS NULL
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(o.items) x WHERE NULLIF(x->>'ticketId','')::uuid=ANY(scarce_ids))
 AND (o.reservation_scarcity_expires_at IS NULL OR o.reservation_scarcity_expires_at>o.created_at+interval '20 minutes');
END; $$;
REVOKE ALL ON FUNCTION public.apply_reservation_scarcity(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_reservation_scarcity(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.guard_reservation_deadline() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  NEW.reservation_scarcity_expires_at:=least(OLD.reservation_scarcity_expires_at,NEW.reservation_scarcity_expires_at);
  NEW.reservation_released_at:=coalesce(OLD.reservation_released_at,NEW.reservation_released_at);
  NEW.payment_started_at:=coalesce(OLD.payment_started_at,NEW.payment_started_at);
  IF OLD.reservation_scarcity_expires_at IS NOT NULL THEN NEW.created_at:=OLD.created_at; END IF;
 END IF;
 NEW.reservation_expires_at:=least(NEW.reservation_expires_at,NEW.reservation_scarcity_expires_at);
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_reservation_deadline BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_reservation_deadline();

CREATE OR REPLACE FUNCTION public.reservation_fits(p_event uuid,p_items jsonb,p_exclude uuid DEFAULT NULL) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 WITH requested AS (
 SELECT NULLIF(x->>'ticketId','')::uuid id,sum((x->>'quantity')::int*greatest(1,coalesce((x->>'group_size')::int,c.group_size,1))) n
 FROM jsonb_array_elements(p_items) x LEFT JOIN ticket_categories c ON c.id=NULLIF(x->>'ticketId','')::uuid GROUP BY NULLIF(x->>'ticketId','')::uuid
 ), inv AS (SELECT * FROM reservation_inventory(p_event,now(),p_exclude)), ev AS (
 SELECT e.max_capacity,coalesce((SELECT count(*) FROM tickets WHERE event_id=p_event AND status IN ('valid','checked_in') AND order_id IS DISTINCT FROM p_exclude),0)
 +coalesce((SELECT sum((x->>'quantity')::int*greatest(1,coalesce((x->>'group_size')::int,c.group_size,1))) FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) x LEFT JOIN ticket_categories c ON c.id=NULLIF(x->>'ticketId','')::uuid WHERE o.event_id=p_event AND o.id IS DISTINCT FROM p_exclude AND ((o.status='pending' AND o.reservation_released_at IS NULL AND (o.reservation_expires_at IS NULL OR o.reservation_expires_at>now() OR o.payment_started_at IS NOT NULL OR o.mollie_payment_id IS NOT NULL OR o.stripe_payment_id IS NOT NULL)) OR (o.status='paid' AND NOT o.payment_reconciliation_required AND NOT EXISTS(SELECT 1 FROM tickets t WHERE t.order_id=o.id)))),0) occupied FROM events e WHERE e.id=p_event
 )
 SELECT NOT EXISTS(SELECT 1 FROM requested r JOIN inv i ON i.ticket_category_id=r.id WHERE i.available IS NOT NULL AND r.n>i.available)
 AND NOT EXISTS(SELECT 1 FROM ev WHERE max_capacity>0 AND occupied+(SELECT sum(n) FROM requested)>max_capacity);
$$;
REVOKE ALL ON FUNCTION public.reservation_fits(uuid,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reservation_fits(uuid,jsonb,uuid) TO service_role;

-- Patch the known transaction bodies without changing price, fee or discount rules.
DO $$ DECLARE def text; marker text; BEGIN
 SELECT pg_get_functiondef('public.reserve_ticket_order(jsonb,text)'::regprocedure) INTO def;
 marker:=' PERFORM id FROM public.ticket_categories WHERE id IN';
 IF position(marker IN def)=0 THEN RAISE EXCEPTION 'Unexpected reserve function; manual review required'; END IF;
 def:=replace(def,marker,E' PERFORM public.apply_reservation_scarcity(e.id);\n IF NOT public.reservation_fits(e.id,p_body->''items'') THEN RAISE EXCEPTION ''Nicht genügend Tickets verfügbar.''; END IF;\n'||marker);
 marker:=' RETURN jsonb_build_object(''id'',oid';
 IF position(marker IN def)=0 THEN RAISE EXCEPTION 'Unexpected reserve return'; END IF;
 def:=replace(def,marker,E' PERFORM public.apply_reservation_scarcity(e.id);\n'||marker);
 EXECUTE def;
 SELECT pg_get_functiondef('public.finalize_ticket_payment(uuid,text,text,text,bigint,text,timestamptz)'::regprocedure) INTO def;
 marker:=' SELECT * INTO o FROM public.orders WHERE id=p_order FOR UPDATE;';
 IF position(marker IN def)=0 THEN RAISE EXCEPTION 'Unexpected finalize function'; END IF;
 def:=replace(def,marker,E' PERFORM id FROM public.events WHERE id=(SELECT event_id FROM public.orders WHERE id=p_order) FOR UPDATE;\n'||marker);
 marker:='   FOR i IN SELECT * FROM jsonb_array_elements(o.items) LOOP';
 IF position(marker IN def)=0 THEN RAISE EXCEPTION 'Unexpected ticket issuance'; END IF;
 def:=replace(def,marker,E'   IF NOT public.reservation_fits(o.event_id,o.items,o.id) THEN\n    UPDATE public.orders SET status=''paid'',paid_at=coalesce(paid_at,p_paid_at,now()),payment_reconciliation_required=true,ticket_email_state=''reconciliation'',reservation_released_at=coalesce(reservation_released_at,now()) WHERE id=o.id;\n    RETURN jsonb_build_object(''send_email'',false,''generated'',0,''reconciliation_required'',true);\n   END IF;\n'||marker);
 marker:='  UPDATE public.orders SET status=p_status WHERE id=o.id AND status<>''paid'';';
 IF position(marker IN def)=0 THEN RAISE EXCEPTION 'Unexpected terminal payment update'; END IF;
 def:=replace(def,marker,'  UPDATE public.orders SET status=p_status,reservation_released_at=CASE WHEN p_status IN (''failed'',''cancelled'') THEN coalesce(reservation_released_at,now()) ELSE reservation_released_at END WHERE id=o.id AND status<>''paid'';');
 -- A repeated paid callback must not silently turn a manual reconciliation into tickets.
 marker:=' IF p_status=''paid'' THEN';
 def:=replace(def,marker,E' IF o.payment_reconciliation_required THEN RETURN jsonb_build_object(''send_email'',false,''generated'',0,''reconciliation_required'',true); END IF;\n'||marker);
 marker:=' RETURN jsonb_build_object(''send_email'',p_status=';
 IF position(marker IN def)=0 THEN RAISE EXCEPTION 'Unexpected finalize return'; END IF;
 def:=replace(def,marker,E' PERFORM public.apply_reservation_scarcity(o.event_id);\n'||marker);
 EXECUTE def;
END $$;

CREATE OR REPLACE FUNCTION public.guard_new_order_stock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.status IN ('pending','paid') AND NEW.event_id IS NOT NULL THEN
  PERFORM id FROM events WHERE id=NEW.event_id FOR UPDATE;
  IF NOT public.reservation_fits(NEW.event_id,NEW.items) THEN RAISE EXCEPTION 'Nicht genügend Tickets verfügbar.'; END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_new_order_stock BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.guard_new_order_stock();

-- Atomic stock guard also covers privileged free/import ticket insertion.
CREATE OR REPLACE FUNCTION public.guard_ticket_stock() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE requested jsonb;
BEGIN
 IF NEW.status NOT IN ('valid','checked_in') THEN RETURN NEW; END IF;
 PERFORM id FROM events WHERE id=NEW.event_id FOR UPDATE;
 SELECT jsonb_agg(jsonb_build_object('ticketId',cat,'quantity',n,'group_size',1)) INTO requested FROM (
 SELECT cat,count(*) n FROM (SELECT ticket_category_id cat FROM tickets WHERE order_id=NEW.order_id AND event_id=NEW.event_id AND status IN ('valid','checked_in') UNION ALL SELECT NEW.ticket_category_id) t GROUP BY cat
 ) counted;
 IF NOT public.reservation_fits(NEW.event_id,requested,NEW.order_id) THEN RAISE EXCEPTION 'Nicht genügend Tickets verfügbar.'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER guard_ticket_stock BEFORE INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.guard_ticket_stock();

CREATE OR REPLACE FUNCTION public.ticket_inventory(p_event uuid)
RETURNS TABLE(ticket_category_id uuid,sold bigint,reserved bigint,available bigint,scarce boolean,event_available bigint,event_sold bigint,event_reserved bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM events WHERE id=p_event AND (status='published' OR public.has_role(auth.uid(),'admin') OR public.manages_series(auth.uid(),series_id))) THEN RETURN; END IF;
 PERFORM public.apply_reservation_scarcity(p_event);
 RETURN QUERY SELECT * FROM public.reservation_inventory(p_event);
END; $$;
REVOKE ALL ON FUNCTION public.ticket_inventory(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ticket_inventory(uuid) TO anon,authenticated,service_role;

-- Only expose the deadline and reconciliation flag in the existing guest capability.
DO $$ DECLARE def text; marker text; BEGIN
 SELECT pg_get_functiondef('public.get_order_confirmation(uuid)'::regprocedure) INTO def;
 marker:='''created_at'',o.created_at';
 IF position(marker IN def)=0 THEN RAISE EXCEPTION 'Unexpected confirmation payload'; END IF;
 EXECUTE replace(def,marker,'''reservation_expires_at'',o.reservation_expires_at,''payment_reconciliation_required'',o.payment_reconciliation_required,'||marker);
END $$;

-- Backfill only pending leases in scarce stock; never alter paid financial rows.
SELECT public.apply_reservation_scarcity(id) FROM public.events WHERE EXISTS(SELECT 1 FROM public.orders o WHERE o.event_id=events.id AND o.status='pending');