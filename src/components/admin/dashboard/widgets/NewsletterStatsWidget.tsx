import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, UserPlus, UserMinus } from "lucide-react";

const NewsletterStatsWidget = () => {
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, recentCount: 0 });

  useEffect(() => {
    supabase
      .from("newsletter_subscribers")
      .select("id, unsubscribed, created_at")
      .then(({ data }) => {
        if (!data) return;
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        setStats({
          total: data.length,
          active: data.filter((s) => !s.unsubscribed).length,
          unsubscribed: data.filter((s) => s.unsubscribed).length,
          recentCount: data.filter((s) => s.created_at >= weekAgo).length,
        });
      });
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
