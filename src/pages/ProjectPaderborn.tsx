import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Instagram, Timer, MapPin, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import headerImg from "@/assets/pp-header.png";

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
      { id: "pp-early", name: "EARLY BIRD TICKET", description: "Vergünstigte Eintrittskarte · bevorzugter Gast · Einlass auch bei ausverkauften Events", price: "11,99", soldOut: false },
    ],
  },
  {
    title: "FAST LANE",
    items: [
      { id: "pp-deluxe", name: "EARLY DELUXE TICKET", description: "Alle Inhalte des Early Bird Tickets + VIP-Eingang (kein Anstehen)", price: "16,99", soldOut: false },
    ],
  },
  {
    title: "PREMIUM",
    items: [
      { id: "pp-premium", name: "PREMIUM TICKET", description: "Alle Inhalte der Eintrittskarte und des Deluxe-Tickets + Premium Stoffband, 5 Knicklichter, 2 süße Shots", price: "21,99", soldOut: false },
    ],
  },
];

/* ─── Info Sections ─── */
const infoSections = [
  {
    id: "eventinfo",
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
    id: "einlass",
    title: "Einlassinformationen",
    content: `✅ Der Gast muss sich ausweisen können (Personalausweis oder Reisepass)
✅ Einlass ab 16 Jahren
✅ Unter 18 nur mit gültigem Muttizettel

Das Ticket muss nicht ausgedruckt werden, sondern kann digital am Handy vorgezeigt werden. Bitte beim Vorzeigen des QR Codes diesen "größer zoomen".

Mit einem "sauberen & passendem" Outfit und einem normalen "Auftreten" – freuen wir uns mit dir gemeinsam zu feiern.`,
  },
  {
    id: "promoter",
    title: "Promoter melden",
    content: "promoter", // special handling
  },
  {
    id: "muttizettel",
    title: "Muttizettel",
    content: "muttizettel", // special handling
  },
];

/* ─── Instagram handle (default fallback) ─── */
const instagramHandle = "@nachtaktiv.events";
const instagramUrl = `https://instagram.com/${instagramHandle.replace("@", "")}`;
const whatsappNumber = "49123456789";

/* ─── Cart Timer Hook ─── */
const CART_TIMER_SECONDS = 600; // 10 minutes

const useCartTimer = () => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive || timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          setIsActive(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startTimer = useCallback(() => {
    setTimeLeft(CART_TIMER_SECONDS);
    setIsActive(true);
  }, []);

  const formatTime = () => {
    if (timeLeft === null) return "";
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return { timeLeft, isActive, startTimer, formatTime };
};

/* ─── Quantity Selector ─── */
const QuantitySelector = ({ qty, onQtyChange }: { qty: number; onQtyChange: (v: number) => void }) => (
  <div className="flex items-center gap-1.5">
    <button className="pp-qty-btn" onClick={() => onQtyChange(Math.max(0, qty - 1))} aria-label="Menge reduzieren">−</button>
    <input type="number" className="pp-qty-input" value={qty} readOnly min={0} max={10} />
    <button className="pp-qty-btn" onClick={() => onQtyChange(Math.min(10, qty + 1))} aria-label="Menge erhöhen">+</button>
  </div>
);

/* ─── Ticket Row ─── */
const TicketRow = ({ item, qty, onQtyChange }: { item: TicketItem; qty: number; onQtyChange: (v: number) => void }) => (
  <div className="pp-ticket-item">
    <div className="hidden sm:flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h4 className={`pp-ticket-title text-base ${item.soldOut ? "sold-out-line" : ""}`}>{item.name}</h4>
        <p className="pp-ticket-desc mt-0.5 text-sm">{item.description}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right">
          <div className="pp-ticket-price text-base">
            <span className="text-xs font-normal mr-1">EUR</span>{item.price}
          </div>
          <div className="pp-ticket-tax text-xs">inkl. MwSt.</div>
        </div>
        {item.soldOut ? (
          <div className="pp-sold-out w-[88px] text-center">SOLD OUT</div>
        ) : (
          <QuantitySelector qty={qty} onQtyChange={onQtyChange} />
        )}
      </div>
    </div>
    <div className="sm:hidden space-y-2">
      <div>
        <h4 className={`pp-ticket-title text-sm ${item.soldOut ? "sold-out-line" : ""}`}>{item.name}</h4>
        <p className="pp-ticket-desc mt-0.5 text-xs">{item.description}</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="pp-ticket-price text-sm">
            <span className="text-[10px] font-normal mr-1">EUR</span>{item.price}
          </div>
          <div className="pp-ticket-tax">inkl. MwSt.</div>
        </div>
        {item.soldOut ? (
          <div className="pp-sold-out text-[10px]">SOLD OUT</div>
        ) : (
          <QuantitySelector qty={qty} onQtyChange={onQtyChange} />
        )}
      </div>
    </div>
  </div>
);

/* ─── Muttizettel Modal Form ─── */
const MutttizettelForm = ({ onClose }: { onClose: () => void }) => {
  const [formData, setFormData] = useState({
    childName: "",
    childBirthdate: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: send to backend
    alert("Muttizettel wurde eingereicht! Du erhältst eine Bestätigung per E-Mail.");
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-2xl p-6 sm:p-8 z-10"
        style={{ background: "hsl(0 10% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-black uppercase tracking-wide mb-1" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Muttizettel
        </h3>
        <p className="text-sm mb-6" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
          Für Gäste unter 18 Jahren. Bitte vollständig ausfüllen.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Name des Kindes</label>
            <input
              type="text" required maxLength={100}
              value={formData.childName} onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
              className="pp-form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Geburtsdatum</label>
            <input
              type="date" required
              value={formData.childBirthdate} onChange={(e) => setFormData({ ...formData, childBirthdate: e.target.value })}
              className="pp-form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Name Erziehungsberechtigte/r</label>
            <input
              type="text" required maxLength={100}
              value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              className="pp-form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Telefon Erziehungsberechtigte/r</label>
            <input
              type="tel" required maxLength={20}
              value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
              className="pp-form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase mb-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>E-Mail Erziehungsberechtigte/r</label>
            <input
              type="email" required maxLength={255}
              value={formData.parentEmail} onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
              className="pp-form-input"
            />
          </div>
          <motion.button
            type="submit"
            className="pp-cart-btn mt-2 text-sm"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            MUTTIZETTEL EINREICHEN
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

/* ─── Collapsible with special handling ─── */
const InfoAccordion = ({ id, title, content, onMuttizettelOpen }: { id: string; title: string; content: string; onMuttizettelOpen: () => void }) => {
  const [open, setOpen] = useState(false);

  const isPromoter = id === "promoter";
  const isMuttizettel = id === "muttizettel";

  const handleClick = () => {
    if (isMuttizettel) {
      onMuttizettelOpen();
      return;
    }
    setOpen(!open);
  };

  return (
    <div className="pp-accordion">
      <button onClick={handleClick} className="w-full flex items-center justify-between py-3.5 px-4 sm:px-5 text-left">
        <span className="text-sm sm:text-base font-bold uppercase tracking-wide" style={{ color: "hsl(var(--foreground))" }}>{title}</span>
        {!isMuttizettel && (
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "hsl(0, 70%, 55%)" }} />
          </motion.div>
        )}
        {isMuttizettel && (
          <span className="text-xs font-bold uppercase px-3 py-1 rounded-lg" style={{ background: "hsl(0, 70%, 50%)", color: "white" }}>
            Öffnen
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && !isMuttizettel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
              {isPromoter ? (
                <>
                  <p className="text-sm sm:text-base whitespace-pre-line leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Du willst als Promoter für unsere Events arbeiten und dir etwas dazuverdienen?{"\n\n"}Melde dich direkt bei uns!
                  </p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hi, ich möchte Promoter werden!")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all"
                      style={{ background: "hsl(142, 70%, 45%)", color: "white" }}
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                    <a
                      href={instagramUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all"
                      style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", color: "white" }}
                    >
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                  </div>
                </>
              ) : (
                <p className="text-sm sm:text-base whitespace-pre-line leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {content}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Weitere Events ─── */
const upcomingEvents = [
  { id: 1, name: "CITY MADNESS", date: "19. April 2025", location: "Bielefeld", image: "" },
  { id: 2, name: "NEON NIGHTS", date: "03. Mai 2025", location: "Paderborn", image: "" },
  { id: 3, name: "SUMMER BASH", date: "17. Mai 2025", location: "Dortmund", image: "" },
];

/* ─── Ticket Widget ─── */
const PPTicketWidget = () => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [showMuttizettel, setShowMuttizettel] = useState(false);
  const { timeLeft, isActive, startTimer, formatTime } = useCartTimer();

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleQtyChange = (id: string, val: number) => {
    const prev = quantities[id] || 0;
    setQuantities((q) => ({ ...q, [id]: val }));
    if (val > prev && !isActive) {
      startTimer();
    }
  };

  const handleApplyDiscount = () => {
    if (discountCode.trim().length > 0) {
      setDiscountApplied(true);
      // TODO: validate code against backend
    }
  };

  return (
    <>
      <AnimatePresence>
        {showMuttizettel && <MutttizettelForm onClose={() => setShowMuttizettel(false)} />}
      </AnimatePresence>

      <div className="space-y-5 sm:space-y-7">
        {/* Cart Timer */}
        <AnimatePresence>
          {isActive && timeLeft !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold"
              style={{
                background: timeLeft < 60 ? "hsl(0 70% 50% / 0.2)" : "hsl(0 0% 100% / 0.08)",
                border: `1px solid ${timeLeft < 60 ? "hsl(0 70% 50% / 0.4)" : "hsl(0 0% 100% / 0.12)"}`,
                color: timeLeft < 60 ? "hsl(0 70% 60%)" : "hsl(0 0% 100% / 0.9)",
              }}
            >
              <Timer className="w-4 h-4" />
              <span>Reserviert für: {formatTime()}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {ticketData.map((category) => (
          <div key={category.title}>
            <h3 className="pp-category-title mb-2 sm:mb-3 text-sm sm:text-base">{category.title}</h3>
            <div>
              {category.items.map((item) => (
                <TicketRow
                  key={item.id}
                  item={item}
                  qty={quantities[item.id] || 0}
                  onQtyChange={(v) => handleQtyChange(item.id, v)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Rabattcode */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Rabattcode eingeben"
            value={discountCode}
            onChange={(e) => { setDiscountCode(e.target.value); setDiscountApplied(false); }}
            maxLength={30}
            className="pp-form-input flex-1 text-sm"
          />
          <motion.button
            onClick={handleApplyDiscount}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide shrink-0"
            style={{ background: "hsl(0, 70%, 50%)", color: "white" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Einlösen
          </motion.button>
        </div>
        {discountApplied && (
          <p className="text-xs" style={{ color: "hsl(142, 70%, 55%)" }}>
            ✓ Code wird beim Checkout geprüft
          </p>
        )}

        {/* Cart Button */}
        <motion.button
          className="pp-cart-btn mt-1 text-sm sm:text-base py-3.5 sm:py-4"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          IN DEN WARENKORB {totalItems > 0 && `(${totalItems})`}
        </motion.button>

        {/* Instagram – subtle button, below cart */}
        <a
          href={instagramUrl}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all hover:opacity-100"
          style={{ color: "hsl(0 0% 100% / 0.6)", border: "1px solid hsl(0 0% 100% / 0.12)", background: "hsl(0 0% 100% / 0.04)" }}
        >
          <Instagram className="w-3.5 h-3.5" />
          {instagramHandle}
        </a>

        {/* Info Accordions */}
        <div className="space-y-2 pt-2">
          {infoSections.map((s) => (
            <InfoAccordion
              key={s.id}
              id={s.id}
              title={s.title}
              content={s.content}
              onMuttizettelOpen={() => setShowMuttizettel(true)}
            />
          ))}
        </div>

        {/* Weitere Events Button */}
        <Link
          to="/#events"
          className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.02]"
          style={{ background: "hsl(0 0% 100% / 0.08)", border: "1px solid hsl(0 0% 100% / 0.12)", color: "hsl(0 0% 100% / 0.8)" }}
        >
          Weitere Events entdecken <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  );
};

/* ─── Hero Section ─── */
const PPHeroSection = () => (
  <motion.div
    className="flex flex-col items-center text-center relative"
    initial={{ opacity: 0, x: -60 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    {/* Titel testweise ausgeblendet */}

    <p className="text-base sm:text-lg md:text-base lg:text-lg font-bold uppercase tracking-[0.25em] mt-2 sm:mt-3" style={{ color: "hsl(var(--foreground) / 0.8)" }}>
      IM CAPITOL
    </p>

    <div className="flex items-center justify-center gap-4 sm:gap-8 mt-3 sm:mt-4 text-sm sm:text-base font-bold uppercase tracking-wider" style={{ color: "hsl(var(--foreground) / 0.9)" }}>
      <span>05. APRIL</span>
      <span>AB 22 UHR</span>
      <span>PADERBORN</span>
    </div>

    <img
      src={headerImg}
      alt="Project Paderborn"
      className="w-full md:w-[120%] max-w-none mx-auto mt-8 sm:mt-12 -mb-4"
    />
  </motion.div>
);

/* ─── Weitere Events ─── */
const WeitereEvents = () => (
  <motion.section
    className="mt-12 sm:mt-16"
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
  >
    <h2 className="pp-neon-title text-2xl sm:text-3xl font-black uppercase text-center mb-6 sm:mb-8">
      Weitere Events in deiner Nähe
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
      {upcomingEvents.map((event) => (
        <motion.div
          key={event.id}
          className="rounded-2xl overflow-hidden cursor-pointer"
          style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
          whileHover={{ scale: 1.02, borderColor: "hsl(0 70% 50% / 0.4)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="h-32 sm:h-40 flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(0 50% 20%) 0%, hsl(0 30% 10%) 100%)" }}>
            <span className="text-2xl sm:text-3xl font-black uppercase tracking-wide" style={{ color: "hsl(0 0% 100% / 0.3)", fontFamily: "'Orbitron', sans-serif" }}>
              {event.name}
            </span>
          </div>
          <div className="p-4 sm:p-5">
            <h3 className="text-base sm:text-lg font-bold uppercase" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
              {event.name}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
              <span>{event.date}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </motion.section>
);

/* ─── Footer ─── */
const PPFooter = () => (
  <footer className="mt-8 sm:mt-12 pb-6 sm:pb-8">
    <div className="text-center mb-6 sm:mb-8 text-sm sm:text-base" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
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
        <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="text-xs lg:text-sm font-medium opacity-80 hover:opacity-100 transition-opacity" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
          powered by smea
        </a>
        <p className="text-[10px] lg:text-xs mt-2 lg:mt-3 max-w-xs lg:max-w-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
          Veranstalter: Nachtaktiv Events. Der Ticketverkauf erfolgt über unsere eigene Plattform.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 lg:gap-6 text-xs lg:text-sm">
        <a href="/impressum" className="footer-link">Impressum</a>
        <a href="/datenschutz" className="footer-link">Datenschutzerklärung</a>
        <a href="/agb" className="footer-link">AGB</a>
      </div>
    </div>
    <div className="md:hidden text-center space-y-3">
      <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="text-xs font-medium opacity-80 hover:opacity-100 transition-opacity inline-block" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
        powered by smea
      </a>
      <p className="text-[10px] px-4 leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
        Veranstalter: Nachtaktiv Events. Der Ticketverkauf erfolgt über unsere eigene Plattform.
      </p>
      <div className="flex justify-center gap-4 text-xs">
        <a href="/impressum" className="footer-link">Impressum</a>
        <a href="/datenschutz" className="footer-link">Datenschutz</a>
        <a href="/agb" className="footer-link">AGB</a>
      </div>
    </div>
  </footer>
);

/* ─── Page Layout ─── */
const ProjectPaderborn = () => {
  return (
    <div className="min-h-screen pp-bg">
      {/* Confetti & Smoke Particles */}
      <div className="pp-confetti-container">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={`c${i}`} className={`pp-confetti pp-confetti--${i + 1}`} />
        ))}
        <div className="pp-smoke pp-smoke--1" />
        <div className="pp-smoke pp-smoke--2" />
        <div className="pp-smoke pp-smoke--3" />
        <div className="pp-smoke pp-smoke--4" />
        <div className="pp-smoke pp-smoke--5" />
      </div>
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

        <WeitereEvents />
        <PPFooter />
      </div>

      {/* WhatsApp Floating Button */}
      <a
        href={`https://wa.me/${whatsappNumber}`}
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
