
-- Granular permissions table per role
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission text NOT NULL,
  granted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- Security definer function to check permissions
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions rp
    JOIN public.user_roles ur ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
      AND rp.granted = true
  )
$$;

-- Seed default permissions for admin (all granted)
INSERT INTO public.role_permissions (role, permission, granted) VALUES
  -- Events
  ('admin', 'events.view', true),
  ('admin', 'events.create', true),
  ('admin', 'events.edit', true),
  ('admin', 'events.delete', true),
  ('admin', 'events.publish', true),
  -- Event-Serien
  ('admin', 'series.view', true),
  ('admin', 'series.create', true),
  ('admin', 'series.edit', true),
  ('admin', 'series.delete', true),
  -- Tickets
  ('admin', 'tickets.view', true),
  ('admin', 'tickets.create', true),
  ('admin', 'tickets.edit', true),
  ('admin', 'tickets.delete', true),
  ('admin', 'tickets.issue_free', true),
  -- Orders
  ('admin', 'orders.view', true),
  ('admin', 'orders.refund', true),
  ('admin', 'orders.export', true),
  -- Kunden
  ('admin', 'customers.view', true),
  ('admin', 'customers.edit', true),
  ('admin', 'customers.export', true),
  ('admin', 'customers.delete', true),
  -- Newsletter
  ('admin', 'newsletter.view', true),
  ('admin', 'newsletter.send', true),
  ('admin', 'newsletter.manage_lists', true),
  ('admin', 'newsletter.manage_subscribers', true),
  ('admin', 'newsletter.export', true),
  -- Scanner
  ('admin', 'scanner.view', true),
  ('admin', 'scanner.checkin', true),
  ('admin', 'scanner.manage_links', true),
  -- Coupons
  ('admin', 'coupons.view', true),
  ('admin', 'coupons.create', true),
  ('admin', 'coupons.edit', true),
  ('admin', 'coupons.delete', true),
  -- Analytics
  ('admin', 'analytics.view', true),
  ('admin', 'analytics.export', true),
  -- Einstellungen
  ('admin', 'settings.view', true),
  ('admin', 'settings.edit', true),
  ('admin', 'settings.manage_users', true),
  ('admin', 'settings.manage_permissions', true),
  -- Support
  ('admin', 'support.view', true),
  ('admin', 'support.respond', true),
  ('admin', 'support.manage', true),
  ('admin', 'support.delete', true),
  -- Werbemanager
  ('admin', 'ads.view', true),
  ('admin', 'ads.create', true),
  ('admin', 'ads.edit', true),
  ('admin', 'ads.delete', true),
  -- Seiten-Inhalte
  ('admin', 'pages.view', true),
  ('admin', 'pages.edit', true),
  -- Tracking
  ('admin', 'tracking.view', true),
  ('admin', 'tracking.manage', true),
  -- Vorlagen
  ('admin', 'templates.view', true),
  ('admin', 'templates.edit', true),
  -- Dashboard
  ('admin', 'dashboard.view', true),
  ('admin', 'dashboard.customize', true),
  -- Default moderator permissions
  ('moderator', 'events.view', true),
  ('moderator', 'events.create', true),
  ('moderator', 'events.edit', true),
  ('moderator', 'events.publish', true),
  ('moderator', 'series.view', true),
  ('moderator', 'tickets.view', true),
  ('moderator', 'tickets.create', true),
  ('moderator', 'tickets.edit', true),
  ('moderator', 'orders.view', true),
  ('moderator', 'customers.view', true),
  ('moderator', 'newsletter.view', true),
  ('moderator', 'newsletter.send', true),
  ('moderator', 'scanner.view', true),
  ('moderator', 'scanner.checkin', true),
  ('moderator', 'coupons.view', true),
  ('moderator', 'analytics.view', true),
  ('moderator', 'support.view', true),
  ('moderator', 'support.respond', true),
  ('moderator', 'dashboard.view', true),
  -- Default scanner permissions
  ('scanner', 'scanner.view', true),
  ('scanner', 'scanner.checkin', true),
  ('scanner', 'tickets.view', true),
  ('scanner', 'dashboard.view', true),
  -- Default user permissions
  ('user', 'dashboard.view', true),
  ('user', 'events.view', true),
  ('user', 'tickets.view', true)
ON CONFLICT (role, permission) DO NOTHING;
