import { PageLayout } from "@/components/PageLayout";
import { Megaphone, MessageCircle, Instagram, CheckCircle } from "lucide-react";

const benefits = [
  "Provision pro verkauftem Ticket",
  "Gratis Eintritt zu allen Events",
  "Exklusive Promoter-Partys",
  "Flexible Arbeitszeiten",
  "Nettes Team & gute Stimmung",
];

const Promoter = () => (
  <PageLayout title="Promoter werden" subtitle="Verdiene Geld mit Partys">
    <div className="space-y-8">
      <p className="text-base sm:text-lg" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
        Du liebst Partys und hast ein großes Netzwerk? Dann werde Teil unseres Promoter-Teams und verdiene dir nebenbei etwas dazu – während du das tust, was du am liebsten machst!
      </p>

      <div>
        <h2 className="text-lg font-bold uppercase mb-4" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Deine Vorteile
        </h2>
        <div className="space-y-3">
          {benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "hsl(0 70% 55%)" }} />
              <span className="text-sm sm:text-base" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{benefit}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-4" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          So funktioniert's
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: "01", title: "Melde dich", desc: "Schreib uns per WhatsApp oder Instagram" },
            { step: "02", title: "Erhalte deinen Code", desc: "Du bekommst einen persönlichen Promoter-Link" },
            { step: "03", title: "Verdiene mit", desc: "Für jeden Verkauf über deinen Link gibt's Provision" },
          ].map((s) => (
            <div
              key={s.step}
              className="p-5 rounded-2xl"
              style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
            >
              <div className="text-2xl font-black mb-2" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 70% 50% / 0.5)" }}>
                {s.step}
              </div>
              <div className="text-sm font-bold mb-1" style={{ color: "hsl(0 0% 100%)" }}>{s.title}</div>
              <div className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <a
          href="https://wa.me/49123456789?text=Hi%2C%20ich%20m%C3%B6chte%20Promoter%20werden!"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.03]"
          style={{ background: "hsl(142 70% 45%)", color: "white" }}
        >
          <MessageCircle className="w-4 h-4" /> Per WhatsApp bewerben
        </a>
        <a
          href="https://instagram.com/nachtaktiv.events"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.03]"
          style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", color: "white" }}
        >
          <Instagram className="w-4 h-4" /> Per Instagram bewerben
        </a>
      </div>
    </div>
  </PageLayout>
);

export default Promoter;
