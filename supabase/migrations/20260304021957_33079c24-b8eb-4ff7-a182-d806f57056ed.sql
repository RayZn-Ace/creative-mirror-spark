
-- Newsletter subscriber lists
CREATE TABLE public.newsletter_lists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  color text DEFAULT '#e91e8c',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage newsletter lists"
ON public.newsletter_lists FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Newsletter subscribers (manual + imported)
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  name text,
  tags text[] DEFAULT '{}',
  city text,
  birth_date date,
  source text DEFAULT 'manual', -- 'manual', 'order', 'import'
  unsubscribed boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage newsletter subscribers"
ON public.newsletter_subscribers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- List membership (many-to-many)
CREATE TABLE public.newsletter_list_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id uuid NOT NULL REFERENCES public.newsletter_lists(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES public.newsletter_subscribers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(list_id, subscriber_id)
);

ALTER TABLE public.newsletter_list_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage list members"
ON public.newsletter_list_members FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update triggers
CREATE TRIGGER update_newsletter_lists_updated_at
BEFORE UPDATE ON public.newsletter_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_newsletter_subscribers_updated_at
BEFORE UPDATE ON public.newsletter_subscribers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
