REVOKE ALL ON FUNCTION public.manages_series(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_series_manager(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.manages_series(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_series_manager(uuid) TO authenticated, service_role;