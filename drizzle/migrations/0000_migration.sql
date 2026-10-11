-- ORDERS: remove world-readable policy, allow owners by verified login email
DROP POLICY IF EXISTS "Orders viewable by payment id" ON public.orders;
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT TO authenticated
  USING (lower(email) = lower(coalesce(auth.jwt()->>'email','')));

-- TICKETS: remove world-readable policy (exposed all QR codes)
DROP POLICY IF EXISTS "Anyone can view tickets by order" ON public.tickets;
CREATE POLICY "Customers view own tickets" ON public.tickets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = tickets.order_id AND lower(o.email) = lower(coalesce(auth.jwt()->>'email',''))));

-- Order confirmation page for guests: knowledge of the unguessable order UUID is the capability
CREATE OR REPLACE FUNCTION public.get_order_confirmation(_order_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'order', to_jsonb(o) - 'mollie_payment_id' - 'stripe_payment_id' - 'redirect_url' - 'birth_date' - 'phone',
    'tickets', CASE WHEN o.status = 'paid' THEN coalesce((SELECT jsonb_agg(to_jsonb(t) - 'checked_in_by') FROM public.tickets t WHERE t.order_id = o.id), '[]'::jsonb) ELSE '[]'::jsonb END)
  FROM public.orders o WHERE o.id = _order_id
$$;
GRANT EXECUTE ON FUNCTION public.get_order_confirmation(uuid) TO anon, authenticated;

-- Public aggregates (no personal data)
CREATE OR REPLACE FUNCTION public.count_paid_orders(_event_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.orders WHERE event_id = _event_id AND status = 'paid'
$$;
GRANT EXECUTE ON FUNCTION public.count_paid_orders(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.sold_tickets_by_category(_event_id uuid)
RETURNS TABLE(ticket_category_id uuid, sold integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ticket_category_id, count(*)::int FROM public.tickets
  WHERE event_id = _event_id AND status IN ('valid','checked_in') AND ticket_category_id IS NOT NULL
  GROUP BY ticket_category_id
$$;
GRANT EXECUTE ON FUNCTION public.sold_tickets_by_category(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.recent_purchases_public(_limit integer DEFAULT 5)
RETURNS TABLE(first_name text, ticket_count integer, event_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT split_part(trim(name),' ',1),
         greatest(1, coalesce((SELECT sum(coalesce((i->>'quantity')::int,1)) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(items)='array' THEN items ELSE '[]'::jsonb END) i),1))::int,
         event_id
  FROM public.orders WHERE status='paid' AND name IS NOT NULL AND trim(name) <> ''
  ORDER BY created_at DESC LIMIT least(greatest(_limit,1),10)
$$;
GRANT EXECUTE ON FUNCTION public.recent_purchases_public(integer) TO anon, authenticated;

-- U18 FORMS: no public read-back; admins can read
DROP POLICY IF EXISTS "Submitters can read their own u18 form" ON public.u18_forms;
CREATE POLICY "Admins can read u18 forms" ON public.u18_forms FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- VERIFICATION CODES: only server functions (service role) may touch them
DROP POLICY IF EXISTS "Anyone can select verification codes" ON public.ticket_verification_codes;
DROP POLICY IF EXISTS "Anyone can update verification codes" ON public.ticket_verification_codes;
DROP POLICY IF EXISTS "Anyone can insert verification codes" ON public.ticket_verification_codes;

-- LOUNGE BOOKINGS: no public read
DROP POLICY IF EXISTS "Anyone can view own lounge bookings" ON public.lounge_bookings;

-- PUSH TOKENS: updates limited to own/anonymous tokens, cannot hijack someone else's
DROP POLICY IF EXISTS "Anyone can update push token by token" ON public.push_tokens;
CREATE POLICY "Update own or anonymous push token" ON public.push_tokens FOR UPDATE TO anon, authenticated
  USING (user_id IS NULL OR user_id = auth.uid())
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
DROP POLICY IF EXISTS "Anyone can register push token" ON public.push_tokens;
CREATE POLICY "Register own or anonymous push token" ON public.push_tokens FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- PAGE VISITS: visitors may only set left_at
REVOKE UPDATE ON public.page_visits FROM anon, authenticated;
GRANT UPDATE (left_at) ON public.page_visits TO anon, authenticated;

-- COUPONS: codes are validated server-side; no public listing of all codes
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

-- ROLES/PERMISSIONS: staff only
DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.role_permissions;
CREATE POLICY "Users view permissions of own roles" ON public.role_permissions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text = role_permissions.role));
DROP POLICY IF EXISTS "Authenticated users can view custom roles" ON public.custom_roles;
CREATE POLICY "Staff view custom roles" ON public.custom_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role::text = custom_roles.name));