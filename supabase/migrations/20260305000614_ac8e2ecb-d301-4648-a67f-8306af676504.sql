CREATE POLICY "Anyone can view tickets by order" ON public.tickets FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = tickets.order_id
    AND orders.status = 'paid'
  )
);