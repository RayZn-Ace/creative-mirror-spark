ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reservation_review_reason text,
 ADD COLUMN IF NOT EXISTS reservation_next_verify_at timestamptz;
CREATE TABLE public.reservation_job_control (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 job_id bigint
);
GRANT ALL ON public.reservation_job_control TO service_role;
ALTER TABLE public.reservation_job_control ENABLE ROW LEVEL SECURITY;
INSERT INTO public.reservation_job_control(singleton) VALUES(true);
CREATE OR REPLACE FUNCTION public.sync_reservation_job() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE jid bigint; needed boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(278112026);
 SELECT job_id INTO jid FROM public.reservation_job_control WHERE singleton;
 IF jid IS NULL THEN RETURN; END IF;
 SELECT EXISTS(SELECT 1 FROM public.orders WHERE status='pending' AND reservation_released_at IS NULL AND reservation_expires_at IS NOT NULL) INTO needed;
 PERFORM cron.alter_job(jid,active:=needed);
END; $$;
REVOKE ALL ON FUNCTION public.sync_reservation_job() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sync_reservation_job() TO service_role;
CREATE OR REPLACE FUNCTION public.wake_reservation_job() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 PERFORM public.sync_reservation_job(); RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.wake_reservation_job() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wake_reservation_job AFTER INSERT OR UPDATE OF status,reservation_expires_at,reservation_released_at ON public.orders
 FOR EACH STATEMENT EXECUTE FUNCTION public.wake_reservation_job();
CREATE OR REPLACE FUNCTION public.claim_reservation_batch() RETURNS SETOF public.orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE candidate record;
BEGIN
 FOR candidate IN SELECT id,event_id FROM public.orders WHERE status='pending' AND reservation_released_at IS NULL
  AND reservation_expires_at<=now() AND payment_started_at IS NULL AND mollie_payment_id IS NULL AND stripe_payment_id IS NULL
  ORDER BY reservation_expires_at,id LIMIT 12
 LOOP
  PERFORM id FROM public.events WHERE id=candidate.event_id FOR UPDATE;
  UPDATE public.orders SET reservation_released_at=now() WHERE id=candidate.id AND status='pending' AND reservation_released_at IS NULL
   AND reservation_expires_at<=now() AND payment_started_at IS NULL AND mollie_payment_id IS NULL AND stripe_payment_id IS NULL;
 END LOOP;
 RETURN QUERY WITH candidates AS (
  SELECT id FROM public.orders WHERE status='pending' AND reservation_released_at IS NULL AND reservation_expires_at<=now()
   AND (payment_started_at IS NOT NULL OR mollie_payment_id IS NOT NULL OR stripe_payment_id IS NOT NULL)
   AND (reservation_next_verify_at IS NULL OR reservation_next_verify_at<=now())
   AND (reservation_verification_claimed_at IS NULL OR reservation_verification_claimed_at<=now()-interval '60 seconds')
   ORDER BY reservation_verification_claimed_at NULLS FIRST,reservation_expires_at,id LIMIT 12 FOR UPDATE SKIP LOCKED
 ) UPDATE public.orders o SET reservation_verification_claimed_at=now() FROM candidates c WHERE o.id=c.id RETURNING o.*;
 PERFORM public.sync_reservation_job();
END; $$;
REVOKE ALL ON FUNCTION public.claim_reservation_batch() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_reservation_batch() TO service_role;