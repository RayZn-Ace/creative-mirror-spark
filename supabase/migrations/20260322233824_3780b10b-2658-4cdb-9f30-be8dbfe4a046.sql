
-- Lounges per event
CREATE TABLE public.lounges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric DEFAULT 0,
  min_persons integer DEFAULT 1,
  max_persons integer DEFAULT 10,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'booked')),
  position_x numeric DEFAULT 0,
  position_y numeric DEFAULT 0,
  position_w numeric DEFAULT 80,
  position_h numeric DEFAULT 60,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Lounge booking requests
CREATE TABLE public.lounge_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lounge_id uuid NOT NULL REFERENCES public.lounges(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  party_size integer DEFAULT 1,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lounges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lounge_bookings ENABLE ROW LEVEL SECURITY;

-- Lounges: admins manage, anyone can view for published events
CREATE POLICY "Admins can manage lounges" ON public.lounges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view lounges of published events" ON public.lounges FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = lounges.event_id AND events.status = 'published'));

-- Lounge bookings: admins manage all, anyone can insert
CREATE POLICY "Admins can manage lounge bookings" ON public.lounge_bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can create lounge bookings" ON public.lounge_bookings FOR INSERT TO public
  WITH CHECK (true);
CREATE POLICY "Anyone can view own lounge bookings" ON public.lounge_bookings FOR SELECT TO public
  USING (true);

-- Add lounge_view_mode to events (list or floorplan)
ALTER TABLE public.events ADD COLUMN lounge_view_mode text DEFAULT 'list';
ALTER TABLE public.events ADD COLUMN lounge_enabled boolean DEFAULT false;
