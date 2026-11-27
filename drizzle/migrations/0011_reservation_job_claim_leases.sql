CREATE OR REPLACE FUNCTION public.claim_expired_reservations(p_event uuid) RETURNS SETOF public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 RETURN QUERY WITH candidates AS (
  SELECT id FROM public.orders WHERE event_id=p_event AND status='pending' AND reservation_released_at IS NULL AND reservation_expires_at<=now()
  AND (mollie_payment_id IS NOT NULL OR stripe_payment_id IS NOT NULL)
  AND (reservation_next_verify_at IS NULL OR reservation_next_verify_at<=now())
  AND (reservation_verification_claimed_at IS NULL OR reservation_verification_claimed_at<=now()-interval '60 seconds')
  ORDER BY reservation_verification_claimed_at NULLS FIRST,reservation_expires_at,id LIMIT 3 FOR UPDATE SKIP LOCKED
 ) UPDATE public.orders o SET reservation_verification_claimed_at=now(),reservation_next_verify_at=now()+interval '5 minutes' FROM candidates c WHERE o.id=c.id RETURNING o.*;
END; $$;
REVOKE ALL ON FUNCTION public.claim_expired_reservations(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_expired_reservations(uuid) TO service_role;
DO $$ DECLARE def text; marker text; BEGIN
 SELECT pg_get_functiondef('public.claim_reservation_batch()'::regprocedure) INTO def;
 marker:='SET reservation_verification_claimed_at=now() FROM candidates';
 IF position(marker IN def)=0 THEN RAISE EXCEPTION 'Unexpected batch claim definition'; END IF;
 EXECUTE replace(def,marker,'SET reservation_verification_claimed_at=now(),reservation_next_verify_at=now()+interval ''5 minutes'' FROM candidates');
END $$;
UPDATE public.reservation_job_control SET job_id=1 WHERE singleton;
SELECT public.sync_reservation_job();