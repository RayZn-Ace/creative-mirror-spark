import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, UserPlus, UserMinus } from "lucide-react";

const NewsletterStatsWidget = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, recentCount: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      const PAGE = 1000;
      let all: any[] = [];
      let from = 0;
      while (true) {
        const { data } = await supabase.from("newsletter_subscribers").select("id, unsubscribed, created_at").range(from, from + PAGE - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      setStats({
        total: all.length,
        active: all.filter((s) => !s.unsubscribed).length,
        unsubscribed: all.filter((s) => s.unsubscribed).length,
        recentCount: all.filter((s) => s.created_at >= weekAgo).length,
      });
    };
    fetchAll();
  }, []);

  return (
    <div className="space-y-3">
      <div className="text-center pb-2" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
        <Mail className="w-5 h-5 mx-auto mb-1" style={{ color: "hsl(270 60% 55%)" }} />
        <span className="text-lg font-black" style={{ color: "hsl(0 0% 100%)" }}>{stats.active}</span>
        <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>aktive Abonnenten</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px]" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
          <UserPlus className="w-3 h-3" /> Neu (7 Tage)
        </span>
        <span className="text-xs font-bold" style={{ color: "hsl(140 60% 50%)" }}>+{stats.recentCount}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px]" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
          <UserMinus className="w-3 h-3" /> Abgemeldet
        </span>
        <span className="text-xs font-bold" style={{ color: "hsl(0 60% 50%)" }}>{stats.unsubscribed}</span>
      </div>
    </div>
  );
};

export default NewsletterStatsWidget;
