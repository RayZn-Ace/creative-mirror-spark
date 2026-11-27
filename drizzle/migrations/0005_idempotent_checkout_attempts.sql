ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_attempt_id uuid, ADD COLUMN IF NOT EXISTS checkout_request_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_attempt_unique ON public.orders(checkout_attempt_id) WHERE checkout_attempt_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.reserve_checkout_attempt(p_body jsonb,p_provider text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE attempt uuid:=NULLIF(p_body->>'attemptId','')::uuid; request_hash text:=md5(p_body::text||p_provider); existing public.orders; result jsonb; BEGIN
 IF attempt IS NULL THEN RETURN public.reserve_ticket_order(p_body,p_provider); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(attempt::text,0));
 SELECT * INTO existing FROM public.orders WHERE checkout_attempt_id=attempt;
 IF FOUND THEN IF existing.checkout_request_hash IS DISTINCT FROM request_hash OR existing.payment_provider IS DISTINCT FROM p_provider THEN RAISE EXCEPTION 'Kaufversuch stimmt nicht überein.'; END IF; RETURN jsonb_build_object('id',existing.id); END IF;
 result:=public.reserve_ticket_order(p_body,p_provider);
 UPDATE public.orders SET checkout_attempt_id=attempt,checkout_request_hash=request_hash WHERE id=(result->>'id')::uuid;
 RETURN result;
 END; $$;
REVOKE ALL ON FUNCTION public.reserve_checkout_attempt(jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_checkout_attempt(jsonb,text) TO service_role;