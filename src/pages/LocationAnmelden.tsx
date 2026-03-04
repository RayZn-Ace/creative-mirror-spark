import { PageLayout } from "@/components/PageLayout";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send } from "lucide-react";

const LocationAnmelden = () => {
  const [form, setForm] = useState({
    name: "",
    locationname: "",
    stadt: "",
    telefon: "",
    email: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        subject: `Location Anmeldung – ${form.locationname}, ${form.stadt}`,
        customer_email: form.email,
        customer_name: form.name,
        category: "location" as const,
        source: "location-form",
        metadata: {
          kontaktperson: form.name,
          locationname: form.locationname,
          stadt: form.stadt,
          telefon: form.telefon,
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
            Wir haben deine Anfrage erhalten und melden uns schnellstmöglich bei dir.
          </p>
        </div>
      </PageLayout>
    );
  }

  const inputStyle =
    "w-full px-4 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
  const inputBg = "bg-[hsl(220,20%,14%)] border border-[hsl(220,15%,20%)]";

  return (
    <PageLayout title="" subtitle="">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl md:text-6xl font-black uppercase mb-4"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            LOCATION <span className="text-primary">ANMELDEN</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Du meinst, deine Location eignet sich perfekt für unsere Tour? Dann lass uns kennenlernen!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Dein Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className={`${inputStyle} ${inputBg}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Name der Location</label>
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
            <label className="block text-sm font-medium text-foreground mb-1.5">Stadt der Location</label>
            <input
              type="text"
              name="stadt"
              value={form.stadt}
              onChange={handleChange}
              required
              className={`${inputStyle} ${inputBg}`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Telefonnummer</label>
            <input
              type="tel"
              name="telefon"
              value={form.telefon}
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
            className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.02] disabled:opacity-50 bg-primary text-primary-foreground flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? "Wird gesendet..." : "Absenden"}
          </button>
        </form>
      </div>
    </PageLayout>
  );
};

export default LocationAnmelden;
