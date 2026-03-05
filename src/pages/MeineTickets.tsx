import { useState, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Search, CheckCircle, Mail, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

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

type Step = "email" | "code" | "tickets";

const SAVED_INFO_KEY = "gimme_checkout_info";

const MeineTickets = () => {
  const savedInfo = (() => { try { return JSON.parse(localStorage.getItem(SAVED_INFO_KEY) || "{}"); } catch { return {}; } })();
  const [email, setEmail] = useState(savedInfo.email || "");
  const [step, setStep] = useState<Step>("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [orders, setOrders] = useState<OrderWithTickets[]>([]);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Bitte gib eine gültige E-Mail ein.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-ticket-code", {
        body: { email },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Fehler beim Senden des Codes.");
      } else {
        toast.success("Verifizierungscode gesendet!");
        setStep("code");
        setCode(["", "", "", "", "", ""]);
        setCooldown(60);
        const interval = setInterval(() => {
          setCooldown((c) => {
            if (c <= 1) { clearInterval(interval); return 0; }
            return c - 1;
          });
        }, 1000);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    } catch {
      toast.error("Netzwerkfehler. Bitte versuche es erneut.");
    }
    setLoading(false);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all filled
    if (newCode.every((d) => d !== "") && newCode.join("").length === 6) {
      handleVerify(newCode.join(""));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeStr: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-ticket-code", {
        body: { email, code: codeStr },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Ungültiger oder abgelaufener Code.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else if (data?.verified) {
        setOrders(data.orders || []);
        setStep("tickets");
        toast.success("Verifizierung erfolgreich!");
      }
    } catch {
      toast.error("Netzwerkfehler.");
    }
    setLoading(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
  };

  const handleReset = () => {
    setStep("email");
    setOrders([]);
    setCode(["", "", "", "", "", ""]);
  };

  return (
    <PageLayout title="Meine Tickets" subtitle="Finde deine gekauften Tickets">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Step 1: Email */}
        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center py-8 rounded-2xl space-y-4"
                style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--primary) / 0.15)" }}>
                  <Mail className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div className="text-center space-y-1.5 px-6">
                  <h3 className="text-base font-bold" style={{ color: "hsl(0 0% 100%)" }}>E-Mail verifizieren</h3>
                  <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    Gib die E-Mail-Adresse ein, die du beim Kauf verwendet hast. Du erhältst einen Code per E-Mail.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Deine E-Mail-Adresse eingeben..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                  className="flex-1 px-4 py-3 rounded-xl text-sm bg-transparent outline-none"
                  style={{ border: "1px solid hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)" }}
                />
                <motion.button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wide shrink-0 flex items-center gap-2"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Code senden
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Code */}
          {step === "code" && (
            <motion.div
              key="code-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col items-center py-8 rounded-2xl space-y-4"
                style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: "hsl(var(--primary) / 0.15)" }}>
                  <ShieldCheck className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div className="text-center space-y-1.5 px-6">
                  <h3 className="text-base font-bold" style={{ color: "hsl(0 0% 100%)" }}>Code eingeben</h3>
                  <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    Wir haben einen 6-stelligen Code an <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>{email}</span> gesendet.
                  </p>
                </div>
              </div>

              {/* Code input */}
              <div className="flex justify-center gap-2.5">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    onPaste={i === 0 ? handleCodePaste : undefined}
                    className="w-12 h-14 text-center text-xl font-black rounded-xl bg-transparent outline-none transition-all focus:ring-2"
                    style={{
                      border: "1px solid hsl(0 0% 100% / 0.2)",
                      color: "hsl(0 0% 100%)",
                      caretColor: "hsl(var(--primary))",
                      ...(digit ? { borderColor: "hsl(var(--primary))" } : {}),
                    }}
                  />
                ))}
              </div>

              {loading && (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(var(--primary))" }} />
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="text-xs flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  style={{ color: "hsl(0 0% 100% / 0.5)" }}
                >
                  <ArrowLeft className="w-3 h-3" /> Andere E-Mail
                </button>
                <button
                  onClick={handleSendCode}
                  disabled={cooldown > 0 || loading}
                  className="text-xs hover:opacity-80 transition-opacity disabled:opacity-30"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  {cooldown > 0 ? `Erneut senden (${cooldown}s)` : "Code erneut senden"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Tickets */}
          {step === "tickets" && (
            <motion.div
              key="tickets-step"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" style={{ color: "hsl(140 70% 55%)" }} />
                  <span className="text-xs font-bold" style={{ color: "hsl(140 70% 55%)" }}>Verifiziert: {email}</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs hover:opacity-80 transition-opacity"
                  style={{ color: "hsl(0 0% 100% / 0.5)" }}
                >
                  Abmelden
                </button>
              </div>

              {orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
                  style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                  <Ticket className="w-10 h-10 mb-4" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
                  <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                    Keine Tickets für diese E-Mail gefunden.
                  </p>
                </div>
              )}

              {orders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl p-5 space-y-4"
                  style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                >
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
                            {ticket.qr_code}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageLayout>
  );
};

export default MeineTickets;
