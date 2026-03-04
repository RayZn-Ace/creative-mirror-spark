
-- Tickets table
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ticket_category_id uuid REFERENCES public.ticket_categories(id) ON DELETE SET NULL,
  holder_name text,
  holder_email text,
  qr_code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'valid',
  checked_in_at timestamptz,
  checked_in_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Scanner links table
CREATE TABLE public.scanner_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  label text,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_links ENABLE ROW LEVEL SECURITY;

-- Tickets policies
CREATE POLICY "Admins can manage tickets"
  ON public.tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Scanners can view tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'scanner'));

CREATE POLICY "Scanners can update ticket status"
  ON public.tickets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'scanner'))
  WITH CHECK (public.has_role(auth.uid(), 'scanner'));

-- Scanner links policies
CREATE POLICY "Admins can manage scanner links"
  ON public.scanner_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active scanner links"
  ON public.scanner_links FOR SELECT
  USING (active = true);

-- Realtime for live check-in counter
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
