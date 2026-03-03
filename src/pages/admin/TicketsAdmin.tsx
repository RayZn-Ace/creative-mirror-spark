import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";
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
  sort_order: number | null;
  features: string[] | null;
}

interface EventOption {
  id: string;
  title: string;
}

const TicketsAdmin = () => {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [editing, setEditing] = useState<Partial<TicketRow> | null>(null);
  const [filterEvent, setFilterEvent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [ticketsRes, eventsRes] = await Promise.all([
      supabase.from("ticket_categories").select("*").order("sort_order"),
      supabase.from("events").select("id, title").order("title"),
    ]);
    setTickets((ticketsRes.data as TicketRow[]) || []);
    setEvents((eventsRes.data as EventOption[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filterEvent ? tickets.filter((t) => t.event_id === filterEvent) : tickets;

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
    if (!confirm("Ticket-Kategorie löschen?")) return;
    await supabase.from("ticket_categories").delete().eq("id", id);
    toast.success("Gelöscht");
    load();
  };

  const getEventTitle = (eventId: string) => events.find((e) => e.id === eventId)?.title || "—";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
          Ticket-Kategorien
        </h1>
        <button
          onClick={() => setEditing({ name: "", price: 0, event_id: events[0]?.id || "", sort_order: 0, sold_out: false, features: [] })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
        >
          <Plus className="w-4 h-4" /> Neue Kategorie
        </button>
      </div>

      {/* Filter */}
      {events.length > 0 && (
        <div className="mb-4">
          <select
            value={filterEvent}
            onChange={(e) => setFilterEvent(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
          >
            <option value="">Alle Events</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Keine Ticket-Kategorien vorhanden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{ticket.name}</span>
                  {ticket.sold_out && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>
                      Ausverkauft
                    </span>
                  )}
                </div>
                <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  {getEventTitle(ticket.event_id)} · {ticket.price.toFixed(2)} {ticket.currency}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(ticket)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => remove(ticket.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
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
              className="fixed inset-4 sm:inset-y-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 rounded-2xl overflow-y-auto"
              style={{ background: "hsl(220 50% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>
                  {editing.id ? "Kategorie bearbeiten" : "Neue Kategorie"}
                </h2>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Event *</label>
                  <select
                    value={editing.event_id || ""}
                    onChange={(e) => setEditing({ ...editing, event_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
                  >
                    {events.map((e) => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Name *</label>
                  <input
                    value={editing.name || ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Preis (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editing.price || 0}
                      onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Sortierung</label>
                    <input
                      type="number"
                      value={editing.sort_order || 0}
                      onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Beschreibung</label>
                  <textarea
                    value={editing.description || ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                  <input
                    type="checkbox"
                    checked={editing.sold_out || false}
                    onChange={(e) => setEditing({ ...editing, sold_out: e.target.checked })}
                    className="rounded"
                  />
                  Ausverkauft
                </label>

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

export default TicketsAdmin;
