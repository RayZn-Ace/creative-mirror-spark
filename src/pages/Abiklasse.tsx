import { PageLayout } from "@/components/PageLayout";
import { motion } from "framer-motion";
import { MessageCircle, Instagram, PartyPopper, Users, Music, Star } from "lucide-react";

const Abiklasse = () => (
  <PageLayout title="Abiklasse auffüllen" subtitle="Euer Abiball oder Abistreich mit uns">
    <div className="space-y-8">
      <p className="text-base sm:text-lg" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
        Ihr plant euren <strong style={{ color: "hsl(0 0% 100%)" }}>Abiball, Abistreich oder eine Stufenparty</strong>? Wir organisieren für euch eine unvergessliche Nacht – komplett mit Sound, Licht, Konfetti und allem was dazugehört!
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[
          { icon: Music, title: "DJ & Sound", desc: "Professionelles DJ-Setup mit PA-Anlage" },
          { icon: PartyPopper, title: "Effekte", desc: "CO2, Konfetti, Flammenwerfer & mehr" },
          { icon: Users, title: "Organisation", desc: "Wir kümmern uns um alles" },
          { icon: Star, title: "VIP-Feeling", desc: "Exklusive Extras für eure Stufe" },
        ].map((item) => (
          <div
            key={item.title}
            className="p-4 sm:p-5 rounded-2xl"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
          >
            <item.icon className="w-5 h-5 mb-2" style={{ color: "hsl(0 70% 55%)" }} />
            <div className="text-sm font-bold mb-1" style={{ color: "hsl(0 0% 100%)" }}>{item.title}</div>
            <div className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-3" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          So läuft's ab
        </h2>
        <p>
          Schreibt uns einfach per WhatsApp oder Instagram mit euren Vorstellungen (Datum, Location, Anzahl Leute, Budget). Wir erstellen euch ein individuelles Angebot – unverbindlich und kostenlos!
        </p>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <a
          href="https://wa.me/491622537300?text=Hi%2C%20wir%20planen%20unseren%20Abiball!"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.03]"
          style={{ background: "hsl(142 70% 45%)", color: "white" }}
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp Anfrage
        </a>
        <a
          href="https://instagram.com/gimmegimmeparty"
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.03]"
          style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", color: "white" }}
        >
          <Instagram className="w-4 h-4" /> Instagram DM
        </a>
      </div>
    </div>
  </PageLayout>
);

export default Abiklasse;
