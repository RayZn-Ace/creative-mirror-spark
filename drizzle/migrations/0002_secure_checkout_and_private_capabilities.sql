ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_provider text, ADD COLUMN IF NOT EXISTS provider_amount_minor bigint, ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz, ADD COLUMN IF NOT EXISTS coupon_id uuid, ADD COLUMN IF NOT EXISTS ticket_email_state text;
ALTER TABLE public.u18_forms ADD COLUMN IF NOT EXISTS access_token_hash text;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
REVOKE INSERT ON public.orders FROM anon;
DROP POLICY IF EXISTS "Anyone can view active scanner links" ON public.scanner_links;
REVOKE SELECT ON public.scanner_links FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_loyalty_for_paid_order_backfill(public.orders) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_loyalty_for_paid_order_backfill(public.orders) TO service_role;
CREATE OR REPLACE FUNCTION public.reserve_ticket_order(p_body jsonb, p_provider text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE e public.events; c public.ticket_categories; cp public.coupons; i jsonb; result_items jsonb := '[]'; qty int; persons int; sold int; reserved int; subtotal numeric := 0; discount numeric := 0; fee numeric := 0; insurance numeric := 0; oid uuid; coupon_uuid uuid; total_qty int := 0;
BEGIN
 IF p_provider NOT IN ('mollie','stripe') OR jsonb_typeof(p_body->'items') <> 'array' OR jsonb_array_length(p_body->'items') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Ungültige Bestellung.'; END IF;
 SELECT * INTO e FROM public.events WHERE id=(p_body->>'eventId')::uuid;
 IF NOT FOUND OR e.status IS DISTINCT FROM 'published' OR e.sold_out IS TRUE OR e.date < (now() AT TIME ZONE 'Europe/Berlin')::date THEN RAISE EXCEPTION 'Veranstaltung nicht verfügbar.'; END IF;
 PERFORM id FROM public.ticket_categories WHERE id IN (SELECT (x->>'ticketId')::uuid FROM jsonb_array_elements(p_body->'items') x) ORDER BY id FOR UPDATE;
 IF (SELECT count(DISTINCT x->>'ticketId') FROM jsonb_array_elements(p_body->'items') x) <> jsonb_array_length(p_body->'items') THEN RAISE EXCEPTION 'Doppelte Ticketkategorie.'; END IF;
 FOR i IN SELECT * FROM jsonb_array_elements(p_body->'items') LOOP
  qty := (i->>'quantity')::int;
  IF qty NOT BETWEEN 1 AND 99 THEN RAISE EXCEPTION 'Bitte wähle 1 bis 99 Tickets je Kategorie.'; END IF;
  SELECT * INTO c FROM public.ticket_categories WHERE id=(i->>'ticketId')::uuid AND event_id=e.id;
  IF NOT FOUND OR c.sold_out IS TRUE OR c.internal_only IS TRUE OR c.coming_soon IS TRUE OR c.price < 0 OR (c.sale_start IS NOT NULL AND c.sale_start>now()) OR (c.sale_end IS NOT NULL AND c.sale_end<now()) THEN RAISE EXCEPTION 'Ticketkategorie nicht verfügbar.'; END IF;
  persons := qty * GREATEST(1,COALESCE(c.group_size,1));
  SELECT count(*) INTO sold FROM public.tickets WHERE ticket_category_id=c.id AND status IN ('valid','checked_in');
  SELECT COALESCE(sum((x->>'quantity')::int * GREATEST(1,COALESCE((x->>'group_size')::int,1))),0)::int INTO reserved FROM public.orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) x WHERE o.event_id=e.id AND o.payment_provider IS NOT NULL AND o.status='pending' AND (o.reservation_expires_at IS NULL OR o.reservation_expires_at>now()) AND x->>'ticketId'=c.id::text;
  IF c.max_capacity>0 AND sold+reserved+persons>c.max_capacity THEN RAISE EXCEPTION 'Nicht genügend Tickets verfügbar.'; END IF;
  subtotal := subtotal + round(c.price,2)*qty; total_qty := total_qty+qty;
  result_items := result_items || jsonb_build_array(jsonb_build_object('ticketId',c.id,'name',c.name,'quantity',qty,'priceEur',round(c.price,2),'group_size',GREATEST(1,COALESCE(c.group_size,1))));
 END LOOP;
 IF COALESCE(p_body->>'discountCode','')<>'' THEN
  SELECT * INTO cp FROM public.coupons WHERE code=upper(trim(p_body->>'discountCode')) AND active=true FOR UPDATE;
  IF NOT FOUND OR (cp.event_id IS NOT NULL AND cp.event_id<>e.id) OR (cp.valid_from IS NOT NULL AND cp.valid_from>now()) OR (cp.valid_until IS NOT NULL AND cp.valid_until<now()) OR COALESCE(cp.min_order_amount,0)>subtotal THEN RAISE EXCEPTION 'Gutschein nicht gültig.'; END IF;
  SELECT count(*) INTO reserved FROM public.orders WHERE coupon_id=cp.id AND status='pending' AND (reservation_expires_at IS NULL OR reservation_expires_at>now());
  IF cp.max_uses>0 AND cp.used_count+reserved>=cp.max_uses THEN RAISE EXCEPTION 'Gutschein ausgeschöpft.'; END IF;
  discount := LEAST(subtotal,GREATEST(0,CASE WHEN cp.discount_type='percentage' THEN round(subtotal*cp.discount_value/100,2) ELSE cp.discount_value END)); coupon_uuid:=cp.id;
 END IF;
 subtotal := subtotal-discount;
 IF e.service_fee_enabled IS TRUE AND e.service_fee_value>0 THEN fee := CASE WHEN e.service_fee_type='percentage' THEN round(subtotal*e.service_fee_value/100,2) WHEN e.service_fee_mode='per_ticket' THEN round(e.service_fee_value*total_qty,2) ELSE round(e.service_fee_value,2) END; END IF;
 IF (p_body->>'insuranceAccepted')::boolean IS TRUE AND e.insurance_enabled IS TRUE AND e.insurance_amount>0 THEN insurance:=round(e.insurance_amount*total_qty,2); END IF;
 INSERT INTO public.orders(email,name,phone,birth_date,event_id,items,total_amount,currency,service_fee,insurance_fee,status,payment_provider,reservation_expires_at,coupon_id)
 VALUES(p_body->>'email',p_body->>'name',p_body->>'phone',NULLIF(p_body->>'birthDate','')::date,e.id,result_items,subtotal+fee+insurance,p_body->>'currency',fee,insurance,'pending',p_provider,now()+interval '15 minutes',coupon_uuid) RETURNING id INTO oid;
 RETURN jsonb_build_object('id',oid,'total',subtotal+fee+insurance,'items',result_items,'discount',discount,'title',e.title);
END; $$;
REVOKE ALL ON FUNCTION public.reserve_ticket_order(jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ticket_order(jsonb,text) TO service_role;
CREATE OR REPLACE FUNCTION public.finalize_ticket_payment(p_order uuid,p_provider text,p_payment_id text,p_currency text,p_amount bigint,p_status text,p_paid_at timestamptz) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE o public.orders; i jsonb; n int; gs int; generated int:=0; expected bigint; inserted boolean:=false;
BEGIN
 IF p_provider NOT IN ('mollie','stripe') OR p_status NOT IN ('paid','pending','failed','cancelled') THEN RAISE EXCEPTION 'Ungültiger Zahlungsstatus.'; END IF;
 SELECT * INTO o FROM public.orders WHERE id=p_order FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Bestellung nicht gefunden.'; END IF;
 IF (p_provider='mollie' AND o.mollie_payment_id IS DISTINCT FROM p_payment_id) OR (p_provider='stripe' AND o.stripe_payment_id IS DISTINCT FROM p_payment_id) OR (o.payment_provider IS NOT NULL AND o.payment_provider<>p_provider) OR upper(o.currency)<>upper(p_currency) THEN RAISE EXCEPTION 'Zahlungszuordnung stimmt nicht überein.'; END IF;
 expected:=o.provider_amount_minor;
 IF expected IS NULL THEN
  IF upper(o.currency)<>'EUR' THEN RAISE EXCEPTION 'Alte Fremdwährungszahlung erfordert Prüfung.'; END IF;
  expected:=round(o.total_amount*100)::bigint;
 END IF;
 IF p_amount IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Zahlungsbetrag stimmt nicht überein.'; END IF;
 IF o.status='paid' AND p_status<>'paid' THEN RETURN jsonb_build_object('send_email',false); END IF;
 PERFORM id FROM public.ticket_categories WHERE id IN (SELECT (x->>'ticketId')::uuid FROM jsonb_array_elements(o.items) x WHERE x->>'ticketId' IS NOT NULL) ORDER BY id FOR UPDATE;
 IF p_status='paid' THEN
  IF NOT EXISTS (SELECT 1 FROM public.tickets WHERE order_id=o.id) THEN
   FOR i IN SELECT * FROM jsonb_array_elements(o.items) LOOP
    gs := (i->>'group_size')::int;
    IF gs IS NULL THEN SELECT group_size INTO gs FROM public.ticket_categories WHERE id=(i->>'ticketId')::uuid; END IF;
    gs:=GREATEST(1,COALESCE(gs,1));
    FOR n IN 1..((i->>'quantity')::int*gs) LOOP
     INSERT INTO public.tickets(order_id,event_id,ticket_category_id,holder_name,holder_email,qr_code,status) VALUES(o.id,o.event_id,(i->>'ticketId')::uuid,o.name,o.email,upper(encode(extensions.gen_random_bytes(16),'hex')),'valid'); generated:=generated+1;
    END LOOP;
   END LOOP;
   inserted:=generated>0;
  END IF;
  IF o.status<>'paid' AND o.coupon_id IS NOT NULL THEN UPDATE public.coupons SET used_count=used_count+1 WHERE id=o.coupon_id; END IF;
  UPDATE public.orders SET status='paid',paid_at=COALESCE(paid_at,p_paid_at,now()),ticket_email_state=CASE WHEN inserted THEN 'pending' ELSE ticket_email_state END WHERE id=o.id;
 ELSE
  UPDATE public.orders SET status=p_status WHERE id=o.id AND status<>'paid';
 END IF;
 RETURN jsonb_build_object('send_email',p_status='paid' AND (inserted OR o.ticket_email_state='pending'),'generated',generated);
END; $$;
REVOKE ALL ON FUNCTION public.finalize_ticket_payment(uuid,text,text,text,bigint,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_ticket_payment(uuid,text,text,text,bigint,text,timestamptz) TO service_role;
CREATE OR REPLACE FUNCTION public.validate_u18_submission() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE f record; ev public.events;
BEGIN
 FOR f IN SELECT key,value FROM jsonb_each_text(to_jsonb(NEW)) LOOP
  IF f.key IN ('parent_signature','supervisor_signature') THEN
   IF length(f.value)>200000 OR (f.value IS NOT NULL AND f.value !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$') THEN RAISE EXCEPTION 'Ungültige Unterschrift.' USING ERRCODE='22023'; END IF;
  ELSIF length(f.value)>1000 THEN RAISE EXCEPTION 'Eingabe zu lang.' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF NEW.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(NEW.email)>255 OR length(trim(NEW.parent_name))<1 OR length(trim(NEW.minor_name))<1 OR NEW.parent_birthday IS NULL OR NEW.minor_birthday IS NULL OR date_part('year',age(CURRENT_DATE,NEW.parent_birthday))<18 OR date_part('year',age(CURRENT_DATE,NEW.minor_birthday)) NOT BETWEEN 16 AND 17 OR (NEW.supervisor_birthday IS NOT NULL AND date_part('year',age(CURRENT_DATE,NEW.supervisor_birthday))<18) THEN RAISE EXCEPTION 'Bitte prüfe Namen, E-Mail und Altersangaben.' USING ERRCODE='22023'; END IF;
 IF NEW.access_token_hash IS NOT NULL AND NEW.access_token_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Ungültiger Dokumentzugang.' USING ERRCODE='22023'; END IF;
 IF NEW.event_id IS NOT NULL THEN SELECT * INTO ev FROM public.events WHERE id=NEW.event_id; IF NOT FOUND OR ev.status IS DISTINCT FROM 'published' OR ev.is_16plus IS DISTINCT FROM true THEN RAISE EXCEPTION 'Muttizettel nur für 16+ Veranstaltungen.' USING ERRCODE='22023'; END IF; NEW.event_title:=ev.title; NEW.event_date:=ev.date; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER validate_u18_submission BEFORE INSERT ON public.u18_forms FOR EACH ROW EXECUTE FUNCTION public.validate_u18_submission();
CREATE INDEX IF NOT EXISTS orders_active_reservation_idx ON public.orders(event_id,status) WHERE payment_provider IS NOT NULL AND status='pending';