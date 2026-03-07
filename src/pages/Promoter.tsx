import { PageLayout } from "@/components/PageLayout";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Promoter = () => {
  const [form, setForm] = useState({
    stadtname: "",
    locationname: "",
    wunschdatum: "",
    kapazitaet: "",
    handynummer: "",
    email: "",
    kommentar: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Bitte stimme der Datenschutzerklärung & AGB zu.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        subject: `Buchungsanfrage – ${form.locationname}, ${form.stadtname}`,
        customer_email: form.email,
        customer_name: form.locationname,
        category: "location" as const,
        source: "booking-form",
        metadata: {
          stadtname: form.stadtname,
          locationname: form.locationname,
          wunschdatum: form.wunschdatum,
          kapazitaet: form.kapazitaet,
          handynummer: form.handynummer,
          kommentar: form.kommentar,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Anfrage erfolgreich gesendet!");
    } catch (err: any) {
      toast.error("Fehler beim Senden: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <PageLayout title="" subtitle="">
        <div className="max-w-xl mx-auto text-center py-16">
          <h1
            className="text-4xl md:text-5xl font-black uppercase mb-4"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            Danke! <span className="text-primary">🎉</span>
          </h1>
          <p className="text-muted-foreground">
            Wir haben deine Anfrage erhalten und melden uns mit einem Angebot bei dir.
          </p>
        </div>
      </PageLayout>
    );
  }

  const inputStyle =
    "w-full px-4 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
  const inputBg = "bg-[hsl(220,15%,93%)] border border-[hsl(220,15%,85%)]";

  return (
    <PageLayout title="" subtitle="">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl md:text-6xl font-black uppercase mb-4"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            UNS <span className="text-primary">BUCHEN!</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Du möchtest uns bei dir in deiner Location / Stadt buchen? Gib uns alle Infos – wir melden uns mit Angebot.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Stadtname</label>
            <input
              type="text"
              name="stadtname"
              value={form.stadtname}
              onChange={handleChange}
              required
              className={`${inputStyle} ${inputBg}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Locationname</label>
            <input
              type="text"
              name="locationname"
              value={form.locationname}
              onChange={handleChange}
              required
              className={`${inputStyle} ${inputBg}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Wunschdatum</label>
            <input
              type="date"
              name="wunschdatum"
              value={form.wunschdatum}
              onChange={handleChange}
              className={`${inputStyle} ${inputBg}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Kapazität</label>
            <input
              type="text"
              name="kapazitaet"
              value={form.kapazitaet}
              onChange={handleChange}
              className={`${inputStyle} ${inputBg}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Handynummer</label>
            <input
              type="tel"
              name="handynummer"
              value={form.handynummer}
              onChange={handleChange}
              required
              className={`${inputStyle} ${inputBg}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">E-Mail</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className={`${inputStyle} ${inputBg}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Kommentar</label>
            <textarea
              name="kommentar"
              value={form.kommentar}
              onChange={handleChange}
              rows={4}
              className={`${inputStyle} ${inputBg} resize-none`}
            />
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 accent-primary"
            />
            <span className="text-xs text-muted-foreground">
              Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
              <Link to="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</Link>
              {" "}&{" "}
              <Link to="/agb" className="text-primary hover:underline">AGB</Link>
              {" "}zu.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.02] disabled:opacity-50 bg-primary text-primary-foreground"
          >
            {loading ? "Wird gesendet..." : "Absenden"}
          </button>
        </form>
      </div>
    </PageLayout>
  );
};

export default Promoter;
