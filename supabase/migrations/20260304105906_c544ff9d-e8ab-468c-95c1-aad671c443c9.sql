
ALTER TABLE public.ticket_categories
  ADD COLUMN IF NOT EXISTS sale_start timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sale_end timestamptz DEFAULT NULL;
