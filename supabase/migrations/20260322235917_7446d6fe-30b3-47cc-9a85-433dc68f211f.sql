-- Add images array column to lounges (replaces single image_url)
ALTER TABLE public.lounges ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Create storage bucket for lounge images
INSERT INTO storage.buckets (id, name, public)
VALUES ('lounge-images', 'lounge-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view lounge images
CREATE POLICY "Anyone can view lounge images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'lounge-images');

-- Allow authenticated admins to upload lounge images
CREATE POLICY "Admins can upload lounge images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lounge-images' AND public.has_role(auth.uid(), 'admin'));

-- Allow authenticated admins to delete lounge images
CREATE POLICY "Admins can delete lounge images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'lounge-images' AND public.has_role(auth.uid(), 'admin'));