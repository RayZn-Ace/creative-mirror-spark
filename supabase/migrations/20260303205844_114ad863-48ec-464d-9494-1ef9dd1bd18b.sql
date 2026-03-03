
-- Create event_series table for grouping events
CREATE TABLE public.event_series (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  city TEXT,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add series reference to events
ALTER TABLE public.events ADD COLUMN series_id UUID REFERENCES public.event_series(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.event_series ENABLE ROW LEVEL SECURITY;

-- Public can view published series
CREATE POLICY "Anyone can view published series"
ON public.event_series FOR SELECT
USING (status = 'published');

-- Admins can manage series
CREATE POLICY "Admins can manage series"
ON public.event_series FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_event_series_updated_at
BEFORE UPDATE ON public.event_series
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
