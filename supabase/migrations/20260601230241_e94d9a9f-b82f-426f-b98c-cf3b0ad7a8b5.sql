CREATE TABLE public.member_goodies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'voucher',
  title text NOT NULL,
  description text,
  code text,
  value numeric DEFAULT 0,
  value_type text DEFAULT 'fixed',
  event_id uuid,
  icon text DEFAULT 'Gift',
  color text DEFAULT 'hsl(270 70% 55%)',
  expires_at timestamp with time zone,
  redeemed_at timestamp with time zone,
  redeemed_by uuid,
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.member_goodies TO authenticated;
GRANT ALL ON public.member_goodies TO service_role;

ALTER TABLE public.member_goodies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own goodies"
  ON public.member_goodies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users redeem own goodies"
  ON public.member_goodies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage goodies"
  ON public.member_goodies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_member_goodies_user ON public.member_goodies(user_id, status);
CREATE INDEX idx_member_goodies_event ON public.member_goodies(event_id);

CREATE TRIGGER update_member_goodies_updated_at
  BEFORE UPDATE ON public.member_goodies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();