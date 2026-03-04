
-- Tracking pixels configuration table
CREATE TABLE public.tracking_pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL, -- google_analytics, google_tag_manager, meta, snapchat, tiktok, pinterest, linkedin, twitter
  pixel_id TEXT NOT NULL, -- the actual pixel/tag ID
  label TEXT, -- optional friendly name
  enabled BOOLEAN NOT NULL DEFAULT false,
  test_mode BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb, -- provider-specific config (e.g. conversion events, custom params)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tracking pixels"
ON public.tracking_pixels FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view enabled tracking pixels"
ON public.tracking_pixels FOR SELECT
USING (enabled = true);

-- Tracking event logs table
CREATE TABLE public.tracking_event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pixel_id UUID REFERENCES public.tracking_pixels(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  event_name TEXT NOT NULL, -- PageView, Purchase, AddToCart, etc.
  event_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  test_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage event logs"
ON public.tracking_event_logs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert event logs"
ON public.tracking_event_logs FOR INSERT
WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_tracking_pixels_updated_at
BEFORE UPDATE ON public.tracking_pixels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
