
ALTER TABLE public.orders ADD COLUMN phone TEXT;
ALTER TABLE public.orders ADD COLUMN birth_date DATE;
ALTER TABLE public.orders DROP COLUMN first_name;
ALTER TABLE public.orders DROP COLUMN last_name;
ALTER TABLE public.orders ADD COLUMN name TEXT;
