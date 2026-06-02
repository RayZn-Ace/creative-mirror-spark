import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUserStats } from "@/hooks/useUserStats";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, Ticket, Clock, Euro, Calendar, Share2, ChevronLeft, ChevronRight, PartyPopper, Rocket, Heart, Music, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type MusicData = {
  connected: boolean;
  profile?: { display_name: string | null; avatar_url: string | null };
  yearTopTrack?: { name: string; artist: string; image: string | null } | null;
  yearTopArtist?: { name: string; image: string | null; genre: string | null } | null;
  recentTopTrack?: { name: string; artist: string; image: string | null } | null;
  midTermTopTrack?: { name: string; artist: string; image: string | null } | null;
};

export default function Wrapped() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const stats = useUserStats(year);
  const [slide, setSlide] = useState(0);
  const { flags, loading: flagsLoading } = useFeatureFlags();
  const { user } = useAuth();
  const [music, setMusic] = useState<MusicData | null>(null);
  const [fallbackSong, setFallbackSong] = useState<{ title: string; artist: string; cover_url: string; spotify_url: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [musicRes, songRes] = await Promise.all([
        supabase.functions.invoke("spotify-wrapped", { body: {} }),
        supabase.from("settings").select("value").eq("key", "wrapped_fallback_song").maybeSingle(),
      ]);
      if (musicRes.data) setMusic(musicRes.data as MusicData);
      const v = songRes.data?.value as any;
      if (v?.title && v?.artist) setFallbackSong(v);
    })();
  }, [user]);

  const slides = [
    {
      key: "intro",
      bg: "from-primary via-purple-600 to-pink-600",
      content: (
        <div className="text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 animate-pulse" />
          <div className="text-5xl md:text-7xl font-bold mb-4">Dein {year}</div>
          <div className="text-2xl opacity-90">war sick fr fr 🔥</div>
        </div>
      ),
    },
    {
      key: "parties",
      bg: "from-pink-600 via-rose-500 to-orange-500",
      content: (
        <div className="text-center">
          <Ticket className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">Du warst auf</div>
          <div className="text-8xl md:text-9xl font-black mb-3">{stats.yearCount}</div>
          <div className="text-3xl font-bold">Partys 🎉</div>
          <div className="mt-6 opacity-80">
            Das sind {stats.yearCount * 6} Stunden Vibes
          </div>
        </div>
      ),
    },
    {
      key: "city",
      bg: "from-cyan-500 via-blue-600 to-indigo-700",
      content: (
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">Deine Homebase</div>
          <div className="text-6xl md:text-7xl font-black mb-3">
            {stats.topCity || "—"}
          </div>
          <div className="text-2xl opacity-90">
            {stats.topCityCount}x am Start
          </div>
        </div>
      ),
    },
    {
      key: "spend",
      bg: "from-emerald-500 via-teal-600 to-green-700",
      content: (
        <div className="text-center">
          <Euro className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">Du hast investiert</div>
          <div className="text-7xl md:text-8xl font-black mb-3">
            {stats.yearSpent.toFixed(0)}€
          </div>
          <div className="text-xl opacity-90">in unvergessliche Nächte 💸</div>
        </div>
      ),
    },
    {
      key: "month",
      bg: "from-violet-600 via-purple-700 to-fuchsia-700",
      content: (
        <div className="text-center w-full max-w-md">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">Dein Party-Monat</div>
          <div className="text-5xl font-black mb-6">
            {(() => {
              const max = stats.monthBreakdown.reduce(
                (a, b) => (b.count > a.count ? b : a),
                { month: "—", count: 0 },
              );
              return max.count > 0 ? max.month : "—";
            })()}
          </div>
          <div className="grid grid-cols-12 gap-1 items-end h-32">
            {stats.monthBreakdown.map((m) => {
              const max = Math.max(...stats.monthBreakdown.map((x) => x.count), 1);
              const h = (m.count / max) * 100;
              return (
                <div key={m.month} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-white/80 rounded-t transition-all"
                    style={{ height: `${h}%`, minHeight: m.count ? "8%" : "0" }}
                  />
                  <div className="text-[10px] opacity-70">{m.month[0]}</div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    ...(music?.connected && music.yearTopArtist ? [{
      key: "soundtrack",
      bg: "from-green-500 via-emerald-600 to-teal-700",
      content: (
        <div className="text-center w-full">
          <Headphones className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <div className="text-xl opacity-80 mb-2">Dein Soundtrack {year}</div>
          {music.yearTopArtist.image && (
            <img src={music.yearTopArtist.image} alt="" className="h-32 w-32 mx-auto rounded-full mb-4 object-cover shadow-2xl ring-4 ring-white/40" />
          )}
          <div className="text-4xl md:text-5xl font-black mb-2">{music.yearTopArtist.name}</div>
          {music.yearTopArtist.genre && (
            <div className="text-sm opacity-70 capitalize mb-4">{music.yearTopArtist.genre}</div>
          )}
          {music.yearTopTrack && (
            <div className="mt-6 bg-white/15 backdrop-blur rounded-2xl p-4">
              <div className="text-xs opacity-70 uppercase tracking-wide mb-1">Top Song</div>
              <div className="font-bold">{music.yearTopTrack.name}</div>
              <div className="text-sm opacity-80">{music.yearTopTrack.artist}</div>
            </div>
          )}
        </div>
      ),
    }] : []),
    ...(music?.connected && music.recentTopTrack ? [{
      key: "month-song",
      bg: "from-fuchsia-600 via-purple-700 to-indigo-800",
      content: (
        <div className="text-center w-full max-w-sm">
          <Music className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <div className="text-xl opacity-80 mb-4">Im Monat deiner Lieblings-Party hattest du das hier in Dauerschleife 🔁</div>
          {music.recentTopTrack.image && (
            <img src={music.recentTopTrack.image} alt="" className="h-44 w-44 mx-auto rounded-2xl mb-5 object-cover shadow-2xl" />
          )}
          <div className="text-3xl font-black mb-2">{music.recentTopTrack.name}</div>
          <div className="text-lg opacity-90">{music.recentTopTrack.artist}</div>
        </div>
      ),
    }] : []),
    ...(!music?.connected && fallbackSong ? [{
      key: "fallback-song",
      bg: "from-fuchsia-600 via-purple-700 to-indigo-800",
      content: (
        <div className="text-center w-full max-w-sm">
          <Music className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <div className="text-xl opacity-80 mb-4">Der Sound deiner Saison 🔁</div>
          {fallbackSong.cover_url && (
            <img src={fallbackSong.cover_url} alt="" className="h-44 w-44 mx-auto rounded-2xl mb-5 object-cover shadow-2xl" />
          )}
          <div className="text-3xl font-black mb-2">{fallbackSong.title}</div>
          <div className="text-lg opacity-90 mb-6">{fallbackSong.artist}</div>
          <div className="text-xs opacity-70 mb-3">Verbinde Spotify für deinen echten Soundtrack</div>
          <Link to="/account/profile">
            <Button size="sm" variant="secondary" className="bg-[#1DB954] hover:bg-[#1aa34a] text-white border-0">
              <Headphones className="h-4 w-4 mr-2" /> Spotify verbinden
            </Button>
          </Link>
        </div>
      ),
    }] : []),
    ...(!music?.connected && !fallbackSong ? [{
      key: "connect-music",
      bg: "from-[#1DB954] via-emerald-600 to-teal-700",
      content: (
        <div className="text-center">
          <Headphones className="h-16 w-16 mx-auto mb-6" />
          <div className="text-3xl font-black mb-4">Connect Spotify 🎧</div>
          <div className="text-lg opacity-90 mb-6 max-w-xs mx-auto">
            Verbinde Spotify und sieh deinen Party-Soundtrack als nächstes Mal hier
          </div>
          <Link to="/account/profile">
            <Button size="lg" variant="secondary">Jetzt verbinden</Button>
          </Link>
        </div>
      ),
    }] : []),
    {
      key: "outro",
      bg: "from-primary via-pink-600 to-orange-500",
      content: (
        <div className="text-center">
          <div className="text-6xl mb-6">👑</div>
          <div className="text-4xl md:text-6xl font-black mb-4">
            Du bist eine Legende
          </div>
          <div className="text-xl opacity-90 mb-8">
            Bereit für noch mehr Bangers in {now.getFullYear() + (year < now.getFullYear() ? 1 : 1)}? 🚀
          </div>
          <Button
            size="lg"
            variant="secondary"
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: `Mein ${year} bei Nightlife`,
                    text: `Ich war auf ${stats.yearCount} Partys in ${year} – ${stats.yearCount * 6}h Vibes! 🔥`,
                  });
                } else {
                  await navigator.clipboard.writeText(
                    `Mein ${year}: ${stats.yearCount} Partys, ${stats.yearSpent.toFixed(0)}€ in Vibes investiert. 🔥`,
                  );
                  toast.success("Kopiert!");
                }
              } catch {}
            }}
          >
            <Share2 className="h-4 w-4 mr-2" /> Mit der Squad teilen
          </Button>
        </div>
      ),
    },
  ];

  if (flagsLoading || stats.loading) {
    return <div className="p-12 text-center text-muted-foreground">Lade dein Wrapped...</div>;
  }

  if (!flags.wrapped_enabled) {
    return <Navigate to="/account" replace />;
  }

  // No partys yet → "Was bisher geschah" welcome wrapped (if enabled)
  if (stats.yearCount === 0) {
    if (!flags.wrapped_welcome_enabled) {
      return (
        <div className="space-y-6">
          <YearPicker year={year} setYear={setYear} />
          <Card className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Noch keine Story für {year}</h2>
            <p className="text-muted-foreground">
              Schnapp dir Tickets und komm wieder, wenn du was zu wrappen hast 🎉
            </p>
          </Card>
        </div>
      );
    }
    return <WelcomeWrapped name={user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Legend"} />;
  }


  const current = slides[slide];
  const next = () => setSlide((s) => Math.min(slides.length - 1, s + 1));
  const prev = () => setSlide((s) => Math.max(0, s - 1));

  return (
    <div className="space-y-4">
      <YearPicker year={year} setYear={setYear} onChange={() => setSlide(0)} />

      <div className="relative aspect-[9/16] sm:aspect-[4/5] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 bg-gradient-to-br ${current.bg} flex items-center justify-center p-8 text-white`}
          >
            {current.content}
          </motion.div>
        </AnimatePresence>

        {/* progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${i <= slide ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>

        {/* tap zones */}
        <button
          className="absolute inset-y-0 left-0 w-1/3 z-10"
          onClick={prev}
          aria-label="Previous"
        />
        <button
          className="absolute inset-y-0 right-0 w-1/3 z-10"
          onClick={next}
          aria-label="Next"
        />
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={prev} disabled={slide === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-muted-foreground self-center">
          {slide + 1} / {slides.length}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={next}
          disabled={slide === slides.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function YearPicker({
  year,
  setYear,
  onChange,
}: {
  year: number;
  setYear: (y: number) => void;
  onChange?: () => void;
}) {
  const current = new Date().getFullYear();
  const years = [current, current - 1, current - 2];
  return (
    <div>
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Sparkles className="h-7 w-7 text-primary" /> Year in Review
      </h1>
      <p className="text-muted-foreground mt-1">Deine Nightlife-Story als Story 📲</p>
      <div className="flex gap-2 mt-4">
        {years.map((y) => (
          <Button
            key={y}
            size="sm"
            variant={y === year ? "default" : "outline"}
            onClick={() => {
              setYear(y);
              onChange?.();
            }}
          >
            {y}
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ─── Welcome Wrapped: "Was bisher geschah" für neue Nutzer ─── */
function WelcomeWrapped({ name }: { name: string }) {
  const [slide, setSlide] = useState(0);
  const slides = [
    {
      key: "hi",
      bg: "from-primary via-purple-600 to-pink-600",
      content: (
        <div className="text-center">
          <div className="text-6xl mb-6">👋</div>
          <div className="text-5xl md:text-7xl font-black mb-4">Servus, {name}!</div>
          <div className="text-xl opacity-90">Schön dass du da bist 🖤</div>
        </div>
      ),
    },
    {
      key: "what",
      bg: "from-pink-600 via-rose-500 to-orange-500",
      content: (
        <div className="text-center">
          <PartyPopper className="h-16 w-16 mx-auto mb-6" />
          <div className="text-3xl font-bold mb-4">Das hier ist deine Nightlife-Story</div>
          <div className="text-lg opacity-90">Sobald du auf Partys gehst, wird hier dein eigenes Wrapped entstehen ✨</div>
        </div>
      ),
    },
    {
      key: "perks",
      bg: "from-cyan-500 via-blue-600 to-indigo-700",
      content: (
        <div className="text-center">
          <Heart className="h-14 w-14 mx-auto mb-6" />
          <div className="text-3xl font-bold mb-6">Was du bei uns kriegst</div>
          <div className="space-y-3 text-left max-w-xs mx-auto">
            <div className="flex items-center gap-3"><Ticket className="h-5 w-5 shrink-0" /><span>Tickets für die sicksten Abipartys</span></div>
            <div className="flex items-center gap-3"><Sparkles className="h-5 w-5 shrink-0" /><span>Rewards & Goodies just for vibing</span></div>
            <div className="flex items-center gap-3"><MapPin className="h-5 w-5 shrink-0" /><span>Events in deiner Stadt zuerst</span></div>
          </div>
        </div>
      ),
    },
    {
      key: "cta",
      bg: "from-violet-600 via-pink-600 to-orange-500",
      content: (
        <div className="text-center">
          <Rocket className="h-16 w-16 mx-auto mb-6 animate-pulse" />
          <div className="text-4xl md:text-5xl font-black mb-4">Ready to write history?</div>
          <div className="text-lg opacity-90 mb-8">Dein erstes Ticket wartet 🎫</div>
          <Link to="/termine">
            <Button size="lg" variant="secondary">
              <Ticket className="h-4 w-4 mr-2" /> Veranstaltungen ansehen
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const current = slides[slide];
  const next = () => setSlide((s) => Math.min(slides.length - 1, s + 1));
  const prev = () => setSlide((s) => Math.max(0, s - 1));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-primary" /> Was bisher geschah
        </h1>
        <p className="text-muted-foreground mt-1">Deine kleine Welcome-Story 📲</p>
      </div>

      <div className="relative aspect-[9/16] sm:aspect-[4/5] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 bg-gradient-to-br ${current.bg} flex items-center justify-center p-8 text-white`}
          >
            {current.content}
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {slides.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= slide ? "bg-white" : "bg-white/30"}`} />
          ))}
        </div>

        <button className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={prev} aria-label="Previous" />
        <button className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={next} aria-label="Next" />
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={prev} disabled={slide === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-muted-foreground self-center">{slide + 1} / {slides.length}</div>
        <Button variant="outline" size="sm" onClick={next} disabled={slide === slides.length - 1}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
