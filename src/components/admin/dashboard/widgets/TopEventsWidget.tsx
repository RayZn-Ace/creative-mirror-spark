import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

interface TopEvent {
  title: string;
  city: string | null;
  count: number;
}

const TopEventsWidget = () => {
  const [events, setEvents] = useState<TopEvent[]>([]);

  useEffect(() => {
    (async () => {
      const { data: tickets } = await supabase.from("tickets").select("event_id");
      if (!tickets?.length) return;

      const counts: Record<string, number> = {};
      tickets.forEach(t => { counts[t.event_id] = (counts[t.event_id] || 0) + 1; });

      const topIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const { data: evs } = await supabase.from("events").select("id, title, city").in("id", topIds.map(([id]) => id));

      setEvents(topIds.map(([id, count]) => {
        const ev = evs?.find(e => e.id === id);
        return { title: ev?.title ?? "–", city: ev?.city ?? null, count };
      }));
    })();
  }, []);

  if (!events.length) return (
    <div className="text-center py-6">
      <Trophy className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
      <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine Daten</p>
    </div>
  );

  const maxCount = events[0]?.count ?? 1;

  return (
    <div className="space-y-2">
      {events.map((ev, i) => (
        <div key={i} className="rounded-lg px-2.5 py-2" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-medium truncate" style={{ color: "hsl(0 0% 100% / 0.85)" }}>{ev.title}</p>
            <span className="text-xs font-bold shrink-0" style={{ color: "hsl(45 80% 55%)" }}>{ev.count}</span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
            <div className="h-full rounded-full" style={{ width: `${(ev.count / maxCount) * 100}%`, background: "hsl(45 80% 55%)", transition: "width 0.6s" }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopEventsWidget;
