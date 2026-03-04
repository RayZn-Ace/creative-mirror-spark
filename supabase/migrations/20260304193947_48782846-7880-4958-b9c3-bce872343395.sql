
-- Create ad placement types
CREATE TYPE public.ad_placement_type AS ENUM ('banner', 'popup', 'ticker', 'interstitial', 'ticket_ad');

-- Create ad placements table
CREATE TABLE public.ad_placements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type ad_placement_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  click_url TEXT,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  position TEXT DEFAULT 'top',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_placements ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage ad placements"
  ON public.ad_placements FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can view active
CREATE POLICY "Anyone can view active ad placements"
  ON public.ad_placements FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Updated at trigger
CREATE TRIGGER update_ad_placements_updated_at
  BEFORE UPDATE ON public.ad_placements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
