import { useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Briefcase, Star, Users, Music, Camera, Mic, Video, Megaphone } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const bereiche = [
  { label: "Promoter", icon: Megaphone },
  { label: "Crew Auf-/Abbau", icon: Users },
  { label: "Tänzer", icon: Star },
  { label: "DJ", icon: Music },
  { label: "Sänger", icon: Mic },
  { label: "Videograf", icon: Video },
  { label: "Fotograf", icon: Camera },
  { label: "Sonstiges", icon: Briefcase },
];

const Jobs = () => {
  const [form, setForm] = useState({
    name: "", alter: "", instagram: "", stadt: "", email: "", telefon: "", bereich: "", kommentar: "",
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
        alter: form.alter, instagram: form.instagram, stadt: form.stadt,
        telefon: form.telefon, bereich: form.bereich, kommentar: form.kommentar,
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error("Fehler beim Senden. Bitte versuche es erneut.");
    } else {
      setSubmitted(true);
      // Send email copy to support (fire & forget)
      supabase.functions.invoke("send-job-application-email", {
        body: form,
      }).catch((err) => console.error("Email notification failed:", err));
    }
  };

  if (submitted) {
    return (
      <PageLayout title="" subtitle="">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center py-20"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 mx-auto mb-6 flex items-center justify-center">
            <Send className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Bewerbung gesendet!</h2>
          <p className="text-muted-foreground">Vielen Dank für dein Interesse! Wir melden uns so schnell wie möglich bei dir.</p>
        </motion.div>
      </PageLayout>
    );
  }

  const inputClasses = "w-full px-4 py-3 rounded-xl text-sm bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all";

  return (
    <PageLayout title="" subtitle="">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1
            className="text-4xl md:text-6xl font-black uppercase mb-4 text-foreground"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}
          >
            Jobs & <span className="text-primary">Karriere</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
            Wir suchen europaweit Leute in allen Bereichen. Bewirb dich jetzt und werde Teil unseres Teams!
          </p>
        </motion.div>

        {/* Bereich Selection as Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <label className="block text-sm font-semibold text-foreground mb-3">Bereich auswählen *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bereiche.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setForm((f) => ({ ...f, bereich: label }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-sm font-medium ${
                  form.bereich === label
                    ? "bg-primary/15 border-primary text-primary ring-1 ring-primary/30"
                    : "bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Name *</label>
              <input value={form.name} onChange={set("name")} required className={inputClasses} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Alter</label>
              <input value={form.alter} onChange={set("alter")} type="number" className={inputClasses} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Instagram</label>
              <input value={form.instagram} onChange={set("instagram")} placeholder="@deinprofil" className={inputClasses} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Stadt</label>
              <input value={form.stadt} onChange={set("stadt")} className={inputClasses} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-Mail *</label>
              <input value={form.email} onChange={set("email")} type="email" required className={inputClasses} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Handynummer</label>
              <input value={form.telefon} onChange={set("telefon")} type="tel" className={inputClasses} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Kommentar</label>
            <textarea value={form.kommentar} onChange={set("kommentar")} rows={4} className={`${inputClasses} resize-none`} />
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={agb} onChange={(e) => setAgb(e.target.checked)} className="mt-1 accent-primary w-4 h-4" />
            <span className="text-xs leading-relaxed text-muted-foreground">
              Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
              <Link to="/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</Link>
              {" & "}
              <Link to="/agb" className="text-primary hover:underline">AGB</Link> zu.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !agb || !form.bereich}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-[1.02] disabled:opacity-50 bg-primary text-primary-foreground"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Bewerbung absenden
          </button>
        </motion.form>
      </div>
    </PageLayout>
  );
};

export default Jobs;
