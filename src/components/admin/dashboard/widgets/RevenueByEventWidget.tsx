import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PiggyBank } from "lucide-react";

interface EventRevenue {
  title: string;
  city: string | null;
  revenue: number;
}

const RevenueByEventWidget = () => {
  const [events, setEvents] = useState<EventRevenue[]>([]);

  useEffect(() => {
    (async () => {
      const { data: orders } = await supabase.from("orders").select("event_id, total_amount, status").eq("status", "paid");
      if (!orders?.length) return;

      const map: Record<string, number> = {};
      orders.forEach(o => { if (o.event_id) map[o.event_id] = (map[o.event_id] || 0) + Number(o.total_amount); });

      const topIds = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const { data: evs } = await supabase.from("events").select("id, title, city").in("id", topIds.map(([id]) => id));

      setEvents(topIds.map(([id, rev]) => {
        const ev = evs?.find(e => e.id === id);
        return { title: ev?.title ?? "–", city: ev?.city ?? null, revenue: rev };
      }));
    })();
  }, []);

  if (!events.length) return (
    <div className="text-center py-6">
      <PiggyBank className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
      <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine Daten</p>
    </div>
  );

  const max = events[0]?.revenue ?? 1;

  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <div key={i}>
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-xs font-medium truncate" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{e.title}</p>
            <span className="text-xs font-bold shrink-0" style={{ color: "hsl(140 60% 50%)" }}>{e.revenue.toFixed(0)}€</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
            <div className="h-full rounded-full" style={{ width: `${(e.revenue / max) * 100}%`, background: "hsl(140 60% 50%)", transition: "width 0.6s" }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default RevenueByEventWidget;
