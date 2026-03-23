import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FloorplanView from "./FloorplanView";
import LoungeBookingForm from "./LoungeBookingForm";
import LoungeDetailPopup from "./LoungeDetailPopup";
import { Armchair, Check, Clock, X as XIcon } from "lucide-react";

interface Lounge {
  id: string;
  name: string;
  description: string | null;
  price: number;
  min_persons: number;
  max_persons: number;
  status: "available" | "reserved" | "booked";
  position_x: number;
  position_y: number;
  position_w: number;
  position_h: number;
  sort_order: number;
  images: string[] | null;
  image_url: string | null;
}

interface Props {
  eventId: string;
  viewMode: "list" | "floorplan";
}

const statusConfig: Record<string, { bg: string; border: string; text: string; label: string; icon: any }> = {
  available: { bg: "hsl(150 60% 15% / 0.3)", border: "hsl(150 70% 40% / 0.4)", text: "hsl(150 70% 55%)", label: "Verfügbar", icon: Check },
  reserved: { bg: "hsl(45 80% 20% / 0.3)", border: "hsl(45 80% 50% / 0.4)", text: "hsl(45 80% 60%)", label: "Reserviert", icon: Clock },
  booked: { bg: "hsl(0 60% 20% / 0.3)", border: "hsl(0 60% 45% / 0.4)", text: "hsl(0 60% 55%)", label: "Gebucht", icon: XIcon },
};

const LoungeSection = ({ eventId, viewMode }: Props) => {
  const [lounges, setLounges] = useState<Lounge[]>([]);
  const [selected, setSelected] = useState<Lounge | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchLounges = async () => {
    const { data } = await supabase
      .from("lounges")
      .select("*")
      .eq("event_id", eventId)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (data) setLounges(data as Lounge[]);
  };

  useEffect(() => { fetchLounges(); }, [eventId]);

  if (!lounges.length) return null;

  const handleSelect = (lounge: Lounge) => {
    setSelected(lounge);
    setShowDetail(true);
  };

  const handleBookFromDetail = () => {
    setShowDetail(false);
    setShowForm(true);
  };

  const handleCloseAll = () => {
    setShowDetail(false);
    setShowForm(false);
    setSelected(null);
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-black uppercase tracking-wider mb-4 flex items-center gap-2"
        style={{ color: "hsl(0 0% 100%)" }}>
        <Armchair className="w-5 h-5" style={{ color: "hsl(270 70% 55%)" }} />
        Lounge Reservierung
      </h3>

      {viewMode === "floorplan" ? (
        <FloorplanView
          lounges={lounges}
          onSelect={handleSelect}
          selectedId={selected?.id}
        />
      ) : (
        <div className="grid gap-2">
          {lounges.map(lounge => {
            const cfg = statusConfig[lounge.status];
            const Icon = cfg.icon;
            return (
              <button
                key={lounge.id}
                onClick={() => handleSelect(lounge)}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  cursor: "pointer",
                }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.9)" }}>{lounge.name}</p>
                  {lounge.description && (
                    <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{lounge.description}</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    {lounge.price > 0 ? `ab ${lounge.price} €` : "Kostenlos"} · {lounge.min_persons}–{lounge.max_persons} Pers.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.text }} />
                  <span className="text-xs font-bold" style={{ color: cfg.text }}>{cfg.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail popup */}
      {showDetail && selected && (
        <LoungeDetailPopup
          lounge={selected}
          onClose={handleCloseAll}
          onBook={handleBookFromDetail}
        />
      )}

      {/* Booking form */}
      {showForm && selected && (
        <LoungeBookingForm
          lounge={selected}
          eventId={eventId}
          onClose={handleCloseAll}
          onSuccess={() => { handleCloseAll(); fetchLounges(); }}
        />
      )}
    </div>
  );
};

export default LoungeSection;
