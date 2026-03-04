
ALTER TABLE public.ticket_categories
  ADD COLUMN IF NOT EXISTS internal_only boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_size integer DEFAULT 1;
