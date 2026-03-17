import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

type Mode = "orders" | "tickets";

const SalesChartWidget = () => {
  const [mode, setMode] = useState<Mode>("orders");
  const [data, setData] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    const days: { day: string; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push({
        day: d.toLocaleDateString("de-DE", { weekday: "short" }),
        date: d.toISOString().split("T")[0],
      });
    }

    if (mode === "orders") {
      supabase
        .from("orders")
        .select("created_at, status")
        .eq("status", "paid")
        .gte("created_at", days[0].date)
        .then(({ data: orders }) => {
          setData(days.map(d => ({
            day: d.day,
            count: orders?.filter(o => o.created_at.startsWith(d.date)).length ?? 0,
          })));
        });
    } else {
      supabase
        .from("tickets")
        .select("created_at, order_id, orders!inner(status)")
        .eq("orders.status", "paid")
        .gte("created_at", days[0].date)
        .then(({ data: tickets }) => {
          setData(days.map(d => ({
            day: d.day,
            count: tickets?.filter(t => t.created_at.startsWith(d.date)).length ?? 0,
          })));
        });
    }
  }, [mode]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-1 mb-2">
        {([["orders", "Bestellungen"], ["tickets", "Tickets"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              mode === key
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="day" tick={{ fill: "hsl(0 0% 100% / 0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "hsl(220 40% 14%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 8, fontSize: 12, color: "#fff" }}
              cursor={{ fill: "hsl(0 0% 100% / 0.04)" }}
            />
            <Bar dataKey="count" name={mode === "orders" ? "Bestellungen" : "Tickets"} fill="hsl(270 70% 55%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChartWidget;
