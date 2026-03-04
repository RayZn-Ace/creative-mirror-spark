
-- Table for pending role invitations
CREATE TABLE public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed boolean NOT NULL DEFAULT false
);

-- RLS
ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invitations"
ON public.pending_invitations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update handle_new_user to auto-assign pending roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));

  -- Auto-assign any pending invitation roles
  INSERT INTO public.user_roles (user_id, role)
  SELECT NEW.id, pi.role
  FROM public.pending_invitations pi
  WHERE LOWER(pi.email) = LOWER(NEW.email)
    AND pi.claimed = false
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Mark invitations as claimed
  UPDATE public.pending_invitations
  SET claimed = true
  WHERE LOWER(email) = LOWER(NEW.email) AND claimed = false;

  RETURN NEW;
END;
$$;
