import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gauge } from "lucide-react";

interface EventCapacity {
  title: string;
  city: string | null;
  sold: number;
  soldOut: boolean;
}

const CapacityOverviewWidget = () => {
  const [events, setEvents] = useState<EventCapacity[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data: evs } = await supabase.from("events")
        .select("id, title, city, sold_out")
        .eq("status", "published").gte("date", today)
        .order("date", { ascending: true }).limit(6);
      if (!evs?.length) return;

      const { data: tickets } = await supabase.from("tickets")
        .select("event_id").in("event_id", evs.map(e => e.id));

      setEvents(evs.map(e => ({
        title: e.title,
        city: e.city,
        sold: tickets?.filter(t => t.event_id === e.id).length ?? 0,
        soldOut: e.sold_out ?? false,
      })));
    })();
  }, []);

  if (!events.length) return (
    <div className="text-center py-6">
      <Gauge className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
      <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine Events</p>
    </div>
  );

  return (
    <div className="space-y-1.5">
      {events.map((e, i) => (
        <div key={i} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "hsl(0 0% 100% / 0.85)" }}>{e.title}</p>
            {e.city && <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{e.city}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100%)" }}>{e.sold}</span>
            {e.soldOut && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(0 60% 50% / 0.15)", color: "hsl(0 60% 50%)" }}>
                Ausverkauft
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CapacityOverviewWidget;
