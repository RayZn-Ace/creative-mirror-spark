ALTER TABLE public.events ADD COLUMN box_office_enabled boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN box_office_price numeric DEFAULT NULL;