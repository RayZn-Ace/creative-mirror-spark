
CREATE TABLE public.blog_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  category text,
  reading_time text,
  published_at date,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published blog posts" ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Seed some initial posts
INSERT INTO public.blog_posts (title, slug, excerpt, category, reading_time, published_at, status, content) VALUES
('Die besten Party-Tipps für dein nächstes Event', 'beste-party-tipps', 'Von der Location bis zur Playlist – entdecke die besten Tipps für unvergessliche Events.', 'Event Trends', '6 Min. Lesezeit', '2026-02-14', 'published', 'Hier kommt der vollständige Artikel...'),
('Warum Live-Events so erfolgreich sind', 'live-events-erfolgreich', 'Die Faszination Live-Entertainment lebt weiter – wir erklären das Phänomen.', 'Insights', '5 Min. Lesezeit', '2026-02-09', 'published', 'Hier kommt der vollständige Artikel...'),
('Party Outfit Ideen für jede Saison', 'party-outfit-ideen', 'Glitter, Style und gute Vibes – so wirst du zum Star der Party.', 'Outfits & Styling', '4 Min. Lesezeit', '2026-02-04', 'published', 'Hier kommt der vollständige Artikel...'),
('Die Top 20 Songs zum Mitsingen', 'top-20-songs-mitsingen', 'Diese Hits musst du kennen, um bei unseren Events mitzufeiern.', 'Musik', '7 Min. Lesezeit', '2026-01-27', 'published', 'Hier kommt der vollständige Artikel...'),
('Unsere Geschichte – Von der Idee zum Event', 'unsere-geschichte', 'Von der ersten Party bis heute – die komplette Story.', 'Behind the Scenes', '8 Min. Lesezeit', '2026-01-19', 'published', 'Hier kommt der vollständige Artikel...');
