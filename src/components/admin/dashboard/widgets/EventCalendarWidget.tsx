import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";

interface CalendarDay {
  date: number;
  isToday: boolean;
  events: string[];
  isCurrentMonth: boolean;
}

const EventCalendarWidget = () => {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [monthLabel, setMonthLabel] = useState("");

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = (firstDay.getDay() + 6) % 7; // Monday start

    setMonthLabel(now.toLocaleDateString("de-DE", { month: "long", year: "numeric" }));

    const fromDate = new Date(year, month, 1 - startPad).toISOString().split("T")[0];
    const toDate = new Date(year, month + 1, 7).toISOString().split("T")[0];

    supabase
      .from("events")
      .select("title, date")
      .gte("date", fromDate)
      .lte("date", toDate)
      .eq("status", "published")
      .then(({ data: events }) => {
        const eventsByDate: Record<string, string[]> = {};
        events?.forEach(e => {
          if (e.date) {
            if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
            eventsByDate[e.date].push(e.title);
          }
        });

        const allDays: CalendarDay[] = [];
        for (let i = -startPad; i < lastDay.getDate(); i++) {
          const d = new Date(year, month, i + 1);
          const dateStr = d.toISOString().split("T")[0];
          allDays.push({
            date: d.getDate(),
            isToday: dateStr === now.toISOString().split("T")[0],
            events: eventsByDate[dateStr] ?? [],
            isCurrentMonth: d.getMonth() === month,
          });
        }
        // Fill to complete last week
        while (allDays.length % 7 !== 0) {
          const d = new Date(year, month + 1, allDays.length - lastDay.getDate() - startPad + 1);
          allDays.push({ date: d.getDate(), isToday: false, events: [], isCurrentMonth: false });
        }
        setDays(allDays);
      });
  }, []);

  return (
    <div>
      <div className="text-center mb-2">
        <span className="text-xs font-bold capitalize" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{monthLabel}</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
          <span key={d} className="text-[9px] font-bold" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d, i) => (
          <div
            key={i}
            className="relative aspect-square flex items-center justify-center rounded"
            style={{
              background: d.isToday ? "hsl(330 80% 55% / 0.2)" : d.events.length ? "hsl(270 60% 55% / 0.1)" : "transparent",
              border: d.isToday ? "1px solid hsl(330 80% 55% / 0.4)" : "none",
            }}
            title={d.events.join(", ")}
          >
            <span className="text-[10px]" style={{ color: d.isCurrentMonth ? "hsl(0 0% 100% / 0.7)" : "hsl(0 0% 100% / 0.2)" }}>
              {d.date}
            </span>
            {d.events.length > 0 && (
              <div className="absolute bottom-0.5 flex gap-0.5 justify-center">
                {d.events.slice(0, 3).map((_, ei) => (
                  <div key={ei} className="w-1 h-1 rounded-full" style={{ background: "hsl(270 60% 55%)" }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventCalendarWidget;
