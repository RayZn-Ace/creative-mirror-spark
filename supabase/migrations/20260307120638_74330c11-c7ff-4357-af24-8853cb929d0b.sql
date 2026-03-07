
CREATE TABLE public.muttizettel_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  event_name TEXT,
  -- Parent / Erziehungsberechtigte/r
  parent_name TEXT NOT NULL,
  parent_address TEXT,
  parent_zip TEXT,
  parent_city TEXT,
  parent_country TEXT DEFAULT 'Deutschland',
  parent_phone TEXT NOT NULL,
  parent_birthdate DATE,
  parent_email TEXT,
  -- Child / Minderjährige/r
  child_name TEXT NOT NULL,
  child_birthdate DATE NOT NULL,
  child_address TEXT,
  child_zip TEXT,
  child_city TEXT,
  child_phone TEXT,
  -- Companion / Erziehungsbeauftragte Person
  companion_name TEXT,
  companion_phone TEXT,
  companion_birthdate DATE,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT
);

ALTER TABLE public.muttizettel_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert muttizettel submissions"
  ON public.muttizettel_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage muttizettel submissions"
  ON public.muttizettel_submissions
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
