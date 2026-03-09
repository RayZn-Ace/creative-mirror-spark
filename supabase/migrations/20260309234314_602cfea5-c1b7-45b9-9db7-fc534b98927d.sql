
CREATE TABLE IF NOT EXISTS public.u18_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE,

  parent_name TEXT NOT NULL,
  parent_address TEXT NOT NULL,
  parent_zip TEXT DEFAULT '',
  parent_city TEXT DEFAULT '',
  parent_country TEXT NOT NULL DEFAULT 'Deutschland',
  parent_phone TEXT NOT NULL,
  parent_birthday DATE NOT NULL,

  minor_name TEXT NOT NULL,
  minor_address TEXT NOT NULL,
  minor_zip TEXT DEFAULT '',
  minor_city TEXT DEFAULT '',
  minor_country TEXT NOT NULL DEFAULT 'Deutschland',
  minor_phone TEXT NOT NULL,
  minor_birthday DATE NOT NULL,

  supervisor_name TEXT,
  supervisor_address TEXT,
  supervisor_zip TEXT,
  supervisor_city TEXT,
  supervisor_country TEXT,
  supervisor_email TEXT,
  supervisor_phone TEXT,
  supervisor_birthday DATE,

  email TEXT NOT NULL,
  has_signature BOOLEAN NOT NULL DEFAULT false,
  has_supervisor_signature BOOLEAN NOT NULL DEFAULT false,
  accept_newsletter BOOLEAN NOT NULL DEFAULT false,
  parent_signature TEXT,
  supervisor_signature TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.u18_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit u18 form"
  ON public.u18_forms
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view u18 forms"
  ON public.u18_forms
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete u18 forms"
  ON public.u18_forms
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));
