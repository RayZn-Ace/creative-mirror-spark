
-- Create a custom_roles table for flexible role management
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  color text NOT NULL DEFAULT '#888888',
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage custom roles"
ON public.custom_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view custom roles"
ON public.custom_roles
FOR SELECT
TO authenticated
USING (true);

-- Seed the default system roles
INSERT INTO public.custom_roles (name, display_name, color, is_system) VALUES
  ('admin', 'Admin', '#e6457a', true),
  ('moderator', 'Moderator', '#8b5cf6', true),
  ('scanner', 'Scanner', '#38bdf8', true),
  ('user', 'User', '#888888', true);
