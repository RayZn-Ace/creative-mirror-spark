import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart } from "lucide-react";

interface Order {
  id: string;
  email: string;
  name: string | null;
  total_amount: number;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  paid: "hsl(140 60% 50%)",
  pending: "hsl(45 80% 55%)",
  expired: "hsl(0 60% 50%)",
  canceled: "hsl(0 60% 50%)",
};

const RecentOrdersWidget = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase
      .from("orders")
      .select("id, email, name, total_amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setOrders(data ?? []));
  }, []);

  if (!orders.length) {
    return (
      <div className="text-center py-6">
        <ShoppingCart className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
        <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine Bestellungen</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {orders.map((o) => (
        <div key={o.id} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "hsl(0 0% 100% / 0.85)" }}>{o.name || o.email}</p>
            <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
              {new Date(o.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100%)" }}>
              {o.total_amount.toFixed(2)}€
            </span>
            <div className="flex items-center gap-1 justify-end mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColors[o.status] ?? "hsl(0 0% 50%)" }} />
              <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: statusColors[o.status] ?? "hsl(0 0% 50%)" }}>
                {o.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentOrdersWidget;
