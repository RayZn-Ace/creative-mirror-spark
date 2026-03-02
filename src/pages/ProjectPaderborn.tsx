import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle } from "lucide-react";
import flyerImg from "@/assets/project-paderborn-feed.png";

/* ─── Ticket Data ─── */
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
      { id: "pp-early", name: "EARLY BIRD TICKET", description: "Eintrittspreis", price: "12,90", soldOut: false },
      { id: "pp-normal", name: "NORMAL TICKET", description: "Eintrittspreis", price: "16,90", soldOut: false },
    ],
  },
  {
    title: "FAST LANE",
    items: [
      { id: "pp-early-fast", name: "EARLY BIRD FAST LANE", description: "Eintrittspreis inkl. bevorzugtem Einlass", price: "19,90", soldOut: false },
      { id: "pp-normal-fast", name: "NORMAL TICKET FAST LANE", description: "Eintrittspreis inkl. bevorzugtem Einlass", price: "24,90", soldOut: false },
    ],
  },
];

/* ─── Collapsible Info Data ─── */
const infoSections = [
  {
    title: "Eventinformationen",
    content: `📅 Sonntag, 05.04.2025\n📍 Capitol Paderborn\n🕐 Einlass ab 20:00 Uhr\n🎵 Best of HipHop, RnB, Deutschrap & Afrobeats\n🔞 Ab 16 Jahren (mit Muttizettel ab 16)`,
  },
  {
    title: "Einlassinformationen",
    content: `✅ Gültiger Lichtbildausweis erforderlich (Personalausweis oder Reisepass)\n✅ Unter 18 nur mit gültigem Muttizettel\n✅ Fast Lane Tickets: Separater Eingang, kein Anstehen\n❌ Keine Glasflaschen, Waffen oder illegale Substanzen`,
  },
  {
    title: "Promoter melden",
    content: `Du willst als Promoter für unsere Events arbeiten und dir etwas dazuverdienen?\n\nMelde dich direkt bei uns per WhatsApp oder E-Mail:\n📧 info@nachtaktiv-events.de\n📱 WhatsApp: +49 123 456789`,
  },
  {
    title: "Muttizettel?",
    content: `Bist du unter 18? Kein Problem!\n\nMit einem gültigen Muttizettel (U18-Partyzettel) kannst du ab 16 Jahren an unseren Events teilnehmen.\n\nDen Muttizettel findest du zum Download auf unserer Website oder du fragst uns per WhatsApp.`,
  },
];

/* ─── Quantity Selector ─── */
const QuantitySelector = ({ id }: { id: string }) => {
  const [qty, setQty] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      <button className="pp-qty-btn" onClick={() => setQty(Math.max(0, qty - 1))} aria-label="Menge reduzieren">−</button>
      <input type="number" className="pp-qty-input" value={qty} readOnly min={0} max={10} />
      <button className="pp-qty-btn" onClick={() => setQty(Math.min(10, qty + 1))} aria-label="Menge erhöhen">+</button>
    </div>
  );
};

/* ─── Ticket Row ─── */
const TicketRow = ({ item }: { item: TicketItem }) => (
  <div className="pp-ticket-item">
    {/* Desktop */}
    <div className="hidden sm:flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h4 className={`pp-ticket-title ${item.soldOut ? "line-through opacity-50" : ""}`}>{item.name}</h4>
        <p className="pp-ticket-desc mt-0.5">{item.description}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <div className="pp-ticket-price">
            <span className="text-xs font-normal mr-1">EUR</span>{item.price}
          </div>
          <div className="pp-ticket-tax">inkl. 7% MwSt.</div>
        </div>
        {item.soldOut ? (
          <div className="pp-sold-out w-[88px] text-center">SOLD OUT</div>
        ) : (
          <QuantitySelector id={item.id} />
        )}
      </div>
    </div>
    {/* Mobile */}
    <div className="sm:hidden space-y-2">
      <div>
        <h4 className={`pp-ticket-title text-xs ${item.soldOut ? "line-through opacity-50" : ""}`}>{item.name}</h4>
        <p className="pp-ticket-desc mt-0.5 text-[10px]">{item.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="pp-ticket-price text-xs">
            <span className="text-[10px] font-normal mr-1">EUR</span>{item.price}
          </div>
          <div className="pp-ticket-tax">inkl. 7% MwSt.</div>
        </div>
        {item.soldOut ? (
          <div className="pp-sold-out text-[10px]">SOLD OUT</div>
        ) : (
          <QuantitySelector id={item.id} />
        )}
      </div>
    </div>
  </div>
);

/* ─── Collapsible Section ─── */
const InfoAccordion = ({ title, content }: { title: string; content: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="pp-accordion">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-4 text-left"
      >
        <span className="text-sm sm:text-base font-bold uppercase tracking-wide text-white">{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-5 h-5 text-red-500" />
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
            <div className="px-4 pb-4 text-sm text-white/80 whitespace-pre-line leading-relaxed">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Main Page ─── */
const ProjectPaderborn = () => {
  return (
    <div className="min-h-screen pp-bg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Desktop: 2 columns */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 lg:gap-10 items-start">
          {/* Left: Flyer */}
          <motion.div
            initial={{ opacity: 0, x: -60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex justify-center"
          >
            <img
              src={flyerImg}
              alt="Project Paderborn – Sonntag 05.04 – Capitol Paderborn"
              className="w-full max-w-md rounded-2xl shadow-2xl"
            />
          </motion.div>

          {/* Right: Tickets + Info */}
          <motion.div
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="space-y-5"
          >
            <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-wider text-white">
              Project <span className="text-red-600">Paderborn</span>
            </h1>
            <p className="text-white/70 text-sm">📅 Sonntag, 05.04.2025 &nbsp;|&nbsp; 📍 Capitol Paderborn</p>

            {/* Ticket Categories */}
            {ticketData.map((cat) => (
              <div key={cat.title}>
                <h3 className="pp-category-title mb-2">{cat.title}</h3>
                {cat.items.map((item) => (
                  <TicketRow key={item.id} item={item} />
                ))}
              </div>
            ))}

            {/* Cart Button */}
            <motion.button className="pp-cart-btn" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              IN DEN WARENKORB
            </motion.button>

            {/* Info Accordions */}
            <div className="space-y-2 pt-2">
              {infoSections.map((s) => (
                <InfoAccordion key={s.title} title={s.title} content={s.content} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Mobile: stacked */}
        <div className="md:hidden space-y-5">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <img
              src={flyerImg}
              alt="Project Paderborn"
              className="w-[85%] max-w-sm rounded-2xl shadow-2xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <h1 className="text-xl font-black uppercase tracking-wider text-white text-center">
              Project <span className="text-red-600">Paderborn</span>
            </h1>
            <p className="text-white/70 text-xs text-center">📅 Sonntag, 05.04.2025 · 📍 Capitol Paderborn</p>

            {ticketData.map((cat) => (
              <div key={cat.title}>
                <h3 className="pp-category-title mb-2 text-xs">{cat.title}</h3>
                {cat.items.map((item) => (
                  <TicketRow key={item.id} item={item} />
                ))}
              </div>
            ))}

            <motion.button className="pp-cart-btn text-xs py-3" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              IN DEN WARENKORB
            </motion.button>

            <div className="space-y-2">
              {infoSections.map((s) => (
                <InfoAccordion key={s.title} title={s.title} content={s.content} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer className="mt-10 pb-6 text-center">
          <div className="flex justify-center gap-4 text-[10px] sm:text-xs">
            <a href="/impressum" className="text-white/50 hover:text-white transition-colors">Impressum</a>
            <a href="/datenschutz" className="text-white/50 hover:text-white transition-colors">Datenschutz</a>
            <a href="/agb" className="text-white/50 hover:text-white transition-colors">AGB</a>
          </div>
          <p className="text-[9px] text-white/40 mt-3 max-w-md mx-auto">
            Veranstalter: Nachtaktiv Events. Alle Rechte vorbehalten.
          </p>
        </footer>
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
