
-- Add badge and coming_soon columns to ticket_categories
ALTER TABLE public.ticket_categories ADD COLUMN badge text;
ALTER TABLE public.ticket_categories ADD COLUMN coming_soon boolean DEFAULT false;
-- Add category_group column to group tickets (e.g. REGULAR, DELUXE, FAN)
ALTER TABLE public.ticket_categories ADD COLUMN category_group text;
