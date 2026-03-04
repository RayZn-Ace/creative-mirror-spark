import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Receipt } from "lucide-react";

const AvgOrderValueWidget = () => {
  const [data, setData] = useState({ avg: 0, total: 0, count: 0, trend: 0 });

  useEffect(() => {
    supabase.from("orders").select("total_amount, status, created_at").eq("status", "paid").then(({ data: orders }) => {
      if (!orders?.length) return;
      const total = orders.reduce((s, o) => s + Number(o.total_amount), 0);
      const avg = total / orders.length;
      // Last 7 days vs previous 7
      const now = Date.now();
      const recent = orders.filter(o => new Date(o.created_at).getTime() > now - 7 * 86400000);
      const prev = orders.filter(o => { const t = new Date(o.created_at).getTime(); return t > now - 14 * 86400000 && t <= now - 7 * 86400000; });
      const recentAvg = recent.length ? recent.reduce((s, o) => s + Number(o.total_amount), 0) / recent.length : 0;
      const prevAvg = prev.length ? prev.reduce((s, o) => s + Number(o.total_amount), 0) / prev.length : 0;
      const trend = prevAvg > 0 ? Math.round(((recentAvg - prevAvg) / prevAvg) * 100) : 0;
      setData({ avg, total, count: orders.length, trend });
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <Receipt className="w-5 h-5 mb-1" style={{ color: "hsl(45 80% 55%)" }} />
      <span className="text-2xl font-black" style={{ color: "hsl(0 0% 100%)" }}>{data.avg.toFixed(2)}€</span>
      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Ø pro Bestellung</span>
      {data.trend !== 0 && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1" style={{
          background: data.trend > 0 ? "hsl(140 60% 50% / 0.15)" : "hsl(0 60% 50% / 0.15)",
          color: data.trend > 0 ? "hsl(140 60% 50%)" : "hsl(0 60% 50%)",
        }}>
          {data.trend > 0 ? "↑" : "↓"} {Math.abs(data.trend)}% vs. Vorwoche
        </span>
      )}
      <span className="text-[10px] mt-1" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{data.count} Bestellungen</span>
    </div>
  );
};

export default AvgOrderValueWidget;
