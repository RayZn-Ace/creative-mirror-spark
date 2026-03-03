
-- Add info_sections JSONB column to events for accordion blocks
ALTER TABLE public.events ADD COLUMN info_sections jsonb DEFAULT '[]'::jsonb;
