import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, Check, X, ChevronDown, Armchair, Eye, LayoutGrid, List,
} from "lucide-react";
import FloorplanView from "@/components/lounge/FloorplanView";

interface LoungeRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  min_persons: number;
  max_persons: number;
  status: string;
  sort_order: number;
}

interface BookingRow {
  id: string;
  lounge_id: string;
  event_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  party_size: number;
  message: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  lounge_name?: string;
}

interface EventOption {
  id: string;
  title: string;
  date: string | null;
  lounge_enabled: boolean;
  lounge_view_mode: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  available: { bg: "hsl(150 60% 20% / 0.3)", text: "hsl(150 70% 55%)" },
  reserved: { bg: "hsl(45 80% 25% / 0.3)", text: "hsl(45 80% 60%)" },
  booked: { bg: "hsl(0 60% 25% / 0.3)", text: "hsl(0 60% 55%)" },
};

const bookingStatusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "hsl(45 80% 25% / 0.3)", text: "hsl(45 80% 60%)", label: "Ausstehend" },
  approved: { bg: "hsl(150 60% 20% / 0.3)", text: "hsl(150 70% 55%)", label: "Zugesagt" },
  rejected: { bg: "hsl(0 60% 25% / 0.3)", text: "hsl(0 60% 55%)", label: "Abgelehnt" },
};

const LoungesAdmin = () => {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [lounges, setLounges] = useState<LoungeRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [tab, setTab] = useState<"lounges" | "bookings">("lounges");
  const [editingLounge, setEditingLounge] = useState<Partial<LoungeRow> | null>(null);
  const [loungeEnabled, setLoungeEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<string>("list");

  // Fetch events
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events")
        .select("id, title, date, lounge_enabled, lounge_view_mode")
        .order("date", { ascending: false });
      if (data) {
        setEvents(data as EventOption[]);
        if (data.length > 0 && !selectedEventId) {
          setSelectedEventId(data[0].id);
          setLoungeEnabled(data[0].lounge_enabled ?? false);
          setViewMode(data[0].lounge_view_mode ?? "list");
        }
      }
    })();
  }, []);

  // Fetch lounges & bookings when event changes
  useEffect(() => {
    if (!selectedEventId) return;
    const ev = events.find(e => e.id === selectedEventId);
    if (ev) {
      setLoungeEnabled(ev.lounge_enabled ?? false);
      setViewMode(ev.lounge_view_mode ?? "list");
    }
    fetchLounges();
    fetchBookings();
  }, [selectedEventId]);

  const fetchLounges = async () => {
    const { data } = await supabase.from("lounges")
      .select("*").eq("event_id", selectedEventId).order("sort_order");
    if (data) setLounges(data as LoungeRow[]);
  };

  const fetchBookings = async () => {
    const { data } = await supabase.from("lounge_bookings")
      .select("*").eq("event_id", selectedEventId).order("created_at", { ascending: false });
    if (data) {
      // Attach lounge names
      const withNames = data.map((b: any) => {
        const l = lounges.find(l => l.id === b.lounge_id);
        return { ...b, lounge_name: l?.name || "—" };
      });
      setBookings(withNames as BookingRow[]);
    }
  };

  // Re-fetch bookings when lounges change (for names)
  useEffect(() => { if (selectedEventId) fetchBookings(); }, [lounges]);

  const toggleLoungeEnabled = async () => {
    const newVal = !loungeEnabled;
    await supabase.from("events").update({ lounge_enabled: newVal }).eq("id", selectedEventId);
    setLoungeEnabled(newVal);
    setEvents(prev => prev.map(e => e.id === selectedEventId ? { ...e, lounge_enabled: newVal } : e));
    toast.success(newVal ? "Lounges aktiviert" : "Lounges deaktiviert");
  };

  const toggleViewMode = async () => {
    const newMode = viewMode === "list" ? "floorplan" : "list";
    await supabase.from("events").update({ lounge_view_mode: newMode }).eq("id", selectedEventId);
    setViewMode(newMode);
    setEvents(prev => prev.map(e => e.id === selectedEventId ? { ...e, lounge_view_mode: newMode } : e));
  };

  const saveLounge = async () => {
    if (!editingLounge?.name) return;
    if (editingLounge.id) {
      await supabase.from("lounges").update({
        name: editingLounge.name,
        description: editingLounge.description || null,
        price: editingLounge.price || 0,
        min_persons: editingLounge.min_persons || 1,
        max_persons: editingLounge.max_persons || 10,
        status: editingLounge.status || "available",
      }).eq("id", editingLounge.id);
      toast.success("Lounge aktualisiert");
    } else {
      await supabase.from("lounges").insert({
        event_id: selectedEventId,
        name: editingLounge.name,
        description: editingLounge.description || null,
        price: editingLounge.price || 0,
        min_persons: editingLounge.min_persons || 1,
        max_persons: editingLounge.max_persons || 10,
        sort_order: lounges.length,
      });
      toast.success("Lounge erstellt");
    }
    setEditingLounge(null);
    fetchLounges();
  };

  const deleteLounge = async (id: string) => {
    if (!confirm("Lounge wirklich löschen?")) return;
    await supabase.from("lounges").delete().eq("id", id);
    toast.success("Lounge gelöscht");
    fetchLounges();
  };

  const updateLoungeStatus = async (id: string, status: string) => {
    await supabase.from("lounges").update({ status }).eq("id", id);
    fetchLounges();
  };

  const updateBookingStatus = async (bookingId: string, status: string, loungeId: string) => {
    await supabase.from("lounge_bookings").update({ status }).eq("id", bookingId);
    // If approved → set lounge to reserved; if rejected and was pending, keep available
    if (status === "approved") {
      await supabase.from("lounges").update({ status: "reserved" }).eq("id", loungeId);
    }
    toast.success(status === "approved" ? "Anfrage zugesagt" : "Anfrage abgelehnt");
    fetchLounges();
    fetchBookings();
  };

  const inputStyle: React.CSSProperties = {
    background: "hsl(0 0% 100% / 0.06)",
    border: "1px solid hsl(0 0% 100% / 0.1)",
    color: "hsl(0 0% 100%)",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black" style={{ color: "hsl(0 0% 100%)" }}>
          <Armchair className="w-6 h-6 inline mr-2" style={{ color: "hsl(270 70% 55%)" }} />
          Lounges
        </h1>
      </div>

      {/* Event Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm min-w-[200px]"
          style={inputStyle}
        >
          {events.map(ev => (
            <option key={ev.id} value={ev.id} style={{ background: "hsl(220 40% 10%)" }}>
              {ev.title} {ev.date ? `(${new Date(ev.date).toLocaleDateString("de-DE")})` : ""}
            </option>
          ))}
        </select>

        {/* Toggle enabled */}
        <button
          onClick={toggleLoungeEnabled}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: loungeEnabled ? "hsl(150 60% 20% / 0.3)" : "hsl(0 0% 100% / 0.06)",
            border: `1px solid ${loungeEnabled ? "hsl(150 70% 40% / 0.4)" : "hsl(0 0% 100% / 0.1)"}`,
            color: loungeEnabled ? "hsl(150 70% 55%)" : "hsl(0 0% 100% / 0.5)",
          }}
        >
          {loungeEnabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {loungeEnabled ? "Aktiv" : "Inaktiv"}
        </button>

        {/* View mode toggle */}
        <button
          onClick={toggleViewMode}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
          style={{
            background: "hsl(0 0% 100% / 0.06)",
            border: "1px solid hsl(0 0% 100% / 0.1)",
            color: "hsl(0 0% 100% / 0.7)",
          }}
        >
          {viewMode === "floorplan" ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
          {viewMode === "floorplan" ? "Saalplan" : "Liste"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
        {(["lounges", "bookings"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === t ? "hsl(270 70% 55% / 0.15)" : "transparent",
              color: tab === t ? "hsl(270 70% 55%)" : "hsl(0 0% 100% / 0.5)",
            }}
          >
            {t === "lounges" ? `Lounges (${lounges.length})` : `Anfragen (${bookings.length})`}
          </button>
        ))}
      </div>

      {/* Lounges Tab */}
      {tab === "lounges" && (
        <div className="space-y-3">
          <button
            onClick={() => setEditingLounge({ name: "", price: 0, min_persons: 1, max_persons: 10 })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "hsl(270 70% 55%)", color: "white" }}
          >
            <Plus className="w-4 h-4" /> Neue Lounge
          </button>

          {/* Edit form */}
          {editingLounge && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Name *" value={editingLounge.name || ""} onChange={e => setEditingLounge({ ...editingLounge, name: e.target.value })}
                  className="px-3 py-2 rounded-xl text-sm col-span-2" style={inputStyle} />
                <input placeholder="Beschreibung" value={editingLounge.description || ""} onChange={e => setEditingLounge({ ...editingLounge, description: e.target.value })}
                  className="px-3 py-2 rounded-xl text-sm col-span-2" style={inputStyle} />
                <input type="number" placeholder="Preis (€)" value={editingLounge.price || 0} onChange={e => setEditingLounge({ ...editingLounge, price: Number(e.target.value) })}
                  className="px-3 py-2 rounded-xl text-sm" style={inputStyle} />
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={editingLounge.min_persons || 1} onChange={e => setEditingLounge({ ...editingLounge, min_persons: Number(e.target.value) })}
                    className="px-3 py-2 rounded-xl text-sm flex-1" style={inputStyle} />
                  <input type="number" placeholder="Max" value={editingLounge.max_persons || 10} onChange={e => setEditingLounge({ ...editingLounge, max_persons: Number(e.target.value) })}
                    className="px-3 py-2 rounded-xl text-sm flex-1" style={inputStyle} />
                </div>
              </div>
              {editingLounge.id && (
                <select value={editingLounge.status || "available"} onChange={e => setEditingLounge({ ...editingLounge, status: e.target.value })}
                  className="px-3 py-2 rounded-xl text-sm" style={inputStyle}>
                  <option value="available" style={{ background: "hsl(220 40% 10%)" }}>Verfügbar</option>
                  <option value="reserved" style={{ background: "hsl(220 40% 10%)" }}>Reserviert</option>
                  <option value="booked" style={{ background: "hsl(220 40% 10%)" }}>Gebucht</option>
                </select>
              )}
              <div className="flex gap-2">
                <button onClick={saveLounge} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: "hsl(150 60% 35%)", color: "white" }}>
                  <Check className="w-3.5 h-3.5 inline mr-1" /> Speichern
                </button>
                <button onClick={() => setEditingLounge(null)} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)" }}>
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Lounge list */}
          {lounges.map(l => {
            const sc = statusColors[l.status] || statusColors.available;
            return (
              <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.9)" }}>{l.name}</p>
                  <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                    {l.price > 0 ? `${l.price} €` : "Kostenlos"} · {l.min_persons}–{l.max_persons} Pers.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status dropdown */}
                  <select
                    value={l.status}
                    onChange={e => updateLoungeStatus(l.id, e.target.value)}
                    className="px-2 py-1 rounded-lg text-xs font-bold"
                    style={{ background: sc.bg, color: sc.text, border: "none" }}
                  >
                    <option value="available">Verfügbar</option>
                    <option value="reserved">Reserviert</option>
                    <option value="booked">Gebucht</option>
                  </select>
                  <button onClick={() => setEditingLounge(l)} className="p-1.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
                    <Pencil className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.5)" }} />
                  </button>
                  <button onClick={() => deleteLounge(l.id)} className="p-1.5 rounded-lg" style={{ background: "hsl(0 60% 30% / 0.2)" }}>
                    <Trash2 className="w-3.5 h-3.5" style={{ color: "hsl(0 60% 55%)" }} />
                  </button>
                </div>
              </div>
            );
          })}
          {lounges.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
              Noch keine Lounges für dieses Event angelegt.
            </p>
          )}
        </div>
      )}

      {/* Bookings Tab */}
      {tab === "bookings" && (
        <div className="space-y-3">
          {bookings.map(b => {
            const sc = bookingStatusColors[b.status] || bookingStatusColors.pending;
            const loungeName = lounges.find(l => l.id === b.lounge_id)?.name || "—";
            return (
              <div key={b.id} className="rounded-xl p-4" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
                      {b.customer_name} → {loungeName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                      {b.customer_email} {b.customer_phone ? `· ${b.customer_phone}` : ""} · {b.party_size} Pers.
                    </p>
                    {b.message && <p className="text-xs mt-1 italic" style={{ color: "hsl(0 0% 100% / 0.3)" }}>"{b.message}"</p>}
                    <p className="text-[10px] mt-1" style={{ color: "hsl(0 0% 100% / 0.25)" }}>
                      {new Date(b.created_at).toLocaleString("de-DE")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
                    {b.status === "pending" && (
                      <>
                        <button onClick={() => updateBookingStatus(b.id, "approved", b.lounge_id)}
                          className="p-1.5 rounded-lg" style={{ background: "hsl(150 60% 25% / 0.3)" }}>
                          <Check className="w-3.5 h-3.5" style={{ color: "hsl(150 70% 55%)" }} />
                        </button>
                        <button onClick={() => updateBookingStatus(b.id, "rejected", b.lounge_id)}
                          className="p-1.5 rounded-lg" style={{ background: "hsl(0 60% 25% / 0.3)" }}>
                          <X className="w-3.5 h-3.5" style={{ color: "hsl(0 60% 55%)" }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {bookings.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
              Noch keine Anfragen für dieses Event.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default LoungesAdmin;
