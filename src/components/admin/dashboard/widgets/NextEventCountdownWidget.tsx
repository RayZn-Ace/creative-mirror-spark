import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Timer } from "lucide-react";

const NextEventCountdownWidget = () => {
  const [event, setEvent] = useState<{ title: string; city: string | null; date: string; time: string | null } | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0 });

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    supabase.from("events").select("title, city, date, time")
      .eq("status", "published").gte("date", today)
      .order("date", { ascending: true }).limit(1)
      .then(({ data }) => { if (data?.[0]) setEvent(data[0]); });
  }, []);

  useEffect(() => {
    if (!event) return;
    const update = () => {
      const target = new Date(event.date + (event.time ? `T${event.time}` : "T20:00"));
      const diff = Math.max(0, target.getTime() - Date.now());
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
      });
    };
    update();
    const iv = setInterval(update, 60000);
    return () => clearInterval(iv);
  }, [event]);

  if (!event) return (
    <div className="text-center py-6">
      <Timer className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
      <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine kommenden Events</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <p className="text-xs font-bold text-center truncate w-full" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{event.title}</p>
      {event.city && <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{event.city}</p>}
      <div className="flex gap-3 mt-1">
        {[
          { val: countdown.days, label: "Tage" },
          { val: countdown.hours, label: "Std" },
          { val: countdown.mins, label: "Min" },
        ].map(u => (
          <div key={u.label} className="text-center">
            <span className="text-xl font-black block" style={{ color: "hsl(330 80% 55%)" }}>{u.val}</span>
            <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NextEventCountdownWidget;
