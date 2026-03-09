import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Trash2, Users, Calendar } from "lucide-react";

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  event_id: string;
}

interface EventInfo {
  id: string;
  title: string;
  date: string | null;
  city: string | null;
}

const WaitlistAdmin = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [events, setEvents] = useState<Record<string, EventInfo>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: waitlistData }, { data: eventsData }] = await Promise.all([
      supabase.from("waitlist").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("id, title, date, city"),
    ]);
    setEntries(waitlistData || []);
    const evMap: Record<string, EventInfo> = {};
    (eventsData || []).forEach((e: any) => { evMap[e.id] = e; });
    setEvents(evMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const eventIds = [...new Set(entries.map((e) => e.event_id))];
  const filtered = filter === "all" ? entries : entries.filter((e) => e.event_id === filter);

  const handleDelete = async (id: string) => {
    await supabase.from("waitlist").delete().eq("id", id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDeleteAll = async (eventId: string) => {
    if (!confirm("Alle Warteliste-Einträge für dieses Event löschen?")) return;
    await supabase.from("waitlist").delete().eq("event_id", eventId);
    setEntries((prev) => prev.filter((e) => e.event_id !== eventId));
  };

  const exportCSV = (eventId?: string) => {
    const data = eventId ? entries.filter((e) => e.event_id === eventId) : filtered;
    const rows = [
      ["E-Mail", "Event", "Stadt", "Datum", "Eingetragen am"],
      ...data.map((e) => {
        const ev = events[e.event_id];
        return [
          e.email,
          ev?.title || "Unbekannt",
          ev?.city || "",
          ev?.date || "",
          new Date(e.created_at).toLocaleString("de-DE"),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `warteliste${eventId ? `-${events[eventId]?.title || eventId}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("de-DE");
  const formatDateTime = (iso: string) => new Date(iso).toLocaleString("de-DE");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "hsl(0 0% 100%)" }}>Warteliste</h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            {entries.length} Einträge für {eventIds.length} Events
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm"
            style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
          >
            <option value="all">Alle Events</option>
            {eventIds.map((id) => (
              <option key={id} value={id}>{events[id]?.title || id}</option>
            ))}
          </select>
          <button
            onClick={() => exportCSV()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
            style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}
          >
            <Download className="w-4 h-4" /> CSV Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Laden...</div>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
          <p className="text-sm font-medium" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Noch keine Warteliste-Einträge</p>
        </div>
      ) : (
        /* Group by event */
        <div className="space-y-4">
          {(filter === "all" ? eventIds : [filter]).map((eventId) => {
            const ev = events[eventId];
            const eventEntries = entries.filter((e) => e.event_id === eventId);
            if (eventEntries.length === 0) return null;

            return (
              <div key={eventId} className="rounded-2xl overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                {/* Event header */}
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(0 70% 50% / 0.15)" }}>
                      <Users className="w-4 h-4" style={{ color: "hsl(0 70% 55%)" }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{ev?.title || "Unbekanntes Event"}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {ev?.date && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                            <Calendar className="w-3 h-3" /> {formatDate(ev.date)}
                          </span>
                        )}
                        {ev?.city && (
                          <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>· {ev.city}</span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>
                          {eventEntries.length} Einträge
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportCSV(eventId)}
                      className="p-2 rounded-lg transition-all hover:scale-105"
                      style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}
                      title="CSV exportieren"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAll(eventId)}
                      className="p-2 rounded-lg transition-all hover:scale-105"
                      style={{ background: "hsl(0 70% 50% / 0.1)", color: "hsl(0 70% 55%)" }}
                      title="Alle löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Entries */}
                <div className="divide-y" style={{ borderColor: "hsl(0 0% 100% / 0.04)" }}>
                  {eventEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <div>
                        <span className="text-sm font-medium" style={{ color: "hsl(0 0% 100% / 0.9)" }}>{entry.email}</span>
                        <span className="text-xs ml-3" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{formatDateTime(entry.created_at)}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-all"
                        style={{ color: "hsl(0 70% 55%)" }}
                        title="Löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WaitlistAdmin;
