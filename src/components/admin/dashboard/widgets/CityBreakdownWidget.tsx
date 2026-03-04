import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

const CityBreakdownWidget = () => {
  const [cities, setCities] = useState<{ city: string; count: number }[]>([]);

  useEffect(() => {
    supabase.from("tickets").select("event_id").then(async ({ data: tickets }) => {
      if (!tickets?.length) return;
      const eventIds = [...new Set(tickets.map(t => t.event_id))];
      const { data: events } = await supabase.from("events").select("id, city").in("id", eventIds);
      const cityMap: Record<string, number> = {};
      tickets.forEach(t => {
        const ev = events?.find(e => e.id === t.event_id);
        const city = ev?.city || "Unbekannt";
        cityMap[city] = (cityMap[city] || 0) + 1;
      });
      setCities(Object.entries(cityMap).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 6));
    });
  }, []);

  if (!cities.length) return <EmptyState icon={<MapPin className="w-7 h-7" />} text="Keine Daten" />;
  const max = cities[0].count;
  return (
    <div className="space-y-2">
      {cities.map(c => (
        <div key={c.city}>
          <div className="flex justify-between mb-0.5">
            <span className="text-xs font-medium" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{c.city}</span>
            <span className="text-xs font-bold" style={{ color: "hsl(270 60% 55%)" }}>{c.count}</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
            <div className="h-full rounded-full" style={{ width: `${(c.count / max) * 100}%`, background: "hsl(270 60% 55%)", transition: "width 0.6s" }} />
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyState = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="text-center py-6">
    <div className="mx-auto mb-2 w-7 h-7" style={{ color: "hsl(0 0% 100% / 0.15)" }}>{icon}</div>
    <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{text}</p>
  </div>
);

export default CityBreakdownWidget;
