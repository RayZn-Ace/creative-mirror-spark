
-- =============================================
-- CUSTOMER PROFILES (separat von Admin profiles)
-- =============================================
CREATE TABLE public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  birth_date DATE,
  address TEXT,
  city TEXT,
  zip TEXT,
  country TEXT DEFAULT 'Deutschland',
  preferred_cities TEXT[] DEFAULT '{}',
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  push_preferences JSONB NOT NULL DEFAULT '{"new_events":true,"reminders":true,"sales":true,"waitlist":true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_profiles TO authenticated;
GRANT ALL ON public.customer_profiles TO service_role;

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own profile"
  ON public.customer_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Customers insert own profile"
  ON public.customer_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Customers update own profile"
  ON public.customer_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage customer profiles"
  ON public.customer_profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_customer_profiles_updated
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CUSTOMER FAVORITES
-- =============================================
CREATE TABLE public.customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

GRANT SELECT, INSERT, DELETE ON public.customer_favorites TO authenticated;
GRANT ALL ON public.customer_favorites TO service_role;

ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers manage own favorites"
  ON public.customer_favorites FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all favorites"
  ON public.customer_favorites FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

CREATE INDEX idx_customer_favorites_user ON public.customer_favorites(user_id);
CREATE INDEX idx_customer_favorites_event ON public.customer_favorites(event_id);

-- =============================================
-- PUSH TOKENS (multi-device pro user, auch anonym)
-- =============================================
CREATE TABLE public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios','android','web')),
  device_id TEXT,
  preferred_cities TEXT[] DEFAULT '{}',
  preferences JSONB NOT NULL DEFAULT '{"new_events":true,"reminders":true,"sales":true,"waitlist":true}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.push_tokens TO anon;
GRANT ALL ON public.push_tokens TO service_role;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register push token"
  ON public.push_tokens FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Anyone can update push token by token"
  ON public.push_tokens FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "Users view own push tokens"
  ON public.push_tokens FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Users delete own push tokens"
  ON public.push_tokens FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));

CREATE INDEX idx_push_tokens_user ON public.push_tokens(user_id) WHERE active = true;
CREATE INDEX idx_push_tokens_cities ON public.push_tokens USING GIN(preferred_cities);

CREATE TRIGGER trg_push_tokens_updated
  BEFORE UPDATE ON public.push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- PUSH CAMPAIGNS (Admin Broadcasts)
-- =============================================
CREATE TABLE public.push_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  deep_link TEXT,
  target_filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent','failed')),
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_campaigns TO authenticated;
GRANT ALL ON public.push_campaigns TO service_role;

ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage push campaigns"
  ON public.push_campaigns FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_push_campaigns_updated
  BEFORE UPDATE ON public.push_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE CUSTOMER PROFILE bei Signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.customer_profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger ergänzt den existierenden handle_new_user-Trigger nicht — wir erweitern handle_new_user direkt
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  INSERT INTO public.customer_profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)))
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  SELECT NEW.id, pi.role
  FROM public.pending_invitations pi
  WHERE LOWER(pi.email) = LOWER(NEW.email) AND pi.claimed = false
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.pending_invitations
  SET claimed = true
  WHERE LOWER(email) = LOWER(NEW.email) AND claimed = false;

  RETURN NEW;
END;
$function$;

-- Ensure trigger on auth.users exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STORAGE BUCKET für Customer Avatars
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-avatars','customer-avatars',true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars publicly readable"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'customer-avatars');
CREATE POLICY "Users upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'customer-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'customer-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'customer-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
