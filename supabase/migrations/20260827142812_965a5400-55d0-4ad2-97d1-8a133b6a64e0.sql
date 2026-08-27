CREATE TABLE public.series_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  series_id uuid NOT NULL REFERENCES public.event_series(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, series_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.series_managers TO authenticated;
GRANT ALL ON public.series_managers TO service_role;

ALTER TABLE public.series_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage series managers"
ON public.series_managers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own series assignments"
ON public.series_managers FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.manages_series(_user_id uuid, _series_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.series_managers
    WHERE user_id = _user_id AND series_id = _series_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_series_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.series_managers WHERE user_id = _user_id
  )
$$;

CREATE POLICY "Series managers can view their series"
ON public.event_series FOR SELECT TO authenticated
USING (public.manages_series(auth.uid(), id));

CREATE POLICY "Series managers can view events of their series"
ON public.events FOR SELECT TO authenticated
USING (series_id IS NOT NULL AND public.manages_series(auth.uid(), series_id));

CREATE POLICY "Series managers can view ticket categories of their series"
ON public.ticket_categories FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = ticket_categories.event_id
    AND e.series_id IS NOT NULL
    AND public.manages_series(auth.uid(), e.series_id)
));

CREATE POLICY "Series managers can view tickets of their series"
ON public.tickets FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e
  WHERE e.id = tickets.event_id
    AND e.series_id IS NOT NULL
    AND public.manages_series(auth.uid(), e.series_id)
));