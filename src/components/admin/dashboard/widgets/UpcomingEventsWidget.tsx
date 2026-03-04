import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, MapPin } from "lucide-react";

interface Ev {
  id: string;
  title: string;
  city: string | null;
  date: string | null;
}

const UpcomingEventsWidget = () => {
  const [events, setEvents] = useState<Ev[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("events")
      .select("id, title, city, date")
      .eq("status", "published")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(5)
      .then(({ data }) => setEvents(data ?? []));
  }, []);

  if (!events.length) {
    return (
      <div className="text-center py-6">
        <CalendarDays className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
        <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine kommenden Events</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {events.map((ev) => {
        const daysUntil = ev.date
          ? Math.ceil((new Date(ev.date).getTime() - Date.now()) / 86400000)
          : null;
        return (
          <div key={ev.id} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "hsl(0 0% 100% / 0.85)" }}>{ev.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {ev.city && (
                  <span className="flex items-center gap-0.5 text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                    <MapPin className="w-2.5 h-2.5" /> {ev.city}
                  </span>
                )}
                {ev.date && (
                  <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                    {new Date(ev.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                  </span>
                )}
              </div>
            </div>
            {daysUntil !== null && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: daysUntil <= 3 ? "hsl(330 80% 55% / 0.15)" : "hsl(200 80% 55% / 0.15)",
                  color: daysUntil <= 3 ? "hsl(330 80% 55%)" : "hsl(200 80% 55%)",
                }}
              >
                {daysUntil === 0 ? "Heute" : daysUntil === 1 ? "Morgen" : `in ${daysUntil}d`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UpcomingEventsWidget;
