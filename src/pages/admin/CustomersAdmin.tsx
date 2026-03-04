import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, ChevronDown, ChevronUp, Mail, Phone, Calendar, ShoppingCart,
  TrendingUp, User, CreditCard, X, ArrowUpDown, Eye,
} from "lucide-react";

type Order = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  birth_date: string | null;
  status: string;
  total_amount: number;
  service_fee: number;
  currency: string;
  items: unknown;
  event_id: string | null;
  created_at: string;
  paid_at: string | null;
};

type EventInfo = {
  id: string;
  title: string;
  date: string | null;
};

type Customer = {
  email: string;
  name: string | null;
  phone: string | null;
  birth_date: string | null;
  orders: Order[];
  totalSpent: number;
  orderCount: number;
  lastOrder: string;
  firstOrder: string;
};

type SortField = "email" | "totalSpent" | "orderCount" | "lastOrder";

const CustomersAdmin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("lastOrder");
  const [sortAsc, setSortAsc] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      const [ordersRes, eventsRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("events").select("id, title, date"),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data as unknown as Order[]);
      if (eventsRes.data) setEvents(eventsRes.data as unknown as EventInfo[]);
      setLoading(false);
    };
    load();
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, Customer>();
    orders.forEach((order) => {
      const email = order.email.toLowerCase().trim();
      if (!map.has(email)) {
        map.set(email, {
          email,
          name: order.name,
          phone: order.phone,
          birth_date: order.birth_date,
          orders: [],
          totalSpent: 0,
          orderCount: 0,
          lastOrder: order.created_at,
          firstOrder: order.created_at,
        });
      }
      const c = map.get(email)!;
      c.orders.push(order);
      if (order.status === "paid") c.totalSpent += order.total_amount + order.service_fee;
      c.orderCount++;
      if (!c.name && order.name) c.name = order.name;
      if (!c.phone && order.phone) c.phone = order.phone;
      if (!c.birth_date && order.birth_date) c.birth_date = order.birth_date;
      if (order.created_at > c.lastOrder) c.lastOrder = order.created_at;
      if (order.created_at < c.firstOrder) c.firstOrder = order.created_at;
    });
    return Array.from(map.values());
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.email.includes(q) ||
          c.name?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((c) =>
        c.orders.some((o) => o.status === statusFilter)
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "email": cmp = a.email.localeCompare(b.email); break;
        case "totalSpent": cmp = a.totalSpent - b.totalSpent; break;
        case "orderCount": cmp = a.orderCount - b.orderCount; break;
        case "lastOrder": cmp = new Date(a.lastOrder).getTime() - new Date(b.lastOrder).getTime(); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [customers, search, sortField, sortAsc, statusFilter]);

  const getEventTitle = (eventId: string | null) => {
    if (!eventId) return "–";
    return events.find((e) => e.id === eventId)?.title || "Unbekannt";
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const paidOrders = orders.filter((o) => o.status === "paid").length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatCurrency = (v: number) => v.toFixed(2).replace(".", ",") + " €";

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: "hsl(150 60% 40% / 0.12)", text: "hsl(150 60% 40%)", label: "Bezahlt" },
    pending: { bg: "hsl(45 80% 55% / 0.12)", text: "hsl(45 80% 55%)", label: "Ausstehend" },
    failed: { bg: "hsl(0 70% 55% / 0.12)", text: "hsl(0 70% 55%)", label: "Fehlgeschlagen" },
    expired: { bg: "hsl(0 0% 100% / 0.06)", text: "hsl(0 0% 100% / 0.35)", label: "Abgelaufen" },
    canceled: { bg: "hsl(0 0% 100% / 0.06)", text: "hsl(0 0% 100% / 0.35)", label: "Storniert" },
  };

  const getStatus = (s: string) => statusColors[s] || { bg: "hsl(0 0% 100% / 0.06)", text: "hsl(0 0% 100% / 0.4)", label: s };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Laden...</div>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="text-xl sm:text-2xl font-black uppercase mb-6"
        style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
      >
        Kunden
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Kunden", value: customers.length.toString(), icon: Users, color: "hsl(330 80% 55%)" },
          { label: "Bestellungen", value: orders.length.toString(), icon: ShoppingCart, color: "hsl(215 90% 55%)" },
          { label: "Bezahlt", value: paidOrders.toString(), icon: CreditCard, color: "hsl(150 60% 40%)" },
          { label: "Umsatz", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "hsl(45 80% 55%)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                {stat.label}
              </span>
            </div>
            <span className="text-lg font-black" style={{ color: "hsl(0 0% 100%)" }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, E-Mail oder Telefon suchen..."
            className="w-full pl-10 pr-3 py-2 rounded-lg text-sm"
            style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
        >
          <option value="all" style={{ background: "hsl(220 50% 10%)" }}>Alle Status</option>
          <option value="paid" style={{ background: "hsl(220 50% 10%)" }}>Nur bezahlt</option>
          <option value="pending" style={{ background: "hsl(220 50% 10%)" }}>Nur ausstehend</option>
          <option value="failed" style={{ background: "hsl(220 50% 10%)" }}>Nur fehlgeschlagen</option>
        </select>
      </div>

      {/* Sort buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { field: "lastOrder" as SortField, label: "Letzte Bestellung" },
          { field: "totalSpent" as SortField, label: "Umsatz" },
          { field: "orderCount" as SortField, label: "Bestellungen" },
          { field: "email" as SortField, label: "E-Mail" },
        ]).map((s) => (
          <button
            key={s.field}
            onClick={() => handleSort(s.field)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: sortField === s.field ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)",
              color: sortField === s.field ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
            }}
          >
            <ArrowUpDown className="w-3 h-3" />
            {s.label}
            {sortField === s.field && (sortAsc ? " ↑" : " ↓")}
          </button>
        ))}
      </div>

      {/* Customer list */}
      <div className="space-y-2">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
            <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              {search ? "Keine Kunden gefunden" : "Noch keine Bestellungen vorhanden"}
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer, i) => {
            const isExpanded = expandedCustomer === customer.email;
            return (
              <motion.div
                key={customer.email}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "hsl(0 0% 100% / 0.04)",
                  border: `1px solid ${isExpanded ? "hsl(330 80% 55% / 0.25)" : "hsl(0 0% 100% / 0.06)"}`,
                }}
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-3 px-4 sm:px-5 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-all"
                  onClick={() => setExpandedCustomer(isExpanded ? null : customer.email)}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "hsl(330 80% 55% / 0.12)", color: "hsl(330 80% 55%)" }}
                  >
                    {(customer.name || customer.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>
                        {customer.name || customer.email}
                      </span>
                      {customer.orders.filter(o => o.status === "paid").length > 2 && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0" style={{ background: "hsl(330 80% 55% / 0.12)", color: "hsl(330 80% 55%)" }}>
                          Stammkunde
                        </span>
                      )}
                    </div>
                    <span className="text-xs truncate block" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                      {customer.email}
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs block font-bold" style={{ color: "hsl(150 60% 40%)" }}>
                        {formatCurrency(customer.totalSpent)}
                      </span>
                      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Umsatz</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs block font-bold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                        {customer.orderCount}
                      </span>
                      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Bestellungen</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                        {formatDate(customer.lastOrder)}
                      </span>
                      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Letzte</span>
                    </div>
                  </div>
                  <ChevronDown
                    className="w-4 h-4 shrink-0 transition-transform"
                    style={{ color: "hsl(0 0% 100% / 0.3)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-4 pt-1 space-y-4" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
                        {/* Contact info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                            <Mail className="w-3.5 h-3.5" style={{ color: "hsl(215 90% 55%)" }} />
                            <span className="text-xs font-mono truncate" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                              {customer.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                            <Phone className="w-3.5 h-3.5" style={{ color: "hsl(150 60% 40%)" }} />
                            <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                              {customer.phone || "–"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                            <Calendar className="w-3.5 h-3.5" style={{ color: "hsl(45 80% 55%)" }} />
                            <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                              {customer.birth_date ? formatDate(customer.birth_date) : "–"}
                            </span>
                          </div>
                        </div>

                        {/* Orders table */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                            Bestellungen ({customer.orderCount})
                          </span>
                          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr style={{ background: "hsl(0 0% 100% / 0.02)", borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Datum</th>
                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Event</th>
                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Status</th>
                                    <th className="text-right px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Betrag</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {customer.orders.map((order) => {
                                    const st = getStatus(order.status);
                                    return (
                                      <tr key={order.id} style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.04)" }}>
                                        <td className="px-3 py-2 text-xs font-mono" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                                          {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-3 py-2 text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                                          {getEventTitle(order.event_id)}
                                        </td>
                                        <td className="px-3 py-2">
                                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: st.bg, color: st.text }}>
                                            {st.label}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs font-bold text-right" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
                                          {formatCurrency(order.total_amount + order.service_fee)}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Count */}
      {filteredCustomers.length > 0 && (
        <p className="text-xs text-center mt-4" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
          {filteredCustomers.length} von {customers.length} Kunden
        </p>
      )}
    </div>
  );
};

export default CustomersAdmin;