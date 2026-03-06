import { PageLayout } from "@/components/PageLayout";
import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Globe, Star, TrendingUp, DollarSign, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import heroCrowd from "@/assets/hero-crowd.jpg";
import crowdWide from "@/assets/crowd-wide.jpg";
import dancerHappy from "@/assets/dancer-happy.jpg";

const stats = [
  { value: "250.000+", label: "Community" },
  { value: "13+", label: "Länder" },
  { value: "100+", label: "Städte" },
  { value: "500+", label: "Events" },
];

const benefits = [
  { icon: Globe, title: "International", desc: "Begleite uns auf unserer Tour durch 13+ Länder. Content aus den aufregendsten Locations Europas." },
  { icon: Star, title: "Exklusiver Zugang", desc: "VIP-Access, Backstage, Meet & Greet – erlebe Events aus einer Perspektive, die anderen verwehrt bleibt." },
  { icon: TrendingUp, title: "Wachstum", desc: "Profitiere von unserer 250.000+ Community. Cross-Promotion, Features und gemeinsame Reichweite." },
  { icon: DollarSign, title: "Monetarisierung", desc: "Langfristige Partnerschaften, bezahlte Kooperationen und exklusive Creator-Deals." },
];

const testimonials = [
  { name: "Lisa M.", handle: "@lisa.creates", text: "Die Stimmung bei GIMME GIMME ist unreal. Mein bester Content entsteht hier! 🔥", initial: "L" },
  { name: "Marco T.", handle: "@marco.films", text: "Professionelles Team, atemberaubende Locations – als Videograf ein Traum. 🎬", initial: "M" },
  { name: "Sophie K.", handle: "@sophie.vibes", text: "Seit 2 Jahren dabei. Die Community wächst ständig – und mein Account mit. 📈", initial: "S" },
];

const faqItems = [
  { q: "Wie viele Follower brauche ich?", a: "Es gibt keine feste Mindestanzahl. Uns ist die Qualität deines Contents und deine Leidenschaft für Musik und Events wichtiger als reine Followerzahlen." },
  { q: "Bekomme ich eine Vergütung?", a: "Je nach Kooperation bieten wir kostenlose Tickets, VIP-Zugang, bezahlte Partnerschaften oder eine Kombination daraus an." },
  { q: "Welche Plattformen sind relevant?", a: "Instagram, TikTok und YouTube sind unsere Hauptplattformen, aber wir sind offen für alle kreativen Kanäle." },
  { q: "Wie schnell bekomme ich eine Antwort?", a: "Wir versuchen, innerhalb von 48 Stunden zu antworten. Bei hohem Aufkommen kann es etwas länger dauern." },
];

const perks = [
  "Exklusiver Zugang zu begehrten Events",
  "Behind-the-scenes Einblicke",
  "Atemberaubende Live-Sets",
  "Festivals und internationale Tour",
  "Netzwerk & Reichweite",
  "Kooperationen & langfristige Partnerschaften",
  "VIP Zugang & Creator Benefits",
];

const followerOptions = ["0 – 1.000", "1.000 – 5.000", "5.000 – 10.000", "10.000 – 50.000", "50.000 – 100.000", "100.000+"];
const categoryOptions = ["Lifestyle", "Musik & Festivals", "Travel", "Fashion", "Comedy", "Dance", "Vlog", "Fotografie", "Videografie", "Sonstiges"];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(0 0% 100% / 0.08)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{q}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "hsl(230 80% 55%)" }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <p className="px-5 pb-4 text-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Influencer = () => {
  const [form, setForm] = useState({
    vorname: "", nachname: "", instagram: "", tiktok: "", youtube: "",
    email: "", telefon: "", stadt: "", follower: "", kategorie: "", nachricht: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast.error("Bitte stimme der Datenschutzerklärung & AGB zu."); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from("support_tickets").insert({
        subject: `Influencer Bewerbung – ${form.vorname} ${form.nachname}`,
        customer_email: form.email,
        customer_name: `${form.vorname} ${form.nachname}`,
        category: "influencer" as const,
        source: "influencer-form",
        metadata: {
          instagram: form.instagram, tiktok: form.tiktok, youtube: form.youtube,
          telefon: form.telefon, stadt: form.stadt, follower: form.follower,
          kategorie: form.kategorie, nachricht: form.nachricht,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Bewerbung erfolgreich gesendet!");
    } catch (err: any) {
      toast.error("Fehler beim Senden: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full px-4 py-3 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
  const inputBg = "bg-[hsl(220,20%,14%)] border border-[hsl(220,15%,20%)]";

  return (
    <div className="min-h-screen" style={{ background: "hsl(220 50% 6%)" }}>
      {/* Hero */}
      <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroCrowd} alt="GIMME GIMME PARTY" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, hsl(220 50% 6% / 0.6), hsl(220 50% 6% / 0.9))" }} />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-4" style={{ color: "hsl(230 80% 55%)" }}>Creator Programm</p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase mb-6" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            Influencer & <span style={{ color: "hsl(230 80% 55%)" }}>Content Creator</span>
          </h1>
          <p className="text-sm md:text-base mb-8" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
            Erlebe exklusive Events, Festivals und unvergessliche Live-Momente.
          </p>
          <a href="#bewerbung" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-105" style={{ background: "hsl(230 80% 50%)", color: "hsl(0 0% 100%)", boxShadow: "0 4px 30px hsl(230 80% 50% / 0.4)" }}>
            <Send className="w-4 h-4" /> Jetzt bewerben
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="py-12 px-4" style={{ background: "hsl(220 50% 8%)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl md:text-4xl font-black" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(230 80% 55%)" }}>{s.value}</p>
              <p className="text-xs uppercase tracking-wider mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3" style={{ color: "hsl(330 80% 55%)" }}>Influencer / Content Creator</p>
            <h2 className="text-2xl md:text-3xl font-black uppercase mb-6" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
              Du bist Content Creator und liebst Musik?
            </h2>
            <p className="text-sm mb-6" style={{ color: "hsl(0 0% 100% / 0.6)", lineHeight: 1.8 }}>
              Wir laden dich gerne zu unseren Events ein, wenn ABBA, Partymusik und unvergessliche Live-Momente dein Blut in Wallungen bringen. Fülle unser Kontakt-Formular aus und profitiere von:
            </p>
            <ul className="space-y-2">
              {perks.map(p => (
                <li key={p} className="flex items-center gap-3 text-sm" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(330 80% 55%)" }} />
                  {p}
                </li>
              ))}
            </ul>
            <p className="text-sm mt-6" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Wir prüfen deine Anfrage und melden uns schnellstmöglich zurück.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden">
            <img src={dancerHappy} alt="Creator bei GIMME GIMME PARTY" className="w-full h-full object-cover aspect-[3/4]" />
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-20 px-4" style={{ background: "hsl(220 50% 8%)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-center" style={{ color: "hsl(330 80% 55%)" }}>Deine Vorteile</p>
          <h2 className="text-2xl md:text-3xl font-black uppercase mb-12 text-center" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            Warum Creator mit uns zusammenarbeiten
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map(b => (
              <div key={b.title} className="rounded-2xl p-6" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: "hsl(330 80% 55% / 0.15)" }}>
                  <b.icon className="w-5 h-5" style={{ color: "hsl(330 80% 55%)" }} />
                </div>
                <h3 className="text-base font-black uppercase mb-2" style={{ color: "hsl(0 0% 100%)" }}>{b.title}</h3>
                <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)", lineHeight: 1.7 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content showcase */}
      <div className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-center" style={{ color: "hsl(330 80% 55%)" }}>Content</p>
          <h2 className="text-2xl md:text-3xl font-black uppercase mb-12 text-center" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            So sieht das aus
          </h2>
          <div className="rounded-2xl overflow-hidden">
            <img src={crowdWide} alt="GIMME GIMME PARTY Crowd" className="w-full h-[300px] md:h-[400px] object-cover" />
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 px-4" style={{ background: "hsl(220 50% 8%)" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-center" style={{ color: "hsl(330 80% 55%)" }}>Creator Stimmen</p>
          <h2 className="text-2xl md:text-3xl font-black uppercase mb-12 text-center" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            Das sagen unsere Creator
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="rounded-2xl p-6" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black" style={{ background: "hsl(330 80% 55% / 0.2)", color: "hsl(330 80% 55%)" }}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{t.name}</p>
                    <p className="text-xs" style={{ color: "hsl(330 80% 55%)" }}>{t.handle}</p>
                  </div>
                </div>
                <p className="text-sm italic" style={{ color: "hsl(0 0% 100% / 0.6)", lineHeight: 1.7 }}>"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black uppercase mb-8 text-center" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            Häufige Fragen
          </h2>
          <div className="space-y-3">
            {faqItems.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div id="bewerbung" className="py-20 px-4" style={{ background: "hsl(220 50% 8%)" }}>
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.3em] mb-3 text-center" style={{ color: "hsl(330 80% 55%)" }}>Bewerbung</p>
          <h2 className="text-2xl md:text-3xl font-black uppercase mb-2 text-center" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            Influencer Bewerbung
          </h2>
          <p className="text-sm text-center mb-10" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Fülle das Formular aus – wir melden uns bei dir.
          </p>

          {sent ? (
            <div className="text-center py-12">
              <h3 className="text-3xl font-black uppercase mb-4" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
                Danke! <span style={{ color: "hsl(330 80% 55%)" }}>🎉</span>
              </h3>
              <p style={{ color: "hsl(0 0% 100% / 0.5)" }}>Wir prüfen deine Bewerbung und melden uns schnellstmöglich.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>Vorname *</label>
                  <input type="text" name="vorname" value={form.vorname} onChange={handleChange} required className={`${inputStyle} ${inputBg}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>Nachname *</label>
                  <input type="text" name="nachname" value={form.nachname} onChange={handleChange} required className={`${inputStyle} ${inputBg}`} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>Instagram</label>
                  <input type="text" name="instagram" value={form.instagram} onChange={handleChange} placeholder="@username" className={`${inputStyle} ${inputBg}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>TikTok</label>
                  <input type="text" name="tiktok" value={form.tiktok} onChange={handleChange} placeholder="@username" className={`${inputStyle} ${inputBg}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>YouTube</label>
                  <input type="text" name="youtube" value={form.youtube} onChange={handleChange} placeholder="Kanalname" className={`${inputStyle} ${inputBg}`} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>E-Mail *</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required className={`${inputStyle} ${inputBg}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>Telefon</label>
                  <input type="tel" name="telefon" value={form.telefon} onChange={handleChange} className={`${inputStyle} ${inputBg}`} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>Stadt *</label>
                <input type="text" name="stadt" value={form.stadt} onChange={handleChange} required className={`${inputStyle} ${inputBg}`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>Followerzahl *</label>
                  <select name="follower" value={form.follower} onChange={handleChange} required className={`${inputStyle} ${inputBg}`} style={{ colorScheme: "dark" }}>
                    <option value="">Bitte wählen</option>
                    {followerOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>Content Kategorie *</label>
                  <select name="kategorie" value={form.kategorie} onChange={handleChange} required className={`${inputStyle} ${inputBg}`} style={{ colorScheme: "dark" }}>
                    <option value="">Bitte wählen</option>
                    {categoryOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "hsl(0 0% 100%)" }}>Warum willst du Teil unserer Community sein? *</label>
                <textarea name="nachricht" value={form.nachricht} onChange={handleChange} required rows={4} className={`${inputStyle} ${inputBg} resize-none`} />
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 accent-primary" />
                <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                  Ich stimme der Verarbeitung meiner Daten gemäß der{" "}
                  <Link to="/datenschutz" className="hover:underline" style={{ color: "hsl(330 80% 55%)" }}>Datenschutzerklärung</Link>
                  {" "}&{" "}
                  <Link to="/agb" className="hover:underline" style={{ color: "hsl(330 80% 55%)" }}>AGB</Link>
                  {" "}zu.
                </span>
              </div>

              <button type="submit" disabled={loading} className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)", boxShadow: "0 4px 20px hsl(330 80% 50% / 0.3)" }}>
                <Send className="w-4 h-4" />
                {loading ? "Wird gesendet..." : "Bewerbung absenden"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="py-8 text-center px-4">
        <a href="#bewerbung" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-105" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)", boxShadow: "0 4px 30px hsl(330 80% 50% / 0.4)" }}>
          <Send className="w-4 h-4" /> Jetzt bewerben
        </a>
      </div>
    </div>
  );
};

export default Influencer;
