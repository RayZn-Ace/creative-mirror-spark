import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X, Ticket, ChevronDown, ChevronRight, Users, Lock, Clock, Tag, GripVertical, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface TicketRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  sold_out: boolean | null;
  coming_soon: boolean | null;
  sort_order: number | null;
  features: string[] | null;
  badge: string | null;
  category_group: string | null;
  group_size: number | null;
  internal_only: boolean | null;
  sale_start: string | null;
  sale_end: string | null;
}

interface EventOption {
  id: string;
  title: string;
  date: string | null;
  city: string | null;
}

const inputStyle = {
  background: "hsl(0 0% 100% / 0.06)",
  color: "hsl(0 0% 100%)",
  border: "1px solid hsl(0 0% 100% / 0.1)",
};

const TicketsAdmin = () => {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [editing, setEditing] = useState<Partial<TicketRow> | null>(null);
  const [filterEvent, setFilterEvent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [featureInput, setFeatureInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const load = async () => {
    const [ticketsRes, eventsRes] = await Promise.all([
      supabase.from("ticket_categories").select("*").order("sort_order"),
      supabase.from("events").select("id, title, date, city").order("date", { ascending: false }),
    ]);
    setTickets((ticketsRes.data as TicketRow[]) || []);
    setEvents((eventsRes.data as EventOption[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Group tickets by event, with search + event filter
  const groupedTickets = useMemo(() => {
    let filtered = filterEvent ? tickets.filter((t) => t.event_id === filterEvent) : tickets;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => {
        const event = events.find((e) => e.id === t.event_id);
        return (
          t.name.toLowerCase().includes(q) ||
          (event?.title || "").toLowerCase().includes(q) ||
          (event?.city || "").toLowerCase().includes(q)
        );
      });
    }

    const groups = new Map<string, TicketRow[]>();
    filtered.forEach((t) => {
      const existing = groups.get(t.event_id) || [];
      existing.push(t);
      groups.set(t.event_id, existing);
    });
    return groups;
  }, [tickets, filterEvent, searchQuery, events]);

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const allExpanded = expandedEvents.size >= groupedTickets.size && groupedTickets.size > 0;

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedEvents(new Set());
    } else {
      setExpandedEvents(new Set(groupedTickets.keys()));
    }
  };

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing as TicketRow;
    if (!rest.name || !rest.event_id) {
      toast.error("Name und Event sind Pflichtfelder");
      return;
    }

    if (id) {
      const { error } = await supabase.from("ticket_categories").update(rest).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Ticket-Kategorie aktualisiert");
    } else {
      const { error } = await supabase.from("ticket_categories").insert(rest);
      if (error) { toast.error(error.message); return; }
      toast.success("Ticket-Kategorie erstellt");
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Ticket-Kategorie wirklich löschen?")) return;
    await supabase.from("ticket_categories").delete().eq("id", id);
    toast.success("Gelöscht");
    load();
  };

  const getEvent = (eventId: string) => events.find((e) => e.id === eventId);

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const addFeature = () => {
    if (!featureInput.trim() || !editing) return;
    setEditing({ ...editing, features: [...(editing.features || []), featureInput.trim()] });
    setFeatureInput("");
  };

  const removeFeature = (index: number) => {
    if (!editing) return;
    const features = [...(editing.features || [])];
    features.splice(index, 1);
    setEditing({ ...editing, features });
  };

  const totalTickets = tickets.length;
  const totalEvents = new Set(tickets.map((t) => t.event_id)).size;
  const soldOutCount = tickets.filter((t) => t.sold_out).length;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            Ticket-Kategorien
          </h1>
          <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
            {totalTickets} Kategorien · {totalEvents} Events · {soldOutCount} ausverkauft
          </p>
        </div>
        <button
          onClick={() => setEditing({ name: "", price: 0, event_id: events[0]?.id || "", sort_order: 0, sold_out: false, coming_soon: false, features: [], badge: null, category_group: null, group_size: 1, internal_only: false, sale_start: null, sale_end: null })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
        >
          <Plus className="w-4 h-4" /> Neue Kategorie
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, Event oder Stadt suchen…"
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </div>
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm outline-none min-w-[180px]"
          style={inputStyle}
        >
          <option value="">Alle Events</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
        <button
          onClick={toggleAll}
          className="px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
          style={{ color: "hsl(0 0% 100% / 0.4)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
        >
          {allExpanded ? "Alle einklappen" : "Alle aufklappen"}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(330 80% 55%)", borderTopColor: "transparent" }} />
        </div>
      ) : groupedTickets.size === 0 ? (
        <div className="rounded-2xl p-16 text-center" style={{ background: "hsl(0 0% 100% / 0.02)", border: "1px dashed hsl(0 0% 100% / 0.08)" }}>
          <Ticket className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
          <p className="text-sm font-medium" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Ticket-Kategorien vorhanden</p>
          <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.25)" }}>Erstelle eine neue Kategorie über den Button oben</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Array.from(groupedTickets.entries()).map(([eventId, eventTickets]) => {
            const event = getEvent(eventId);
            const isExpanded = expandedEvents.has(eventId);
            return (
              <div key={eventId} className="rounded-2xl overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                {/* Event header */}
                <button
                  onClick={() => toggleEvent(eventId)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(330 80% 55% / 0.12)" }}>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" style={{ color: "hsl(330 80% 55%)" }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color: "hsl(330 80% 55%)" }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>
                      {event?.title || "Unbekanntes Event"}
                    </span>
                    {event?.date && (
                      <span className="text-xs ml-2" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                        {formatDate(event.date)}
                      </span>
                    )}
                    {event?.city && (
                      <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.4)" }}>
                        📍 {event.city}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)" }}>
                    {eventTickets.length} {eventTickets.length === 1 ? "Kategorie" : "Kategorien"}
                  </span>
                </button>

                {/* Tickets */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 space-y-2">
                        {eventTickets.map((ticket, i) => (
                          <div
                            key={ticket.id}
                            className="rounded-xl p-4 flex items-start gap-4 group transition-colors hover:bg-white/[0.02]"
                            style={{ background: "hsl(0 0% 100% / 0.02)", border: "1px solid hsl(0 0% 100% / 0.05)" }}
                          >
                            {/* Sort indicator */}
                            <div className="pt-0.5 hidden sm:block" style={{ color: "hsl(0 0% 100% / 0.15)" }}>
                              <GripVertical className="w-4 h-4" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{ticket.name}</span>

                                {/* Badges */}
                                {ticket.internal_only && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(260 60% 50% / 0.15)", color: "hsl(260 60% 65%)" }}>
                                    <Lock className="w-2.5 h-2.5" /> Intern
                                  </span>
                                )}
                                {ticket.sold_out && (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>
                                    Ausverkauft
                                  </span>
                                )}
                                {ticket.coming_soon && (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(200 70% 50% / 0.15)", color: "hsl(200 70% 60%)" }}>
                                    Coming Soon
                                  </span>
                                )}
                                {(ticket.group_size || 1) > 1 && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(160 60% 40% / 0.15)", color: "hsl(160 60% 55%)" }}>
                                    <Users className="w-2.5 h-2.5" /> {ticket.group_size}er
                                  </span>
                                )}
                                {ticket.badge && (
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(40 80% 50% / 0.15)", color: "hsl(40 80% 60%)" }}>
                                    <Tag className="w-2.5 h-2.5 inline mr-0.5" />{ticket.badge}
                                  </span>
                                )}
                              </div>

                              {/* Meta row */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm font-semibold" style={{ color: "hsl(330 80% 55%)" }}>
                                  {ticket.price === 0 ? "Kostenlos" : `${ticket.price.toFixed(2)} €`}
                                </span>
                                {ticket.category_group && (
                                  <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                                    Gruppe: {ticket.category_group}
                                  </span>
                                )}
                                {(ticket.sale_start || ticket.sale_end) && (
                                  <span className="inline-flex items-center gap-1 text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                                    <Clock className="w-3 h-3" />
                                    {ticket.sale_start ? formatDate(ticket.sale_start) : "—"} – {ticket.sale_end ? formatDate(ticket.sale_end) : "—"}
                                  </span>
                                )}
                              </div>

                              {/* Description */}
                              {ticket.description && (
                                <p className="text-xs leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                                  {ticket.description}
                                </p>
                              )}

                              {/* Features */}
                              {ticket.features && ticket.features.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  {ticket.features.map((f, j) => (
                                    <span key={j} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.45)" }}>
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditing(ticket); setFeatureInput(""); }} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => remove(ticket.id)} className="p-2 rounded-lg hover:bg-red-500/10" style={{ color: "hsl(0 70% 55%)" }}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Quick-add for this event */}
                        <button
                          onClick={() => { setEditing({ name: "", price: 0, event_id: eventId, sort_order: (eventTickets.length + 1) * 10, sold_out: false, coming_soon: false, features: [], badge: null, category_group: null, group_size: 1, internal_only: false, sale_start: null, sale_end: null }); setFeatureInput(""); }}
                          className="w-full py-2.5 rounded-xl text-xs font-medium transition-colors hover:bg-white/[0.03] flex items-center justify-center gap-1.5"
                          style={{ color: "hsl(0 0% 100% / 0.3)", border: "1px dashed hsl(0 0% 100% / 0.08)" }}
                        >
                          <Plus className="w-3.5 h-3.5" /> Kategorie hinzufügen
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)} />
            <motion.div
              className="fixed inset-4 sm:inset-y-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 rounded-2xl overflow-y-auto"
              style={{ background: "hsl(220 50% 8%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4" style={{ background: "hsl(220 50% 8%)", borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
                <h2 className="text-base font-bold" style={{ color: "hsl(0 0% 100%)" }}>
                  {editing.id ? "Kategorie bearbeiten" : "Neue Ticket-Kategorie"}
                </h2>
                <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Event */}
                <FieldGroup label="Event *">
                  <select value={editing.event_id || ""} onChange={(e) => setEditing({ ...editing, event_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle}>
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>{e.title} {e.date ? `(${formatDate(e.date)})` : ""}</option>
                    ))}
                  </select>
                </FieldGroup>

                {/* Name + Badge */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <FieldGroup label="Name *">
                      <input value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} placeholder="z.B. Early Bird" />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Badge">
                    <input value={editing.badge || ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value || null })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} placeholder="z.B. 🔥 Hot" />
                  </FieldGroup>
                </div>

                {/* Price + Group size + Sort */}
                <div className="grid grid-cols-3 gap-3">
                  <FieldGroup label="Preis (€)">
                    <input type="number" step="0.01" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                  </FieldGroup>
                  <FieldGroup label="Gruppengröße">
                    <input type="number" min={1} value={editing.group_size ?? 1} onChange={(e) => setEditing({ ...editing, group_size: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                  </FieldGroup>
                  <FieldGroup label="Sortierung">
                    <input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                  </FieldGroup>
                </div>

                {/* Category group */}
                <FieldGroup label="Kategorie-Gruppe (optional)">
                  <input value={editing.category_group || ""} onChange={(e) => setEditing({ ...editing, category_group: e.target.value || null })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} placeholder="z.B. VIP, Standard" />
                </FieldGroup>

                {/* Description */}
                <FieldGroup label="Beschreibung">
                  <textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none" style={inputStyle} />
                </FieldGroup>

                {/* Sale window */}
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Verkaufsstart">
                    <input type="datetime-local" value={editing.sale_start || ""} onChange={(e) => setEditing({ ...editing, sale_start: e.target.value || null })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                  </FieldGroup>
                  <FieldGroup label="Verkaufsende">
                    <input type="datetime-local" value={editing.sale_end || ""} onChange={(e) => setEditing({ ...editing, sale_end: e.target.value || null })} className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                  </FieldGroup>
                </div>

                {/* Features */}
                <FieldGroup label="Features / Vorteile">
                  <div className="space-y-2">
                    {(editing.features || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(editing.features || []).map((f, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full" style={{ background: "hsl(330 80% 55% / 0.12)", color: "hsl(330 80% 65%)" }}>
                            {f}
                            <button onClick={() => removeFeature(i)} className="hover:text-white"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                        className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                        style={inputStyle}
                        placeholder="Feature hinzufügen…"
                      />
                      <button onClick={addFeature} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)" }}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </FieldGroup>

                {/* Toggles */}
                <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Status</p>
                  <div className="grid grid-cols-2 gap-2">
                    <ToggleChip label="🚫 Ausverkauft" checked={editing.sold_out || false} onChange={(v) => setEditing({ ...editing, sold_out: v })} />
                    <ToggleChip label="🔒 Nur intern" checked={editing.internal_only || false} onChange={(v) => setEditing({ ...editing, internal_only: v })} />
                    <ToggleChip label="⏳ Coming Soon" checked={editing.coming_soon || false} onChange={(v) => setEditing({ ...editing, coming_soon: v })} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors hover:bg-white/[0.06]" style={{ background: "hsl(0 0% 100% / 0.04)", color: "hsl(0 0% 100% / 0.5)" }}>
                    Abbrechen
                  </button>
                  <button onClick={save} className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99]" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
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

// Helper components
const FieldGroup = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
      {label}
    </label>
    {children}
  </div>
);

const ToggleChip = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <button
    onClick={() => onChange(!checked)}
    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all"
    style={{
      background: checked ? "hsl(330 80% 55% / 0.12)" : "hsl(0 0% 100% / 0.03)",
      color: checked ? "hsl(330 80% 65%)" : "hsl(0 0% 100% / 0.4)",
      border: `1px solid ${checked ? "hsl(330 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.06)"}`,
    }}
  >
    <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: checked ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.2)" }}>
      {checked && <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(330 80% 55%)" }} />}
    </div>
    {label}
  </button>
);

export default TicketsAdmin;
