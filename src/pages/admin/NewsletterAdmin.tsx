import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Send, Users, MapPin, CheckCircle, AlertCircle, Loader2, X, Filter, Eye,
} from "lucide-react";
import { toast } from "sonner";

type Order = {
  email: string;
  name: string | null;
  status: string;
  event_id: string | null;
};

type EventInfo = { id: string; title: string; city: string | null };

const NewsletterAdmin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ sent: number; failed: number } | null>(null);

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [fromName, setFromName] = useState("GIMME Events");
  const [fromEmail, setFromEmail] = useState("newsletter@gimmegimmeparty.com");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [onlyPaid, setOnlyPaid] = useState(true);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [ordersRes, eventsRes] = await Promise.all([
        supabase.from("orders").select("email, name, status, event_id"),
        supabase.from("events").select("id, title, city"),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (eventsRes.data) setEvents(eventsRes.data as EventInfo[]);
      setLoading(false);
    };
    load();
  }, []);

  const eventMap = useMemo(() => {
    const m = new Map<string, EventInfo>();
    events.forEach((e) => m.set(e.id, e));
    return m;
  }, [events]);

  const allCities = useMemo(() => {
    const cities = new Set<string>();
    events.forEach((e) => { if (e.city) cities.add(e.city); });
    return Array.from(cities).sort();
  }, [events]);

  const recipients = useMemo(() => {
    const emailMap = new Map<string, string | null>();
    orders.forEach((o) => {
      if (onlyPaid && o.status !== "paid") return;
      if (cityFilter !== "all") {
        const eventCity = o.event_id ? eventMap.get(o.event_id)?.city : null;
        if (eventCity !== cityFilter) return;
      }
      const email = o.email.toLowerCase().trim();
      if (!emailMap.has(email)) emailMap.set(email, o.name);
    });
    return Array.from(emailMap.entries()).map(([email, name]) => ({ email, name }));
  }, [orders, onlyPaid, cityFilter, eventMap]);

  const buildHtml = () => {
    const paragraphs = content.split("\n").filter(Boolean).map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#333;">${p}</p>`).join("");
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#e91e8c,#ff6b35);padding:32px 40px;">
<h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">${subject}</h1>
</td></tr>
<tr><td style="padding:32px 40px;">
${paragraphs}
</td></tr>
<tr><td style="padding:24px 40px;background:#fafafa;border-top:1px solid #eee;">
<p style="margin:0;font-size:12px;color:#999;">Du erhältst diese E-Mail, weil du bei uns ein Ticket gekauft hast.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Bitte Betreff und Inhalt ausfüllen");
      return;
    }
    if (recipients.length === 0) {
      toast.error("Keine Empfänger gefunden");
      return;
    }

    setSending(true);
    setSent(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter", {
        body: {
          subject: subject.trim(),
          html: buildHtml(),
          recipients: recipients.map((r) => r.email),
          fromName: fromName.trim(),
          fromEmail: fromEmail.trim(),
        },
      });

      if (error) throw error;

      setSent({ sent: data.sent, failed: data.failed });
      if (data.sent > 0) toast.success(`${data.sent} E-Mails erfolgreich versendet!`);
      if (data.failed > 0) toast.error(`${data.failed} E-Mails fehlgeschlagen`);
    } catch (err: any) {
      console.error("Newsletter send error:", err);
      toast.error("Fehler beim Versenden: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setSending(false);
    }
  };

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
        Newsletter
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Compose */}
        <div className="lg:col-span-2 space-y-4">
          {/* From */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
              Absender
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Name</label>
                <input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "hsl(0 0% 100% / 0.3)" }}>E-Mail</label>
                <input
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                />
              </div>
            </div>
            <p className="text-[10px]" style={{ color: "hsl(45 80% 55%)" }}>
              ⚠️ Nutze deine verifizierte Resend-Domain oder <code>onboarding@resend.dev</code> zum Testen.
            </p>
          </div>

          {/* Subject */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
          >
            <label className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Betreff</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="z.B. Neues Event: Summer Bash 2025 🎉"
              className="w-full px-3 py-2.5 rounded-lg text-sm"
              style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            />
          </div>

          {/* Content */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
          >
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Inhalt</label>
              <button
                onClick={() => setPreview(!preview)}
                className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-lg transition-all"
                style={{
                  background: preview ? "hsl(215 90% 55% / 0.15)" : "hsl(0 0% 100% / 0.06)",
                  color: preview ? "hsl(215 90% 55%)" : "hsl(0 0% 100% / 0.4)",
                }}
              >
                <Eye className="w-3 h-3" />
                Vorschau
              </button>
            </div>

            {preview ? (
              <div
                className="rounded-lg overflow-hidden"
                style={{ background: "#f4f4f4", minHeight: 200 }}
                dangerouslySetInnerHTML={{ __html: buildHtml() }}
              />
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={"Schreib hier deinen Newsletter-Text...\n\nJede Zeile wird zu einem eigenen Absatz."}
                rows={10}
                className="w-full px-3 py-2.5 rounded-lg text-sm resize-y"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              />
            )}
          </div>

          {/* Send button */}
          <motion.button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !content.trim() || recipients.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, hsl(330 80% 55%), hsl(20 90% 55%))",
              color: "hsl(0 0% 100%)",
            }}
            whileHover={{ scale: sending ? 1 : 1.01 }}
            whileTap={{ scale: sending ? 1 : 0.98 }}
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Wird gesendet...</>
            ) : (
              <><Send className="w-4 h-4" /> Newsletter versenden ({recipients.length})</>
            )}
          </motion.button>

          {/* Result */}
          <AnimatePresence>
            {sent && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl p-4 flex items-center gap-3"
                style={{
                  background: sent.failed === 0 ? "hsl(150 60% 40% / 0.12)" : "hsl(45 80% 55% / 0.12)",
                  border: `1px solid ${sent.failed === 0 ? "hsl(150 60% 40% / 0.3)" : "hsl(45 80% 55% / 0.3)"}`,
                }}
              >
                {sent.failed === 0 ? (
                  <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "hsl(150 60% 40%)" }} />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "hsl(45 80% 55%)" }} />
                )}
                <div>
                  <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>
                    {sent.sent} gesendet{sent.failed > 0 ? `, ${sent.failed} fehlgeschlagen` : ""}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Recipients sidebar */}
        <div className="space-y-4">
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                Empfänger
              </span>
            </div>

            <div
              className="text-center py-4 rounded-xl"
              style={{ background: "hsl(330 80% 55% / 0.08)" }}
            >
              <span className="text-3xl font-black" style={{ color: "hsl(330 80% 55%)" }}>
                {recipients.length}
              </span>
              <span className="text-xs block mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                eindeutige E-Mails
              </span>
            </div>

            {/* Filters */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                  Filter
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyPaid}
                  onChange={(e) => setOnlyPaid(e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                  Nur bezahlte Kunden
                </span>
              </label>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                  Stadt
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                >
                  <option value="all" style={{ background: "hsl(220 50% 10%)" }}>Alle Städte</option>
                  {allCities.map((c) => (
                    <option key={c} value={c} style={{ background: "hsl(220 50% 10%)" }}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Recipient preview */}
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
              Empfänger-Vorschau ({Math.min(recipients.length, 20)}/{recipients.length})
            </span>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {recipients.slice(0, 20).map((r) => (
                <div
                  key={r.email}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px]"
                  style={{ background: "hsl(0 0% 100% / 0.03)" }}
                >
                  <Mail className="w-3 h-3 shrink-0" style={{ color: "hsl(215 90% 55% / 0.5)" }} />
                  <span className="truncate" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                    {r.name ? `${r.name} – ` : ""}{r.email}
                  </span>
                </div>
              ))}
              {recipients.length > 20 && (
                <p className="text-[10px] text-center pt-1" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                  +{recipients.length - 20} weitere
                </p>
              )}
              {recipients.length === 0 && (
                <p className="text-[10px] text-center py-3" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                  Keine Empfänger mit diesen Filtern
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterAdmin;
