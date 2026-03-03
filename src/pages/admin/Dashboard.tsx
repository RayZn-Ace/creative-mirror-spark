import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Ticket, FileText, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const Dashboard = () => {
  const [stats, setStats] = useState({ events: 0, tickets: 0, pages: 0 });

  useEffect(() => {
    const load = async () => {
      const [eventsRes, ticketsRes, pagesRes] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("ticket_categories").select("id", { count: "exact", head: true }),
        supabase.from("page_contents").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        events: eventsRes.count ?? 0,
        tickets: ticketsRes.count ?? 0,
        pages: pagesRes.count ?? 0,
      });
    };
    load();
  }, []);

  const cards = [
    { label: "Events", value: stats.events, icon: Calendar, color: "hsl(330 80% 55%)" },
    { label: "Ticket-Kategorien", value: stats.tickets, icon: Ticket, color: "hsl(200 80% 55%)" },
    { label: "Seiten-Inhalte", value: stats.pages, icon: FileText, color: "hsl(45 80% 55%)" },
  ];

  return (
    <div>
      <h1
        className="text-xl sm:text-2xl font-black uppercase mb-6"
        style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
      >
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-6"
            style={{
              background: "hsl(0 0% 100% / 0.04)",
              border: "1px solid hsl(0 0% 100% / 0.08)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${card.color}20` }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                {card.label}
              </span>
            </div>
            <span className="text-3xl font-black" style={{ color: "hsl(0 0% 100%)" }}>
              {card.value}
            </span>
          </motion.div>
        ))}
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: "hsl(0 0% 100% / 0.04)",
          border: "1px solid hsl(0 0% 100% / 0.08)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
          <span className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
            Schnellaktionen
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="/admin/events"
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
            style={{ background: "hsl(330 80% 55% / 0.1)", color: "hsl(330 80% 55%)", border: "1px solid hsl(330 80% 55% / 0.2)" }}
          >
            + Neues Event erstellen
          </a>
          <a
            href="/admin/pages"
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
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
