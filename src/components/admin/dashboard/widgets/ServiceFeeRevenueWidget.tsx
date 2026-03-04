import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coins } from "lucide-react";

const ServiceFeeRevenueWidget = () => {
  const [data, setData] = useState({ total: 0, today: 0, month: 0, avgPerOrder: 0 });

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    supabase.from("orders").select("service_fee, paid_at, status").eq("status", "paid").then(({ data: orders }) => {
      if (!orders?.length) return;
      let total = 0, today = 0, month = 0;
      orders.forEach(o => {
        const fee = Number(o.service_fee);
        total += fee;
        const pa = o.paid_at ?? "";
        if (pa >= todayStr) today += fee;
        if (pa >= monthStart) month += fee;
      });
      setData({ total, today, month, avgPerOrder: total / orders.length });
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1">
      <Coins className="w-5 h-5 mb-1" style={{ color: "hsl(45 80% 55%)" }} />
      <span className="text-xl font-black" style={{ color: "hsl(0 0% 100%)" }}>{data.month.toFixed(2)}€</span>
      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Servicegebühren (Monat)</span>
      <div className="flex gap-4 mt-2">
        <div className="text-center">
          <span className="text-xs font-bold block" style={{ color: "hsl(0 0% 100%)" }}>{data.today.toFixed(2)}€</span>
          <span className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Heute</span>
        </div>
        <div className="text-center">
          <span className="text-xs font-bold block" style={{ color: "hsl(0 0% 100%)" }}>{data.avgPerOrder.toFixed(2)}€</span>
          <span className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Ø / Bestellung</span>
        </div>
      </div>
    </div>
  );
};

export default ServiceFeeRevenueWidget;
