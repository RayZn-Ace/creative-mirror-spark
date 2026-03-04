
-- Add max impressions and current impression count to ad_placements
ALTER TABLE public.ad_placements ADD COLUMN max_impressions INTEGER DEFAULT NULL;
ALTER TABLE public.ad_placements ADD COLUMN impression_count INTEGER NOT NULL DEFAULT 0;

-- Create storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-images', 'ad-images', true);

-- Allow admins to upload ad images
CREATE POLICY "Admins can manage ad images"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'ad-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow public read access to ad images
CREATE POLICY "Public can view ad images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'ad-images');
