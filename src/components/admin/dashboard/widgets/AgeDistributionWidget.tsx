import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

const AGE_GROUPS = [
  { label: "< 18", min: 0, max: 17, color: "hsl(200 80% 55%)" },
  { label: "18–21", min: 18, max: 21, color: "hsl(270 60% 55%)" },
  { label: "22–25", min: 22, max: 25, color: "hsl(330 80% 55%)" },
  { label: "26–30", min: 26, max: 30, color: "hsl(45 80% 55%)" },
  { label: "31–40", min: 31, max: 40, color: "hsl(140 60% 50%)" },
  { label: "40+", min: 41, max: 200, color: "hsl(0 0% 55%)" },
];

const AgeDistributionWidget = () => {
  const [groups, setGroups] = useState<{ label: string; count: number; color: string }[]>([]);

  useEffect(() => {
    supabase.from("orders").select("birth_date, status").eq("status", "paid").not("birth_date", "is", null).then(({ data }) => {
      if (!data?.length) return;
      const now = new Date();
      const results = AGE_GROUPS.map(g => {
        const count = data.filter(o => {
          const age = Math.floor((now.getTime() - new Date(o.birth_date!).getTime()) / (365.25 * 86400000));
          return age >= g.min && age <= g.max;
        }).length;
        return { label: g.label, count, color: g.color };
      });
      setGroups(results);
    });
  }, []);

  const total = groups.reduce((s, g) => s + g.count, 0);
  if (!total) return (
    <div className="text-center py-6">
      <Users className="w-7 h-7 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
      <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine Altersdaten vorhanden</p>
    </div>
  );
  const max = Math.max(...groups.map(g => g.count));

  return (
    <div className="space-y-2">
      {groups.map(g => (
        <div key={g.label}>
          <div className="flex justify-between mb-0.5">
            <span className="text-[11px] font-medium" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{g.label}</span>
            <span className="text-[11px] font-bold" style={{ color: g.color }}>{g.count} <span style={{ color: "hsl(0 0% 100% / 0.3)" }}>({total ? Math.round((g.count / total) * 100) : 0}%)</span></span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
            <div className="h-full rounded-full" style={{ width: max ? `${(g.count / max) * 100}%` : "0%", background: g.color, transition: "width 0.6s" }} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgeDistributionWidget;
