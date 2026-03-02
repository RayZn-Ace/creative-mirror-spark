import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";
import flyerImg from "@/assets/project-paderborn-feed.png";
import clubinioImg from "@/assets/clubinio.webp";

/* ─── Ticket Data (from nachtaktivevents.app/eventDetails/6839) ─── */
interface TicketItem {
  id: string;
  name: string;
  description: string;
  price: string;
  soldOut: boolean;
}

interface TicketCategory {
  title: string;
  items: TicketItem[];
}

const ticketData: TicketCategory[] = [
  {
    title: "REGULAR",
    items: [
      { id: "pp-early", name: "EARLY BIRD TICKET", description: "Vergünstigte Eintrittskarte · bevorzugter Gast · Einlass auch bei ausverkauften Events", price: "11,99", soldOut: false },
    ],
  },
  {
    title: "FAST LANE",
    items: [
      { id: "pp-deluxe", name: "EARLY DELUXE TICKET", description: "Alle Inhalte des Early Bird Tickets + VIP-Eingang (kein Anstehen)", price: "16,99", soldOut: false },
    ],
  },
];

const premiumTicket: TicketItem = {
  id: "pp-premium",
  name: "PREMIUM TICKET",
  description: "Alle Inhalte der Eintrittskarte und des Deluxe-Tickets + Premium Stoffband, 5 Knicklichter, 2 süße Shots",
  price: "21,99",
  soldOut: false,
};

/* ─── Info Sections ─── */
const infoSections = [
  {
    title: "Eventinformationen",
    content: `👉 PROJECT PADERBORN - DIE GRÖßTE HAUSPARTY IM CLUB! 🔥

❌ MISSION - HAUSVERBOT! ❌

Jeder von uns träumt von dieser einen Party, worüber jeder redet, an die man sich ein Leben lang zurück erinnert und man mit Stolz sagen kann: „ICH WAR DABEI!"

📅 Sonntag, 05.04.2025
📍 Capitol Paderborn – Leostraße 39, 33098 Paderborn
🕐 Beginn: 22:00 Uhr | VVK: 17:00 Uhr

🍔 GRATIS HAMBURGER
🍺 BEERPONG-KING mit GRATIS BIER
🔥 VERRÜCKTER FLAMMENWERFER
🎉 KONFETTI EXPLOSION, XXL-BALLONS, CO2 EFFECT & vieles Mehr!`,
  },
  {
    title: "Einlassinformationen",
    content: `✅ Der Gast muss sich ausweisen können (Personalausweis oder Reisepass)
✅ Einlass ab 16 Jahren
✅ Unter 18 nur mit gültigem Muttizettel

Das Ticket muss nicht ausgedruckt werden, sondern kann digital am Handy vorgezeigt werden. Bitte beim Vorzeigen des QR Codes diesen "größer zoomen".

Mit einem "sauberen & passendem" Outfit und einem normalen "Auftreten" – freuen wir uns mit dir gemeinsam zu feiern.`,
  },
  {
    title: "Promoter melden",
    content: `Du willst als Promoter für unsere Events arbeiten und dir etwas dazuverdienen?

Melde dich direkt bei uns per Instagram oder WhatsApp!

📱 Instagram: @nachtaktiv.events
💬 WhatsApp: Schreib uns direkt über den Chat-Button unten rechts.`,
  },
  {
    title: "Muttizettel?",
    content: `Noch keine 18? Kein Problem!

Mit einem gültigen Muttizettel kannst du ab 16 Jahren an unseren Events teilnehmen.

📝 Muttizettel ausfüllen: nachtaktivevents.app/muttizettel?event=6839

Drucke den Muttizettel aus und bringe ihn ausgefüllt & unterschrieben mit.`,
  },
];

/* ─── Quantity Selector ─── */
const QuantitySelector = ({ id }: { id: string }) => {
  const [qty, setQty] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      <button className="quantity-btn" onClick={() => setQty(Math.max(0, qty - 1))} aria-label="Menge reduzieren">−</button>
      <input type="number" className="quantity-input" value={qty} readOnly min={0} max={10} />
      <button className="quantity-btn" onClick={() => setQty(Math.min(10, qty + 1))} aria-label="Menge erhöhen">+</button>
    </div>
  );
};

/* ─── Ticket Row (same style as city-madness) ─── */
const TicketRow = ({ item }: { item: TicketItem }) => (
  <div className="ticket-item">
    <div className="hidden sm:flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h4 className={`ticket-title ${item.soldOut ? "sold-out-line" : ""}`}>{item.name}</h4>
        <p className="ticket-description mt-0.5">{item.description}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <div className="ticket-price">
            <span className="text-xs font-normal mr-1">EUR</span>{item.price}
          </div>
          <div className="ticket-tax">inkl. MwSt.</div>
        </div>
        {item.soldOut ? (
          <div className="sold-out-badge w-[88px] text-center">SOLD OUT</div>
        ) : (
          <QuantitySelector id={item.id} />
        )}
      </div>
    </div>
    <div className="sm:hidden space-y-2">
      <div>
        <h4 className={`ticket-title text-xs ${item.soldOut ? "sold-out-line" : ""}`}>{item.name}</h4>
        <p className="ticket-description mt-0.5 text-[10px]">{item.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="ticket-price text-xs">
            <span className="text-[10px] font-normal mr-1">EUR</span>{item.price}
          </div>
          <div className="ticket-tax">inkl. MwSt.</div>
        </div>
        {item.soldOut ? (
          <div className="sold-out-badge text-[10px]">SOLD OUT</div>
        ) : (
          <QuantitySelector id={item.id} />
        )}
      </div>
    </div>
  </div>
);

/* ─── Collapsible ─── */
const InfoAccordion = ({ title, content }: { title: string; content: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="pp-accordion">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3 px-4 text-left">
        <span className="text-xs sm:text-sm font-bold uppercase tracking-wide" style={{ color: "hsl(var(--foreground))" }}>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "hsl(0, 70%, 55%)" }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 text-xs sm:text-sm whitespace-pre-line leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Ticket Widget (exactly like city-madness but with info sections instead of Stage) ─── */
const PPTicketWidget = () => (
  <div className="space-y-4 sm:space-y-6">
    {ticketData.map((category) => (
      <div key={category.title}>
        <h3 className="ticket-category-title mb-2 sm:mb-3 text-xs sm:text-sm">{category.title}</h3>
        <div>
          {category.items.map((item) => (
            <TicketRow key={item.id} item={item} />
          ))}
        </div>
      </div>
    ))}

    {/* Premium section (replaces Stage) */}
    <div>
      <h3 className="ticket-category-title mb-2 sm:mb-3 text-xs sm:text-sm">PREMIUM</h3>
      <div className="stage-badge text-center mb-3 sm:mb-4 p-4 sm:p-6" style={{ background: "linear-gradient(135deg, hsl(0, 50%, 25%) 0%, hsl(0, 40%, 18%) 100%)" }}>
        <div className="text-xl sm:text-2xl font-black uppercase tracking-wider mb-1" style={{ color: "hsl(var(--foreground))" }}>PREMIUM</div>
        <div className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-lg text-base sm:text-lg font-black uppercase tracking-wider" style={{ background: "hsl(0 0% 0% / 0.8)", color: "hsl(var(--foreground))" }}>
          VIP EXPERIENCE
        </div>
      </div>
      <TicketRow item={premiumTicket} />
    </div>

    <motion.button className="cart-button mt-3 sm:mt-4 text-xs sm:text-sm py-3 sm:py-3.5" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
      style={{ background: "hsl(0, 70%, 50%)", border: "none", boxShadow: "0 4px 20px hsl(0 70% 50% / 0.4)" }}>
      IN DEN WARENKORB
    </motion.button>

    {/* Info Accordions */}
    <div className="space-y-2 pt-2">
      {infoSections.map((s) => (
        <InfoAccordion key={s.title} title={s.title} content={s.content} />
      ))}
    </div>
  </div>
);

/* ─── Hero Section (flyer as the main visual, like header+kybba on city-madness) ─── */
const PPHeroSection = () => (
  <motion.div
    className="flex flex-col items-center text-center relative"
    initial={{ opacity: 0, x: -60 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    <img
      src={flyerImg}
      alt="Project Paderborn – Sonntag 05.04 – Capitol Paderborn"
      className="w-[85%] sm:w-[75%] md:w-[90%] lg:w-full max-w-lg mx-auto rounded-2xl"
      style={{ boxShadow: "0 10px 50px hsl(0 70% 30% / 0.5)" }}
    />
  </motion.div>
);

/* ─── Footer (same structure as city-madness) ─── */
const PPFooter = () => (
  <footer className="mt-8 sm:mt-12 pb-6 sm:pb-8">
    <div className="text-center mb-6 sm:mb-8 text-xs sm:text-sm" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
      <p>Fragen, Probleme oder Reservierungsanfragen?</p>
      <p>
        Kontaktiere uns:{" "}
        <a href="mailto:info@nachtaktiv-events.de" className="underline hover:opacity-80 transition-opacity">
          info@nachtaktiv-events.de
        </a>
      </p>
    </div>
    <div className="hidden md:flex items-start justify-between gap-6 lg:gap-8">
      <div className="flex-1">
        <a href="https://clubinio.de/" target="_blank" rel="noopener noreferrer">
          <img src={clubinioImg} alt="Clubinio" className="h-8 lg:h-10 opacity-80 hover:opacity-100 transition-opacity" />
        </a>
        <p className="text-[9px] lg:text-[10px] mt-2 lg:mt-3 max-w-xs lg:max-w-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
          Veranstalter: Nachtaktiv Events. Der Ticketverkauf erfolgt über unsere eigene Plattform.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 lg:gap-6 text-[10px] lg:text-xs">
        <a href="/impressum" className="footer-link">Impressum</a>
        <a href="/datenschutz" className="footer-link">Datenschutzerklärung</a>
        <a href="/agb" className="footer-link">AGB</a>
      </div>
    </div>
    <div className="md:hidden text-center space-y-3">
      <a href="https://clubinio.de/" target="_blank" rel="noopener noreferrer">
        <img src={clubinioImg} alt="Clubinio" className="h-7 mx-auto opacity-80" />
      </a>
      <p className="text-[9px] px-4 leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
        Veranstalter: Nachtaktiv Events. Der Ticketverkauf erfolgt über unsere eigene Plattform.
      </p>
      <div className="flex justify-center gap-4 text-[10px]">
        <a href="/impressum" className="footer-link">Impressum</a>
        <a href="/datenschutz" className="footer-link">Datenschutz</a>
        <a href="/agb" className="footer-link">AGB</a>
      </div>
    </div>
  </footer>
);

/* ─── Page Layout (1:1 like Index.tsx / city-madness) ─── */
const ProjectPaderborn = () => {
  return (
    <div className="min-h-screen pp-bg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Desktop: two columns */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 lg:gap-8 items-start">
          <PPHeroSection />
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <PPTicketWidget />
          </motion.div>
        </div>

        {/* Mobile: stacked */}
        <div className="md:hidden space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <PPHeroSection />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <PPTicketWidget />
          </motion.div>
        </div>

        <PPFooter />
      </div>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/49123456789"
        target="_blank"
        rel="noopener noreferrer"
        className="pp-whatsapp-btn"
        aria-label="WhatsApp Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
};

export default ProjectPaderborn;
