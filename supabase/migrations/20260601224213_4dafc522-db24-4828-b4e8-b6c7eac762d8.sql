
-- ============ ACHIEVEMENTS CATALOG ============
CREATE TABLE public.achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Award',
  points_reward integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'bronze',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements publicly readable" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins manage achievements" ON public.achievements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ LOYALTY POINTS LEDGER ============
CREATE TABLE public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  order_id uuid,
  points integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_points_user ON public.loyalty_points(user_id, created_at DESC);
CREATE UNIQUE INDEX idx_loyalty_points_order_purchase ON public.loyalty_points(user_id, order_id)
  WHERE order_id IS NOT NULL AND reason = 'ticket_purchase';

GRANT SELECT ON public.loyalty_points TO authenticated;
GRANT ALL ON public.loyalty_points TO service_role;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own points" ON public.loyalty_points FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage points" ON public.loyalty_points FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ USER ACHIEVEMENTS ============
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON public.user_achievements(user_id, unlocked_at DESC);

GRANT SELECT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own achievements" ON public.user_achievements FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage user achievements" ON public.user_achievements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ ACHIEVEMENT POINTS BONUS TRIGGER ============
CREATE OR REPLACE FUNCTION public.award_achievement_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward int;
BEGIN
  SELECT points_reward INTO v_reward FROM public.achievements WHERE id = NEW.achievement_id;
  IF v_reward IS NOT NULL AND v_reward > 0 THEN
    INSERT INTO public.loyalty_points (user_id, points, reason, metadata)
    VALUES (NEW.user_id, v_reward, 'achievement', jsonb_build_object('achievement_id', NEW.achievement_id));
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'award_achievement_points failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_achievement_points
AFTER INSERT ON public.user_achievements
FOR EACH ROW EXECUTE FUNCTION public.award_achievement_points();

-- ============ ORDER PAID → LOYALTY TRIGGER ============
CREATE OR REPLACE FUNCTION public.award_loyalty_for_paid_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_points int;
  v_ticket_count int;
  v_party_count int;
  v_event record;
BEGIN
  IF NEW.status <> 'paid' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'paid' THEN RETURN NEW; END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(NEW.email) LIMIT 1;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  -- 1 Punkt pro 1€
  v_points := GREATEST(0, floor(COALESCE(NEW.total_amount, 0))::int);
  IF v_points > 0 THEN
    INSERT INTO public.loyalty_points (user_id, order_id, points, reason, metadata)
    VALUES (v_user_id, NEW.id, v_points, 'ticket_purchase',
            jsonb_build_object('amount', NEW.total_amount, 'currency', NEW.currency))
    ON CONFLICT (user_id, order_id) WHERE order_id IS NOT NULL AND reason = 'ticket_purchase' DO NOTHING;
  END IF;

  -- First Ticket
  INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'first_ticket') ON CONFLICT DO NOTHING;

  -- Ticket count in this order
  SELECT COALESCE(SUM(GREATEST(1, (COALESCE(item->>'quantity','1'))::int)), 0)
    INTO v_ticket_count
    FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb)) item;

  IF v_ticket_count >= 5 THEN
    INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'squad_goals') ON CONFLICT DO NOTHING;
  END IF;

  IF COALESCE(NEW.total_amount, 0) >= 100 THEN
    INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'big_spender') ON CONFLICT DO NOTHING;
  END IF;

  -- Lifetime party count (distinct paid orders for this user's email)
  SELECT COUNT(*) INTO v_party_count
    FROM public.orders o
   WHERE o.status = 'paid' AND lower(o.email) = lower(NEW.email);

  IF v_party_count >= 5 THEN INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'party_5') ON CONFLICT DO NOTHING; END IF;
  IF v_party_count >= 10 THEN INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'party_10') ON CONFLICT DO NOTHING; END IF;
  IF v_party_count >= 25 THEN INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'party_25') ON CONFLICT DO NOTHING; END IF;

  -- Event-specific
  IF NEW.event_id IS NOT NULL THEN
    SELECT open_air, date INTO v_event FROM public.events WHERE id = NEW.event_id;
    IF v_event.open_air THEN
      INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'open_air_lover') ON CONFLICT DO NOTHING;
    END IF;
    IF v_event.date IS NOT NULL AND (v_event.date - CURRENT_DATE) > 30 THEN
      INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'early_bird') ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- VIP buyer: any item with badge ILIKE 'VIP' or category name ILIKE 'VIP'
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(NEW.items, '[]'::jsonb)) item
     WHERE (item->>'name') ILIKE '%VIP%' OR (item->>'badge') ILIKE '%VIP%' OR (item->>'name') ILIKE '%Premium%'
  ) THEN
    INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'vip_vibes') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'award_loyalty_for_paid_order failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_loyalty_on_paid
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.award_loyalty_for_paid_order();

-- ============ SEED ACHIEVEMENTS ============
INSERT INTO public.achievements (id, name, description, icon, points_reward, tier, sort_order) VALUES
  ('first_ticket',    'First Time',       'Erste Party gebucht – Willkommen in der Nightlife Generation 🔥', 'Sparkles',  50, 'bronze', 1),
  ('party_5',         'Regular',          '5 Partys besucht – du bist drin', 'PartyPopper', 100, 'silver', 2),
  ('party_10',        'Stammgast',        '10 Partys gerockt – kein Wochenende ohne', 'Flame', 200, 'gold', 3),
  ('party_25',        'Nightlife Legend', '25 Partys – absolute Legende 👑', 'Crown', 500, 'legendary', 4),
  ('squad_goals',     'Squad Goals',      '5+ Tickets in einer Bestellung – Crew zusammengetrommelt', 'Users', 150, 'silver', 5),
  ('big_spender',     'Big Spender',      'Bestellung über 100€ – Geld ausgeben für Vibes', 'CreditCard', 100, 'silver', 6),
  ('early_bird',      'Early Bird',       'Ticket 30+ Tage im Voraus gesichert', 'Sunrise', 50, 'bronze', 7),
  ('open_air_lover',  'Sunshine Vibes',   'Erste Open-Air Party gebucht', 'Sun', 75, 'bronze', 8),
  ('streak_4',        'On Fire',          '4 Wochen in Folge auf Partys', 'Flame', 100, 'gold', 9),
  ('vip_vibes',       'VIP Vibes',        'VIP/Premium Ticket gekauft – treat yourself', 'Star', 200, 'gold', 10);

-- ============ BACKFILL FOR EXISTING PAID ORDERS ============
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM public.orders WHERE status = 'paid' ORDER BY paid_at ASC NULLS LAST, created_at ASC LOOP
    PERFORM public.award_loyalty_for_paid_order_backfill(r);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Backfill skipped: %', SQLERRM;
END $$;

-- Backfill helper that mimics trigger logic (no NEW context)
CREATE OR REPLACE FUNCTION public.award_loyalty_for_paid_order_backfill(r public.orders)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_points int;
  v_ticket_count int;
  v_party_count int;
  v_event record;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(r.email) LIMIT 1;
  IF v_user_id IS NULL THEN RETURN; END IF;

  v_points := GREATEST(0, floor(COALESCE(r.total_amount, 0))::int);
  IF v_points > 0 THEN
    INSERT INTO public.loyalty_points (user_id, order_id, points, reason, metadata)
    VALUES (v_user_id, r.id, v_points, 'ticket_purchase',
            jsonb_build_object('amount', r.total_amount, 'currency', r.currency, 'backfill', true))
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'first_ticket') ON CONFLICT DO NOTHING;

  SELECT COALESCE(SUM(GREATEST(1, (COALESCE(item->>'quantity','1'))::int)), 0) INTO v_ticket_count
    FROM jsonb_array_elements(COALESCE(r.items, '[]'::jsonb)) item;
  IF v_ticket_count >= 5 THEN INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'squad_goals') ON CONFLICT DO NOTHING; END IF;
  IF COALESCE(r.total_amount, 0) >= 100 THEN INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'big_spender') ON CONFLICT DO NOTHING; END IF;

  SELECT COUNT(*) INTO v_party_count FROM public.orders o WHERE o.status='paid' AND lower(o.email)=lower(r.email);
  IF v_party_count >= 5 THEN INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'party_5') ON CONFLICT DO NOTHING; END IF;
  IF v_party_count >= 10 THEN INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'party_10') ON CONFLICT DO NOTHING; END IF;
  IF v_party_count >= 25 THEN INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'party_25') ON CONFLICT DO NOTHING; END IF;

  IF r.event_id IS NOT NULL THEN
    SELECT open_air, date INTO v_event FROM public.events WHERE id = r.event_id;
    IF v_event.open_air THEN INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'open_air_lover') ON CONFLICT DO NOTHING; END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(r.items, '[]'::jsonb)) item
     WHERE (item->>'name') ILIKE '%VIP%' OR (item->>'badge') ILIKE '%VIP%' OR (item->>'name') ILIKE '%Premium%'
  ) THEN
    INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (v_user_id, 'vip_vibes') ON CONFLICT DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'backfill row failed: %', SQLERRM;
END;
$$;

-- Run backfill (function defined above, executed once now)
DO $$
DECLARE r public.orders%ROWTYPE;
BEGIN
  FOR r IN SELECT * FROM public.orders WHERE status = 'paid' ORDER BY paid_at ASC NULLS LAST, created_at ASC LOOP
    PERFORM public.award_loyalty_for_paid_order_backfill(r);
  END LOOP;
END $$;
