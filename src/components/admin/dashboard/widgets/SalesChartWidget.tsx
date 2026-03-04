import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const SalesChartWidget = () => {
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
  }, []);

  return (
    <div className="h-full flex flex-col">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="day" tick={{ fill: "hsl(0 0% 100% / 0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "hsl(220 40% 14%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 8, fontSize: 12, color: "#fff" }}
            cursor={{ fill: "hsl(0 0% 100% / 0.04)" }}
          />
          <Bar dataKey="count" name="Bestellungen" fill="hsl(330 80% 55%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChartWidget;
