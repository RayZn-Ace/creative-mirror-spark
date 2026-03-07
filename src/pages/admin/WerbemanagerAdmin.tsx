import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Megaphone, Plus, Pencil, Trash2, X, Loader2, ToggleLeft, ToggleRight, Image, MessageSquare, Type, Layers, Ticket, Upload } from "lucide-react";

type AdType = "banner" | "popup" | "ticker" | "interstitial" | "ticket_ad";

interface AdPlacement {
  id: string;
  type: AdType;
  title: string;
  content: string | null;
  image_url: string | null;
  click_url: string | null;
  event_id: string | null;
  is_global: boolean;
  active: boolean;
  sort_order: number;
  position: string;
  start_date: string | null;
  end_date: string | null;
  max_impressions: number | null;
  impression_count: number;
  config: Record<string, any>;
}

interface EventOption { id: string; title: string; date: string | null; }

const typeLabels: Record<AdType, { label: string; icon: any; color: string }> = {
  banner: { label: "Banner", icon: Image, color: "hsl(200 80% 55%)" },
  popup: { label: "Pop-up", icon: MessageSquare, color: "hsl(330 80% 55%)" },
  ticker: { label: "Ticker", icon: Type, color: "hsl(45 80% 55%)" },
  interstitial: { label: "Zwischen-Ad", icon: Layers, color: "hsl(270 60% 55%)" },
  ticket_ad: { label: "Ticket-Werbung", icon: Ticket, color: "hsl(142 70% 55%)" },
};

const emptyAd: Partial<AdPlacement> = {
  type: "banner", title: "", content: "", image_url: "", click_url: "",
  event_id: null, is_global: true, active: true, sort_order: 0, position: "top",
  start_date: null, end_date: null, max_impressions: null, impression_count: 0, config: {},
};

const inputStyle = {
  background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)",
  color: "hsl(0 0% 100%)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px",
  width: "100%", outline: "none",
};
const selectStyle = {
  ...inputStyle, colorScheme: "dark" as const,
  WebkitAppearance: "none" as const, backgroundColor: "hsl(220 50% 10%)",
};
const labelStyle = { color: "hsl(0 0% 100% / 0.5)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: "4px", display: "block" };

const WerbemanagerAdmin = () => {
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [editing, setEditing] = useState<Partial<AdPlacement> | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<AdType | "all">("all");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [aRes, eRes] = await Promise.all([
      supabase.from("ad_placements").select("*").order("sort_order", { ascending: true }),
      supabase.from("events").select("id, title, date").order("date", { ascending: false }),
    ]);
    setAds((aRes.data as any[]) || []);
    setEvents((eRes.data as EventOption[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing as any;
    if (!rest.title?.trim()) { toast.error("Titel ist Pflicht"); return; }
    if (id) {
      const { error } = await supabase.from("ad_placements").update(rest).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Werbung aktualisiert");
    } else {
      const { error } = await supabase.from("ad_placements").insert(rest);
      if (error) { toast.error(error.message); return; }
      toast.success("Werbung erstellt");
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Werbung wirklich löschen?")) return;
    await supabase.from("ad_placements").delete().eq("id", id);
    toast.success("Gelöscht");
    load();
  };

  const toggleActive = async (ad: AdPlacement) => {
    await supabase.from("ad_placements").update({ active: !ad.active }).eq("id", ad.id);
    load();
  };

  const filtered = filterType === "all" ? ads : ads.filter(a => a.type === filterType);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;

  if (editing) {
    const adType = editing.type || "banner";
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}>
            <X className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            {editing.id ? "Werbung bearbeiten" : "Neue Werbung"}
          </h1>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          {/* Type selector */}
          <div>
            <label style={labelStyle}>Typ *</label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(typeLabels) as AdType[]).map(t => {
                const info = typeLabels[t];
                const Icon = info.icon;
                const selected = adType === t;
                return (
                  <button key={t} onClick={() => setEditing({ ...editing, type: t })}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{ background: selected ? `${info.color}20` : "hsl(0 0% 100% / 0.06)", color: selected ? info.color : "hsl(0 0% 100% / 0.5)", border: selected ? `1px solid ${info.color}40` : "1px solid transparent" }}>
                    <Icon className="w-3.5 h-3.5" /> {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Titel *</label>
              <input value={editing.title || ""} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Sponsor Banner XY" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Position</label>
              <select value={editing.position || "top"} onChange={e => setEditing({ ...editing, position: e.target.value })} style={selectStyle}>
                <option value="top">Oben</option>
                <option value="bottom">Unten</option>
                <option value="middle">Mitte</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div>
            <label style={labelStyle}>Inhalt / Nachricht</label>
            <textarea value={editing.content || ""} onChange={e => setEditing({ ...editing, content: e.target.value })} rows={3} placeholder={adType === "ticker" ? "🎉 Einlass ab 22 Uhr · Afterparty im Keller" : adType === "popup" ? "Wichtige Info für alle Besucher..." : "Beschreibung oder HTML"} style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} />
          </div>

          {/* Image upload + Link (not for ticker) */}
          {adType !== "ticker" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Bild hochladen</label>
                  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    const ext = file.name.split('.').pop();
                    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
                    const { error } = await supabase.storage.from("ad-images").upload(path, file);
                    if (error) { toast.error("Upload fehlgeschlagen: " + error.message); setUploading(false); return; }
                    const { data: urlData } = supabase.storage.from("ad-images").getPublicUrl(path);
                    setEditing({ ...editing, image_url: urlData.publicUrl });
                    setUploading(false);
                    toast.success("Bild hochgeladen");
                  }} />
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold w-full justify-center transition-all"
                    style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.6)" }}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Lädt hoch..." : "Bild wählen"}
                  </button>
                </div>
                <div>
                  <label style={labelStyle}>Klick-URL (optional)</label>
                  <input value={editing.click_url || ""} onChange={e => setEditing({ ...editing, click_url: e.target.value })} placeholder="https://sponsor.de" style={inputStyle} />
                </div>
              </div>

              {/* Preview */}
              {editing.image_url && (
                <div>
                  <label style={labelStyle}>Vorschau</label>
                  <div className="rounded-xl overflow-hidden relative" style={{ border: "1px solid hsl(0 0% 100% / 0.1)", maxHeight: "200px" }}>
                    <img src={editing.image_url} alt="Vorschau" className="w-full h-full object-cover" style={{ maxHeight: "200px" }} />
                    <button onClick={() => setEditing({ ...editing, image_url: "" })}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "hsl(0 0% 0% / 0.6)", color: "hsl(0 0% 100%)" }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Targeting */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
            <label style={{ ...labelStyle, marginBottom: "8px" }}>Zuordnung</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                <input type="radio" checked={editing.is_global === true} onChange={() => setEditing({ ...editing, is_global: true, event_id: null })} />
                Global (alle Seiten)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                <input type="radio" checked={editing.is_global === false} onChange={() => setEditing({ ...editing, is_global: false })} />
                Event-spezifisch
              </label>
            </div>
            {!editing.is_global && (
              <select value={editing.event_id || ""} onChange={e => setEditing({ ...editing, event_id: e.target.value || null })} style={selectStyle}>
                <option value="">Event wählen...</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} {ev.date ? `(${ev.date})` : ""}</option>)}
              </select>
            )}
          </div>

          {/* Scheduling + Impressions */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Anzeigen ab (optional)</label>
              <input type="datetime-local" value={editing.start_date || ""} onChange={e => setEditing({ ...editing, start_date: e.target.value || null })} style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
            <div>
              <label style={labelStyle}>Anzeigen bis (optional)</label>
              <input type="datetime-local" value={editing.end_date || ""} onChange={e => setEditing({ ...editing, end_date: e.target.value || null })} style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
            <div>
              <label style={labelStyle}>Max. Aufrufe (leer = ∞)</label>
              <input type="number" value={editing.max_impressions ?? ""} onChange={e => setEditing({ ...editing, max_impressions: e.target.value ? parseInt(e.target.value) : null })} placeholder="z.B. 500" style={inputStyle} />
              {editing.id && editing.impression_count !== undefined && (
                <span className="text-[10px] mt-1 block" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{editing.impression_count} bisherige Aufrufe</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Sortierung</label>
              <input type="number" value={editing.sort_order || 0} onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                <input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="rounded w-4 h-4" />
                Aktiv
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>Abbrechen</button>
            <button onClick={save} className="px-6 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}>Speichern</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone className="w-5 h-5" style={{ color: "hsl(230 80% 56%)" }} />
          <h1 className="text-xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>Werbemanager</h1>
        </div>
        <button onClick={() => setEditing({ ...emptyAd })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}>
          <Plus className="w-4 h-4" /> Neue Werbung
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterType("all")} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{ background: filterType === "all" ? "hsl(0 0% 100% / 0.12)" : "hsl(0 0% 100% / 0.04)", color: filterType === "all" ? "hsl(0 0% 100%)" : "hsl(0 0% 100% / 0.4)" }}>
          Alle ({ads.length})
        </button>
        {(Object.keys(typeLabels) as AdType[]).map(t => {
          const info = typeLabels[t];
          const count = ads.filter(a => a.type === t).length;
          return (
            <button key={t} onClick={() => setFilterType(t)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{ background: filterType === t ? `${info.color}20` : "hsl(0 0% 100% / 0.04)", color: filterType === t ? info.color : "hsl(0 0% 100% / 0.4)" }}>
              {info.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <Megaphone className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
          <p className="text-sm mb-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Keine Werbung vorhanden</p>
          <button onClick={() => setEditing({ ...emptyAd })} className="text-sm font-bold" style={{ color: "hsl(330 80% 55%)" }}>Jetzt erste Werbung erstellen</button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ad => {
            const info = typeLabels[ad.type];
            const Icon = info.icon;
            const eventName = ad.event_id ? events.find(e => e.id === ad.event_id)?.title : null;
            const isExpired = ad.end_date && new Date(ad.end_date) < new Date();
            const isExhausted = ad.max_impressions && ad.impression_count >= ad.max_impressions;
            return (
              <div key={ad.id} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)", opacity: !ad.active || isExpired || isExhausted ? 0.5 : 1 }}>
                {/* Thumbnail */}
                {ad.image_url ? (
                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0" style={{ border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                    <img src={ad.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${info.color}15`, border: `1px solid ${info.color}30` }}>
                    <Icon className="w-6 h-6" style={{ color: info.color }} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{ad.title}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: `${info.color}20`, color: info.color }}>
                      {info.label}
                    </span>
                    {ad.is_global ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(142 70% 45% / 0.12)", color: "hsl(142 70% 55%)" }}>🌍 Global</span>
                    ) : eventName ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(330 80% 55% / 0.12)", color: "hsl(330 80% 55%)" }}>📅 {eventName}</span>
                    ) : null}
                    {!ad.active && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>Inaktiv</span>}
                    {isExpired && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(45 80% 55% / 0.15)", color: "hsl(45 80% 55%)" }}>Abgelaufen</span>}
                    {ad.max_impressions && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(200 80% 55% / 0.12)", color: "hsl(200 80% 60%)" }}>
                        👁 {ad.impression_count}/{ad.max_impressions}
                      </span>
                    )}
                    {isExhausted && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>Limit erreicht</span>}
                  </div>
                  {ad.content && <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(0 0% 100% / 0.4)", maxWidth: "400px" }}>{ad.content}</p>}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleActive(ad)} className="p-2 rounded-lg hover:bg-white/5" title={ad.active ? "Deaktivieren" : "Aktivieren"} style={{ color: ad.active ? "hsl(142 70% 55%)" : "hsl(0 0% 100% / 0.3)" }}>
                    {ad.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditing(ad)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(ad.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WerbemanagerAdmin;
