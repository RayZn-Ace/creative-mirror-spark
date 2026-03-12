import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Ticket, FileText, Layers } from "lucide-react";
import { motion } from "framer-motion";

const StatsWidget = () => {
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
    <div className="grid grid-cols-2 gap-2">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl p-3 sm:p-4"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${card.color}20` }}
            >
              <card.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: card.color }} />
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              {card.label}
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black" style={{ color: "hsl(0 0% 100%)" }}>
            {card.value}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsWidget;
