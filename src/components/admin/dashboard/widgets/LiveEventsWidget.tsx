import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Clock, Users, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface LiveEvent {
  id: string;
  title: string;
  city: string | null;
  date: string | null;
  time: string | null;
  end_time: string | null;
  location_name: string | null;
  totalTickets: number;
  checkedIn: number;
}

const LiveEventsWidget = () => {
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const { data: events } = await supabase
      .from("events")
      .select("id, title, city, date, time, end_time, location_name, status")
      .eq("date", today)
      .eq("status", "published");

    if (!events?.length) {
      setLiveEvents([]);
      setLoading(false);
      return;
    }

    const { data: tickets } = await supabase
      .from("tickets")
      .select("id, event_id, status")
      .in("event_id", events.map((e) => e.id));

    setLiveEvents(
      events.map((ev) => {
        const evT = tickets?.filter((t) => t.event_id === ev.id) ?? [];
        return { ...ev, totalTickets: evT.length, checkedIn: evT.filter((t) => t.status === "checked_in").length };
      })
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("dashboard-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tickets" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
      </div>
    );
  }

  if (!liveEvents.length) {
    return (
      <div className="text-center py-6">
        <Calendar className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
        <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Heute keine Events geplant</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Live
          </span>
        </div>
        <button onClick={load} className="p-1 rounded-lg hover:bg-white/10 transition-colors" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      {liveEvents.map((ev, i) => {
        const pct = ev.totalTickets > 0 ? Math.round((ev.checkedIn / ev.totalTickets) * 100) : 0;
        return (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg p-3"
            style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{ev.title}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  {ev.city && <span className="flex items-center gap-1 text-[10px]" style={{ color: "hsl(0 0% 100% / 0.45)" }}><MapPin className="w-2.5 h-2.5" /> {ev.city}</span>}
                  {ev.time && <span className="flex items-center gap-1 text-[10px]" style={{ color: "hsl(0 0% 100% / 0.45)" }}><Clock className="w-2.5 h-2.5" /> {ev.time}{ev.end_time ? ` – ${ev.end_time}` : ""}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" style={{ color: "hsl(140 60% 50%)" }} />
                  <span className="text-base font-black" style={{ color: "hsl(0 0% 100%)" }}>{ev.checkedIn}</span>
                  <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>/ {ev.totalTickets}</span>
                </div>
              </div>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
              <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                style={{ background: pct > 75 ? "hsl(140 60% 50%)" : pct > 40 ? "hsl(45 80% 55%)" : "hsl(200 80% 55%)" }} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default LiveEventsWidget;
