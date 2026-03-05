
CREATE TABLE public.ticket_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '10 minutes'),
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert verification codes" ON public.ticket_verification_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can select verification codes" ON public.ticket_verification_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can update verification codes" ON public.ticket_verification_codes FOR UPDATE USING (true);

-- Clean up expired codes automatically
CREATE INDEX idx_verification_codes_email ON public.ticket_verification_codes(email, code);
