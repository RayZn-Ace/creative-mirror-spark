import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Ticket, Sparkles } from "lucide-react";
import { ANNIVERSARY_TITLE, ANNIVERSARY_SUBTITLE, ANNIVERSARY_BADGE } from "@/lib/anniversary";
import anniversaryHeroAsset from "@/assets/anniversary-hero.jpg.asset.json";

const anniversaryHero = anniversaryHeroAsset.url;

/**
 * Jubiläums-Startbild.
 * Zum Austauschen einfach das Bild oben (anniversaryHero) ersetzen.
 */
const confetti = Array.from({ length: 18 }, (_, i) => i);

const AnniversaryHero = ({ ticketLabel }: { ticketLabel: string }) => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0">
      <img
        src={anniversaryHero}
        alt="2 Jahre Nightlife Generation – Jubiläums-Party"
        className="w-full h-full object-cover object-top scale-105"
        loading="eager"
      />
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="absolute inset-0 bg-background/50" />
      <div className="anniv-glow absolute inset-0" />
    </div>

    {/* Konfetti */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {confetti.map((i) => (
        <motion.span
          key={i}
          className="anniv-confetti"
          style={{ left: `${(i * 5.6) % 100}%` }}
          initial={{ y: "-10%", opacity: 0, rotate: 0 }}
          animate={{ y: "110%", opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: 7 + (i % 5), repeat: Infinity, delay: i * 0.45, ease: "linear" }}
        />
      ))}
    </div>

    <div className="relative z-10 container text-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full anniv-badge text-[11px] sm:text-xs font-black uppercase tracking-[0.25em]"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {ANNIVERSARY_BADGE}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl leading-none mb-4"
      >
        <span className="anniv-title">{ANNIVERSARY_TITLE}</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.25 }}
        className="text-lg md:text-xl text-foreground/85 max-w-2xl mx-auto mb-10"
      >
        {ANNIVERSARY_SUBTITLE}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <Link
          to="/termine"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg animate-pulse-glow hover:opacity-90 transition-all"
        >
          <Ticket className="w-5 h-5" /> {ticketLabel}
        </Link>
      </motion.div>
    </div>
  </section>
);

export default AnniversaryHero;
