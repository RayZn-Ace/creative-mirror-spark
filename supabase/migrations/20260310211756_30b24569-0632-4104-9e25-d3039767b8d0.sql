
ALTER TABLE public.ticket_categories 
ADD COLUMN IF NOT EXISTS max_capacity integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS kvk_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS kvk_min_percent integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS kvk_max_percent integer DEFAULT 25;
