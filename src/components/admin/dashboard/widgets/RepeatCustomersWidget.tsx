import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

interface RepeatCustomer {
  email: string;
  name: string | null;
  orders: number;
  totalSpent: number;
}

const RepeatCustomersWidget = () => {
  const [customers, setCustomers] = useState<RepeatCustomer[]>([]);

  useEffect(() => {
    supabase.from("orders").select("email, name, total_amount, status").eq("status", "paid").then(({ data }) => {
      if (!data?.length) return;
      const map: Record<string, { name: string | null; orders: number; totalSpent: number }> = {};
      data.forEach(o => {
        if (!map[o.email]) map[o.email] = { name: o.name, orders: 0, totalSpent: 0 };
        map[o.email].orders++;
        map[o.email].totalSpent += Number(o.total_amount);
        if (o.name && !map[o.email].name) map[o.email].name = o.name;
      });
      setCustomers(
        Object.entries(map)
          .filter(([, v]) => v.orders >= 2)
          .map(([email, v]) => ({ email, ...v }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 6)
      );
    });
  }, []);

  if (!customers.length) return (
    <div className="text-center py-6">
      <Heart className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
      <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Noch keine Stammkunden</p>
    </div>
  );

  return (
    <div className="space-y-1.5">
      {customers.map(c => (
        <div key={c.email} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "hsl(0 0% 100% / 0.85)" }}>{c.name || c.email}</p>
            <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{c.totalSpent.toFixed(2)}€ gesamt</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: "hsl(330 80% 55% / 0.15)", color: "hsl(330 80% 55%)" }}>
            {c.orders}x
          </span>
        </div>
      ))}
    </div>
  );
};

export default RepeatCustomersWidget;
