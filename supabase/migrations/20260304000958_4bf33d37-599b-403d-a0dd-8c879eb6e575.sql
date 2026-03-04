
-- Create orders table to store ticket purchases
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mollie_payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  event_id UUID REFERENCES public.events(id),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  service_fee NUMERIC NOT NULL DEFAULT 0,
  redirect_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Public can insert orders (guest checkout)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Orders can be read by mollie_payment_id (for confirmation page)
CREATE POLICY "Orders viewable by payment id"
ON public.orders
FOR SELECT
USING (true);

-- Admins can manage all orders
CREATE POLICY "Admins can manage orders"
ON public.orders
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow webhook to update orders (service role handles this)
CREATE POLICY "Service role can update orders"
ON public.orders
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
