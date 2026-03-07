ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_16plus boolean DEFAULT true;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS muttizettel boolean DEFAULT true;