import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: "Bezahlt", color: "hsl(140 60% 50%)" },
  pending: { label: "Ausstehend", color: "hsl(45 80% 55%)" },
  expired: { label: "Abgelaufen", color: "hsl(0 60% 50%)" },
  canceled: { label: "Storniert", color: "hsl(0 0% 50%)" },
};

const PaymentStatusWidget = () => {
  const [statuses, setStatuses] = useState<{ status: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    supabase.from("orders").select("status").then(({ data }) => {
      if (!data) return;
      const map: Record<string, number> = {};
      data.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
      setStatuses(Object.entries(map).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count));
      setTotal(data.length);
    });
  }, []);

  if (!total) return (
    <div className="text-center py-6">
      <CreditCard className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
      <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine Bestellungen</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Mini donut */}
      <div className="flex items-center justify-center">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            {(() => {
              let offset = 0;
              return statuses.map(s => {
                const pct = (s.count / total) * 100;
                const cfg = STATUS_CONFIG[s.status];
                const el = <circle key={s.status} cx="18" cy="18" r="13" fill="none" stroke={cfg?.color ?? "hsl(0 0% 40%)"} strokeWidth="5"
                  strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={`${-offset}`} />;
                offset += pct;
                return el;
              });
            })()}
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black" style={{ color: "hsl(0 0% 100%)" }}>{total}</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {statuses.map(s => {
          const cfg = STATUS_CONFIG[s.status] ?? { label: s.status, color: "hsl(0 0% 50%)" };
          return (
            <div key={s.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                <span className="text-[11px]" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{cfg.label}</span>
              </div>
              <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100%)" }}>{s.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentStatusWidget;
