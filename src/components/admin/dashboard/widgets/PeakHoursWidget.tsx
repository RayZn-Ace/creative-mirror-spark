import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const PeakHoursWidget = () => {
  const [data, setData] = useState<{ hour: string; count: number }[]>([]);

  useEffect(() => {
    supabase.from("orders").select("created_at, status").eq("status", "paid").then(({ data: orders }) => {
      if (!orders?.length) return;
      const hourMap: Record<number, number> = {};
      orders.forEach(o => {
        const h = new Date(o.created_at).getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      });
      const result = [];
      for (let h = 8; h <= 23; h++) {
        result.push({ hour: `${h}`, count: hourMap[h] || 0 });
      }
      for (let h = 0; h <= 4; h++) {
        result.push({ hour: `${h}`, count: hourMap[h] || 0 });
      }
      setData(result);
    });
  }, []);

  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <XAxis dataKey="hour" tick={{ fill: "hsl(0 0% 100% / 0.35)", fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
          <YAxis tick={{ fill: "hsl(0 0% 100% / 0.25)", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ background: "hsl(220 40% 14%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 8, fontSize: 11, color: "#fff" }} cursor={{ fill: "hsl(0 0% 100% / 0.04)" }} />
          <Bar dataKey="count" name="Bestellungen" fill="hsl(200 80% 55%)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PeakHoursWidget;
