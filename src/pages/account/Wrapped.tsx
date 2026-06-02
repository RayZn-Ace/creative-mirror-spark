import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useUserStats } from "@/hooks/useUserStats";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, Ticket, Clock, Euro, Calendar, Share2, ChevronLeft, ChevronRight, PartyPopper, Rocket, Heart, Music, Headphones, Play, X, Pause, Volume2, VolumeX } from "lucide-react";
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
  const [fallbackSong, setFallbackSong] = useState<{ title: string; artist: string; cover_url: string; spotify_url: string; audio_url?: string } | null>(null);
  const [fallbackSong2, setFallbackSong2] = useState<{ title: string; artist: string; cover_url: string; spotify_url: string; audio_url?: string } | null>(null);
  const [resolvedPreview, setResolvedPreview] = useState<string>("");
  const [resolvedPreview2, setResolvedPreview2] = useState<string>("");
  const [wrappedCfg, setWrappedCfg] = useState<Record<string, any> | null>(null);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slidesCountRef = useRef(1);
  const MAX_STORY_MS = 60000;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [musicRes, cfgRes, legacyRes] = await Promise.all([
        supabase.functions.invoke("spotify-wrapped", { body: {} }),
        supabase.from("settings").select("value").eq("key", "wrapped_config").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "wrapped_fallback_song").maybeSingle(),
      ]);
      if (musicRes.data) setMusic(musicRes.data as MusicData);
      const cfg = (cfgRes.data?.value as Record<string, any>) || {};
      setWrappedCfg(cfg);
      const yearCfg = cfg[String(year)];
      const fb = yearCfg?.fallbackSong || (legacyRes.data?.value as any);
      if (fb?.title || fb?.artist || fb?.cover_url || fb?.spotify_url || fb?.audio_url) setFallbackSong(fb);
      else setFallbackSong(null);
      const fb2 = yearCfg?.fallbackSong2;
      if (fb2?.title || fb2?.artist || fb2?.audio_url) setFallbackSong2(fb2);
      else setFallbackSong2(null);
    })();
  }, [user, year]);

  // Auto-resolve preview URLs from iTunes if admin only provided title/artist (no audio_url)
  useEffect(() => {
    const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
    const score = (it: any, title: string, artist: string) => {
      const t = norm(title), a = norm(artist);
      const tn = norm(it.trackName || ""), an = norm(it.artistName || "");
      let s = 0;
      if (tn === t) s += 100; else if (tn.startsWith(t)) s += 60; else if (tn.includes(t)) s += 30;
      if (an === a) s += 100; else if (an.includes(a) || a.includes(an)) s += 60;
      if (it.previewUrl) s += 10;
      return s;
    };
    const resolve = async (song: typeof fallbackSong, setter: (s: string) => void) => {
      if (music?.connected || !song || song.audio_url) { setter(""); return; }
      const title = song.title || ""; const artist = song.artist || "";
      if (!title.trim() && !artist.trim()) { setter(""); return; }
      const tryFetch = async (country: string, term: string): Promise<any[]> => {
        try {
          const r = await fetch(`https://itunes.apple.com/search?media=music&entity=song&limit=25&country=${country}&term=${encodeURIComponent(term)}`);
          const j = await r.json();
          return (j?.results || []) as any[];
        } catch { return []; }
      };
      const terms = [`${artist} ${title}`, `${title} ${artist}`, title].map((t) => t.trim()).filter(Boolean);
      let best: any = null; let bestScore = -1;
      for (const c of ["DE", "US"]) {
        for (const term of terms) {
          const results = await tryFetch(c, term);
          for (const it of results) {
            const sc = score(it, title, artist);
            if (sc > bestScore && (it.previewUrl || bestScore < 0)) { best = it; bestScore = sc; }
          }
          if (best?.previewUrl && bestScore >= 160) break;
        }
        if (best?.previewUrl && bestScore >= 160) break;
      }
      setter(best?.previewUrl || "");
    };
    resolve(fallbackSong, setResolvedPreview);
    resolve(fallbackSong2, setResolvedPreview2);
  }, [fallbackSong, fallbackSong2, music?.connected]);


  // Auto-advance slides while playing — total story capped at 60s
  useEffect(() => {
    if (!started || paused) return;
    const n = Math.max(1, slidesCountRef.current);
    const perSlide = Math.max(2500, Math.min(5000, Math.floor(MAX_STORY_MS / n)));
    const t = setTimeout(() => {
      setSlide((s) => s + 1);
    }, perSlide);
    return () => clearTimeout(t);
  }, [started, paused, slide]);
  // Swap audio source when crossing halftime — with crossfade
  useEffect(() => {
    if (!started || !audioRef.current) return;
    const n = Math.max(1, slidesCountRef.current);
    const half = Math.ceil(n / 2);
    const url2 = !music?.connected ? (fallbackSong2?.audio_url || resolvedPreview2 || "") : "";
    const oldAudio = audioRef.current;
    if (slide >= half && url2 && oldAudio.src !== url2 && !(oldAudio as any)._swapping) {
      (oldAudio as any)._swapping = true;
      const targetVol = muted ? 0 : 1;
      const next = new Audio(url2);
      next.loop = true;
      next.muted = muted;
      next.preload = "auto";
      next.volume = 0;
      audioRef.current = next;
      next.play().then(() => {
        const duration = 900;
        const steps = 30;
        const stepMs = duration / steps;
        let i = 0;
        const startVol = oldAudio.volume;
        const iv = setInterval(() => {
          i++;
          const p = i / steps;
          oldAudio.volume = Math.max(0, startVol * (1 - p));
          next.volume = Math.min(targetVol, targetVol * p);
          if (i >= steps) {
            clearInterval(iv);
            try { oldAudio.pause(); oldAudio.src = ""; } catch {}
          }
        }, stepMs);
      }).catch(() => {
        // fallback: hard swap
        try { oldAudio.pause(); oldAudio.src = ""; } catch {}
        next.volume = targetVol;
      });
    }
  }, [slide, started, fallbackSong2, resolvedPreview2, music?.connected, muted]);

  // Cleanup on fullscreen exit
  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement && started) {
        setStarted(false);
        if (audioRef.current) audioRef.current.pause();
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [started]);

  const yearCfg = (wrappedCfg?.[String(year)] || {}) as { slides?: Record<string, { enabled?: boolean; gradient?: string; bgImage?: string; title?: string; subtitle?: string }>; cover?: { image_url?: string; audio_url?: string; title?: string; subtitle?: string } };
  const sCfg = (k: string) => yearCfg.slides?.[k] || {};
  const isOn = (k: string) => sCfg(k).enabled !== false;
  const grad = (k: string, def: string) => sCfg(k).gradient || def;
  const bgImg = (k: string) => sCfg(k).bgImage || "";

  const rawSlides = [
    {
      key: "intro",
      bg: grad("intro", "from-primary via-purple-600 to-pink-600"),
      bgImage: bgImg("intro"),
      content: (
        <div className="text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 animate-pulse" />
          <div className="text-5xl md:text-7xl font-bold mb-4">{sCfg("intro").title || `Dein ${year}`}</div>
          <div className="text-2xl opacity-90">{sCfg("intro").subtitle || "war sick fr fr 🔥"}</div>
        </div>
      ),
    },
    {
      key: "parties",
      bg: grad("parties", "from-pink-600 via-rose-500 to-orange-500"),
      bgImage: bgImg("parties"),
      content: (
        <div className="text-center">
          <Ticket className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">{sCfg("parties").subtitle || "Du warst auf"}</div>
          <div className="text-8xl md:text-9xl font-black mb-3">{stats.yearCount}</div>
          <div className="text-3xl font-bold">{sCfg("parties").title || "Partys 🎉"}</div>
          <div className="mt-6 opacity-80">Das sind {stats.yearCount * 6} Stunden Vibes</div>
        </div>
      ),
    },
    {
      key: "city",
      bg: grad("city", "from-cyan-500 via-blue-600 to-indigo-700"),
      bgImage: bgImg("city"),
      content: (
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">{sCfg("city").subtitle || "Deine Homebase"}</div>
          <div className="text-6xl md:text-7xl font-black mb-3">{stats.topCity || "—"}</div>
          <div className="text-2xl opacity-90">{stats.topCityCount}x am Start</div>
        </div>
      ),
    },
    {
      key: "spend",
      bg: grad("spend", "from-emerald-500 via-teal-600 to-green-700"),
      bgImage: bgImg("spend"),
      content: (
        <div className="text-center">
          <Euro className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">{sCfg("spend").subtitle || "Du hast investiert"}</div>
          <div className="text-7xl md:text-8xl font-black mb-3">{stats.yearSpent.toFixed(0)}€</div>
          <div className="text-xl opacity-90">{sCfg("spend").title || "in unvergessliche Nächte 💸"}</div>
        </div>
      ),
    },
    {
      key: "month",
      bg: grad("month", "from-violet-600 via-purple-700 to-fuchsia-700"),
      bgImage: bgImg("month"),
      content: (
        <div className="text-center w-full max-w-md">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">{sCfg("month").subtitle || "Dein Party-Monat"}</div>
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
                  <div className="w-full bg-white/80 rounded-t transition-all" style={{ height: `${h}%`, minHeight: m.count ? "8%" : "0" }} />
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
      bg: grad("soundtrack", "from-green-500 via-emerald-600 to-teal-700"),
      bgImage: bgImg("soundtrack"),
      content: (
        <div className="text-center w-full">
          <Headphones className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <div className="text-xl opacity-80 mb-2">{sCfg("soundtrack").subtitle || `Dein Soundtrack ${year}`}</div>
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
      key: "monthSong",
      bg: grad("monthSong", "from-fuchsia-600 via-purple-700 to-indigo-800"),
      bgImage: bgImg("monthSong"),
      content: (
        <div className="text-center w-full max-w-sm">
          <Music className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <div className="text-xl opacity-80 mb-4">{sCfg("monthSong").subtitle || "Im Monat deiner Lieblings-Party hattest du das hier in Dauerschleife 🔁"}</div>
          {music.recentTopTrack.image && (
            <img src={music.recentTopTrack.image} alt="" className="h-44 w-44 mx-auto rounded-2xl mb-5 object-cover shadow-2xl" />
          )}
          <div className="text-3xl font-black mb-2">{music.recentTopTrack.name}</div>
          <div className="text-lg opacity-90">{music.recentTopTrack.artist}</div>
        </div>
      ),
    }] : []),
    ...(!music?.connected && fallbackSong ? [{
      key: "fallbackSong",
      bg: grad("fallbackSong", "from-fuchsia-600 via-purple-700 to-indigo-800"),
      bgImage: bgImg("fallbackSong"),
      content: (
        <div className="text-center w-full max-w-sm">
          <Music className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <div className="text-xl opacity-80 mb-4">{sCfg("fallbackSong").subtitle || "Der Sound deiner Saison 🔁"}</div>
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
      key: "connectMusic",
      bg: grad("connectMusic", "from-[#1DB954] via-emerald-600 to-teal-700"),
      bgImage: bgImg("connectMusic"),
      content: (
        <div className="text-center">
          <Headphones className="h-16 w-16 mx-auto mb-6" />
          <div className="text-3xl font-black mb-4">{sCfg("connectMusic").title || "Connect Spotify 🎧"}</div>
          <div className="text-lg opacity-90 mb-6 max-w-xs mx-auto">
            {sCfg("connectMusic").subtitle || "Verbinde Spotify und sieh deinen Party-Soundtrack als nächstes Mal hier"}
          </div>
          <Link to="/account/profile">
            <Button size="lg" variant="secondary">Jetzt verbinden</Button>
          </Link>
        </div>
      ),
    }] : []),
    {
      key: "outro",
      bg: grad("outro", "from-primary via-pink-600 to-orange-500"),
      bgImage: bgImg("outro"),
      content: (
        <div className="text-center">
          <div className="text-6xl mb-6">👑</div>
          <div className="text-4xl md:text-6xl font-black mb-4">{sCfg("outro").title || "Du bist eine Legende"}</div>
          <div className="text-xl opacity-90 mb-8">
            {sCfg("outro").subtitle || `Bereit für noch mehr Bangers in ${now.getFullYear() + 1}? 🚀`}
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

  const slides = rawSlides.filter((s) => isOn(s.key));
  slidesCountRef.current = Math.max(1, slides.length);
  const halfIndex = Math.ceil(slides.length / 2);

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

  const cover = yearCfg.cover || {};
  const coverImg = cover.image_url || "";
  const audioUrl1 = cover.audio_url || (!music?.connected ? (fallbackSong?.audio_url || resolvedPreview || "") : "");
  const audioUrl2 = !music?.connected ? (fallbackSong2?.audio_url || resolvedPreview2 || "") : "";
  const currentAudioUrl = slide >= halfIndex && audioUrl2 ? audioUrl2 : audioUrl1;


  const startStory = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }

    // Create + start audio SYNC within user gesture (before any await)
    if (audioUrl1) {
      try {
        const a = new Audio(audioUrl1);
        a.loop = true;
        a.muted = muted;
        a.preload = "auto";
        audioRef.current = a;
        a.currentTime = 0;

        try {
          await a.play();
        } catch (err) {
          console.warn("audio play failed", err);
          toast.error("Der hinterlegte Song konnte nicht gestartet werden.");
        }
      } catch (e) {
        console.warn(e);
      }
    }
    setStarted(true);
    setSlide(0);
    // Fullscreen (async ok — gesture still counts)
    try {
      const el = containerRef.current;
      if (el && el.requestFullscreen) await el.requestFullscreen();
    } catch {}
  };

  const stopStory = () => {
    setStarted(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };



  // Cover screen (before start)
  if (!started) {
    return (
      <div className="space-y-4">
        <YearPicker year={year} setYear={setYear} onChange={() => setSlide(0)} />
        <button
          onClick={startStory}
          className="group relative aspect-[9/16] sm:aspect-[4/5] max-w-md mx-auto w-full rounded-3xl overflow-hidden shadow-2xl block"
        >
          {coverImg ? (
            <img src={coverImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-pink-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ring-4 ring-white/40">
              <Play className="h-10 w-10 ml-1 fill-white" />
            </div>
            <div className="text-4xl md:text-5xl font-black drop-shadow-lg">
              {cover.title || `Dein ${year}`}
            </div>
            <div className="text-lg opacity-90 mt-2 drop-shadow">
              {cover.subtitle || "Tap to play 🔥"}
            </div>
          </div>
        </button>
        <p className="text-center text-xs text-muted-foreground">
          {stats.yearCount} Partys · {stats.yearSpent.toFixed(0)}€ Vibes
        </p>
      </div>
    );
  }

  // Fullscreen story player
  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* audio managed imperatively via audioRef in startStory */}
      <div className="relative w-full h-full max-w-md mx-auto sm:aspect-[9/16] sm:h-auto sm:max-h-[95vh] sm:rounded-3xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 bg-gradient-to-br ${current.bg} text-white`}
          >
            {current.bgImage && (
              <>
                <img src={current.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-black/30" />
              </>
            )}
            <div className="absolute inset-0 flex items-center justify-center p-8">
              {current.content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
          {slides.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: i < slide ? "100%" : i === slide ? (paused ? "50%" : "100%") : "0%",
                  transition: i === slide && !paused ? "width 5s linear" : "none",
                }}
              />
            </div>
          ))}
        </div>

        {/* top controls */}
        <div className="absolute top-6 right-3 flex gap-2 z-30">
          {(audioUrl1 || audioUrl2) && (
            <button
              onClick={(e) => { e.stopPropagation(); setMuted((m) => { const nm = !m; if (audioRef.current) audioRef.current.muted = nm; return nm; }); }}
              className="h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
              aria-label="Mute"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); stopStory(); }}
            className="h-9 w-9 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* tap zones */}
        <button className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={prev} aria-label="Previous" />
        <button
          className="absolute inset-y-1/4 left-1/3 right-1/3 z-10"
          onClick={() => setPaused((p) => !p)}
          aria-label="Pause"
        />
        <button className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={next} aria-label="Next" />
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
