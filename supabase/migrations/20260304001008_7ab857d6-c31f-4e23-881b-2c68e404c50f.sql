
-- Drop the overly permissive update policy
DROP POLICY "Service role can update orders" ON public.orders;

-- Restrict INSERT to only allow setting specific fields (still public for guest checkout)
DROP POLICY "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'pending');
