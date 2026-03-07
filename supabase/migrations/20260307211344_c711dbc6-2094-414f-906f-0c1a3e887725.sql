
-- Create media_albums table
CREATE TABLE public.media_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image_url text,
  event_date date,
  location text,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  photo_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create media_photos table
CREATE TABLE public.media_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.media_albums(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  thumbnail_url text,
  caption text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.media_albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_photos ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can view published albums
CREATE POLICY "Anyone can view published albums"
  ON public.media_albums FOR SELECT
  USING (status = 'published');

-- RLS: Admins can manage albums
CREATE POLICY "Admins can manage albums"
  ON public.media_albums FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Anyone can view photos of published albums
CREATE POLICY "Anyone can view photos of published albums"
  ON public.media_photos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.media_albums
    WHERE media_albums.id = media_photos.album_id
    AND media_albums.status = 'published'
  ));

-- RLS: Admins can manage photos
CREATE POLICY "Admins can manage photos"
  ON public.media_photos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger for albums
CREATE TRIGGER update_media_albums_updated_at
  BEFORE UPDATE ON public.media_albums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for media photos
INSERT INTO storage.buckets (id, name, public) VALUES ('media-photos', 'media-photos', true);

-- Storage RLS: Anyone can view media photos
CREATE POLICY "Anyone can view media photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media-photos');

-- Storage RLS: Admins can upload media photos
CREATE POLICY "Admins can upload media photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media-photos' AND public.has_role(auth.uid(), 'admin'));

-- Storage RLS: Admins can delete media photos
CREATE POLICY "Admins can delete media photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'media-photos' AND public.has_role(auth.uid(), 'admin'));
