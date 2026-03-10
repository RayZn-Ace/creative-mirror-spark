import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface SeriesRow {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  city: string | null;
  sort_order: number | null;
  status: string | null;
  event_count?: number;
}

const emptySeries: Omit<SeriesRow, "id" | "event_count"> = {
  title: "",
  slug: "",
  subtitle: "",
  description: "",
  image_url: "",
  city: "",
  sort_order: 0,
  status: "draft",
};

const SeriesAdmin = () => {
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [editing, setEditing] = useState<Partial<SeriesRow> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: seriesData } = await supabase
      .from("event_series")
      .select("*")
      .order("sort_order");

    if (seriesData) {
      // Count events per series
      const { data: events } = await supabase.from("events").select("series_id");
      const counts: Record<string, number> = {};
      events?.forEach((e: any) => {
        if (e.series_id) counts[e.series_id] = (counts[e.series_id] || 0) + 1;
      });
      setSeries(
        seriesData.map((s: any) => ({ ...s, event_count: counts[s.id] || 0 }))
      );
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { id, event_count, ...rest } = editing as SeriesRow;
    if (!rest.title || !rest.slug) {
      toast.error("Titel und Slug sind Pflichtfelder");
      return;
    }
    if (id) {
      const { error } = await supabase.from("event_series").update(rest).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Serie aktualisiert");
    } else {
      const { error } = await supabase.from("event_series").insert(rest);
      if (error) { toast.error(error.message); return; }
      toast.success("Serie erstellt");
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Serie wirklich löschen? Events bleiben erhalten.")) return;
    await supabase.from("event_series").delete().eq("id", id);
    toast.success("Serie gelöscht");
    load();
  };

  const toggleStatus = async (s: SeriesRow) => {
    const newStatus = s.status === "published" ? "draft" : "published";
    await supabase.from("event_series").update({ status: newStatus }).eq("id", s.id);
    toast.success(newStatus === "published" ? "Veröffentlicht" : "Auf Entwurf gesetzt");
    load();
  };

  const Field = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          background: "hsl(0 0% 100% / 0.08)",
          color: "hsl(0 0% 100%)",
          border: "1px solid hsl(0 0% 100% / 0.12)",
        }}
      />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
          Event-Serien
        </h1>
        <button
          onClick={() => setEditing({ ...emptySeries })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "hsl(270 70% 55%)", color: "hsl(0 0% 100%)" }}
        >
          <Plus className="w-4 h-4" /> Neue Serie
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</p>
      ) : series.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <p className="text-sm mb-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Noch keine Serien vorhanden</p>
          <button onClick={() => setEditing({ ...emptySeries })} className="text-sm font-bold" style={{ color: "hsl(230 80% 56%)" }}>
            Jetzt erste Serie erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {series.map((s) => (
            <div
              key={s.id}
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(270 60% 55% / 0.15)" }}
              >
                <Layers className="w-5 h-5" style={{ color: "hsl(270 60% 55%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{s.title}</span>
                  <span
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: s.status === "published" ? "hsl(142 70% 45% / 0.15)" : "hsl(0 0% 100% / 0.08)",
                      color: s.status === "published" ? "hsl(142 70% 55%)" : "hsl(0 0% 100% / 0.4)",
                    }}
                  >
                    {s.status}
                  </span>
                </div>
                <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  /{s.slug} · {s.event_count} Events · {s.city || "Keine Stadt"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleStatus(s)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  {s.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditing(s)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(s.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)} />
            <motion.div
              className="fixed inset-4 sm:inset-y-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 rounded-2xl overflow-y-auto"
              style={{ background: "hsl(220 50% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>
                  {editing.id ? "Serie bearbeiten" : "Neue Serie"}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Titel *" value={editing.title} onChange={(v: string) => setEditing({ ...editing, title: v })} />
                  <Field label="Slug *" value={editing.slug} onChange={(v: string) => setEditing({ ...editing, slug: v })} placeholder="z.b. hannover" />
                </div>
                <Field label="Untertitel" value={editing.subtitle} onChange={(v: string) => setEditing({ ...editing, subtitle: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Stadt" value={editing.city} onChange={(v: string) => setEditing({ ...editing, city: v })} />
                  <Field label="Sortierung" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: parseInt(v) || 0 })} type="number" />
                </div>
                <Field label="Bild-URL" value={editing.image_url} onChange={(v: string) => setEditing({ ...editing, image_url: v })} />
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Beschreibung</label>
                  <textarea
                    value={editing.description || ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>
                    Abbrechen
                  </button>
                  <button onClick={save} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}>
                    Speichern
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeriesAdmin;
