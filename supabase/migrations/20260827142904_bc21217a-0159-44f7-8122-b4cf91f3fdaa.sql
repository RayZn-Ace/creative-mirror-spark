ALTER TABLE public.pending_invitations ADD COLUMN IF NOT EXISTS series_ids uuid[] NOT NULL DEFAULT '{}';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  INSERT INTO public.series_managers (user_id, series_id)
  SELECT NEW.id, s
  FROM public.pending_invitations pi, unnest(pi.series_ids) AS s
  WHERE LOWER(pi.email) = LOWER(NEW.email) AND pi.claimed = false
  ON CONFLICT (user_id, series_id) DO NOTHING;

  UPDATE public.pending_invitations
  SET claimed = true
  WHERE LOWER(email) = LOWER(NEW.email) AND claimed = false;

  RETURN NEW;
END;
$$;