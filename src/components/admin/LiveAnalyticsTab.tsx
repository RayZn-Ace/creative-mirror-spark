import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Users, TrendingUp, Clock, Globe, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

type PageVisit = {
  id: string;
  session_id: string;
  page_url: string | null;
  referrer: string | null;
  referrer_source: string | null;
  created_at: string;
  left_at: string | null;
};

const SOURCE_COLORS: Record<string, string> = {
  WhatsApp: "hsl(142 70% 49%)",
  Instagram: "hsl(330 80% 55%)",
  Google: "hsl(45 80% 55%)",
  Facebook: "hsl(215 90% 55%)",
  TikTok: "hsl(330 60% 50%)",
  Twitter: "hsl(200 80% 55%)",
  YouTube: "hsl(0 70% 50%)",
  LinkedIn: "hsl(210 70% 50%)",
  Snapchat: "hsl(55 80% 55%)",
  Pinterest: "hsl(0 70% 50%)",
  Telegram: "hsl(200 70% 50%)",
  E_Mail: "hsl(270 60% 55%)",
  Direkt: "hsl(220 15% 55%)",
  Andere: "hsl(0 0% 50%)",
};

const ACTIVE_THRESHOLD_MINUTES = 5;

const LiveAnalyticsTab = () => {
  const [visits, setVisits] = useState<PageVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadVisits = async () => {
    const { data } = await supabase
      .from("page_visits")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (data) setVisits(data as unknown as PageVisit[]);
    setLoading(false);
  };

  useEffect(() => {
    loadVisits();
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!autoRefresh) return;
    const channel = supabase
      .channel("page_visits_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "page_visits" }, () => {
        loadVisits();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [autoRefresh]);

  // Auto refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadVisits, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const now = new Date();
  const activeThreshold = new Date(now.getTime() - ACTIVE_THRESHOLD_MINUTES * 60 * 1000);

  const activeVisitors = useMemo(() => {
    const sessions = new Set<string>();
    visits.forEach((v) => {
      const createdAt = new Date(v.created_at);
      if (createdAt >= activeThreshold && (!v.left_at || new Date(v.left_at) >= activeThreshold)) {
        sessions.add(v.session_id);
      }
    });
    return sessions.size;
  }, [visits]);

  // Peak concurrent visitors (by 5-min windows)
  const peakData = useMemo(() => {
    if (visits.length === 0) return { count: 0, when: "" };
    const windows: Record<string, Set<string>> = {};
    visits.forEach((v) => {
      const d = new Date(v.created_at);
      const key = `${d.toISOString().slice(0, 15)}0`;
      if (!windows[key]) windows[key] = new Set();
      windows[key].add(v.session_id);
    });
    let maxKey = "";
    let maxCount = 0;
    Object.entries(windows).forEach(([key, set]) => {
      if (set.size > maxCount) { maxCount = set.size; maxKey = key; }
    });
    const when = maxKey ? new Date(maxKey).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";
    return { count: maxCount, when };
  }, [visits]);

  // Visitors over time (hourly, last 24h)
  const hourlyData = useMemo(() => {
    const hours: { label: string; visitors: number }[] = [];
    for (let i = 23; i >= 0; i--) {
      const start = new Date(now.getTime() - i * 3600000);
      const end = new Date(start.getTime() + 3600000);
      const label = start.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      const sessions = new Set<string>();
      visits.forEach((v) => {
        const d = new Date(v.created_at);
        if (d >= start && d < end) sessions.add(v.session_id);
      });
      hours.push({ label, visitors: sessions.size });
    }
    return hours;
  }, [visits]);

  // Referrer breakdown
  const referrerData = useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach((v) => {
      const src = v.referrer_source || "Direkt";
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: SOURCE_COLORS[name] || SOURCE_COLORS.Andere }))
      .sort((a, b) => b.value - a.value);
  }, [visits]);

  // Top pages
  const topPages = useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach((v) => {
      const page = v.page_url ? new URL(v.page_url, "https://x.com").pathname : "/";
      counts[page] = (counts[page] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [visits]);

  const totalToday = useMemo(() => {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessions = new Set<string>();
    visits.forEach((v) => {
      if (new Date(v.created_at) >= todayStart) sessions.add(v.session_id);
    });
    return sessions.size;
  }, [visits]);

  const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5"
      style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs font-medium" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{label}</span>
      </div>
      <div className="text-2xl font-black" style={{ color: "hsl(0 0% 100%)" }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{sub}</div>}
    </motion.div>
  );

  if (loading) {
    return <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Lade Liveanalyse...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(150 60% 45%)" }} />
          <span className="text-xs font-medium" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Echtzeit · Letztes Update: {now.toLocaleTimeString("de-DE")}
          </span>
        </div>
        <button
          onClick={() => { setAutoRefresh(!autoRefresh); if (!autoRefresh) loadVisits(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: autoRefresh ? "hsl(150 60% 45% / 0.12)" : "hsl(0 0% 100% / 0.06)",
            color: autoRefresh ? "hsl(150 60% 45%)" : "hsl(0 0% 100% / 0.5)",
          }}
        >
          <RefreshCw className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
          {autoRefresh ? "Live" : "Pausiert"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Jetzt online" value={activeVisitors} sub={`Letzte ${ACTIVE_THRESHOLD_MINUTES} Min.`} color="hsl(150 60% 45%)" />
        <StatCard icon={TrendingUp} label="Peak (gleichzeitig)" value={peakData.count} sub={peakData.when} color="hsl(330 80% 55%)" />
        <StatCard icon={Clock} label="Besucher heute" value={totalToday} color="hsl(45 80% 55%)" />
        <StatCard icon={Globe} label="Quellen gesamt" value={referrerData.length} color="hsl(215 80% 55%)" />
      </div>

      {/* Visitors over time chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5"
        style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
      >
        <h3 className="text-sm font-bold mb-4" style={{ color: "hsl(0 0% 100% / 0.8)" }}>Besucher letzte 24 Stunden</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={hourlyData}>
            <defs>
              <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(330 80% 55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(330 80% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "hsl(0 0% 100% / 0.6)" }}
              itemStyle={{ color: "hsl(330 80% 55%)" }}
            />
            <Area type="monotone" dataKey="visitors" stroke="hsl(330 80% 55%)" fill="url(#visitGradient)" strokeWidth={2} name="Besucher" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Referrer + Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Referrer Sources */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: "hsl(0 0% 100% / 0.8)" }}>Traffic-Quellen</h3>
          {referrerData.length === 0 ? (
            <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Noch keine Daten</p>
          ) : (
            <div className="space-y-2">
              {referrerData.map((src) => {
                const total = referrerData.reduce((s, r) => s + r.value, 0);
                const pct = total > 0 ? Math.round((src.value / total) * 100) : 0;
                return (
                  <div key={src.name} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: src.color }} />
                    <span className="text-xs font-medium flex-1 truncate" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                      {src.name}
                    </span>
                    <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{src.value}</span>
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: src.color }} />
                    </div>
                    <span className="text-[10px] w-8 text-right" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
        >
          <h3 className="text-sm font-bold mb-4" style={{ color: "hsl(0 0% 100% / 0.8)" }}>Meistbesuchte Seiten</h3>
          {topPages.length === 0 ? (
            <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Noch keine Daten</p>
          ) : (
            <div className="space-y-2">
              {topPages.map((p, i) => (
                <div key={p.page} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold w-5 text-center" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                    {i + 1}
                  </span>
                  <span className="text-xs font-mono flex-1 truncate" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                    {p.page}
                  </span>
                  <span className="text-xs font-bold" style={{ color: "hsl(330 80% 55%)" }}>{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LiveAnalyticsTab;
