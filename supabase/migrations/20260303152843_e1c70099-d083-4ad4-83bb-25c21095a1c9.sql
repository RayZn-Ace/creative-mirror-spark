
-- Fix: Change all policies to PERMISSIVE (drop restrictive, recreate as permissive)

-- events
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;

CREATE POLICY "Admins can manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view published events" ON public.events FOR SELECT USING (status = 'published');

-- ticket_categories
DROP POLICY IF EXISTS "Admins can manage ticket categories" ON public.ticket_categories;
DROP POLICY IF EXISTS "Anyone can view ticket categories of published events" ON public.ticket_categories;

CREATE POLICY "Admins can manage ticket categories" ON public.ticket_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view ticket categories of published events" ON public.ticket_categories FOR SELECT USING (EXISTS (SELECT 1 FROM events WHERE events.id = ticket_categories.event_id AND events.status = 'published'));

-- page_contents
DROP POLICY IF EXISTS "Admins can manage page contents" ON public.page_contents;
DROP POLICY IF EXISTS "Anyone can view page contents" ON public.page_contents;

CREATE POLICY "Admins can manage page contents" ON public.page_contents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view page contents" ON public.page_contents FOR SELECT USING (true);

-- user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
