import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { CheckCircle, Clock, XCircle, ArrowLeft, Ticket } from "lucide-react";

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

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (data) setOrder(data as unknown as OrderData);
      setLoading(false);
    };

    fetchOrder();

    // Poll for status updates (Mollie webhook may be slightly delayed)
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("status, paid_at")
        .eq("id", orderId)
        .maybeSingle();
      if (data && order) {
        setOrder((prev) => prev ? { ...prev, status: data.status, paid_at: data.paid_at } : prev);
        if (data.status === "paid" || data.status === "cancelled" || data.status === "failed") {
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

          {/* Actions */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.01]"
            style={{ background: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.3)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
