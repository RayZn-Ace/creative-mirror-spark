import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Armchair, LayoutGrid, List, Pencil, Upload, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
  image_url: string | null;
  images: string[] | null;
  active: boolean;
  position_x: number;
  position_y: number;
  position_w: number;
  position_h: number;
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
}

interface EventOption {
  id: string;
  title: string;
  date: string | null;
  lounge_enabled: boolean;
  lounge_view_mode: string;
}

const bookingStatusColors: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "hsl(45 80% 25% / 0.3)", text: "hsl(45 80% 60%)", label: "Ausstehend" },
  approved: { bg: "hsl(150 60% 20% / 0.3)", text: "hsl(150 70% 55%)", label: "Zugesagt" },
  rejected: { bg: "hsl(0 60% 25% / 0.3)", text: "hsl(0 60% 55%)", label: "Abgelehnt" },
};

const loungeStatusColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
  available: { bg: "hsl(150 60% 20% / 0.2)", border: "hsl(150 70% 40% / 0.4)", text: "hsl(150 70% 55%)", label: "Frei" },
  reserved: { bg: "hsl(45 80% 25% / 0.2)", border: "hsl(45 80% 50% / 0.4)", text: "hsl(45 80% 60%)", label: "Reserviert" },
  booked: { bg: "hsl(0 60% 25% / 0.2)", border: "hsl(0 60% 45% / 0.4)", text: "hsl(0 60% 55%)", label: "Gebucht" },
};

const defaultLoungeNames = [
  "Lounge 1", "Lounge 2", "Lounge 3", "Martini Lounge 4",
  "VIP Lounge 5", "Lounge 6", "Lounge 7", "Lounge 8",
];

const LoungesAdmin = () => {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [lounges, setLounges] = useState<LoungeRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [tab, setTab] = useState<"lounges" | "bookings">("lounges");
  const [loungeEnabled, setLoungeEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<string>("list");
  const [editingLounge, setEditingLounge] = useState<LoungeRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", price: 0, min_persons: 1, max_persons: 10, image_url: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events")
        .select("id, title, date, lounge_enabled, lounge_view_mode")
        .order("date", { ascending: false });
      if (data) {
        setEvents(data as EventOption[]);
        if (data.length > 0) {
          setSelectedEventId(data[0].id);
          setLoungeEnabled(data[0].lounge_enabled ?? false);
          setViewMode(data[0].lounge_view_mode ?? "list");
        }
      }
    })();
  }, []);

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
    if (data) setBookings(data as BookingRow[]);
  };

  const toggleLoungeEnabled = async () => {
    const newVal = !loungeEnabled;
    await supabase.from("events").update({ lounge_enabled: newVal }).eq("id", selectedEventId);
    setLoungeEnabled(newVal);
    setEvents(prev => prev.map(e => e.id === selectedEventId ? { ...e, lounge_enabled: newVal } : e));

    if (newVal && lounges.length === 0) {
      await supabase.from("lounges").insert(
        defaultLoungeNames.map((name, i) => ({ name, event_id: selectedEventId, sort_order: i }))
      );
      await fetchLounges();
    }
    toast.success(newVal ? "Lounges aktiviert" : "Lounges deaktiviert");
  };

  const toggleViewMode = async () => {
    const newMode = viewMode === "list" ? "floorplan" : "list";
    await supabase.from("events").update({ lounge_view_mode: newMode }).eq("id", selectedEventId);
    setViewMode(newMode);
    setEvents(prev => prev.map(e => e.id === selectedEventId ? { ...e, lounge_view_mode: newMode } : e));
  };

  const updateLoungeStatus = async (id: string, status: string) => {
    await supabase.from("lounges").update({ status }).eq("id", id);
    fetchLounges();
  };

  const toggleLoungeActive = async (id: string, active: boolean) => {
    await supabase.from("lounges").update({ active } as any).eq("id", id);
    setLounges(prev => prev.map(l => l.id === id ? { ...l, active } : l));
    toast.success(active ? "Lounge aktiviert" : "Lounge deaktiviert");
  };

  const openEdit = (lounge: LoungeRow) => {
    setEditingLounge(lounge);
    setEditForm({
      name: lounge.name,
      description: lounge.description || "",
      price: lounge.price || 0,
      min_persons: lounge.min_persons || 1,
      max_persons: lounge.max_persons || 10,
      image_url: lounge.image_url || "",
    });
  };

  const saveEdit = async () => {
    if (!editingLounge) return;
    await supabase.from("lounges").update({
      name: editForm.name,
      description: editForm.description || null,
      price: editForm.price,
      min_persons: editForm.min_persons,
      max_persons: editForm.max_persons,
      image_url: editForm.image_url || null,
    } as any).eq("id", editingLounge.id);
    toast.success("Lounge gespeichert");
    setEditingLounge(null);
    fetchLounges();
  };

  const updateBookingStatus = async (bookingId: string, status: string, loungeId: string) => {
    await supabase.from("lounge_bookings").update({ status }).eq("id", bookingId);
    if (status === "approved") {
      await supabase.from("lounges").update({ status: "reserved" }).eq("id", loungeId);
    }
    toast.success(status === "approved" ? "Anfrage zugesagt" : "Anfrage abgelehnt");
    fetchLounges();
    fetchBookings();
  };

  const statusCycle = (current: string) => {
    const cycle: Record<string, string> = { available: "reserved", reserved: "booked", booked: "available" };
    return cycle[current] || "available";
  };

  const inputStyle: React.CSSProperties = {
    background: "hsl(0 0% 100% / 0.06)",
    border: "1px solid hsl(0 0% 100% / 0.1)",
    color: "hsl(0 0% 100%)",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black" style={{ color: "hsl(0 0% 100%)" }}>
        <Armchair className="w-6 h-6 inline mr-2" style={{ color: "hsl(270 70% 55%)" }} />
        Lounges
      </h1>

      {/* Event Selector + Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm min-w-[200px]" style={inputStyle}>
          {events.map(ev => (
            <option key={ev.id} value={ev.id} style={{ background: "hsl(220 40% 10%)" }}>
              {ev.title} {ev.date ? `(${new Date(ev.date).toLocaleDateString("de-DE")})` : ""}
            </option>
          ))}
        </select>

        <button onClick={toggleLoungeEnabled}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
          style={{
            background: loungeEnabled ? "hsl(150 60% 20% / 0.3)" : "hsl(0 0% 100% / 0.06)",
            border: `1px solid ${loungeEnabled ? "hsl(150 70% 40% / 0.4)" : "hsl(0 0% 100% / 0.1)"}`,
            color: loungeEnabled ? "hsl(150 70% 55%)" : "hsl(0 0% 100% / 0.5)",
          }}>
          {loungeEnabled ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {loungeEnabled ? "Aktiv" : "Inaktiv"}
        </button>

        <button onClick={toggleViewMode}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
          style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.7)" }}>
          {viewMode === "floorplan" ? <LayoutGrid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
          {viewMode === "floorplan" ? "Saalplan" : "Liste"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
        {(["lounges", "bookings"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === t ? "hsl(270 70% 55% / 0.15)" : "transparent",
              color: tab === t ? "hsl(270 70% 55%)" : "hsl(0 0% 100% / 0.5)",
            }}>
            {t === "lounges" ? `Lounges (${lounges.length})` : `Anfragen (${bookings.length})`}
          </button>
        ))}
      </div>

      {/* Lounges Tab */}
      {tab === "lounges" && (
        <div className="space-y-3">
          {lounges.length === 0 ? (
            <p className="text-center py-8 text-sm" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
              Klicke oben auf „Aktiv" um die 8 Standard-Lounges automatisch anzulegen.
            </p>
          ) : viewMode === "floorplan" ? (
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ background: "hsl(0 0% 100% / 0.02)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                <p className="text-xs text-center mb-3" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  Klicke auf eine Lounge um den Status zu ändern (Frei → Reserviert → Gebucht → Frei)
                </p>
                <FloorplanView
                  lounges={lounges as any}
                  adminMode
                  onSelect={(lounge) => updateLoungeStatus(lounge.id, statusCycle(lounge.status))}
                />
              </div>
              {/* Compact control list below floorplan */}
              <div className="grid gap-2">
                {lounges.map(lounge => {
                  const sc = loungeStatusColors[lounge.status] || loungeStatusColors.available;
                  return (
                    <div key={lounge.id} className="rounded-xl px-4 py-2.5 flex items-center gap-3"
                      style={{
                        background: "hsl(0 0% 100% / 0.03)",
                        border: `1px solid ${lounge.active ? sc.border : "hsl(0 0% 100% / 0.06)"}`,
                        opacity: lounge.active ? 1 : 0.5,
                      }}>
                      <span className="text-xs font-bold flex-1 truncate" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
                        {lounge.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: sc.bg, color: sc.text }}>
                        {sc.label}
                      </span>
                      <button onClick={() => openEdit(lounge)}
                        className="p-1.5 rounded-lg shrink-0 hover:scale-105 transition-all"
                        style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                        <Pencil className="w-3 h-3" style={{ color: "hsl(0 0% 100% / 0.6)" }} />
                      </button>
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <Switch
                          checked={lounge.active}
                          onCheckedChange={(val) => toggleLoungeActive(lounge.id, val)}
                        />
                        <span className="text-[8px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                          {lounge.active ? "Aktiv" : "Aus"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* LIST VIEW */
            <div className="grid gap-3">
              {lounges.map(lounge => {
                const sc = loungeStatusColors[lounge.status] || loungeStatusColors.available;
                return (
                  <div key={lounge.id}
                    className="rounded-xl p-4 flex items-center gap-4 transition-all"
                    style={{
                      background: "hsl(0 0% 100% / 0.03)",
                      border: `1px solid ${lounge.active ? sc.border : "hsl(0 0% 100% / 0.06)"}`,
                      opacity: lounge.active ? 1 : 0.5,
                    }}>
                    {/* Image thumbnail */}
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                      {lounge.image_url ? (
                        <img src={lounge.image_url} alt={lounge.name} className="w-full h-full object-cover" />
                      ) : (
                        <Armchair className="w-6 h-6" style={{ color: sc.text }} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
                          {lounge.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: sc.bg, color: sc.text }}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                        {lounge.price > 0 ? `${lounge.price} €` : "Kostenlos"} · {lounge.min_persons}–{lounge.max_persons} Pers.
                      </p>
                      {lounge.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                          {lounge.description}
                        </p>
                      )}
                    </div>

                    {/* Status cycle button */}
                    <button
                      onClick={() => updateLoungeStatus(lounge.id, statusCycle(lounge.status))}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105 shrink-0"
                      style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                      Status →
                    </button>

                    {/* Edit button */}
                    <button onClick={() => openEdit(lounge)}
                      className="p-2 rounded-lg transition-all hover:scale-105 shrink-0"
                      style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                      <Pencil className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.6)" }} />
                    </button>

                    {/* Active switch */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <Switch
                        checked={lounge.active}
                        onCheckedChange={(val) => toggleLoungeActive(lounge.id, val)}
                      />
                      <span className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                        {lounge.active ? "Aktiv" : "Aus"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Dialog */}
      {editingLounge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditingLounge(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4 mx-4"
            style={{ background: "hsl(220 30% 8%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>
              <Pencil className="w-4 h-4 inline mr-2" style={{ color: "hsl(270 70% 55%)" }} />
              Lounge bearbeiten
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Name</label>
                <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" />
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Beschreibung</label>
                <Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" placeholder="z.B. Premium VIP Lounge mit Sofa..." />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Preis (€)</label>
                  <Input type="number" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: Number(e.target.value) }))}
                    className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Min Pers.</label>
                  <Input type="number" value={editForm.min_persons} onChange={e => setEditForm(f => ({ ...f, min_persons: Number(e.target.value) }))}
                    className="bg-white/5 border-white/10 text-white" />
                </div>
                <div>
                  <label className="text-xs font-bold mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Max Pers.</label>
                  <Input type="number" value={editForm.max_persons} onChange={e => setEditForm(f => ({ ...f, max_persons: Number(e.target.value) }))}
                    className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                  <ImageIcon className="w-3 h-3 inline mr-1" />
                  Bild-URL
                </label>
                <Input value={editForm.image_url} onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white" placeholder="https://..." />
                {editForm.image_url && (
                  <img src={editForm.image_url} alt="Preview" className="mt-2 w-full h-24 object-cover rounded-lg" />
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingLounge(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.6)" }}>
                Abbrechen
              </button>
              <button onClick={saveEdit}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                style={{ background: "hsl(270 70% 55%)", color: "white" }}>
                Speichern
              </button>
            </div>
          </div>
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
