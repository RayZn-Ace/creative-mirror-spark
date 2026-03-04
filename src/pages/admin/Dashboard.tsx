import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Ticket, FileText, TrendingUp, Layers, MapPin, Clock, Users, RefreshCw } from "lucide-react";
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

const Dashboard = () => {
  const [stats, setStats] = useState({ series: 0, events: 0, tickets: 0, pages: 0 });
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [seriesRes, eventsRes, ticketsRes, pagesRes] = await Promise.all([
        supabase.from("event_series").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("ticket_categories").select("id", { count: "exact", head: true }),
        supabase.from("page_contents").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        series: seriesRes.count ?? 0,
        events: eventsRes.count ?? 0,
        tickets: ticketsRes.count ?? 0,
        pages: pagesRes.count ?? 0,
      });
    };
    load();
  }, []);

  const loadLiveEvents = useCallback(async () => {
    setLiveLoading(true);
    const today = new Date().toISOString().split("T")[0];

    // Fetch events happening today
    const { data: events } = await supabase
      .from("events")
      .select("id, title, city, date, time, end_time, location_name, status")
      .eq("date", today)
      .eq("status", "published");

    if (!events || events.length === 0) {
      setLiveEvents([]);
      setLiveLoading(false);
      return;
    }

    // Fetch ticket counts for these events
    const eventIds = events.map((e) => e.id);
    const { data: tickets } = await supabase
      .from("tickets")
      .select("id, event_id, status")
      .in("event_id", eventIds);

    const mapped: LiveEvent[] = events.map((ev) => {
      const evTickets = tickets?.filter((t) => t.event_id === ev.id) ?? [];
      return {
        id: ev.id,
        title: ev.title,
        city: ev.city,
        date: ev.date,
        time: ev.time,
        end_time: ev.end_time,
        location_name: ev.location_name,
        totalTickets: evTickets.length,
        checkedIn: evTickets.filter((t) => t.status === "checked_in").length,
      };
    });

    setLiveEvents(mapped);
    setLiveLoading(false);
  }, []);

  useEffect(() => {
    loadLiveEvents();
    // Auto-refresh every 30s
    const interval = setInterval(loadLiveEvents, 30000);
    return () => clearInterval(interval);
  }, [loadLiveEvents]);

  // Subscribe to realtime ticket changes
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-tickets")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tickets" }, () => {
        loadLiveEvents();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadLiveEvents]);

  const cards = [
    { label: "Serien", value: stats.series, icon: Layers, color: "hsl(270 60% 55%)" },
    { label: "Events", value: stats.events, icon: Calendar, color: "hsl(330 80% 55%)" },
    { label: "Tickets", value: stats.tickets, icon: Ticket, color: "hsl(200 80% 55%)" },
    { label: "Seiten", value: stats.pages, icon: FileText, color: "hsl(45 80% 55%)" },
  ];

  return (
    <div>
      <h1
        className="text-lg sm:text-2xl font-black uppercase mb-4 sm:mb-6"
        style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
      >
        Dashboard
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-xl sm:rounded-2xl p-3 sm:p-6"
            style={{
              background: "hsl(0 0% 100% / 0.04)",
              border: "1px solid hsl(0 0% 100% / 0.08)",
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${card.color}20` }}
              >
                <card.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: card.color }} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                {card.label}
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-black" style={{ color: "hsl(0 0% 100%)" }}>
              {card.value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* LIVE EVENTS */}
      <div
        className="rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-8"
        style={{
          background: "hsl(0 0% 100% / 0.04)",
          border: "1px solid hsl(0 0% 100% / 0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
              Heute Live
            </span>
          </div>
          <button
            onClick={loadLiveEvents}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "hsl(0 0% 100% / 0.4)" }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {liveLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
          </div>
        ) : liveEvents.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
            <p className="text-xs sm:text-sm" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
              Heute keine Events geplant
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {liveEvents.map((ev, i) => {
              const pct = ev.totalTickets > 0 ? Math.round((ev.checkedIn / ev.totalTickets) * 100) : 0;
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg sm:rounded-xl p-3 sm:p-4"
                  style={{
                    background: "hsl(0 0% 100% / 0.03)",
                    border: "1px solid hsl(0 0% 100% / 0.06)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>
                        {ev.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {ev.city && (
                          <span className="flex items-center gap-1 text-[10px] sm:text-xs" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
                            <MapPin className="w-3 h-3" /> {ev.city}
                          </span>
                        )}
                        {ev.time && (
                          <span className="flex items-center gap-1 text-[10px] sm:text-xs" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
                            <Clock className="w-3 h-3" /> {ev.time}{ev.end_time ? ` – ${ev.end_time}` : ""}
                          </span>
                        )}
                        {ev.location_name && (
                          <span className="text-[10px] sm:text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                            {ev.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" style={{ color: "hsl(140 60% 50%)" }} />
                        <span className="text-lg sm:text-xl font-black" style={{ color: "hsl(0 0% 100%)" }}>
                          {ev.checkedIn}
                        </span>
                        <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                          / {ev.totalTickets}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                        eingecheckt
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      style={{
                        background: pct > 75 ? "hsl(140 60% 50%)" : pct > 40 ? "hsl(45 80% 55%)" : "hsl(200 80% 55%)",
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="rounded-xl sm:rounded-2xl p-4 sm:p-6"
        style={{
          background: "hsl(0 0% 100% / 0.04)",
          border: "1px solid hsl(0 0% 100% / 0.08)",
        }}
      >
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
            Schnellaktionen
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:gap-3">
          <a
            href="/admin/series"
            className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all hover:scale-[1.02]"
            style={{ background: "hsl(270 60% 55% / 0.1)", color: "hsl(270 60% 55%)", border: "1px solid hsl(270 60% 55% / 0.2)" }}
          >
            + Neue Event-Serie erstellen
          </a>
          <a
            href="/admin/events"
            className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all hover:scale-[1.02]"
            style={{ background: "hsl(330 80% 55% / 0.1)", color: "hsl(330 80% 55%)", border: "1px solid hsl(330 80% 55% / 0.2)" }}
          >
            + Neues Event erstellen
          </a>
          <a
            href="/admin/pages"
            className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all hover:scale-[1.02]"
            style={{ background: "hsl(45 80% 55% / 0.1)", color: "hsl(45 80% 55%)", border: "1px solid hsl(45 80% 55% / 0.2)" }}
          >
            Seiten-Inhalte bearbeiten
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
