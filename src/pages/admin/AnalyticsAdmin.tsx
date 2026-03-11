import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
  ComposedChart, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Euro, ShoppingCart, Ticket, Users, Calendar,
  ArrowUpRight, ArrowDownRight, CreditCard, MapPin, Clock, BarChart3,
  ChevronLeft, ChevronRight, Download, Filter, Sun, Moon, Eye, Target,
  Percent, Repeat, UserCheck, Globe, Zap, ArrowRight,
} from "lucide-react";





/* ─── Helpers ─── */
const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) => n.toLocaleString("de-DE");
const COLORS = [
  "hsl(270 70% 55%)", "hsl(260 70% 60%)", "hsl(200 80% 55%)", "hsl(140 60% 50%)",
  "hsl(40 90% 55%)", "hsl(10 80% 55%)", "hsl(180 60% 50%)", "hsl(290 60% 55%)",
  "hsl(170 70% 50%)", "hsl(350 80% 55%)", "hsl(220 70% 60%)", "hsl(60 80% 50%)",
];

const cardStyle: React.CSSProperties = {
  background: "hsl(220 40% 12%)",
  border: "1px solid hsl(0 0% 100% / 0.06)",
  borderRadius: 16,
};

const tooltipStyle = {
  contentStyle: { background: "hsl(220 40% 14%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 12, fontSize: 12, color: "#fff" },
  labelStyle: { color: "#fff", fontWeight: 600 },
  itemStyle: { color: "#fff" },
  cursor: { fill: "hsl(0 0% 100% / 0.04)" },
};

const daysBetween = (a: Date, b: Date) => Math.ceil((b.getTime() - a.getTime()) / 86400000);

const getWeekNumber = (d: Date) => {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime() + ((start.getDay() + 6) % 7) * 86400000;
  return Math.ceil(diff / 604800000);
};

/* ─── Stat Card ─── */
const StatCard = ({ icon: Icon, label, value, sub, trend, color, onClick, active }: any) => (
  <div
    style={{ ...cardStyle, ...(active ? { borderColor: color, boxShadow: `0 0 20px ${color}20` } : {}) }}
    className={`p-4 sm:p-5 flex flex-col gap-1.5 ${onClick ? "cursor-pointer hover:border-white/20 transition-all" : ""}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      {trend !== undefined && trend !== null && (
        <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: trend >= 0 ? "hsl(140 60% 50%)" : "hsl(0 70% 55%)" }}>
          {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend).toFixed(1)}%
        </span>
      )}
    </div>
    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{label}</span>
    <span className="text-lg sm:text-xl font-black" style={{ color: "hsl(0 0% 100%)" }}>{value}</span>
    {sub && <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{sub}</span>}
  </div>
);

const SectionHeader = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between mt-8 mb-4">
    <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{children}</h2>
    {right}
  </div>
);

/* ─── Date Range Presets ─── */
type RangeKey = "today" | "yesterday" | "7d" | "14d" | "30d" | "thisMonth" | "lastMonth" | "90d" | "thisYear" | "all";
const RANGE_PRESETS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Heute" },
  { key: "yesterday", label: "Gestern" },
  { key: "7d", label: "7 Tage" },
  { key: "14d", label: "14 Tage" },
  { key: "30d", label: "30 Tage" },
  { key: "thisMonth", label: "Dieser Monat" },
  { key: "lastMonth", label: "Letzter Monat" },
  { key: "90d", label: "90 Tage" },
  { key: "thisYear", label: "Dieses Jahr" },
  { key: "all", label: "Gesamt" },
];

const getRange = (key: RangeKey): [Date, Date] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today": return [today, now];
    case "yesterday": { const y = new Date(today.getTime() - 86400000); return [y, today]; }
    case "7d": return [new Date(today.getTime() - 7 * 86400000), now];
    case "14d": return [new Date(today.getTime() - 14 * 86400000), now];
    case "30d": return [new Date(today.getTime() - 30 * 86400000), now];
    case "thisMonth": return [new Date(now.getFullYear(), now.getMonth(), 1), now];
    case "lastMonth": return [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)];
    case "90d": return [new Date(today.getTime() - 90 * 86400000), now];
    case "thisYear": return [new Date(now.getFullYear(), 0, 1), now];
    case "all": return [new Date(2020, 0, 1), now];
  }
};

type ViewMode = "day" | "week" | "month";

/* ─── Main Component ─── */
const AnalyticsAdmin = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showRangeMenu, setShowRangeMenu] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "revenue" | "orders" | "customers" | "events" | "geo" | "tickets">("overview");

  useEffect(() => {
    const fetchAll = async (query: any) => {
      const PAGE = 1000;
      let all: any[] = [];
      let from = 0;
      while (true) {
        const { data } = await query.range(from, from + PAGE - 1);
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    };

    Promise.all([
      fetchAll(supabase.from("orders").select("id, total_amount, service_fee, status, paid_at, created_at, email, event_id, name, birth_date, items, phone")),
      fetchAll(supabase.from("tickets").select("id, event_id, status, checked_in_at, created_at, order_id, ticket_category_id, holder_email")),
      supabase.from("events").select("id, title, date, city, status, slug, location_name, sold_out, open_air").then(r => r.data ?? []),
      fetchAll(supabase.from("newsletter_subscribers").select("id, created_at, unsubscribed, city, source")),
      supabase.from("ticket_categories").select("id, name, price, category_group, group_size, event_id, sold_out, badge").then(r => r.data ?? []),
    ]).then(([o, t, e, s, c]) => {
      setOrders(o); setTickets(t); setEvents(e); setSubscribers(s); setCategories(c);
      setLoading(false);
    });
  }, []);

  const [rangeStart, rangeEnd] = useMemo(() => getRange(rangeKey), [rangeKey]);

  // Previous period for comparison
  const rangeDays = daysBetween(rangeStart, rangeEnd);
  const prevStart = new Date(rangeStart.getTime() - rangeDays * 86400000);
  const prevEnd = new Date(rangeStart.getTime() - 1);

  // Filtered data
  const filteredOrders = useMemo(() => {
    let o = orders.filter(o => o.status === "paid");
    o = o.filter(o => {
      const d = new Date(o.paid_at ?? o.created_at);
      return d >= rangeStart && d <= rangeEnd;
    });
    if (selectedEvent) o = o.filter(o => o.event_id === selectedEvent);
    return o;
  }, [orders, rangeStart, rangeEnd, selectedEvent]);

  const prevOrders = useMemo(() => {
    let o = orders.filter(o => o.status === "paid");
    o = o.filter(o => {
      const d = new Date(o.paid_at ?? o.created_at);
      return d >= prevStart && d <= prevEnd;
    });
    if (selectedEvent) o = o.filter(o => o.event_id === selectedEvent);
    return o;
  }, [orders, prevStart, prevEnd, selectedEvent]);

  const filteredTickets = useMemo(() => {
    let t = tickets.filter(t => {
      const d = new Date(t.created_at);
      return d >= rangeStart && d <= rangeEnd;
    });
    if (selectedEvent) t = t.filter(t => t.event_id === selectedEvent);
    return t;
  }, [tickets, rangeStart, rangeEnd, selectedEvent]);

  const allPaidOrders = useMemo(() => orders.filter(o => o.status === "paid"), [orders]);
  const eventMap = useMemo(() => new Map(events.map(e => [e.id, e])), [events]);

  // ── KPIs ──
  const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const revenueTrend = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;
  const totalServiceFees = filteredOrders.reduce((s, o) => s + Number(o.service_fee), 0);
  const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  const prevAOV = prevOrders.length > 0 ? prevOrders.reduce((s, o) => s + Number(o.total_amount), 0) / prevOrders.length : 0;
  const aovTrend = prevAOV > 0 ? ((avgOrderValue - prevAOV) / prevAOV) * 100 : null;
  const ticketCount = filteredTickets.length;
  const prevTicketCount = tickets.filter(t => { const d = new Date(t.created_at); return d >= prevStart && d <= prevEnd; }).length;
  const ticketTrend = prevTicketCount > 0 ? ((ticketCount - prevTicketCount) / prevTicketCount) * 100 : null;
  const checkedIn = filteredTickets.filter(t => t.checked_in_at).length;
  const checkinRate = ticketCount > 0 ? (checkedIn / ticketCount) * 100 : 0;
  const orderCount = filteredOrders.length;
  const prevOrderCount = prevOrders.length;
  const orderTrend = prevOrderCount > 0 ? ((orderCount - prevOrderCount) / prevOrderCount) * 100 : null;

  // Unique & repeat customers
  const emailCount = new Map<string, number>();
  filteredOrders.forEach(o => emailCount.set(o.email, (emailCount.get(o.email) ?? 0) + 1));
  const uniqueCustomers = emailCount.size;
  const repeatCustomers = Array.from(emailCount.values()).filter(c => c > 1).length;
  const repeatRate = uniqueCustomers > 0 ? (repeatCustomers / uniqueCustomers) * 100 : 0;

  // Revenue per day for chart
  const revenuePerDay = useMemo(() => filteredOrders.reduce((acc, o) => {
    const ds = (o.paid_at ?? o.created_at).split("T")[0];
    acc[ds] = (acc[ds] ?? 0) + Number(o.total_amount);
    return acc;
  }, {} as Record<string, number>), [filteredOrders]);

  const ordersPerDay = useMemo(() => filteredOrders.reduce((acc, o) => {
    const ds = (o.paid_at ?? o.created_at).split("T")[0];
    acc[ds] = (acc[ds] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>), [filteredOrders]);

  const ticketsPerDay = useMemo(() => filteredTickets.reduce((acc, t) => {
    const ds = t.created_at.split("T")[0];
    acc[ds] = (acc[ds] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>), [filteredTickets]);

  // Build chart data based on view mode
  const chartData = useMemo(() => {
    if (viewMode === "day") {
      const data: { label: string; revenue: number; orders: number; tickets: number; date: string }[] = [];
      const days = daysBetween(rangeStart, rangeEnd);
      for (let i = 0; i < Math.min(days, 366); i++) {
        const d = new Date(rangeStart.getTime() + i * 86400000);
        const ds = d.toISOString().split("T")[0];
        data.push({
          label: d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }),
          date: ds,
          revenue: revenuePerDay[ds] ?? 0,
          orders: ordersPerDay[ds] ?? 0,
          tickets: ticketsPerDay[ds] ?? 0,
        });
      }
      return data;
    }
    if (viewMode === "week") {
      const weekMap = new Map<string, { revenue: number; orders: number; tickets: number }>();
      const days = daysBetween(rangeStart, rangeEnd);
      for (let i = 0; i < Math.min(days, 366); i++) {
        const d = new Date(rangeStart.getTime() + i * 86400000);
        const ds = d.toISOString().split("T")[0];
        const wk = `KW ${getWeekNumber(d)}`;
        const cur = weekMap.get(wk) ?? { revenue: 0, orders: 0, tickets: 0 };
        cur.revenue += revenuePerDay[ds] ?? 0;
        cur.orders += ordersPerDay[ds] ?? 0;
        cur.tickets += ticketsPerDay[ds] ?? 0;
        weekMap.set(wk, cur);
      }
      return Array.from(weekMap.entries()).map(([label, v]) => ({ label, ...v, date: label }));
    }
    // month
    const monthMap = new Map<string, { revenue: number; orders: number; tickets: number }>();
    const days = daysBetween(rangeStart, rangeEnd);
    for (let i = 0; i < Math.min(days, 366); i++) {
      const d = new Date(rangeStart.getTime() + i * 86400000);
      const ds = d.toISOString().split("T")[0];
      const mk = d.toLocaleDateString("de-DE", { month: "short", year: "2-digit" });
      const cur = monthMap.get(mk) ?? { revenue: 0, orders: 0, tickets: 0 };
      cur.revenue += revenuePerDay[ds] ?? 0;
      cur.orders += ordersPerDay[ds] ?? 0;
      cur.tickets += ticketsPerDay[ds] ?? 0;
      monthMap.set(mk, cur);
    }
    return Array.from(monthMap.entries()).map(([label, v]) => ({ label, ...v, date: label }));
  }, [viewMode, rangeStart, rangeEnd, revenuePerDay, ordersPerDay, ticketsPerDay]);

  // Revenue by event
  const revenueByEvent = useMemo(() => {
    const map = new Map<string, { revenue: number; tickets: number; orders: number; fee: number }>();
    filteredOrders.forEach(o => {
      if (!o.event_id) return;
      const cur = map.get(o.event_id) ?? { revenue: 0, tickets: 0, orders: 0, fee: 0 };
      cur.revenue += Number(o.total_amount);
      cur.orders += 1;
      cur.fee += Number(o.service_fee);
      map.set(o.event_id, cur);
    });
    filteredTickets.forEach(t => {
      const cur = map.get(t.event_id) ?? { revenue: 0, tickets: 0, orders: 0, fee: 0 };
      cur.tickets += 1;
      map.set(t.event_id, cur);
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, name: eventMap.get(id)?.title ?? "Unbekannt", city: eventMap.get(id)?.city ?? "", ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, filteredTickets, eventMap]);

  // City breakdown
  const cityData = useMemo(() => {
    const map = new Map<string, { revenue: number; orders: number; tickets: number }>();
    filteredOrders.forEach(o => {
      const city = eventMap.get(o.event_id)?.city ?? "Unbekannt";
      const cur = map.get(city) ?? { revenue: 0, orders: 0, tickets: 0 };
      cur.revenue += Number(o.total_amount);
      cur.orders += 1;
      map.set(city, cur);
    });
    filteredTickets.forEach(t => {
      const city = eventMap.get(t.event_id)?.city ?? "Unbekannt";
      const cur = map.get(city) ?? { revenue: 0, orders: 0, tickets: 0 };
      cur.tickets += 1;
      map.set(city, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders, filteredTickets, eventMap]);

  // Payment status (all orders in range, not just paid)
  const paymentStatusData = useMemo(() => {
    const map = new Map<string, number>();
    orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= rangeStart && d <= rangeEnd;
    }).forEach(o => map.set(o.status, (map.get(o.status) ?? 0) + 1));
    const labels: Record<string, string> = { paid: "Bezahlt", pending: "Ausstehend", expired: "Abgelaufen", canceled: "Storniert", failed: "Fehlgeschlagen" };
    return Array.from(map.entries()).map(([k, v]) => ({ name: labels[k] ?? k, value: v }));
  }, [orders, rangeStart, rangeEnd]);

  // Peak hours
  const peakData = useMemo(() => {
    const hours = new Array(24).fill(0);
    filteredOrders.forEach(o => { if (o.paid_at) hours[new Date(o.paid_at).getHours()]++; });
    return hours.map((count, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, count }));
  }, [filteredOrders]);

  // Weekday breakdown
  const weekdayData = useMemo(() => {
    const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    const map = new Array(7).fill(0);
    const revMap = new Array(7).fill(0);
    filteredOrders.forEach(o => {
      const d = new Date(o.paid_at ?? o.created_at).getDay();
      map[d]++;
      revMap[d] += Number(o.total_amount);
    });
    return days.map((name, i) => ({ name, orders: map[i], revenue: revMap[i] }));
  }, [filteredOrders]);

  // Age distribution
  const ageData = useMemo(() => {
    const groups: Record<string, number> = { "< 18": 0, "18-24": 0, "25-34": 0, "35-44": 0, "45-54": 0, "55+": 0 };
    const now = new Date();
    filteredOrders.forEach(o => {
      if (!o.birth_date) return;
      const age = Math.floor((now.getTime() - new Date(o.birth_date).getTime()) / (365.25 * 86400000));
      if (age < 18) groups["< 18"]++;
      else if (age <= 24) groups["18-24"]++;
      else if (age <= 34) groups["25-34"]++;
      else if (age <= 44) groups["35-44"]++;
      else if (age <= 54) groups["45-54"]++;
      else groups["55+"]++;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Hourly revenue heatmap data
  const hourlyRevenue = useMemo(() => {
    const map = new Array(24).fill(0);
    filteredOrders.forEach(o => {
      if (o.paid_at) map[new Date(o.paid_at).getHours()] += Number(o.total_amount);
    });
    return map;
  }, [filteredOrders]);

  // Top customers
  const topCustomers = useMemo(() => {
    const map = new Map<string, { name: string; orders: number; revenue: number; tickets: number }>();
    filteredOrders.forEach(o => {
      const cur = map.get(o.email) ?? { name: o.name || o.email, orders: 0, revenue: 0, tickets: 0 };
      cur.orders += 1;
      cur.revenue += Number(o.total_amount);
      if (o.name) cur.name = o.name;
      map.set(o.email, cur);
    });
    filteredTickets.forEach(t => {
      const email = t.holder_email;
      if (!email) return;
      const cur = map.get(email);
      if (cur) cur.tickets += 1;
    });
    return Array.from(map.entries())
      .map(([email, v]) => ({ email, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20);
  }, [filteredOrders, filteredTickets]);

  // Conversion funnel
  const allOrdersInRange = useMemo(() => orders.filter(o => {
    const d = new Date(o.created_at); return d >= rangeStart && d <= rangeEnd;
  }), [orders, rangeStart, rangeEnd]);
  const conversionRate = allOrdersInRange.length > 0 ? (filteredOrders.length / allOrdersInRange.length) * 100 : 0;

  // Cumulative revenue
  const cumulativeData = useMemo(() => {
    let cumulative = 0;
    return chartData.map(d => {
      cumulative += d.revenue;
      return { ...d, cumulative };
    });
  }, [chartData]);

  // Daily detail table
  const dailyDetail = useMemo(() => {
    return chartData.map(d => ({
      ...d,
      avgOrder: d.orders > 0 ? d.revenue / d.orders : 0,
      ticketsPerOrder: d.orders > 0 ? d.tickets / d.orders : 0,
    })).reverse();
  }, [chartData]);

  // Newsletter stats
  const activeSubs = subscribers.filter(s => !s.unsubscribed).length;
  const subsBySource = useMemo(() => {
    const map = new Map<string, number>();
    subscribers.forEach(s => map.set(s.source ?? "unbekannt", (map.get(s.source ?? "unbekannt") ?? 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [subscribers]);

  // CSV export
  const exportCSV = useCallback(() => {
    const headers = ["Datum", "Umsatz", "Bestellungen", "Tickets", "Ø Bestellwert"];
    const rows = chartData.map(d => [d.label, d.revenue.toFixed(2), d.orders, d.tickets, d.orders > 0 ? (d.revenue / d.orders).toFixed(2) : "0"]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${rangeKey}-${viewMode}.csv`;
    a.click();
  }, [chartData, rangeKey, viewMode]);

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Ticket category analytics
  const ticketCategoryStats = useMemo(() => {
    const map = new Map<string, { name: string; group: string; count: number; checkedIn: number; revenue: number; groupSize: number; events: Set<string> }>();
    filteredTickets.forEach(t => {
      const catId = t.ticket_category_id;
      const cat = catId ? categoryMap.get(catId) : null;
      const catName = cat?.name ?? "Unbekannt";
      const catGroup = cat?.category_group ?? "Sonstige";
      const key = catGroup + " – " + catName;
      const cur = map.get(key) ?? { name: catName, group: catGroup, count: 0, checkedIn: 0, revenue: 0, groupSize: cat?.group_size ?? 1, events: new Set<string>() };
      cur.count += 1;
      if (t.checked_in_at) cur.checkedIn += 1;
      cur.revenue += Number(cat?.price ?? 0);
      cur.events.add(t.event_id);
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, ...v, eventCount: v.events.size, checkinRate: v.count > 0 ? (v.checkedIn / v.count) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [filteredTickets, categoryMap]);

  const categoryGroupStats = useMemo(() => {
    const map = new Map<string, { count: number; checkedIn: number; revenue: number }>();
    ticketCategoryStats.forEach(s => {
      const cur = map.get(s.group) ?? { count: 0, checkedIn: 0, revenue: 0 };
      cur.count += s.count;
      cur.checkedIn += s.checkedIn;
      cur.revenue += s.revenue;
      map.set(s.group, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v, checkinRate: v.count > 0 ? (v.checkedIn / v.count) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [ticketCategoryStats]);

  const ticketTimelineByGroup = useMemo(() => {
    const groups = new Set<string>();
    const dayMap = new Map<string, Record<string, number>>();
    filteredTickets.forEach(t => {
      const ds = t.created_at.split("T")[0];
      const cat = t.ticket_category_id ? categoryMap.get(t.ticket_category_id) : null;
      const group = cat?.category_group ?? "Sonstige";
      groups.add(group);
      const cur = dayMap.get(ds) ?? {};
      cur[group] = (cur[group] ?? 0) + 1;
      dayMap.set(ds, cur);
    });
    const sortedDays = Array.from(dayMap.keys()).sort();
    const groupList = Array.from(groups);
    return { data: sortedDays.map(ds => ({ date: ds, label: new Date(ds + "T00:00:00").toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" }), ...dayMap.get(ds) })), groups: groupList };
  }, [filteredTickets, categoryMap]);

  const eventCategoryBreakdown = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    filteredTickets.forEach(t => {
      const cat = t.ticket_category_id ? categoryMap.get(t.ticket_category_id) : null;
      const catName = cat ? `${cat.category_group ?? ""} ${cat.name}`.trim() : "Unbekannt";
      const eventTitle = eventMap.get(t.event_id)?.title ?? "Unbekannt";
      if (!map.has(eventTitle)) map.set(eventTitle, new Map());
      const inner = map.get(eventTitle)!;
      inner.set(catName, (inner.get(catName) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([event, cats]) => ({
      event,
      categories: Array.from(cats.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      total: Array.from(cats.values()).reduce((s, c) => s + c, 0),
    })).sort((a, b) => b.total - a.total);
  }, [filteredTickets, categoryMap, eventMap]);

  const groupTicketStats = useMemo(() => {
    return ticketCategoryStats.filter(s => s.groupSize > 1);
  }, [ticketCategoryStats]);

  // No-show stats: overall + per past event average
  const noShowStats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    // Past events (date < today)
    const pastEventIds = new Set(events.filter(e => e.date && e.date < today).map(e => e.id));

    // All tickets for past events (regardless of time filter)
    const pastEventTickets = tickets.filter(t => pastEventIds.has(t.event_id));
    const overallTotal = pastEventTickets.length;
    const overallNoShow = pastEventTickets.filter(t => !t.checked_in_at).length;
    const overallRate = overallTotal > 0 ? (overallNoShow / overallTotal) * 100 : 0;

    // Per-event no-show rates
    const perEvent = new Map<string, { total: number; noShow: number }>();
    pastEventTickets.forEach(t => {
      const cur = perEvent.get(t.event_id) ?? { total: 0, noShow: 0 };
      cur.total += 1;
      if (!t.checked_in_at) cur.noShow += 1;
      perEvent.set(t.event_id, cur);
    });

    const eventRates = Array.from(perEvent.entries()).map(([id, v]) => ({
      id,
      title: eventMap.get(id)?.title ?? "Unbekannt",
      city: eventMap.get(id)?.city ?? "",
      date: eventMap.get(id)?.date ?? "",
      total: v.total,
      noShow: v.noShow,
      rate: v.total > 0 ? (v.noShow / v.total) * 100 : 0,
    })).sort((a, b) => b.rate - a.rate);

    const avgRate = eventRates.length > 0
      ? eventRates.reduce((s, e) => s + e.rate, 0) / eventRates.length
      : 0;

    return { overallRate, overallTotal, overallNoShow, avgRate, eventCount: eventRates.length, eventRates };
  }, [tickets, events, eventMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Daten laden...</div>
      </div>
    );
  }

  const tabs = [
    { key: "overview", label: "Übersicht", icon: BarChart3 },
    { key: "revenue", label: "Umsatz", icon: Euro },
    { key: "orders", label: "Bestellungen", icon: ShoppingCart },
    { key: "tickets", label: "Tickets", icon: Ticket },
    { key: "customers", label: "Kunden", icon: Users },
    { key: "events", label: "Events", icon: Calendar },
    
  ] as const;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "hsl(0 0% 100%)" }}>Analyse & Umsatz</h1>
          <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
            {rangeStart.toLocaleDateString("de-DE")} – {rangeEnd.toLocaleDateString("de-DE")}
            {selectedEvent && ` · ${eventMap.get(selectedEvent)?.title}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Export */}
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-white/5 transition-colors" style={{ border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.5)" }}>
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {/* View mode */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid hsl(0 0% 100% / 0.1)" }}>
            {(["day", "week", "month"] as ViewMode[]).map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className="px-3 py-2 text-xs font-medium transition-all"
                style={{ background: viewMode === m ? "hsl(330 80% 55% / 0.2)" : "transparent", color: viewMode === m ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)" }}
              >
                {{ day: "Tag", week: "Woche", month: "Monat" }[m]}
              </button>
            ))}
          </div>
          {/* Range selector */}
          <div className="relative">
            <button onClick={() => setShowRangeMenu(!showRangeMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "hsl(330 80% 55% / 0.15)", color: "hsl(330 80% 55%)", border: "1px solid hsl(330 80% 55% / 0.3)" }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {RANGE_PRESETS.find(r => r.key === rangeKey)?.label}
            </button>
            {showRangeMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRangeMenu(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 rounded-xl overflow-hidden shadow-xl min-w-[160px]" style={{ background: "hsl(220 40% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                  {RANGE_PRESETS.map(r => (
                    <button key={r.key} onClick={() => { setRangeKey(r.key); setShowRangeMenu(false); }}
                      className="w-full px-4 py-2.5 text-xs text-left transition-colors"
                      style={{ background: rangeKey === r.key ? "hsl(330 80% 55% / 0.15)" : "transparent", color: rangeKey === r.key ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)" }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Event filter */}
      {selectedEvent && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Gefiltert nach:</span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "hsl(330 80% 55% / 0.15)", color: "hsl(330 80% 55%)" }}>
            {eventMap.get(selectedEvent)?.title}
          </span>
          <button onClick={() => setSelectedEvent(null)} className="text-xs underline" style={{ color: "hsl(0 0% 100% / 0.4)" }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setDetailTab(tab.key)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
            style={{
              background: detailTab === tab.key ? "hsl(330 80% 55% / 0.15)" : "transparent",
              color: detailTab === tab.key ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)",
              border: `1px solid ${detailTab === tab.key ? "hsl(330 80% 55% / 0.3)" : "transparent"}`,
            }}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ OVERVIEW TAB ═══════ */}
      {detailTab === "overview" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Euro} label="Umsatz" value={`${fmt(totalRevenue)}€`} color="hsl(140 60% 50%)" trend={revenueTrend} />
            <StatCard icon={ShoppingCart} label="Bestellungen" value={fmtInt(orderCount)} color="hsl(200 80% 55%)" trend={orderTrend} />
            <StatCard icon={Ticket} label="Tickets" value={fmtInt(ticketCount)} color="hsl(330 80% 55%)" trend={ticketTrend} />
            <StatCard icon={Target} label="Ø Bestellwert" value={`${fmt(avgOrderValue)}€`} color="hsl(260 70% 60%)" trend={aovTrend} />
            <StatCard icon={CreditCard} label="Servicegebühren" value={`${fmt(totalServiceFees)}€`} color="hsl(40 90% 55%)" />
            <StatCard icon={Percent} label="Conversion" value={`${conversionRate.toFixed(1)}%`} color="hsl(180 60% 50%)" sub={`${allOrdersInRange.length} Bestellversuche`} />
          </div>

          {/* Main revenue chart */}
          <SectionHeader>
            Umsatz & Bestellungen ({viewMode === "day" ? "Tage" : viewMode === "week" ? "Wochen" : "Monate"})
          </SectionHeader>
          <div style={cardStyle} className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(330 80% 55%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(330 80% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" />
                <XAxis dataKey="label" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval={viewMode === "day" && chartData.length > 14 ? Math.floor(chartData.length / 8) : 0} />
                <YAxis yAxisId="left" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [name === "revenue" ? `${fmt(v)}€` : v, name === "revenue" ? "Umsatz" : name === "orders" ? "Bestellungen" : "Tickets"]} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(330 80% 55%)" fill="url(#revGrad)" strokeWidth={2} name="revenue" />
                <Bar yAxisId="right" dataKey="orders" fill="hsl(260 70% 60%)" radius={[3, 3, 0, 0]} opacity={0.6} name="orders" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <StatCard icon={UserCheck} label="Check-in-Rate" value={`${checkinRate.toFixed(1)}%`} color="hsl(140 60% 50%)" sub={`${fmtInt(checkedIn)} / ${fmtInt(ticketCount)}`} />
            <StatCard icon={Repeat} label="Stammkunden" value={`${repeatRate.toFixed(1)}%`} color="hsl(260 70% 60%)" sub={`${repeatCustomers} von ${uniqueCustomers}`} />
            <StatCard icon={Users} label="Newsletter" value={fmtInt(activeSubs)} color="hsl(330 80% 55%)" sub={`${subscribers.length} gesamt`} />
            <StatCard icon={Calendar} label="Events" value={events.length} color="hsl(200 80% 55%)" sub={`${events.filter(e => e.status === "published").length} veröffentlicht`} />
          </div>
        </>
      )}

      {/* ═══════ REVENUE TAB ═══════ */}
      {detailTab === "revenue" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Euro} label="Gesamtumsatz" value={`${fmt(totalRevenue)}€`} color="hsl(140 60% 50%)" trend={revenueTrend} />
            <StatCard icon={Target} label="Ø Bestellwert" value={`${fmt(avgOrderValue)}€`} color="hsl(260 70% 60%)" trend={aovTrend} />
            <StatCard icon={CreditCard} label="Servicegebühren" value={`${fmt(totalServiceFees)}€`} color="hsl(40 90% 55%)" />
            <StatCard icon={TrendingUp} label="Ø Tagesumsatz" value={`${fmt(rangeDays > 0 ? totalRevenue / rangeDays : 0)}€`} color="hsl(200 80% 55%)" />
          </div>

          <SectionHeader>Kumulierter Umsatz</SectionHeader>
          <div style={cardStyle} className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cumulativeData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(140 60% 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(140 60% 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" />
                <XAxis dataKey="label" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval={chartData.length > 14 ? Math.floor(chartData.length / 8) : 0} />
                <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${fmt(v)}€`, "Kumuliert"]} />
                <Area type="monotone" dataKey="cumulative" stroke="hsl(140 60% 50%)" fill="url(#cumGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Detail table */}
          <SectionHeader right={<span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{dailyDetail.length} Einträge</span>}>
            Detail-Tabelle
          </SectionHeader>
          <div style={cardStyle} className="overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                    {["Datum", "Umsatz", "Bestellungen", "Tickets", "Ø Bestellwert", "Tickets/Best."].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyDetail.slice(0, 60).map((d, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "hsl(0 0% 100% / 0.04)" }}>
                      <td className="px-4 py-2.5 font-medium" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{d.label}</td>
                      <td className="px-4 py-2.5 font-bold" style={{ color: d.revenue > 0 ? "hsl(140 60% 50%)" : "hsl(0 0% 100% / 0.3)" }}>{d.revenue > 0 ? `${fmt(d.revenue)}€` : "–"}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{d.orders || "–"}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{d.tickets || "–"}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{d.avgOrder > 0 ? `${fmt(d.avgOrder)}€` : "–"}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{d.ticketsPerOrder > 0 ? d.ticketsPerOrder.toFixed(1) : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════ ORDERS TAB ═══════ */}
      {detailTab === "orders" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={ShoppingCart} label="Bestellungen" value={fmtInt(orderCount)} color="hsl(200 80% 55%)" trend={orderTrend} />
            <StatCard icon={Percent} label="Conversion" value={`${conversionRate.toFixed(1)}%`} color="hsl(180 60% 50%)" />
            <StatCard icon={Target} label="Ø Bestellwert" value={`${fmt(avgOrderValue)}€`} color="hsl(260 70% 60%)" />
            <StatCard icon={Ticket} label="Ø Tickets/Best." value={(ticketCount / Math.max(orderCount, 1)).toFixed(1)} color="hsl(330 80% 55%)" />
          </div>

          <SectionHeader>Bestellungen pro {viewMode === "day" ? "Tag" : viewMode === "week" ? "Woche" : "Monat"}</SectionHeader>
          <div style={cardStyle} className="p-5">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" />
                <XAxis dataKey="label" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} interval={chartData.length > 14 ? Math.floor(chartData.length / 8) : 0} />
                <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="orders" name="Bestellungen" fill="hsl(260 70% 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tickets" name="Tickets" fill="hsl(330 80% 55%)" radius={[4, 4, 0, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Payment status */}
            <div>
              <SectionHeader>Zahlungsstatus</SectionHeader>
              <div style={cardStyle} className="p-5 flex items-center gap-6">
                <div className="w-32 h-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentStatusData} dataKey="value" cx="50%" cy="50%" innerRadius={25} outerRadius={50} paddingAngle={2}>
                        {paymentStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 flex-1">
                  {paymentStatusData.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{s.name}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100%)" }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekday breakdown */}
            <div>
              <SectionHeader>Wochentage</SectionHeader>
              <div style={cardStyle} className="p-5">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weekdayData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fill: "hsl(0 0% 100% / 0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [name === "revenue" ? `${fmt(v)}€` : v, name === "revenue" ? "Umsatz" : "Bestellungen"]} />
                    <Bar dataKey="orders" name="orders" fill="hsl(200 80% 55%)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Peak hours */}
          <SectionHeader>Peak-Zeiten (Buchungsuhrzeit)</SectionHeader>
          <div style={cardStyle} className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={peakData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="hour" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
                <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Bestellungen" fill="hsl(200 80% 55%)" radius={[3, 3, 0, 0]}>
                  {peakData.map((_, i) => <Cell key={i} fill={`hsl(200 80% ${40 + (peakData[i].count / Math.max(...peakData.map(d => d.count), 1)) * 30}%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ═══════ CUSTOMERS TAB ═══════ */}
      {detailTab === "customers" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Einzigartige Kunden" value={fmtInt(uniqueCustomers)} color="hsl(200 80% 55%)" />
            <StatCard icon={Repeat} label="Stammkunden" value={fmtInt(repeatCustomers)} color="hsl(260 70% 60%)" sub={`${repeatRate.toFixed(1)}% Quote`} />
            <StatCard icon={UserCheck} label="Check-in-Rate" value={`${checkinRate.toFixed(1)}%`} color="hsl(140 60% 50%)" />
            <StatCard icon={Euro} label="Ø Umsatz/Kunde" value={`${fmt(uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0)}€`} color="hsl(330 80% 55%)" />
          </div>

          {/* Age distribution */}
          <SectionHeader>Altersverteilung</SectionHeader>
          <div style={cardStyle} className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageData} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: "hsl(0 0% 100% / 0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" name="Kunden" fill="hsl(330 80% 55%)" radius={[4, 4, 0, 0]}>
                  {ageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top customers */}
          <SectionHeader right={<span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Top 20</span>}>
            Top Kunden nach Umsatz
          </SectionHeader>
          <div style={cardStyle} className="overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                    {["#", "Name", "E-Mail", "Bestellungen", "Tickets", "Umsatz"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={c.email} className="border-t" style={{ borderColor: "hsl(0 0% 100% / 0.04)" }}>
                      <td className="px-4 py-2.5 font-bold" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{c.name}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{c.email}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{c.orders}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{c.tickets}</td>
                      <td className="px-4 py-2.5 font-bold" style={{ color: "hsl(140 60% 50%)" }}>{fmt(c.revenue)}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Newsletter sources */}
          <SectionHeader>Newsletter nach Quelle</SectionHeader>
          <div style={cardStyle} className="p-5">
            <div className="space-y-2">
              {subsBySource.map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-xs flex-1 capitalize" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{s.name}</span>
                  <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100%)" }}>{s.value}</span>
                  <div className="w-20 h-1.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${(s.value / (subsBySource[0]?.value || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══════ TICKETS TAB ═══════ */}
      {detailTab === "tickets" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard icon={Ticket} label="Tickets gesamt" value={fmtInt(ticketCount)} color="hsl(330 80% 55%)" />
            <StatCard icon={UserCheck} label="Check-in Rate" value={`${checkinRate.toFixed(1)}%`} color="hsl(140 60% 50%)" sub={`${fmtInt(checkedIn)} eingecheckt`} />
            <StatCard icon={Eye} label="No-Show Rate" value={`${noShowStats.overallRate.toFixed(1)}%`} color="hsl(10 80% 55%)" sub={`${fmtInt(noShowStats.overallNoShow)} von ${fmtInt(noShowStats.overallTotal)} Tickets`} />
            <StatCard icon={Target} label="Ø No-Show / Event" value={`${noShowStats.avgRate.toFixed(1)}%`} color="hsl(40 90% 55%)" sub={`gemessen an ${noShowStats.eventCount} Events`} />
          </div>

          {/* Category Group Distribution (Pie + Bar) */}
          <SectionHeader>Verteilung nach Kategorie-Gruppe</SectionHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div style={cardStyle} className="p-5">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categoryGroupStats} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} strokeWidth={0}>
                    {categoryGroupStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [`${fmtInt(v)} Tickets`, name]} />
                  <Legend formatter={(v) => <span style={{ color: "hsl(0 0% 100% / 0.6)", fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={cardStyle} className="p-5">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryGroupStats} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fill: "hsl(0 0% 100% / 0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "hsl(0 0% 100% / 0.6)", fontSize: 11 }} width={100} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${fmtInt(v)} Tickets`]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {categoryGroupStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ticket Sales Timeline by Group */}
          <SectionHeader>Ticketverkäufe nach Gruppe (Zeitverlauf)</SectionHeader>
          <div style={cardStyle} className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ticketTimelineByGroup.data} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <defs>
                  {ticketTimelineByGroup.groups.map((g, i) => (
                    <linearGradient key={g} id={`tktGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.04)" />
                <XAxis dataKey="label" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Legend formatter={(v) => <span style={{ color: "hsl(0 0% 100% / 0.6)", fontSize: 11 }}>{v}</span>} />
                {ticketTimelineByGroup.groups.map((g, i) => (
                  <Area key={g} type="monotone" dataKey={g} stackId="1" stroke={COLORS[i % COLORS.length]} fill={`url(#tktGrad${i})`} strokeWidth={2} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Category Table */}
          <SectionHeader>Alle Ticketkategorien (Detail)</SectionHeader>
          <div style={cardStyle} className="overflow-hidden">
            <div className="max-h-[400px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                    {["Gruppe", "Kategorie", "Tickets", "Eingecheckt", "Check-in %", "Umsatz", "Events", "Typ"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ticketCategoryStats.map((s, i) => (
                    <tr key={s.key} className="border-t" style={{ borderColor: "hsl(0 0% 100% / 0.04)" }}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <span style={{ color: "hsl(0 0% 100% / 0.5)" }}>{s.group}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-semibold" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{s.name}</td>
                      <td className="px-4 py-2.5 font-bold" style={{ color: "hsl(330 80% 55%)" }}>{fmtInt(s.count)}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(140 60% 50%)" }}>{fmtInt(s.checkedIn)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(s.checkinRate, 100)}%`, background: "hsl(140 60% 50%)" }} />
                          </div>
                          <span style={{ color: "hsl(0 0% 100% / 0.5)" }}>{s.checkinRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-bold" style={{ color: "hsl(140 60% 50%)" }}>{fmt(s.revenue)}€</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{s.eventCount}</td>
                      <td className="px-4 py-2.5">
                        {s.groupSize > 1 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(40 90% 55% / 0.15)", color: "hsl(40 90% 55%)" }}>
                            Gruppe ({s.groupSize}er)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "hsl(0 0% 100% / 0.05)", color: "hsl(0 0% 100% / 0.3)" }}>
                            Einzel
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-Event Category Breakdown */}
          <SectionHeader>Kategorie-Verteilung pro Event</SectionHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {eventCategoryBreakdown.slice(0, 10).map((ev, ei) => (
              <div key={ev.event} style={cardStyle} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold truncate" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{ev.event}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(330 80% 55% / 0.15)", color: "hsl(330 80% 55%)" }}>{ev.total} Tickets</span>
                </div>
                <div className="space-y-2">
                  {ev.categories.map((cat, ci) => {
                    const pct = ev.total > 0 ? (cat.count / ev.total) * 100 : 0;
                    return (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[ci % COLORS.length] }} />
                        <span className="text-[11px] flex-1 truncate" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{cat.name}</span>
                        <div className="w-24 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[ci % COLORS.length] }} />
                        </div>
                        <span className="text-[10px] font-bold w-8 text-right" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{cat.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Group Tickets Section */}
          {groupTicketStats.length > 0 && (
            <>
              <SectionHeader>Gruppentickets</SectionHeader>
              <div style={cardStyle} className="overflow-hidden">
                <div className="max-h-[300px] overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                        {["Kategorie", "Gruppengröße", "Tickets", "Personen (effektiv)", "Check-in %", "Umsatz"].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)", fontSize: 10 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupTicketStats.map((s, i) => (
                        <tr key={s.key} className="border-t" style={{ borderColor: "hsl(0 0% 100% / 0.04)" }}>
                          <td className="px-4 py-2.5 font-semibold" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
                            {s.group} – {s.name}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(40 90% 55% / 0.15)", color: "hsl(40 90% 55%)" }}>
                              {s.groupSize}er
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-bold" style={{ color: "hsl(330 80% 55%)" }}>{fmtInt(s.count)}</td>
                          <td className="px-4 py-2.5" style={{ color: "hsl(260 70% 60%)" }}>{fmtInt(s.count)}</td>
                          <td className="px-4 py-2.5" style={{ color: "hsl(140 60% 50%)" }}>{s.checkinRate.toFixed(1)}%</td>
                          <td className="px-4 py-2.5 font-bold" style={{ color: "hsl(140 60% 50%)" }}>{fmt(s.revenue)}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* No-Show Rate per Event */}
          <SectionHeader right={<span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>gemessen an {noShowStats.eventCount} vergangenen Events</span>}>
            No-Show Rate pro Event
          </SectionHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* No-Show Bar Chart */}
            <div style={cardStyle} className="p-5">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={noShowStats.eventRates.slice(0, 15)} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fill: "hsl(0 0% 100% / 0.4)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="title" tick={{ fill: "hsl(0 0% 100% / 0.6)", fontSize: 10 }} width={140} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v.toFixed(1)}%`, "No-Show Rate"]} />
                  <Bar dataKey="rate" radius={[0, 6, 6, 0]}>
                    {noShowStats.eventRates.slice(0, 15).map((e, i) => (
                      <Cell key={i} fill={e.rate > 50 ? "hsl(10 80% 55%)" : e.rate > 30 ? "hsl(40 90% 55%)" : "hsl(140 60% 50%)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Summary Card */}
            <div style={cardStyle} className="p-5 flex flex-col gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Zusammenfassung</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ background: "hsl(10 80% 55% / 0.1)" }}>
                  <span className="text-[10px] uppercase font-semibold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Gesamt No-Show</span>
                  <p className="text-2xl font-black mt-1" style={{ color: "hsl(10 80% 55%)" }}>{noShowStats.overallRate.toFixed(1)}%</p>
                  <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{fmtInt(noShowStats.overallNoShow)} Tickets</span>
                </div>
                <div className="p-4 rounded-xl" style={{ background: "hsl(40 90% 55% / 0.1)" }}>
                  <span className="text-[10px] uppercase font-semibold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Ø pro Event</span>
                  <p className="text-2xl font-black mt-1" style={{ color: "hsl(40 90% 55%)" }}>{noShowStats.avgRate.toFixed(1)}%</p>
                  <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>über {noShowStats.eventCount} Events</span>
                </div>
              </div>
              {/* Top 5 worst no-show events */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Höchste No-Show Raten</span>
                <div className="mt-2 space-y-2">
                  {noShowStats.eventRates.slice(0, 5).map((e, i) => (
                    <div key={e.id} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold w-5 text-center" style={{ color: "hsl(0 0% 100% / 0.2)" }}>{i + 1}</span>
                      <span className="text-[11px] flex-1 truncate" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{e.title}</span>
                      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{e.city}</span>
                      <span className="text-xs font-bold" style={{ color: e.rate > 50 ? "hsl(10 80% 55%)" : e.rate > 30 ? "hsl(40 90% 55%)" : "hsl(140 60% 50%)" }}>
                        {e.rate.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Full No-Show Table */}
          <div style={cardStyle} className="overflow-hidden">
            <div className="max-h-[350px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                    {["Event", "Stadt", "Datum", "Tickets", "No-Shows", "No-Show %"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {noShowStats.eventRates.map(e => (
                    <tr key={e.id} className="border-t" style={{ borderColor: "hsl(0 0% 100% / 0.04)" }}>
                      <td className="px-4 py-2.5 font-semibold" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{e.title}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{e.city}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{e.date ? new Date(e.date + "T00:00:00").toLocaleDateString("de-DE") : "–"}</td>
                      <td className="px-4 py-2.5 font-bold" style={{ color: "hsl(330 80% 55%)" }}>{fmtInt(e.total)}</td>
                      <td className="px-4 py-2.5" style={{ color: "hsl(10 80% 55%)" }}>{fmtInt(e.noShow)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
                            <div className="h-full rounded-full" style={{ width: `${Math.min(e.rate, 100)}%`, background: e.rate > 50 ? "hsl(10 80% 55%)" : e.rate > 30 ? "hsl(40 90% 55%)" : "hsl(140 60% 50%)" }} />
                          </div>
                          <span className="font-bold" style={{ color: e.rate > 50 ? "hsl(10 80% 55%)" : e.rate > 30 ? "hsl(40 90% 55%)" : "hsl(140 60% 50%)" }}>{e.rate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}


      {detailTab === "events" && (() => {
        const today = new Date().toISOString().split("T")[0];
        const upcomingEvents = events
          .filter(e => e.date && e.date >= today && e.status === "published")
          .sort((a: any, b: any) => a.date.localeCompare(b.date));

        const upcomingStats = upcomingEvents.map(ev => {
          const evTickets = tickets.filter(t => t.event_id === ev.id);
          const evOrders = orders.filter(o => o.event_id === ev.id && o.status === "paid");
          const evCats = categories.filter(c => c.event_id === ev.id);
          const totalCapacity = evCats.reduce((s: number, c: any) => s + (c.max_capacity ?? 0), 0);
          const totalSold = evTickets.length;
          const totalRevenue = evOrders.reduce((s: number, o: any) => s + Number(o.total_amount), 0);
          const totalFees = evOrders.reduce((s: number, o: any) => s + Number(o.service_fee), 0);
          const checkedIn = evTickets.filter(t => t.checked_in_at).length;
          const avgOrder = evOrders.length > 0 ? totalRevenue / evOrders.length : 0;

          // Per-category breakdown
          const catStats = evCats.map((c: any) => {
            const catTickets = evTickets.filter(t => t.ticket_category_id === c.id);
            return {
              name: c.name,
              badge: c.badge,
              sold: catTickets.length,
              capacity: c.max_capacity ?? 0,
              soldOut: c.sold_out,
              price: c.price,
            };
          }).sort((a: any, b: any) => (b.sold / (b.capacity || 1)) - (a.sold / (a.capacity || 1)));

          return {
            id: ev.id,
            title: ev.title,
            date: ev.date,
            city: ev.city,
            locationName: ev.location_name,
            soldOut: ev.sold_out,
            totalSold,
            totalCapacity,
            totalRevenue,
            totalFees,
            orderCount: evOrders.length,
            checkedIn,
            avgOrder,
            catStats,
          };
        });

        return (
        <>
          {/* Kommende Events */}
          <SectionHeader right={<span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{upcomingStats.length} kommende Events</span>}>
            Kommende Events – Ticketverkauf
          </SectionHeader>

          {upcomingStats.length === 0 ? (
            <div style={cardStyle} className="p-8 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
              <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Keine kommenden Events</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingStats.map(ev => {
                const pct = ev.totalCapacity > 0 ? Math.min((ev.totalSold / ev.totalCapacity) * 100, 100) : 0;
                const pctColor = pct >= 90 ? "hsl(0 70% 55%)" : pct >= 60 ? "hsl(40 90% 55%)" : "hsl(140 60% 50%)";
                return (
                  <div key={ev.id} style={cardStyle} className="p-4 sm:p-5">
                    {/* Header row */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{ev.title}</h3>
                          {ev.soldOut && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full" style={{ background: "hsl(0 70% 55% / 0.2)", color: "hsl(0 70% 55%)" }}>
                              Ausverkauft
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                          {new Date(ev.date + "T00:00:00").toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long", year: "numeric" })}
                          {ev.locationName && ` · ${ev.locationName}`}
                          {ev.city && `, ${ev.city}`}
                        </p>
                      </div>
                      <button onClick={() => setSelectedEvent(selectedEvent === ev.id ? null : ev.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all shrink-0"
                        style={{
                          background: selectedEvent === ev.id ? "hsl(330 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.05)",
                          color: selectedEvent === ev.id ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)",
                          border: `1px solid ${selectedEvent === ev.id ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.06)"}`,
                        }}
                      >
                        <Filter className="w-3 h-3" />
                        {selectedEvent === ev.id ? "Filter aktiv" : "Filtern"}
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
                          {fmtInt(ev.totalSold)}{ev.totalCapacity > 0 ? ` / ${fmtInt(ev.totalCapacity)}` : ""} Tickets
                        </span>
                        {ev.totalCapacity > 0 && (
                          <span className="text-xs font-black" style={{ color: pctColor }}>{pct.toFixed(0)}%</span>
                        )}
                      </div>
                      {ev.totalCapacity > 0 && (
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: pctColor }} />
                        </div>
                      )}
                    </div>

                    {/* KPI row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                      <div className="p-2.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                        <span className="text-[9px] uppercase font-bold tracking-wider block" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Umsatz</span>
                        <span className="text-sm font-black" style={{ color: "hsl(140 60% 50%)" }}>{fmt(ev.totalRevenue)}€</span>
                      </div>
                      <div className="p-2.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                        <span className="text-[9px] uppercase font-bold tracking-wider block" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Gebühren</span>
                        <span className="text-sm font-black" style={{ color: "hsl(40 90% 55%)" }}>{fmt(ev.totalFees)}€</span>
                      </div>
                      <div className="p-2.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                        <span className="text-[9px] uppercase font-bold tracking-wider block" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Bestellungen</span>
                        <span className="text-sm font-black" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{fmtInt(ev.orderCount)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                        <span className="text-[9px] uppercase font-bold tracking-wider block" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Ø Bestellung</span>
                        <span className="text-sm font-black" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{fmt(ev.avgOrder)}€</span>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    {ev.catStats.length > 0 && (
                      <div className="space-y-1">
                        {ev.catStats.map((cat, i) => {
                          const catPct = cat.capacity > 0 ? Math.min((cat.sold / cat.capacity) * 100, 100) : 0;
                          return (
                            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.02)" }}>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-medium truncate" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{cat.name}</span>
                                  {cat.badge && (
                                    <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: "hsl(270 70% 55% / 0.2)", color: "hsl(270 70% 55%)" }}>{cat.badge}</span>
                                  )}
                                  {cat.soldOut && (
                                    <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{ background: "hsl(0 70% 55% / 0.2)", color: "hsl(0 70% 55%)" }}>SOLD OUT</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] font-bold shrink-0" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                                {cat.sold}{cat.capacity > 0 ? `/${cat.capacity}` : ""}
                              </span>
                              {cat.capacity > 0 && (
                                <div className="w-16 h-1.5 rounded-full overflow-hidden shrink-0" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
                                  <div className="h-full rounded-full" style={{ width: `${catPct}%`, background: catPct >= 90 ? "hsl(0 70% 55%)" : "hsl(270 70% 55%)" }} />
                                </div>
                              )}
                              <span className="text-[10px] shrink-0" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{fmt(cat.price)}€</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Existing: Revenue per event table */}
          <SectionHeader right={<span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{revenueByEvent.length} Events</span>}>
            Umsatz pro Event (Zeitraum)
          </SectionHeader>
          <div style={cardStyle} className="overflow-hidden">
            <div className="max-h-[500px] overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                    {["#", "Event", "Stadt", "Umsatz", "Gebühren", "Bestellungen", "Tickets", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)", fontSize: 10 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {revenueByEvent.map((e, i) => (
                    <tr key={e.id} className="border-t hover:bg-white/[0.02] transition-colors" style={{ borderColor: "hsl(0 0% 100% / 0.04)" }}>
                      <td className="px-4 py-3 font-bold" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{i + 1}</td>
                      <td className="px-4 py-3 font-medium max-w-[200px] truncate" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{e.name}</td>
                      <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{e.city}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: "hsl(140 60% 50%)" }}>{fmt(e.revenue)}€</td>
                      <td className="px-4 py-3" style={{ color: "hsl(40 90% 55%)" }}>{fmt(e.fee)}€</td>
                      <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{e.orders}</td>
                      <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{e.tickets}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedEvent(selectedEvent === e.id ? null : e.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          style={{ color: selectedEvent === e.id ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.3)" }}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar chart of top events */}
          <SectionHeader>Top 10 Events</SectionHeader>
          <div style={cardStyle} className="p-5">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByEvent.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fill: "hsl(0 0% 100% / 0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fill: "hsl(0 0% 100% / 0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${fmt(v)}€`, "Umsatz"]} />
                <Bar dataKey="revenue" fill="hsl(330 80% 55%)" radius={[0, 4, 4, 0]}>
                  {revenueByEvent.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
        );
      })()}


      <div className="h-8" />
    </div>
  );
};

export default AnalyticsAdmin;
