import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Star, Eye, EyeOff, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface EventRow {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  description: string | null;
  date: string | null;
  time: string | null;
  location_name: string | null;
  location_address: string | null;
  city: string | null;
  image_url: string | null;
  tag: string | null;
  status: string | null;
  highlight: boolean | null;
  ticket_link: string | null;
  sort_order: number | null;
  series_id: string | null;
}

interface SeriesOption {
  id: string;
  title: string;
}

const emptyEvent: Omit<EventRow, "id"> = {
  title: "",
  subtitle: "",
  slug: "",
  description: "",
  date: null,
  time: "20:00",
  location_name: "",
  location_address: "",
  city: "",
  image_url: "",
  tag: "Konzert",
  status: "draft",
  highlight: false,
  ticket_link: "",
  sort_order: 0,
  series_id: null,
};

const EventsAdmin = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [seriesMap, setSeriesMap] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Partial<EventRow> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [eventsRes, seriesRes] = await Promise.all([
      supabase.from("events").select("*").order("sort_order"),
      supabase.from("event_series").select("id, title").order("title"),
    ]);
    setEvents((eventsRes.data as EventRow[]) || []);
    const options = (seriesRes.data as SeriesOption[]) || [];
    setSeriesOptions(options);
    const map: Record<string, string> = {};
    options.forEach((s) => { map[s.id] = s.title; });
    setSeriesMap(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing as EventRow;
    if (!rest.title || !rest.slug) {
      toast.error("Titel und Slug sind Pflichtfelder");
      return;
    }

    if (id) {
      const { error } = await supabase.from("events").update(rest).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Event aktualisiert");
    } else {
      const { error } = await supabase.from("events").insert(rest);
      if (error) { toast.error(error.message); return; }
      toast.success("Event erstellt");
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Event wirklich löschen?")) return;
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event gelöscht");
    load();
  };

  const toggleStatus = async (event: EventRow) => {
    const newStatus = event.status === "published" ? "draft" : "published";
    await supabase.from("events").update({ status: newStatus }).eq("id", event.id);
    toast.success(newStatus === "published" ? "Veröffentlicht" : "Auf Entwurf gesetzt");
    load();
  };

  // Group events by series
  const grouped = events.reduce<{ seriesId: string | null; seriesTitle: string; events: EventRow[] }[]>(
    (acc, event) => {
      const sid = event.series_id || "__none__";
      let group = acc.find((g) => (g.seriesId || "__none__") === sid);
      if (!group) {
        group = {
          seriesId: event.series_id,
          seriesTitle: event.series_id ? seriesMap[event.series_id] || "Unbekannte Serie" : "Ohne Serie",
          events: [],
        };
        acc.push(group);
      }
      group.events.push(event);
      return acc;
    },
    []
  );

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
          Events
        </h1>
        <button
          onClick={() => setEditing({ ...emptyEvent })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
        >
          <Plus className="w-4 h-4" /> Neues Event
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</p>
      ) : events.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <p className="text-sm mb-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Noch keine Events vorhanden</p>
          <button onClick={() => setEditing({ ...emptyEvent })} className="text-sm font-bold" style={{ color: "hsl(330 80% 55%)" }}>
            Jetzt erstes Event erstellen
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.seriesId || "none"}>
              <div className="flex items-center gap-2 mb-3">
                {group.seriesId && <Layers className="w-4 h-4" style={{ color: "hsl(270 60% 55%)" }} />}
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                  {group.seriesTitle} ({group.events.length})
                </span>
              </div>
              <div className="space-y-2">
                {group.events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl p-4 flex items-center gap-4"
                    style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                  >
                    {event.image_url && (
                      <img src={event.image_url} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{event.title}</span>
                        {event.highlight && <Star className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(45 80% 55%)" }} />}
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{
                            background: event.status === "published" ? "hsl(142 70% 45% / 0.15)" : "hsl(0 0% 100% / 0.08)",
                            color: event.status === "published" ? "hsl(142 70% 55%)" : "hsl(0 0% 100% / 0.4)",
                          }}
                        >
                          {event.status}
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                        {event.city} · {event.date || "Kein Datum"} · {event.tag}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleStatus(event)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                        {event.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => setEditing(event)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(event.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
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
                  {editing.id ? "Event bearbeiten" : "Neues Event"}
                </h2>

                {/* Series selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    Event-Serie
                  </label>
                  <select
                    value={editing.series_id || ""}
                    onChange={(e) => setEditing({ ...editing, series_id: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      background: "hsl(0 0% 100% / 0.08)",
                      color: "hsl(0 0% 100%)",
                      border: "1px solid hsl(0 0% 100% / 0.12)",
                    }}
                  >
                    <option value="">Keine Serie</option>
                    {seriesOptions.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Titel *" value={editing.title} onChange={(v: string) => setEditing({ ...editing, title: v })} />
                  <Field label="Slug *" value={editing.slug} onChange={(v: string) => setEditing({ ...editing, slug: v })} placeholder="z.b. hannover-10-04" />
                </div>
                <Field label="Untertitel" value={editing.subtitle} onChange={(v: string) => setEditing({ ...editing, subtitle: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Datum" value={editing.date} onChange={(v: string) => setEditing({ ...editing, date: v })} type="date" />
                  <Field label="Uhrzeit" value={editing.time} onChange={(v: string) => setEditing({ ...editing, time: v })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Location" value={editing.location_name} onChange={(v: string) => setEditing({ ...editing, location_name: v })} />
                  <Field label="Stadt" value={editing.city} onChange={(v: string) => setEditing({ ...editing, city: v })} />
                </div>
                <Field label="Adresse" value={editing.location_address} onChange={(v: string) => setEditing({ ...editing, location_address: v })} />
                <Field label="Bild-URL" value={editing.image_url} onChange={(v: string) => setEditing({ ...editing, image_url: v })} />
                <Field label="Ticket-Link" value={editing.ticket_link} onChange={(v: string) => setEditing({ ...editing, ticket_link: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tag" value={editing.tag} onChange={(v: string) => setEditing({ ...editing, tag: v })} />
                  <Field label="Sortierung" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: parseInt(v) || 0 })} type="number" />
                </div>

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

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                    <input
                      type="checkbox"
                      checked={editing.highlight || false}
                      onChange={(e) => setEditing({ ...editing, highlight: e.target.checked })}
                      className="rounded"
                    />
                    Highlight-Event
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>
                    Abbrechen
                  </button>
                  <button onClick={save} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
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

export default EventsAdmin;
