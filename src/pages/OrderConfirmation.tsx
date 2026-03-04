import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle, Clock, XCircle, ArrowLeft, Ticket, Download } from "lucide-react";

interface OrderData {
  id: string;
  status: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  items: Array<{ name: string; quantity: number; priceEur: number }>;
  total_amount: number;
  currency: string;
  service_fee: number;
  created_at: string;
  paid_at: string | null;
}

interface TicketData {
  id: string;
  qr_code: string;
  status: string;
  holder_name: string | null;
  holder_email: string | null;
  ticket_category_id: string | null;
  event_id: string;
}

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (data) {
        const orderData = data as unknown as OrderData;
        setOrder(orderData);
        if (orderData.status === "paid") {
          fetchTickets();
        }
      }
      setLoading(false);
    };

    const fetchTickets = async () => {
      const { data } = await supabase
        .from("tickets")
        .select("*")
        .eq("order_id", orderId);
      if (data) setTickets(data as unknown as TicketData[]);
    };

    fetchOrder();

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (data) {
        const updated = data as unknown as OrderData;
        setOrder(updated);
        if (updated.status === "paid") {
          fetchTickets();
        }
        if (updated.status === "paid" || updated.status === "cancelled" || updated.status === "failed") {
          clearInterval(interval);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 55% 52%)" }}>
        <div className="text-lg font-bold uppercase tracking-wider animate-pulse" style={{ color: "hsl(0 0% 100%)" }}>
          Laden...
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "hsl(210 55% 52%)" }}>
        <p className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>Bestellung nicht gefunden</p>
        <Link to="/" className="text-sm underline" style={{ color: "hsl(0 0% 100% / 0.8)" }}>Zurück zur Startseite</Link>
      </div>
    );
  }

  const isPaid = order.status === "paid";
  const isPending = order.status === "pending";
  const isFailed = order.status === "failed" || order.status === "cancelled";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, hsl(210 55% 42%), hsl(210 55% 52%))" }}>
      <div className="max-w-lg mx-auto px-4 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl p-6 sm:p-8 backdrop-blur-sm"
          style={{ background: "hsl(0 0% 100% / 0.1)", border: "1px solid hsl(0 0% 100% / 0.2)" }}
        >
          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {isPaid && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <CheckCircle className="w-16 h-16" style={{ color: "hsl(140 70% 55%)" }} />
              </motion.div>
            )}
            {isPending && <Clock className="w-16 h-16 animate-pulse" style={{ color: "hsl(45 100% 60%)" }} />}
            {isFailed && <XCircle className="w-16 h-16" style={{ color: "hsl(0 70% 60%)" }} />}
          </div>

          {/* Status Text */}
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-center mb-2" style={{ color: "hsl(0 0% 100%)" }}>
            {isPaid && "Zahlung erfolgreich!"}
            {isPending && "Zahlung wird verarbeitet..."}
            {isFailed && "Zahlung fehlgeschlagen"}
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
            {isPaid && "Deine Tickets wurden an deine E-Mail gesendet."}
            {isPending && "Bitte warte einen Moment, deine Zahlung wird noch verarbeitet."}
            {isFailed && "Die Zahlung konnte nicht abgeschlossen werden. Bitte versuche es erneut."}
          </p>

          {/* Order Details */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
              <span>Bestellnummer</span>
              <span className="font-mono text-xs">{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
              <span>E-Mail</span>
              <span>{order.email}</span>
            </div>
            <div className="h-px" style={{ background: "hsl(0 0% 100% / 0.15)" }} />

            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
                <span className="flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5 opacity-60" />
                  {item.quantity}x {item.name}
                </span>
                <span>{(item.priceEur * item.quantity).toFixed(2).replace(".", ",")} €</span>
              </div>
            ))}

            {order.service_fee > 0 && (
              <div className="flex justify-between text-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                <span>Servicegebühr</span>
                <span>{order.service_fee.toFixed(2).replace(".", ",")} €</span>
              </div>
            )}

            <div className="h-px" style={{ background: "hsl(0 0% 100% / 0.15)" }} />
            <div className="flex justify-between font-bold" style={{ color: "hsl(0 0% 100%)" }}>
              <span>Gesamt</span>
              <span>{order.total_amount.toFixed(2).replace(".", ",")} €</span>
            </div>
          </div>

          {/* Tickets with QR codes */}
          {isPaid && tickets.length > 0 && (
            <div className="space-y-4 mb-6">
              <div className="h-px" style={{ background: "hsl(0 0% 100% / 0.15)" }} />
              <h2 className="text-sm font-bold uppercase tracking-wider text-center" style={{ color: "hsl(0 0% 100%)" }}>
                Deine Tickets
              </h2>
              {tickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl"
                  style={{ background: "hsl(0 0% 100% / 0.1)", border: "1px solid hsl(0 0% 100% / 0.15)" }}
                >
                  <div className="bg-white p-3 rounded-xl">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.qr_code)}`}
                      alt="QR Code"
                      className="w-40 h-40 sm:w-48 sm:h-48"
                    />
                  </div>
                  <div className="text-center">
                    {ticket.holder_name && (
                      <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{ticket.holder_name}</p>
                    )}
                    <p className="text-xs font-mono" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                      {ticket.qr_code.slice(0, 12).toUpperCase()}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                      style={{
                        background: ticket.status === "valid" ? "hsl(140 70% 45% / 0.3)" : "hsl(0 70% 50% / 0.3)",
                        color: ticket.status === "valid" ? "hsl(140 70% 65%)" : "hsl(0 70% 65%)",
                        border: `1px solid ${ticket.status === "valid" ? "hsl(140 70% 45% / 0.5)" : "hsl(0 70% 50% / 0.5)"}`,
                      }}
                    >
                      {ticket.status === "valid" ? "Gültig" : ticket.status === "checked_in" ? "Eingecheckt" : ticket.status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Link
              to="/meine-tickets"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.01]"
              style={{ background: "hsl(210 80% 50% / 0.4)", color: "hsl(0 0% 100%)", border: "1px solid hsl(210 80% 50% / 0.5)" }}
            >
              <Ticket className="w-4 h-4" /> Alle meine Tickets
            </Link>
            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.01]"
              style={{ background: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.3)" }}
            >
              <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
