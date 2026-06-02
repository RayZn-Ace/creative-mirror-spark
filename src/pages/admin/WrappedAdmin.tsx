import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Sparkles, Upload, Eye, Save, Music } from "lucide-react";

/* ───────── Types ───────── */
export type SlideKey =
  | "intro" | "parties" | "city" | "spend" | "month"
  | "soundtrack" | "monthSong" | "fallbackSong" | "connectMusic" | "outro";

export type SlideConfig = {
  enabled: boolean;
  gradient: string;        // tailwind gradient classes like "from-pink-600 via-rose-500 to-orange-500"
  bgImage?: string;        // optional full background image url
  title?: string;          // optional override for hero text
  subtitle?: string;       // optional override for sub text
};

export type WrappedYearConfig = {
  slides: Record<SlideKey, SlideConfig>;
  fallbackSong: { title: string; artist: string; cover_url: string; spotify_url: string };
  cover?: { image_url?: string; audio_url?: string; title?: string; subtitle?: string };
};

export type WrappedConfig = Record<string, WrappedYearConfig>; // keyed by year

const SLIDE_META: { key: SlideKey; label: string; description: string }[] = [
  { key: "intro",        label: "Intro",                description: "„Dein YYYY war sick" },
  { key: "parties",      label: "Anzahl Partys",        description: "Counter & Stunden-Vibes" },
  { key: "city",         label: "Homebase Stadt",       description: "Top-City des Jahres" },
  { key: "spend",        label: "Investiert",           description: "Wie viel ausgegeben" },
  { key: "month",        label: "Party-Monat",          description: "Stärkster Monat + Balken" },
  { key: "soundtrack",   label: "Soundtrack (Spotify)", description: "Top Artist + Top Song aus Spotify" },
  { key: "monthSong",    label: "Lieblings-Party Song", description: "Song im Monat der Lieblings-Party" },
  { key: "fallbackSong", label: "Fallback Song",        description: "Wenn kein Spotify verbunden" },
  { key: "connectMusic", label: "Connect Spotify CTA",  description: "Wenn weder Spotify noch Fallback gesetzt" },
  { key: "outro",        label: "Outro",                description: "Legende & Share-Button" },
];

const GRADIENT_PRESETS: { name: string; value: string }[] = [
  { name: "Purple → Pink",     value: "from-primary via-purple-600 to-pink-600" },
  { name: "Pink → Orange",     value: "from-pink-600 via-rose-500 to-orange-500" },
  { name: "Cyan → Indigo",     value: "from-cyan-500 via-blue-600 to-indigo-700" },
  { name: "Emerald → Green",   value: "from-emerald-500 via-teal-600 to-green-700" },
  { name: "Violet → Fuchsia",  value: "from-violet-600 via-purple-700 to-fuchsia-700" },
  { name: "Green Spotify",     value: "from-green-500 via-emerald-600 to-teal-700" },
  { name: "Fuchsia → Indigo",  value: "from-fuchsia-600 via-purple-700 to-indigo-800" },
  { name: "Spotify Brand",     value: "from-[#1DB954] via-emerald-600 to-teal-700" },
  { name: "Sunset",            value: "from-primary via-pink-600 to-orange-500" },
  { name: "Midnight",          value: "from-slate-900 via-purple-900 to-slate-900" },
];

const DEFAULT_GRADIENTS: Record<SlideKey, string> = {
  intro:        "from-primary via-purple-600 to-pink-600",
  parties:      "from-pink-600 via-rose-500 to-orange-500",
  city:         "from-cyan-500 via-blue-600 to-indigo-700",
  spend:        "from-emerald-500 via-teal-600 to-green-700",
  month:        "from-violet-600 via-purple-700 to-fuchsia-700",
  soundtrack:   "from-green-500 via-emerald-600 to-teal-700",
  monthSong:    "from-fuchsia-600 via-purple-700 to-indigo-800",
  fallbackSong: "from-fuchsia-600 via-purple-700 to-indigo-800",
  connectMusic: "from-[#1DB954] via-emerald-600 to-teal-700",
  outro:        "from-primary via-pink-600 to-orange-500",
};

export const defaultYearConfig = (): WrappedYearConfig => ({
  slides: Object.fromEntries(
    SLIDE_META.map((s) => [s.key, { enabled: true, gradient: DEFAULT_GRADIENTS[s.key] } as SlideConfig]),
  ) as Record<SlideKey, SlideConfig>,
  fallbackSong: { title: "", artist: "", cover_url: "", spotify_url: "" },
});

/* ───────── Component ───────── */
export default function WrappedAdmin() {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => [currentYear + 1, currentYear, currentYear - 1, currentYear - 2], [currentYear]);
  const [year, setYear] = useState<number>(currentYear);
  const [config, setConfig] = useState<WrappedConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "wrapped_config").maybeSingle();
      const val = (data?.value as WrappedConfig) || {};
      // Migrate legacy fallback song setting if present and no year set yet
      if (!val[currentYear]) {
        const { data: legacy } = await supabase.from("settings").select("value").eq("key", "wrapped_fallback_song").maybeSingle();
        const yc = defaultYearConfig();
        const lv = legacy?.value as any;
        if (lv?.title || lv?.artist) yc.fallbackSong = { ...yc.fallbackSong, ...lv };
        val[currentYear] = yc;
      }
      setConfig(val);
      setLoading(false);
    })();
  }, [currentYear]);

  const yc: WrappedYearConfig = config[year] || defaultYearConfig();

  const updateSlide = (k: SlideKey, patch: Partial<SlideConfig>) => {
    setConfig((c) => ({
      ...c,
      [year]: { ...yc, slides: { ...yc.slides, [k]: { ...yc.slides[k], ...patch } } },
    }));
  };

  const updateSong = (patch: Partial<WrappedYearConfig["fallbackSong"]>) => {
    setConfig((c) => ({ ...c, [year]: { ...yc, fallbackSong: { ...yc.fallbackSong, ...patch } } }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("settings").upsert({ key: "wrapped_config", value: config as any }, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error("Speichern fehlgeschlagen: " + error.message);
    toast.success(`Wrapped ${year} gespeichert ✨`);
  };

  const uploadBg = async (k: SlideKey, file: File) => {
    const path = `wrapped/${year}/${k}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    updateSlide(k, { bgImage: data.publicUrl });
    toast.success("Hintergrund hochgeladen");
  };

  const uploadCover = async (file: File) => {
    const path = `wrapped/${year}/cover-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    updateSong({ cover_url: data.publicUrl });
    toast.success("Cover hochgeladen");
  };

  if (loading) {
    return <div className="p-8 text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Laden…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: "hsl(0 0% 100%)" }}>
            <Sparkles className="h-7 w-7" style={{ color: "hsl(270 70% 55%)" }} />
            Year-in-Review Designer
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
            Slides, Hintergründe & Fallback-Song pro Jahr konfigurieren.
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/account/wrapped" target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2" />Vorschau</Button>
          </a>
          <Button onClick={save} disabled={saving} style={{ background: "hsl(270 70% 55%)" }}>
            <Save className="h-4 w-4 mr-2" />{saving ? "Speichern…" : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Year selector */}
      <div className="flex gap-2 flex-wrap">
        {years.map((y) => (
          <Button key={y} size="sm" variant={y === year ? "default" : "outline"} onClick={() => setYear(y)}
                  style={y === year ? { background: "hsl(270 70% 55%)" } : undefined}>
            {y}
          </Button>
        ))}
      </div>

      {/* Fallback Song */}
      <Card className="p-5 space-y-4" style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5" style={{ color: "hsl(270 70% 55%)" }} />
          <h2 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>Fallback-Song {year}</h2>
        </div>
        <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
          Wird gespielt wenn der Nutzer Spotify nicht verbunden hat. Echte Spotify-Daten überschreiben das.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldLight label="Song-Titel" value={yc.fallbackSong.title} onChange={(v) => updateSong({ title: v })} placeholder="z.B. Mockingbird" />
          <FieldLight label="Künstler" value={yc.fallbackSong.artist} onChange={(v) => updateSong({ artist: v })} placeholder="z.B. Eminem" />
        </div>
        <FieldLight label="Spotify-Link (optional)" value={yc.fallbackSong.spotify_url} onChange={(v) => updateSong({ spotify_url: v })} placeholder="https://open.spotify.com/track/..." />
        <div className="space-y-2">
          <Label className="text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Cover</Label>
          <div className="flex items-center gap-3">
            {yc.fallbackSong.cover_url && (
              <img src={yc.fallbackSong.cover_url} alt="Cover" className="w-16 h-16 rounded-lg object-cover" />
            )}
            <Input value={yc.fallbackSong.cover_url} onChange={(e) => updateSong({ cover_url: e.target.value })} placeholder="https://…" className="flex-1" />
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
              <span className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium"
                    style={{ background: "hsl(270 70% 55% / 0.2)", color: "hsl(270 70% 75%)" }}>
                <Upload className="h-3.5 w-3.5" /> Upload
              </span>
            </label>
          </div>
        </div>
      </Card>

      {/* Slides */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>Slides</h2>
        {SLIDE_META.map((m) => {
          const s = yc.slides[m.key] || { enabled: true, gradient: DEFAULT_GRADIENTS[m.key] };
          return (
            <Card key={m.key} className="p-5 space-y-4" style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold" style={{ color: "hsl(0 0% 100%)" }}>{m.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{m.description}</div>
                </div>
                <Switch checked={s.enabled} onCheckedChange={(v) => updateSlide(m.key, { enabled: v })} />
              </div>

              {s.enabled && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
                  <div className="space-y-3">
                    {/* Gradient picker */}
                    <div>
                      <Label className="text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Gradient</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                        {GRADIENT_PRESETS.map((g) => (
                          <button
                            key={g.value}
                            onClick={() => updateSlide(m.key, { gradient: g.value })}
                            className={`h-10 rounded-lg bg-gradient-to-br ${g.value} ring-2 transition`}
                            style={{ outline: s.gradient === g.value ? "2px solid hsl(270 70% 55%)" : "none", outlineOffset: 2 }}
                            title={g.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* BG Image */}
                    <div className="space-y-2">
                      <Label className="text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Hintergrund-Bild (optional, überlagert Gradient)</Label>
                      <div className="flex items-center gap-2">
                        <Input value={s.bgImage || ""} onChange={(e) => updateSlide(m.key, { bgImage: e.target.value })} placeholder="https://…" className="flex-1" />
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBg(m.key, e.target.files[0])} />
                          <span className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium"
                                style={{ background: "hsl(270 70% 55% / 0.2)", color: "hsl(270 70% 75%)" }}>
                            <Upload className="h-3.5 w-3.5" /> Upload
                          </span>
                        </label>
                        {s.bgImage && (
                          <button onClick={() => updateSlide(m.key, { bgImage: "" })}
                                  className="text-xs px-2 py-2 rounded-md"
                                  style={{ background: "hsl(0 70% 50% / 0.2)", color: "hsl(0 70% 75%)" }}>
                            Entfernen
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Optional text overrides */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FieldLight label="Titel-Override (optional)" value={s.title || ""} onChange={(v) => updateSlide(m.key, { title: v })} placeholder="z.B. Dein Banger-Jahr" />
                      <FieldLight label="Untertitel-Override (optional)" value={s.subtitle || ""} onChange={(v) => updateSlide(m.key, { subtitle: v })} placeholder="z.B. war absolut nuts 🔥" />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className={`aspect-[9/16] rounded-xl overflow-hidden relative bg-gradient-to-br ${s.gradient}`}>
                    {s.bgImage && (
                      <img src={s.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
                      <div className="text-white drop-shadow">
                        <div className="text-xs opacity-80">{s.subtitle || "Untertitel"}</div>
                        <div className="text-lg font-black">{s.title || m.label}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pb-8">
        <Button onClick={save} disabled={saving} style={{ background: "hsl(270 70% 55%)" }}>
          <Save className="h-4 w-4 mr-2" />{saving ? "Speichern…" : "Alle Änderungen speichern"}
        </Button>
      </div>
    </div>
  );
}

function FieldLight({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
