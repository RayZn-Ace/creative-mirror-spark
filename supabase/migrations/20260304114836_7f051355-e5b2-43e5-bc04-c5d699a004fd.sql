
CREATE TABLE public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view settings" ON public.settings
  FOR SELECT USING (true);

-- Seed default settings
INSERT INTO public.settings (key, value) VALUES
  ('company', '{"name": "", "address": "", "zip": "", "city": "", "country": "Deutschland", "vat_id": "", "managing_director": "", "email": "", "phone": "", "bank_name": "", "iban": "", "bic": ""}'::jsonb),
  ('invoice', '{"prefix": "RE", "next_number": 1}'::jsonb),
  ('email', '{"sender_name": "Tickets", "sender_domain": "", "reply_to": ""}'::jsonb);
