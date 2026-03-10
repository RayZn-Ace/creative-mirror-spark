
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS insurance_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_amount numeric DEFAULT 0;

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS insurance_fee numeric DEFAULT 0;
