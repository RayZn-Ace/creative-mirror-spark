import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import {
  TrendingUp, TrendingDown, Euro, ShoppingCart, Ticket, Users, Calendar,
  ArrowUpRight, ArrowDownRight, CreditCard, MapPin, Clock, BarChart3,
} from "lucide-react";

const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const COLORS = [
  "hsl(330 80% 55%)", "hsl(260 70% 60%)", "hsl(200 80% 55%)", "hsl(140 60% 50%)",
  "hsl(40 90% 55%)", "hsl(10 80% 55%)", "hsl(180 60% 50%)", "hsl(290 60% 55%)",
];

const cardStyle: React.CSSProperties = {
  background: "hsl(220 40% 12%)",
  border: "1px solid hsl(0 0% 100% / 0.06)",
  borderRadius: 16,
};

const StatCard = ({ icon: Icon, label, value, sub, trend, color }: any) => (
  <div style={cardStyle} className="p-5 flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: trend >= 0 ? "hsl(140 60% 50%)" : "hsl(0 70% 55%)" }}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}%
        </span>
      )}
    </div>
    <span className="text-[11px] font-medium" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{label}</span>
    <span className="text-xl font-black" style={{ color: "hsl(0 0% 100%)" }}>{value}</span>
    {sub && <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{sub}</span>}
  </div>
);

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-bold uppercase tracking-wider mt-8 mb-4" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
    {children}
  </h2>
);

const AnalyticsAdmin = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("orders").select("id, total_amount, service_fee, status, paid_at, created_at, email, event_id, name, birth_date").then(r => r.data ?? []),
      supabase.from("tickets").select("id, event_id, status, checked_in_at, created_at, order_id").then(r => r.data ?? []),
      supabase.from("events").select("id, title, date, city, status, slug").then(r => r.data ?? []),
      supabase.from("newsletter_subscribers").select("id, created_at, unsubscribed, city").then(r => r.data ?? []),
    ]).then(([o, t, e, s]) => {
      setOrders(o);
      setTickets(t);
      setEvents(e);
      setSubscribers(s);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Daten laden...</div>
      </div>
    );
  }

  const paidOrders = orders.filter(o => o.status === "paid");
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  // Revenue calculations
  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalServiceFees = paidOrders.reduce((s, o) => s + Number(o.service_fee), 0);
  const todayRevenue = paidOrders.filter(o => (o.paid_at ?? "").startsWith(todayStr)).reduce((s, o) => s + Number(o.total_amount), 0);
  const weekRevenue = paidOrders.filter(o => new Date(o.paid_at ?? 0) >= weekAgo).reduce((s, o) => s + Number(o.total_amount), 0);
  const monthRevenue = paidOrders.filter(o => new Date(o.paid_at ?? 0) >= monthAgo).reduce((s, o) => s + Number(o.total_amount), 0);
  const prevMonthRevenue = paidOrders.filter(o => {
    const d = new Date(o.paid_at ?? 0);
    return d >= prevMonthStart && d <= prevMonthEnd;
  }).reduce((s, o) => s + Number(o.total_amount), 0);
  const monthTrend = prevMonthRevenue > 0 ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

  const avgOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
  const totalTickets = tickets.length;
  const checkedIn = tickets.filter(t => t.checked_in_at).length;
  const checkinRate = totalTickets > 0 ? (checkedIn / totalTickets) * 100 : 0;

  // Revenue last 30 days chart
  const revenueLast30: { day: string; revenue: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const ds = d.toISOString().split("T")[0];
    const dayOrders = paidOrders.filter(o => (o.paid_at ?? "").startsWith(ds));
    revenueLast30.push({
      day: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
      revenue: dayOrders.reduce((s, o) => s + Number(o.total_amount), 0),
      orders: dayOrders.length,
    });
  }

  // Revenue by event
  const eventMap = new Map(events.map(e => [e.id, e]));
  const revenueByEvent: { name: string; revenue: number; tickets: number }[] = [];
  const eventRevMap = new Map<string, { revenue: number; tickets: number }>();
  paidOrders.forEach(o => {
    if (!o.event_id) return;
    const cur = eventRevMap.get(o.event_id) ?? { revenue: 0, tickets: 0 };
    cur.revenue += Number(o.total_amount);
    eventRevMap.set(o.event_id, cur);
  });
  tickets.forEach(t => {
    const cur = eventRevMap.get(t.event_id) ?? { revenue: 0, tickets: 0 };
    cur.tickets += 1;
    eventRevMap.set(t.event_id, cur);
  });
  eventRevMap.forEach((v, k) => {
    const ev = eventMap.get(k);
    revenueByEvent.push({ name: ev?.title ?? "Unbekannt", ...v });
  });
  revenueByEvent.sort((a, b) => b.revenue - a.revenue);

  // City breakdown
  const cityRevMap = new Map<string, number>();
  paidOrders.forEach(o => {
    const ev = eventMap.get(o.event_id);
    const city = ev?.city ?? "Unbekannt";
    cityRevMap.set(city, (cityRevMap.get(city) ?? 0) + Number(o.total_amount));
  });
  const cityData = Array.from(cityRevMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Payment status
  const statusMap = new Map<string, number>();
  orders.forEach(o => {
    statusMap.set(o.status, (statusMap.get(o.status) ?? 0) + 1);
  });
  const statusLabels: Record<string, string> = { paid: "Bezahlt", pending: "Ausstehend", expired: "Abgelaufen", canceled: "Storniert" };
  const paymentStatusData = Array.from(statusMap.entries()).map(([key, value]) => ({ name: statusLabels[key] ?? key, value }));

  // Peak hours
  const hourMap = new Array(24).fill(0);
  paidOrders.forEach(o => {
    if (o.paid_at) {
      const h = new Date(o.paid_at).getHours();
      hourMap[h]++;
    }
  });
  const peakData = hourMap.map((count, h) => ({ hour: `${h}:00`, count }));

  // Orders last 7 days
  const ordersLast7: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const ds = d.toISOString().split("T")[0];
    ordersLast7.push({
      day: d.toLocaleDateString("de-DE", { weekday: "short" }),
      count: paidOrders.filter(o => (o.paid_at ?? "").startsWith(ds)).length,
    });
  }

  // Repeat customers
  const emailCount = new Map<string, number>();
  paidOrders.forEach(o => emailCount.set(o.email, (emailCount.get(o.email) ?? 0) + 1));
  const repeatCustomers = Array.from(emailCount.values()).filter(c => c > 1).length;
  const uniqueCustomers = emailCount.size;

  // Age distribution
  const ageGroups = { "< 18": 0, "18-24": 0, "25-34": 0, "35-44": 0, "45+": 0 };
  paidOrders.forEach(o => {
    if (!o.birth_date) return;
    const age = Math.floor((now.getTime() - new Date(o.birth_date).getTime()) / (365.25 * 86400000));
    if (age < 18) ageGroups["< 18"]++;
    else if (age <= 24) ageGroups["18-24"]++;
    else if (age <= 34) ageGroups["25-34"]++;
    else if (age <= 44) ageGroups["35-44"]++;
    else ageGroups["45+"]++;
  });
  const ageData = Object.entries(ageGroups).map(([name, value]) => ({ name, value }));

  // Newsletter
  const activeSubs = subscribers.filter(s => !s.unsubscribed).length;

  const tooltipStyle = {
    contentStyle: { background: "hsl(220 40% 14%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 12, fontSize: 12, color: "#fff" },
    cursor: { fill: "hsl(0 0% 100% / 0.04)" },
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: "hsl(0 0% 100%)" }}>Analyse & Umsatz</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Alle Kennzahlen und Umsätze auf einen Blick</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Euro} label="Gesamtumsatz" value={`${fmt(totalRevenue)}€`} color="hsl(140 60% 50%)" trend={monthTrend} sub={`${paidOrders.length} bezahlte Bestellungen`} />
        <StatCard icon={ShoppingCart} label="Ø Bestellwert" value={`${fmt(avgOrderValue)}€`} color="hsl(200 80% 55%)" />
        <StatCard icon={Ticket} label="Tickets gesamt" value={totalTickets.toLocaleString("de-DE")} color="hsl(330 80% 55%)" sub={`${checkinRate.toFixed(1)}% eingecheckt`} />
        <StatCard icon={CreditCard} label="Servicegebühren" value={`${fmt(totalServiceFees)}€`} color="hsl(260 70% 60%)" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <StatCard icon={TrendingUp} label="Heute" value={`${fmt(todayRevenue)}€`} color="hsl(40 90% 55%)" />
        <StatCard icon={TrendingUp} label="Diese Woche" value={`${fmt(weekRevenue)}€`} color="hsl(40 90% 55%)" />
        <StatCard icon={TrendingUp} label="Dieser Monat" value={`${fmt(monthRevenue)}€`} color="hsl(40 90% 55%)" trend={monthTrend} />
        <StatCard icon={Users} label="Kunden" value={uniqueCustomers.toLocaleString("de-DE")} color="hsl(180 60% 50%)" sub={`${repeatCustomers} Stammkunden`} />
      </div>

      {/* Revenue Chart */}
      <SectionHeader>Umsatz letzte 30 Tage</SectionHeader>
      <div style={cardStyle} className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueLast30} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(330 80% 55%)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(330 80% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`${fmt(v)}€`, "Umsatz"]} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(330 80% 55%)" fill="url(#revGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders Chart */}
      <SectionHeader>Bestellungen letzte 7 Tage</SectionHeader>
      <div style={cardStyle} className="p-5">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ordersLast7} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="day" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="count" name="Bestellungen" fill="hsl(260 70% 60%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Revenue by Event */}
        <div>
          <SectionHeader>Umsatz pro Event</SectionHeader>
          <div style={cardStyle} className="p-5">
            <div className="space-y-3 max-h-80 overflow-auto">
              {revenueByEvent.slice(0, 15).map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-5 text-center" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium truncate block" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{e.name}</span>
                    <div className="w-full h-1.5 rounded-full mt-1" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(e.revenue / (revenueByEvent[0]?.revenue || 1)) * 100}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100%)" }}>{fmt(e.revenue)}€</span>
                    <span className="text-[10px] block" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{e.tickets} Tickets</span>
                  </div>
                </div>
              ))}
              {revenueByEvent.length === 0 && (
                <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Keine Daten</span>
              )}
            </div>
          </div>
        </div>

        {/* City Breakdown */}
        <div>
          <SectionHeader>Umsatz nach Stadt</SectionHeader>
          <div style={cardStyle} className="p-5 flex items-center gap-6">
            <div className="w-40 h-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={cityData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={2}>
                    {cityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${fmt(v)}€`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 flex-1">
              {cityData.map((c, i) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs flex-1 truncate" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{c.name}</span>
                  <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100%)" }}>{fmt(c.value)}€</span>
                </div>
              ))}
              {cityData.length === 0 && <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Keine Daten</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Payment Status */}
        <div>
          <SectionHeader>Zahlungsstatus</SectionHeader>
          <div style={cardStyle} className="p-5">
            <div className="w-32 h-32 mx-auto mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={50}>
                    {paymentStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {paymentStatusData.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{s.name}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100%)" }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div>
          <SectionHeader>Peak-Zeiten</SectionHeader>
          <div style={cardStyle} className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={peakData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="hour" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 8 }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Bestellungen" fill="hsl(200 80% 55%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Age Distribution */}
        <div>
          <SectionHeader>Altersverteilung</SectionHeader>
          <div style={cardStyle} className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={ageData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: "hsl(0 0% 100% / 0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" name="Kunden" fill="hsl(140 60% 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Newsletter & Misc Stats */}
      <SectionHeader>Weitere Kennzahlen</SectionHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={Users} label="Newsletter-Abonnenten" value={activeSubs} color="hsl(330 80% 55%)" sub={`${subscribers.length} gesamt`} />
        <StatCard icon={Calendar} label="Events gesamt" value={events.length} color="hsl(200 80% 55%)" />
        <StatCard icon={Users} label="Check-in Quote" value={`${checkinRate.toFixed(1)}%`} color="hsl(140 60% 50%)" sub={`${checkedIn} / ${totalTickets}`} />
        <StatCard icon={Users} label="Stammkunden-Quote" value={uniqueCustomers > 0 ? `${((repeatCustomers / uniqueCustomers) * 100).toFixed(1)}%` : "0%"} color="hsl(260 70% 60%)" sub={`${repeatCustomers} von ${uniqueCustomers}`} />
      </div>
    </div>
  );
};

export default AnalyticsAdmin;
