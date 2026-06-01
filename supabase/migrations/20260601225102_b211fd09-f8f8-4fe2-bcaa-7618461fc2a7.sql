-- Referral code on profiles
ALTER TABLE public.customer_profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS birthday_bonus_year integer,
  ADD COLUMN IF NOT EXISTS referred_by_code text;

-- Auto-generate referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_attempts int := 0;
BEGIN
  LOOP
    v_code := upper(substring(encode(extensions.gen_random_bytes(6), 'base64') from 1 for 8));
    v_code := regexp_replace(v_code, '[^A-Z0-9]', 'X', 'g');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.customer_profiles WHERE referral_code = v_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      v_code := v_code || floor(random()*100)::text;
      EXIT;
    END IF;
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_referral_code ON public.customer_profiles;
CREATE TRIGGER trg_assign_referral_code
BEFORE INSERT ON public.customer_profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_referral_code();

-- Backfill existing
UPDATE public.customer_profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referee_user_id uuid NOT NULL,
  code text NOT NULL,
  reward_points_referrer int NOT NULL DEFAULT 50,
  reward_points_referee int NOT NULL DEFAULT 25,
  status text NOT NULL DEFAULT 'signup', -- signup | first_purchase_rewarded
  created_at timestamptz NOT NULL DEFAULT now(),
  rewarded_at timestamptz,
  CONSTRAINT referrals_unique_referee UNIQUE (referee_user_id),
  CONSTRAINT referrals_distinct CHECK (referrer_user_id <> referee_user_id)
);

GRANT SELECT, INSERT, UPDATE ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_user_id OR auth.uid() = referee_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage referrals"
  ON public.referrals FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ticket transfers
CREATE TABLE public.ticket_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL,
  from_user_id uuid NOT NULL,
  from_email text NOT NULL,
  to_email text NOT NULL,
  to_name text,
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | cancelled
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

GRANT SELECT, INSERT, UPDATE ON public.ticket_transfers TO authenticated;
GRANT ALL ON public.ticket_transfers TO service_role;

ALTER TABLE public.ticket_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transfers"
  ON public.ticket_transfers FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users create own transfers"
  ON public.ticket_transfers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users cancel own transfers"
  ON public.ticket_transfers FOR UPDATE TO authenticated
  USING (auth.uid() = from_user_id OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = from_user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_ticket_transfers_ticket ON public.ticket_transfers(ticket_id);
CREATE INDEX idx_ticket_transfers_from_user ON public.ticket_transfers(from_user_id);

-- Birthday bonus function (called from client; idempotent per year)
CREATE OR REPLACE FUNCTION public.claim_birthday_bonus(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile record;
  v_today date := CURRENT_DATE;
  v_birthday_this_year date;
  v_diff int;
  v_points int := 100;
BEGIN
  IF _user_id IS NULL OR _user_id <> auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthorized');
  END IF;

  SELECT * INTO v_profile FROM public.customer_profiles WHERE user_id = _user_id;
  IF v_profile.birth_date IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_birthdate');
  END IF;

  v_birthday_this_year := make_date(EXTRACT(YEAR FROM v_today)::int, EXTRACT(MONTH FROM v_profile.birth_date)::int, EXTRACT(DAY FROM v_profile.birth_date)::int);
  v_diff := abs(v_today - v_birthday_this_year);

  IF v_diff > 7 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'out_of_window', 'days', v_diff);
  END IF;

  IF v_profile.birthday_bonus_year = EXTRACT(YEAR FROM v_today)::int THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  INSERT INTO public.loyalty_points (user_id, points, reason, metadata)
  VALUES (_user_id, v_points, 'birthday_bonus', jsonb_build_object('year', EXTRACT(YEAR FROM v_today)::int));

  UPDATE public.customer_profiles
     SET birthday_bonus_year = EXTRACT(YEAR FROM v_today)::int
   WHERE user_id = _user_id;

  RETURN jsonb_build_object('ok', true, 'points', v_points);
END;
$$;

-- Claim referral after signup (called from client)
CREATE OR REPLACE FUNCTION public.claim_referral(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_referrer_id uuid;
  v_normalized text;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated');
  END IF;
  v_normalized := upper(trim(_code));
  IF length(v_normalized) < 4 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;

  SELECT user_id INTO v_referrer_id FROM public.customer_profiles WHERE referral_code = v_normalized;
  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'code_not_found');
  END IF;
  IF v_referrer_id = v_uid THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self_referral');
  END IF;

  -- already referred?
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referee_user_id = v_uid) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_referred');
  END IF;

  INSERT INTO public.referrals (referrer_user_id, referee_user_id, code, status)
  VALUES (v_referrer_id, v_uid, v_normalized, 'signup');

  -- Reward both immediately on signup (simpler than waiting for first purchase)
  INSERT INTO public.loyalty_points (user_id, points, reason, metadata)
  VALUES (v_referrer_id, 50, 'referral_signup', jsonb_build_object('referee', v_uid));

  INSERT INTO public.loyalty_points (user_id, points, reason, metadata)
  VALUES (v_uid, 25, 'referral_welcome', jsonb_build_object('referrer', v_referrer_id));

  UPDATE public.referrals SET status = 'rewarded', rewarded_at = now()
   WHERE referee_user_id = v_uid;

  UPDATE public.customer_profiles SET referred_by_code = v_normalized WHERE user_id = v_uid;

  RETURN jsonb_build_object('ok', true, 'referrer_id', v_referrer_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_birthday_bonus(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;