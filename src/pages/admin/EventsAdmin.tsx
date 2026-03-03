import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Pencil, Trash2, Star, Eye, EyeOff, Layers, ChevronDown, ChevronRight,
  ArrowLeft, ImageIcon, MapPin, Clock, Ticket,
} from "lucide-react";
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

interface TicketRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  sold_out: boolean | null;
  sort_order: number | null;
  features: string[] | null;
}

interface SeriesOption {
  id: string;
  title: string;
}

const emptyEvent: Omit<EventRow, "id"> = {
  title: "", subtitle: "", slug: "", description: "", date: null, time: "20:00",
  location_name: "", location_address: "", city: "", image_url: "", tag: "Konzert",
  status: "draft", highlight: false, ticket_link: "", sort_order: 0, series_id: null,
};

/* ─── Shared Field Components ─── */
const Field = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
  <div>
    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
      {label}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1"
      style={{
        background: "hsl(0 0% 100% / 0.06)",
        color: "hsl(0 0% 100%)",
        border: "1px solid hsl(0 0% 100% / 0.1)",
      }}
    />
  </div>
);

const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div
    className="rounded-2xl p-5 sm:p-6 space-y-4"
    style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.07)" }}
  >
    <div className="flex items-center gap-2.5 pb-2" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
      <Icon className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{title}</h3>
    </div>
    {children}
  </div>
);

/* ─── Event Edit View ─── */
const EventEditView = ({
  editing,
  setEditing,
  seriesOptions,
  tickets,
  onSave,
  onDelete,
  onBack,
}: {
  editing: Partial<EventRow>;
  setEditing: (e: Partial<EventRow>) => void;
  seriesOptions: SeriesOption[];
  tickets: TicketRow[];
  onSave: () => void;
  onDelete?: () => void;
  onBack: () => void;
}) => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg sm:text-xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
          {editing.id ? "Event bearbeiten" : "Neues Event"}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        {editing.id && onDelete && (
          <button
            onClick={onDelete}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ background: "hsl(0 70% 50% / 0.1)", color: "hsl(0 70% 55%)", border: "1px solid hsl(0 70% 50% / 0.2)" }}
          >
            Event löschen
          </button>
        )}
        <button
          onClick={onSave}
          className="px-6 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
        >
          Speichern
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column - Main content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Eventbeschreibung */}
        <Section title="Eventbeschreibung" icon={Pencil}>
          <Field label="Titel *" value={editing.title} onChange={(v: string) => setEditing({ ...editing, title: v })} />
          <Field label="Untertitel" value={editing.subtitle} onChange={(v: string) => setEditing({ ...editing, subtitle: v })} />
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
              Beschreibung & Informationen
            </label>
            <textarea
              value={editing.description || ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={8}
              placeholder="Event-Beschreibung, Dresscode, wichtige Hinweise..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-y transition-all focus:ring-1"
              style={{
                background: "hsl(0 0% 100% / 0.06)",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(0 0% 100% / 0.1)",
                minHeight: "160px",
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
                Event Kategorie
              </label>
              <select
                value={editing.tag || "Konzert"}
                onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              >
                <option value="Konzert">Konzert</option>
                <option value="Party">Party</option>
                <option value="Open Air">Open Air</option>
                <option value="Festival">Festival</option>
                <option value="Club">Club</option>
              </select>
            </div>
            <Field label="Slug *" value={editing.slug} onChange={(v: string) => setEditing({ ...editing, slug: v })} placeholder="z.b. hannover-10-04" />
          </div>
        </Section>

        {/* Zeit & Ort */}
        <Section title="Zeit & Ort" icon={MapPin}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Event-Start (Datum)" value={editing.date} onChange={(v: string) => setEditing({ ...editing, date: v })} type="date" />
            <Field label="Uhrzeit" value={editing.time} onChange={(v: string) => setEditing({ ...editing, time: v })} placeholder="20:00" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stadt" value={editing.city} onChange={(v: string) => setEditing({ ...editing, city: v })} placeholder="z.B. Hannover" />
            <Field label="Location" value={editing.location_name} onChange={(v: string) => setEditing({ ...editing, location_name: v })} placeholder="z.B. Baggi / Osho" />
          </div>
          <Field label="Location (Komplette Adresse)" value={editing.location_address} onChange={(v: string) => setEditing({ ...editing, location_address: v })} placeholder="Raschpl. 7L, 30161 Hannover" />
        </Section>

        {/* Tickets */}
        <Section title="Tickets" icon={Ticket}>
          <Field label="Ticket-Link" value={editing.ticket_link} onChange={(v: string) => setEditing({ ...editing, ticket_link: v })} placeholder="https://tickets.example.com/..." />
          {editing.id && tickets.length > 0 ? (
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
                Aktuelle Ticket-Varianten
              </span>
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl p-4 flex items-center justify-between"
                  style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      {t.sold_out && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>
                          Ausverkauft
                        </span>
                      )}
                      <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{t.name}</span>
                    </div>
                    {t.description && (
                      <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{t.description}</p>
                    )}
                    {t.features && t.features.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.features.map((f, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsl(142 70% 45% / 0.1)", color: "hsl(142 70% 55%)" }}>
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    className="px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                  >
                    {t.price.toFixed(2)} {t.currency || "€"}
                  </div>
                </div>
              ))}
            </div>
          ) : editing.id ? (
            <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
              Keine Ticket-Varianten vorhanden. Erstelle sie unter "Ticket-Kategorien".
            </p>
          ) : null}
        </Section>
      </div>

      {/* Right column - Sidebar */}
      <div className="space-y-6">
        {/* Titelbild */}
        <Section title="Titelbild" icon={ImageIcon}>
          {editing.image_url ? (
            <div className="relative group">
              <img
                src={editing.image_url}
                alt="Titelbild"
                className="w-full aspect-[16/9] rounded-xl object-cover"
              />
              <button
                onClick={() => setEditing({ ...editing, image_url: "" })}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "hsl(0 0% 0% / 0.7)", color: "hsl(0 0% 100%)" }}
              >
                ×
              </button>
            </div>
          ) : (
            <div
              className="w-full aspect-[16/9] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-white/20"
              style={{ background: "hsl(0 0% 100% / 0.04)", border: "2px dashed hsl(0 0% 100% / 0.12)" }}
            >
              <ImageIcon className="w-8 h-8" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
              <span className="text-xs font-medium" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                Kein Bild
              </span>
            </div>
          )}
          <Field label="Bild-URL" value={editing.image_url} onChange={(v: string) => setEditing({ ...editing, image_url: v })} placeholder="https://..." />
        </Section>

        {/* Event-Serie & Einstellungen */}
        <Section title="Einstellungen" icon={Clock}>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
              Event-Serie
            </label>
            <select
              value={editing.series_id || ""}
              onChange={(e) => setEditing({ ...editing, series_id: e.target.value || null })}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            >
              <option value="">Keine Serie</option>
              {seriesOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
              Status
            </label>
            <select
              value={editing.status || "draft"}
              onChange={(e) => setEditing({ ...editing, status: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            >
              <option value="draft">Entwurf</option>
              <option value="published">Veröffentlicht</option>
            </select>
          </div>

          <Field label="Sortierung" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: parseInt(v) || 0 })} type="number" />

          <label className="flex items-center gap-3 text-sm cursor-pointer pt-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
            <input
              type="checkbox"
              checked={editing.highlight || false}
              onChange={(e) => setEditing({ ...editing, highlight: e.target.checked })}
              className="rounded w-4 h-4"
            />
            Highlight-Event
          </label>
        </Section>
      </div>
    </div>
  </div>
);

/* ─── Main Component ─── */
const EventsAdmin = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [seriesMap, setSeriesMap] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Partial<EventRow> | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

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

  // Load tickets when editing an event
  useEffect(() => {
    if (editing?.id) {
      supabase
        .from("ticket_categories")
        .select("*")
        .eq("event_id", editing.id)
        .order("sort_order")
        .then(({ data }) => setTickets((data as TicketRow[]) || []));
    } else {
      setTickets([]);
    }
  }, [editing?.id]);

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
    setEditing(null);
    load();
  };

  const toggleStatus = async (event: EventRow) => {
    const newStatus = event.status === "published" ? "draft" : "published";
    await supabase.from("events").update({ status: newStatus }).eq("id", event.id);
    toast.success(newStatus === "published" ? "Veröffentlicht" : "Auf Entwurf gesetzt");
    load();
  };

  // If editing, show the edit view
  if (editing) {
    return (
      <EventEditView
        editing={editing}
        setEditing={(e) => setEditing(e)}
        seriesOptions={seriesOptions}
        tickets={tickets}
        onSave={save}
        onDelete={editing.id ? () => remove(editing.id!) : undefined}
        onBack={() => setEditing(null)}
      />
    );
  }

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
              <button
                onClick={() => {
                  const key = group.seriesId || "__none__";
                  setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
                }}
                className="flex items-center gap-2 mb-3 w-full text-left group"
              >
                {group.seriesId ? (
                  <Layers className="w-4 h-4" style={{ color: "hsl(270 60% 55%)" }} />
                ) : null}
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                  {group.seriesTitle} ({group.events.length})
                </span>
                {collapsed[group.seriesId || "__none__"] ? (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                )}
              </button>
              <AnimatePresence initial={false}>
                {!collapsed[group.seriesId || "__none__"] && (
                  <motion.div
                    className="space-y-2 overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {group.events.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:border-white/15"
                        style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                        onClick={() => setEditing(event)}
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
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleStatus(event)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                            {event.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => remove(event.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsAdmin;
