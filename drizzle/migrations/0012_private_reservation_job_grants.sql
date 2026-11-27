REVOKE ALL ON public.reservation_job_control FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.reservation_job_control TO service_role;