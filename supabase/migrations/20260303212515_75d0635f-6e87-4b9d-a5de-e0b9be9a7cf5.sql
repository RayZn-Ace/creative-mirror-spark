
-- Add service fee settings to events
ALTER TABLE public.events ADD COLUMN service_fee_enabled boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN service_fee_type text DEFAULT 'absolute'; -- 'absolute' or 'percent'
ALTER TABLE public.events ADD COLUMN service_fee_value numeric DEFAULT 0;
ALTER TABLE public.events ADD COLUMN service_fee_vat numeric DEFAULT 19; -- VAT percentage
