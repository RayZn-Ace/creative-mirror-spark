DO $$ DECLARE def text; marker text; BEGIN
 SELECT pg_get_functiondef('public.reservation_inventory(uuid,timestamptz,uuid)'::regprocedure) INTO def;
 marker:=E'FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) x\n  WHERE o.event_id=p_event AND o.status=''paid''';
 IF position(marker IN def)=0 THEN RAISE EXCEPTION 'Unexpected paid inventory definition'; END IF;
 def:=replace(def,marker,E'FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) x LEFT JOIN ticket_categories c ON c.id=NULLIF(x->>''ticketId'','''')::uuid\n  WHERE o.event_id=p_event AND o.status=''paid''');
 def:=replace(def,'coalesce((x->>''group_size'')::int,1)','coalesce((x->>''group_size'')::int,c.group_size,1)');
 EXECUTE def;
END $$;
CREATE OR REPLACE FUNCTION public.refresh_order_scarcity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF NEW.event_id IS NOT NULL THEN PERFORM public.apply_reservation_scarcity(NEW.event_id); END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER refresh_order_scarcity AFTER INSERT OR UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.refresh_order_scarcity();
CREATE OR REPLACE FUNCTION public.refresh_event_scarcity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 PERFORM public.apply_reservation_scarcity(NEW.id);
 RETURN NEW;
END; $$;
CREATE TRIGGER refresh_event_scarcity AFTER UPDATE OF max_capacity ON public.events FOR EACH ROW EXECUTE FUNCTION public.refresh_event_scarcity();
CREATE OR REPLACE FUNCTION public.refresh_category_scarcity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 PERFORM public.apply_reservation_scarcity(NEW.event_id);
 RETURN NEW;
END; $$;
CREATE TRIGGER refresh_category_scarcity AFTER UPDATE OF max_capacity,group_size ON public.ticket_categories FOR EACH ROW EXECUTE FUNCTION public.refresh_category_scarcity();
REVOKE ALL ON FUNCTION public.guard_reservation_deadline(),public.guard_new_order_stock(),public.guard_ticket_stock(),public.refresh_order_scarcity(),public.refresh_event_scarcity(),public.refresh_category_scarcity() FROM PUBLIC,anon,authenticated;