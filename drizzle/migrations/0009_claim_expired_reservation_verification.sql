ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reservation_verification_claimed_at timestamptz;
CREATE OR REPLACE FUNCTION public.claim_expired_reservations(p_event uuid) RETURNS SETOF public.orders LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
 RETURN QUERY WITH candidates AS (
  SELECT id FROM public.orders WHERE event_id=p_event AND status='pending' AND reservation_released_at IS NULL AND reservation_expires_at<=now()
  AND (mollie_payment_id IS NOT NULL OR stripe_payment_id IS NOT NULL)
  AND (reservation_verification_claimed_at IS NULL OR reservation_verification_claimed_at<=now()-interval '60 seconds')
  ORDER BY reservation_verification_claimed_at NULLS FIRST,reservation_expires_at,id LIMIT 3 FOR UPDATE SKIP LOCKED
 ) UPDATE public.orders o SET reservation_verification_claimed_at=now() FROM candidates c WHERE o.id=c.id RETURNING o.*;
END; $$;
REVOKE ALL ON FUNCTION public.claim_expired_reservations(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_expired_reservations(uuid) TO service_role;