
-- Change role_permissions.role from app_role enum to text for flexibility
ALTER TABLE public.role_permissions DROP CONSTRAINT role_permissions_role_permission_key;
ALTER TABLE public.role_permissions ALTER COLUMN role TYPE text USING role::text;
ALTER TABLE public.role_permissions ADD CONSTRAINT role_permissions_role_permission_key UNIQUE (role, permission);

-- Recreate has_permission to work with text
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
    JOIN public.user_roles ur ON ur.role::text = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
      AND rp.granted = true
  )
$$;
