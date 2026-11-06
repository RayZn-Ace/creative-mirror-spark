ALTER TABLE public.events ALTER COLUMN is_16plus DROP DEFAULT;
CREATE OR REPLACE FUNCTION public.validate_event_age_selection() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_16plus IS NULL THEN RAISE EXCEPTION 'Bitte 16 oder 18 Jahre auswählen.' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER validate_event_age_selection BEFORE INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.validate_event_age_selection();
CREATE OR REPLACE FUNCTION public.create_missing_ticket_request(_order_number text, _first_name text, _last_name text, _email text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF _order_number IS NULL OR length(trim(_order_number)) NOT BETWEEN 1 AND 100 OR trim(_order_number) !~ '^[[:alnum:][:space:]._/\#-]+$' OR _first_name IS NULL OR length(trim(_first_name)) NOT BETWEEN 1 AND 100 OR _last_name IS NULL OR length(trim(_last_name)) NOT BETWEEN 1 AND 100 OR _email IS NULL OR length(trim(_email)) > 255 OR trim(_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN
    RAISE EXCEPTION 'Bitte prüfe deine Bestelldaten.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.support_tickets (category, status, priority, subject, customer_name, customer_email, source, metadata)
  VALUES ('support', 'open', 'normal', 'Ticket nicht erhalten – ' || trim(_order_number), trim(_first_name) || ' ' || trim(_last_name), lower(trim(_email)), 'ticket-not-received-form', jsonb_build_object('request_type', 'ticket_not_received', 'order_number', trim(_order_number), 'first_name', trim(_first_name), 'last_name', trim(_last_name))) RETURNING id INTO v_id;
  RETURN jsonb_build_object('ok', true);
END;
$$;
REVOKE ALL ON FUNCTION public.create_missing_ticket_request(text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_missing_ticket_request(text,text,text,text) TO service_role;
CREATE POLICY "Missing ticket requests require validated server path" ON public.support_tickets AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (source IS DISTINCT FROM 'ticket-not-received-form' AND metadata->>'request_type' IS DISTINCT FROM 'ticket_not_received');