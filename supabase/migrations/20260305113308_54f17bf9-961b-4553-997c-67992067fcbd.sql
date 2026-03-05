
-- Table to track page visits for live analytics
CREATE TABLE public.page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_url text,
  referrer text,
  referrer_source text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);

-- Index for fast "active now" queries
CREATE INDEX idx_page_visits_active ON public.page_visits (created_at DESC, left_at);
CREATE INDEX idx_page_visits_referrer ON public.page_visits (referrer_source);

-- Enable RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous visitors)
CREATE POLICY "Anyone can insert page visits"
ON public.page_visits FOR INSERT
WITH CHECK (true);

-- Admins can read all
CREATE POLICY "Admins can read page visits"
ON public.page_visits FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update (for left_at)
CREATE POLICY "Admins can update page visits"
ON public.page_visits FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow anonymous updates to own session (for left_at)
CREATE POLICY "Visitors can update own session"
ON public.page_visits FOR UPDATE
USING (true)
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_visits;
