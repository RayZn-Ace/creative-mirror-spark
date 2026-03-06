import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Link } from "react-router-dom";

const bereiche = [
  "Crew Auf-/Abbau",
  "Tänzer",
  "DJ",
  "Sänger",
  "Videograf",
  "Fotograf",
  "Sonstiges",
];

const inputStyle: React.CSSProperties = {
  background: "hsl(220 40% 13%)",
  border: "1px solid hsl(0 0% 100% / 0.1)",
  color: "hsl(0 0% 100%)",
  borderRadius: "12px",
  padding: "12px 16px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  color: "hsl(0 0% 100% / 0.7)",
  fontSize: "14px",
  fontWeight: 600,
  marginBottom: "6px",
  display: "block",
};

const Jobs = () => {
  const [form, setForm] = useState({
    name: "",
    alter: "",
    instagram: "",
    stadt: "",
    email: "",
    telefon: "",
    bereich: "",
    kommentar: "",
  });
  const [agb, setAgb] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.bereich || !agb) {
      toast.error("Bitte fülle alle Pflichtfelder aus.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("support_tickets").insert({
      subject: `Bewerbung – ${form.name}, ${form.bereich}`,
      customer_email: form.email,
      customer_name: form.name,
      category: "job" as any,
      source: "jobs-form",
      metadata: {
        alter: form.alter,
        instagram: form.instagram,
        stadt: form.stadt,
        telefon: form.telefon,
        bereich: form.bereich,
        kommentar: form.kommentar,
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error("Fehler beim Senden. Bitte versuche es erneut.");
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <PageLayout title="Jobs & Karriere" subtitle="Wir suchen europaweit Leute in allen Bereichen. Bewirb dich jetzt!">
        <div className="max-w-lg mx-auto text-center py-16">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: "hsl(140 60% 45% / 0.15)" }}
          >
            <Send className="w-7 h-7" style={{ color: "hsl(140 60% 45%)" }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "hsl(0 0% 100%)" }}>
            Bewerbung gesendet!
          </h2>
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Vielen Dank für dein Interesse! Wir melden uns so schnell wie möglich bei dir.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Jobs & Karriere" subtitle="Wir suchen europaweit Leute in allen Bereichen. Bewirb dich jetzt!">
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
        {/* Name */}
        <div>
          <label style={labelStyle}>Name</label>
          <input value={form.name} onChange={set("name")} required style={inputStyle} className="focus:border-blue-500" />
        </div>

        {/* Alter */}
        <div>
          <label style={labelStyle}>Alter</label>
          <input value={form.alter} onChange={set("alter")} type="number" style={inputStyle} className="focus:border-blue-500" />
        </div>

        {/* Instagram */}
        <div>
          <label style={labelStyle}>Instagram</label>
          <input value={form.instagram} onChange={set("instagram")} placeholder="@deinprofil" style={inputStyle} className="focus:border-blue-500" />
        </div>

        {/* Stadt */}
        <div>
          <label style={labelStyle}>Stadt</label>
          <input value={form.stadt} onChange={set("stadt")} style={inputStyle} className="focus:border-blue-500" />
        </div>

        {/* E-Mail */}
        <div>
          <label style={labelStyle}>E-Mail</label>
          <input value={form.email} onChange={set("email")} type="email" required style={inputStyle} className="focus:border-blue-500" />
        </div>

        {/* Handynummer */}
        <div>
          <label style={labelStyle}>Handynummer</label>
          <input value={form.telefon} onChange={set("telefon")} type="tel" style={inputStyle} className="focus:border-blue-500" />
        </div>

        {/* Bereich */}
        <div>
          <label style={labelStyle}>Bereich</label>
          <select
            value={form.bereich}
            onChange={set("bereich")}
            required
            style={{
              ...inputStyle,
              colorScheme: "dark",
              appearance: "auto" as any,
            }}
            className="focus:border-blue-500"
          >
            <option value="">Bitte wählen...</option>
            {bereiche.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Kommentar */}
        <div>
          <label style={labelStyle}>Kommentar</label>
          <textarea
            value={form.kommentar}
            onChange={set("kommentar")}
            rows={4}
            style={{ ...inputStyle, resize: "vertical" }}
            className="focus:border-blue-500"
          />
        </div>

        {/* AGB Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agb}
            onChange={(e) => setAgb(e.target.checked)}
            className="mt-1 accent-blue-500"
            style={{ width: "16px", height: "16px" }}
          />
          <span className="text-xs leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
            <Link to="/datenschutz" className="underline" style={{ color: "hsl(230 80% 55%)" }}>Datenschutzerklärung</Link>
            {" & "}
            <Link to="/agb" className="underline" style={{ color: "hsl(230 80% 55%)" }}>AGB</Link> zu.
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !agb}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "hsl(230 80% 55%)", color: "hsl(0 0% 100%)" }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Absenden
        </button>
      </form>
    </PageLayout>
  );
};

export default Jobs;
