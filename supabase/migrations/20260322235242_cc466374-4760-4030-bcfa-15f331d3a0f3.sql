ALTER TABLE public.lounges ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;
ALTER TABLE public.lounges ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;