import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Ticket, FileText, TrendingUp, Layers } from "lucide-react";
import { motion } from "framer-motion";

const Dashboard = () => {
  const [stats, setStats] = useState({ series: 0, events: 0, tickets: 0, pages: 0 });

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
