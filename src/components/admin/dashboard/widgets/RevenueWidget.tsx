import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";

const RevenueWidget = () => {
  const [revenue, setRevenue] = useState({ today: 0, week: 0, month: 0, orderCount: 0 });

  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    supabase
      .from("orders")
      .select("total_amount, paid_at, status")
      .eq("status", "paid")
      .then(({ data }) => {
        if (!data) return;
        let today = 0, week = 0, month = 0;
        data.forEach((o) => {
          const pa = o.paid_at ?? "";
          if (pa >= todayStr) today += Number(o.total_amount);
          if (pa >= weekAgo) week += Number(o.total_amount);
          if (pa >= monthAgo) month += Number(o.total_amount);
        });
        setRevenue({ today, week, month, orderCount: data.length });
      });
  }, []);

  const rows = [
    { label: "Heute", value: revenue.today },
    { label: "Diese Woche", value: revenue.week },
    { label: "Dieser Monat", value: revenue.month },
  ];

  return (
    <div className="space-y-3">
      <div className="text-center pb-2" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
        <TrendingUp className="w-5 h-5 mx-auto mb-1" style={{ color: "hsl(140 60% 50%)" }} />
        <span className="text-lg font-black" style={{ color: "hsl(0 0% 100%)" }}>{revenue.month.toFixed(2)}€</span>
        <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{revenue.orderCount} Bestellungen gesamt</p>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between">
          <span className="text-[11px] font-medium" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{r.label}</span>
          <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100%)" }}>{r.value.toFixed(2)}€</span>
        </div>
      ))}
    </div>
  );
};

export default RevenueWidget;
