import { useState, useRef } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle } from "lucide-react";

const TicketUmbuchung = () => {
  const [form, setForm] = useState({
    vorname: "", nachname: "", handynummer: "", email: "",
    anzahl: "", ticketshop: "", neues_datum: "", neue_location: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast.error("Bitte stimme der Datenschutzerklärung zu."); return; }
    setSending(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        subject: `Ticket Umbuchung – ${form.vorname} ${form.nachname}`,
        customer_email: form.email,
        customer_name: `${form.vorname} ${form.nachname}`,
        category: "support" as const,
        source: "rebooking-form",
        metadata: {
          phone: form.handynummer,
          ticket_count: form.anzahl,
          ticketshop: form.ticketshop,
          new_date: form.neues_datum,
          new_location: form.neue_location,
          has_attachment: !!file,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Umbuchungsanfrage erfolgreich gesendet!");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Senden");
    }
    setSending(false);
  };

  const inputStyle: React.CSSProperties = {
    background: "hsl(220 20% 97%)",
    border: "1px solid hsl(220 15% 88%)",
    color: "hsl(220 20% 15%)",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "15px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    color: "hsl(220 10% 35%)",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "6px",
    display: "block",
  };

  if (sent) {
    return (
      <PageLayout title="" subtitle="">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle className="w-16 h-16 mb-4" style={{ color: "hsl(142 70% 40%)" }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: "hsl(220 20% 15%)" }}>Anfrage gesendet!</h2>
          <p className="text-sm" style={{ color: "hsl(220 10% 45%)" }}>
            Wir bearbeiten deine Umbuchung so schnell wie möglich und melden uns bei dir.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="" subtitle="">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-4xl">🔁</span>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider" style={{ color: "hsl(220 20% 15%)", fontFamily: "'Orbitron', sans-serif" }}>
              TICKET <span style={{ color: "hsl(220 60% 50%)" }}>UMBUCHUNG</span>
            </h1>
          </div>
          <p className="text-sm" style={{ color: "hsl(220 10% 45%)" }}>
            5€ Bearbeitungsgebühr pro Ticket. Bitte fülle alle Felder aus.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label style={labelStyle}>Vorname</label>
            <input value={form.vorname} onChange={set("vorname")} required style={inputStyle} className="focus:border-blue-500" />
          </div>
          <div>
            <label style={labelStyle}>Nachname</label>
            <input value={form.nachname} onChange={set("nachname")} required style={inputStyle} className="focus:border-blue-500" />
          </div>
          <div>
            <label style={labelStyle}>Handynummer</label>
            <input value={form.handynummer} onChange={set("handynummer")} type="tel" required style={inputStyle} className="focus:border-blue-500" />
          </div>
          <div>
            <label style={labelStyle}>E-Mail</label>
            <input value={form.email} onChange={set("email")} type="email" required style={inputStyle} className="focus:border-blue-500" />
          </div>
          <div>
            <label style={labelStyle}>Anzahl Tickets</label>
            <input value={form.anzahl} onChange={set("anzahl")} type="number" min="1" required style={inputStyle} className="focus:border-blue-500" />
          </div>
          <div>
            <label style={labelStyle}>Ticketshop</label>
            <input value={form.ticketshop} onChange={set("ticketshop")} placeholder="z.B. Eventim, Ticket.io, partyticket.app" style={inputStyle} className="focus:border-blue-500" />
          </div>
          <div>
            <label style={labelStyle}>Neues Datum</label>
            <input value={form.neues_datum} onChange={set("neues_datum")} type="date" required style={inputStyle} className="focus:border-blue-500" />
          </div>
          <div>
            <label style={labelStyle}>Neue Location</label>
            <input value={form.neue_location} onChange={set("neue_location")} required style={inputStyle} className="focus:border-blue-500" />
          </div>
          <div>
            <label style={labelStyle}>Ticket hochladen (PDF/JPG/PNG)</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:cursor-pointer"
              style={{ color: "hsl(220 10% 45%)", background: "hsl(220 20% 97%)", border: "1px solid hsl(220 15% 88%)", borderRadius: "8px", padding: "8px" }}
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-blue-500"
            />
            <span className="text-xs leading-relaxed" style={{ color: "hsl(220 10% 45%)" }}>
              Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
              <a href="/datenschutz" className="underline" style={{ color: "hsl(220 60% 50%)" }}>Datenschutzerklärung</a>{" "}
              &{" "}
              <a href="/agb" className="underline" style={{ color: "hsl(220 60% 50%)" }}>AGB</a>{" "}
              zu.
            </span>
          </label>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "hsl(220 60% 50%)", color: "hsl(0 0% 100%)" }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Absenden
          </button>
        </form>
      </div>
    </PageLayout>
  );
};

export default TicketUmbuchung;
