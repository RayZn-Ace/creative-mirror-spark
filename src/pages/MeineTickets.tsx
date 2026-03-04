import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Search, ArrowRight, CheckCircle } from "lucide-react";

interface OrderWithTickets {
  id: string;
  status: string;
  email: string;
  name: string | null;
  total_amount: number;
  created_at: string;
  paid_at: string | null;
  items: Array<{ name: string; quantity: number; priceEur: number }>;
  tickets: Array<{
    id: string;
    qr_code: string;
    status: string;
    holder_name: string | null;
  }>;
  event_title?: string;
  event_date?: string;
  event_city?: string;
}

const SAVED_INFO_KEY = "gimme_checkout_info";

const MeineTickets = () => {
  const savedInfo = (() => { try { return JSON.parse(localStorage.getItem(SAVED_INFO_KEY) || "{}"); } catch { return {}; } })();
  const [email, setEmail] = useState(savedInfo.email || "");
  const [orders, setOrders] = useState<OrderWithTickets[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!email || !email.includes("@")) return;
    setLoading(true);
    setSearched(true);

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*, events(title, date, city)")
      .eq("email", email)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (!ordersData || ordersData.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const orderIds = ordersData.map((o: any) => o.id);
    const { data: ticketsData } = await supabase
      .from("tickets")
      .select("*")
      .in("order_id", orderIds);

    const result: OrderWithTickets[] = ordersData.map((o: any) => ({
      id: o.id,
      status: o.status,
      email: o.email,
      name: o.name,
      total_amount: o.total_amount,
      created_at: o.created_at,
      paid_at: o.paid_at,
      items: o.items as any,
      event_title: o.events?.title,
      event_date: o.events?.date,
      event_city: o.events?.city,
      tickets: (ticketsData || []).filter((t: any) => t.order_id === o.id).map((t: any) => ({
        id: t.id,
        qr_code: t.qr_code,
        status: t.status,
        holder_name: t.holder_name,
      })),
    }));

    setOrders(result);
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  };

  return (
    <PageLayout title="Meine Tickets" subtitle="Finde deine gekauften Tickets">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Email search */}
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="Deine E-Mail-Adresse eingeben..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-4 py-3 rounded-xl text-sm bg-transparent outline-none"
            style={{ border: "1px solid hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)" }}
          />
          <motion.button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wide shrink-0 flex items-center gap-2"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="w-4 h-4" />
            {loading ? "..." : "Suchen"}
          </motion.button>
        </div>

        {/* Results */}
        {searched && !loading && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
            <Ticket className="w-10 h-10 mb-4" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
            <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Keine Tickets für diese E-Mail gefunden.
            </p>
            <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.25)" }}>
              Stelle sicher, dass du die gleiche E-Mail wie bei der Bestellung verwendest.
            </p>
          </div>
        )}

        <AnimatePresence>
          {orders.map((order, idx) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-2xl p-5 space-y-4"
              style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            >
              {/* Order header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)" }}>
                    {order.event_title || "Event"}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                    {order.event_date && <span>{formatDate(order.event_date)}</span>}
                    {order.event_city && <span>{order.event_city}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold" style={{ color: "hsl(140 70% 55%)" }}>
                  <CheckCircle className="w-3.5 h-3.5" /> Bezahlt
                </div>
              </div>

              <div className="h-px" style={{ background: "hsl(0 0% 100% / 0.08)" }} />

              {/* Tickets */}
              <div className="space-y-3">
                {order.tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center gap-4 p-3 rounded-xl"
                    style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                    <div className="bg-white p-2 rounded-lg shrink-0">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(ticket.qr_code)}`}
                        alt="QR Code"
                        className="w-20 h-20"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {ticket.holder_name && (
                        <p className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{ticket.holder_name}</p>
                      )}
                      <p className="text-xs font-mono mt-0.5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                        {ticket.qr_code.slice(0, 12).toUpperCase()}
                      </p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                        style={{
                          background: ticket.status === "valid" ? "hsl(140 70% 45% / 0.2)" : "hsl(45 100% 50% / 0.2)",
                          color: ticket.status === "valid" ? "hsl(140 70% 60%)" : "hsl(45 100% 60%)",
                        }}
                      >
                        {ticket.status === "valid" ? "Gültig" : ticket.status === "checked_in" ? "Eingecheckt" : ticket.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-right text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                Bestellt am {formatDate(order.created_at)} · {order.total_amount.toFixed(2).replace(".", ",")} €
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!searched && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
            <Ticket className="w-10 h-10 mb-4" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
            <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Gib deine E-Mail-Adresse ein, um deine Tickets zu finden.
            </p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default MeineTickets;
