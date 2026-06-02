CREATE TABLE public.user_music_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider IN ('spotify','apple_music')),
  provider_user_id text,
  display_name text,
  avatar_url text,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_music_connections TO authenticated;
GRANT ALL ON public.user_music_connections TO service_role;

ALTER TABLE public.user_music_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own music connections"
ON public.user_music_connections FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own music connections"
ON public.user_music_connections FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own music connections"
ON public.user_music_connections FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own music connections"
ON public.user_music_connections FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER set_user_music_connections_updated_at
BEFORE UPDATE ON public.user_music_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();