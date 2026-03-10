
-- Add video support to media_photos
ALTER TABLE public.media_photos ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'photo';
ALTER TABLE public.media_photos ADD COLUMN IF NOT EXISTS video_url text;

-- Add cover image selection to media_albums  
ALTER TABLE public.media_albums ADD COLUMN IF NOT EXISTS event_id_ref uuid REFERENCES public.events(id) ON DELETE SET NULL;
