import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Instagram, Timer, MapPin, X, ArrowRight, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import headerImg from "@/assets/gimme-event-header.jpg";

/* ─── Event Data ─── */
interface EventData {
  id: string;
  date: string;
  dateShort: string;
  weekday: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  openAir: boolean;
  soldOut: boolean;
  ticketData: TicketCategory[];
  infoSections: { id: string; title: string; content: string }[];
}

interface TicketItem {
  id: string;
  name: string;
  description: string;
  price: string;
  soldOut: boolean;
  badge?: string;
  comingSoon?: boolean;
}

interface TicketCategory {
  title: string;
  items: TicketItem[];
}

const defaultTickets: TicketCategory[] = [
  {
    title: "REGULAR",
    items: [
      { id: "earlybird", name: "EARLY BIRD TICKET", description: "", price: "29,99", soldOut: true },
      { id: "lastchance", name: "LAST CHANCE TICKET", description: "Vergünstigter Eintritt · Einlass auch bei ausverkauften Events", price: "36,99", soldOut: false, badge: "FAST AUSVERKAUFT" },
      { id: "lastminute", name: "LAST MINUTE TICKET", description: "", price: "", soldOut: false, badge: "COMING SOON", comingSoon: true },
    ],
  },
  {
    title: "DELUXE",
    items: [
      { id: "deluxe", name: "DELUXE TICKET", description: "Gültiges Ticket + Einlass ohne Anstehen über den VIP-Eingang", price: "41,99", soldOut: false, badge: "84% schon weg" },
    ],
  },
  {
    title: "FAN",
    items: [
      { id: "fan", name: "FAN TICKET", description: "VIP-Eingang + Exklusives Stoff-Sammelband + LED-Haarkranz", price: "46,99", soldOut: false, badge: "FANLIEBLING" },
    ],
  },
];

const openAirTickets: TicketCategory[] = [
  {
    title: "REGULAR",
    items: [
      { id: "earlybird", name: "EARLY BIRD TICKET", description: "", price: "24,99", soldOut: true },
      { id: "lastchance", name: "LAST CHANCE TICKET", description: "Vergünstigter Eintritt · Einlass auch bei ausverkauften Events", price: "31,99", soldOut: false, badge: "FAST AUSVERKAUFT" },
      { id: "lastminute", name: "LAST MINUTE TICKET", description: "", price: "", soldOut: false, badge: "COMING SOON", comingSoon: true },
    ],
  },
  {
    title: "DELUXE",
    items: [
      { id: "deluxe", name: "DELUXE TICKET", description: "Gültiges Ticket + Einlass ohne Anstehen über den VIP-Eingang", price: "36,99", soldOut: false, badge: "84% schon weg" },
    ],
  },
  {
    title: "FAN",
    items: [
      { id: "fan", name: "FAN TICKET", description: "VIP-Eingang + Exklusives Stoff-Sammelband + LED-Haarkranz", price: "41,99", soldOut: false, badge: "FANLIEBLING" },
    ],
  },
];

const makeInfoSections = (event: EventData) => [
  {
    id: "eventinfo",
    title: "Eventinformationen",
    content: `🎉 MAMMA MIA PARTY – DAS FANKONZERT! 🎶

Bei der Mamma Mia Party feiern wir die größten Songs von ABBA – und zwar gemeinsam mit EUCH! 🎤 ✨

Von „Dancing Queen" über „Mamma Mia" bis „Waterloo" – wir spielen alle Kult-Hits live vom DJ-Pult zum Mitsingen, Tanzen und Feiern.

📅 ${event.weekday}, ${event.date}
📍 ${event.venue} – ${event.address}
🕐 Beginn: ${event.time} Uhr

🪩 DRESSCODE:
Glitzer, Mamma Mia oder ABBA-Bezug! (Kein Muss, aber gerne gesehen)`,
  },
  {
    id: "einlass",
    title: "Einlassinformationen",
    content: `✅ Einlass ab 18 Jahren – Ausnahmen nur nach Absprache mit der Location.

✅ Wir starten mit der Show, sobald der größte Teil des Einlasses durch ist. Bis dahin laufen bekannte Partysongs zum Mitsingen.

✅ Der Einlass dauert in der Regel nicht länger als 30 Minuten.

✅ Dein Ticket brauchst du nicht auszudrucken – es reicht digital auf deinem Handy.`,
  },
  {
    id: "promoter",
    title: "Promoter melden",
    content: "promoter",
  },
  {
    id: "whatsapp",
    title: "WhatsApp Community",
    content: `👑 LUST AUF FREIKARTEN?

Komm in unsere kostenlose WhatsApp-Gruppe für weitere Infos & Aktionen:

👉 Hier klicken: http://bit.ly/mammamiacommunity`,
  },
];

const events: EventData[] = [
  {
    id: "388",
    date: "10.04.2025",
    dateShort: "10.04",
    weekday: "Freitag",
    time: "20:00",
    venue: "Baggi / Osho",
    address: "Raschpl. 7L, 30161 Hannover",
    city: "Hannover",
    openAir: false,
    soldOut: false,
    ticketData: defaultTickets,
    infoSections: [],
  },
  {
    id: "440",
    date: "19.06.2025",
    dateShort: "19.06",
    weekday: "Donnerstag",
    time: "20:00",
    venue: "Azzurro Beach",
    address: "Am Blauen See 119, 30823 Garbsen",
    city: "Garbsen",
    openAir: true,
    soldOut: false,
    ticketData: openAirTickets,
    infoSections: [],
  },
  {
    id: "410",
    date: "21.08.2025",
    dateShort: "21.08",
    weekday: "Donnerstag",
    time: "20:00",
    venue: "Baggi / Osho",
    address: "Raschpl. 7L, 30161 Hannover",
    city: "Hannover",
    openAir: false,
    soldOut: false,
    ticketData: defaultTickets,
    infoSections: [],
  },
  {
    id: "411",
    date: "23.10.2025",
    dateShort: "23.10",
    weekday: "Donnerstag",
    time: "20:00",
    venue: "Baggi / Osho",
    address: "Raschpl. 7L, 30161 Hannover",
    city: "Hannover",
    openAir: false,
    soldOut: true,
    ticketData: defaultTickets,
    infoSections: [],
  },
  {
    id: "412",
    date: "04.12.2025",
    dateShort: "04.12",
    weekday: "Donnerstag",
    time: "20:00",
    venue: "Baggi / Osho",
    address: "Raschpl. 7L, 30161 Hannover",
    city: "Hannover",
    openAir: false,
    soldOut: false,
    ticketData: defaultTickets,
    infoSections: [],
  },
];

// Fill infoSections dynamically
events.forEach((e) => { e.infoSections = makeInfoSections(e); });

/* ─── Instagram handle ─── */
const instagramHandle = "@gimmegimmeparty";
const instagramUrl = "https://instagram.com/gimmegimmeparty";
const whatsappNumber = "49123456789";

/* ─── Cart Timer Hook ─── */
const CART_TIMER_SECONDS = 600;

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

/* ─── Event Date Tiles ─── */
const EventDateTiles = ({ events, selectedId, onSelect }: { events: EventData[]; selectedId: string; onSelect: (id: string) => void }) => (
  <div className="flex gap-2 sm:gap-3 pb-2 scrollbar-hide justify-center flex-wrap overflow-visible">
    {events.map((event) => {
      const isSelected = event.id === selectedId;
      return (
        <motion.button
          key={event.id}
          onClick={() => onSelect(event.id)}
          className="relative flex flex-col items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-center shrink-0 transition-all"
          style={{
            background: isSelected ? "hsl(0 0% 100% / 0.3)" : event.soldOut ? "hsl(0 0% 100% / 0.05)" : "hsl(0 0% 100% / 0.1)",
            border: `2px solid ${isSelected ? "hsl(0 0% 100% / 0.7)" : "hsl(0 0% 100% / 0.2)"}`,
            color: "hsl(0 0% 100%)",
            minWidth: "72px",
            opacity: event.soldOut ? 0.6 : 1,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {event.soldOut && (
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase whitespace-nowrap"
              style={{ background: "hsl(0 70% 50%)", color: "hsl(0 0% 100%)" }}>
              Ausverkauft
            </span>
          )}
          {event.openAir && !event.soldOut && (
            <span className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase"
              style={{ background: "hsl(45 100% 50%)", color: "hsl(0 0% 10%)" }}>
              <Sun className="w-2.5 h-2.5" /> Open Air
            </span>
          )}
          {event.openAir && event.soldOut && (
            <span className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase"
              style={{ background: "hsl(45 100% 50%)", color: "hsl(0 0% 10%)" }}>
              <Sun className="w-2.5 h-2.5" />
            </span>
          )}
          <span className="text-base sm:text-lg font-black leading-none">{event.dateShort.split(".")[0]}</span>
          <span className="text-[10px] sm:text-xs font-medium uppercase opacity-80 mt-0.5">
            {["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"][parseInt(event.dateShort.split(".")[1])]}
          </span>
          <span className="text-[9px] sm:text-[10px] opacity-60 mt-0.5">{event.venue.split("/")[0].trim()}</span>
        </motion.button>
      );
    })}
  </div>
);

/* ─── Quantity Selector ─── */
const QuantitySelector = ({ qty, onQtyChange }: { qty: number; onQtyChange: (v: number) => void }) => (
  <div className="flex items-center gap-1.5">
    <button className="pp-qty-btn" onClick={() => onQtyChange(Math.max(0, qty - 1))} aria-label="Menge reduzieren">−</button>
    <input type="number" className="pp-qty-input" value={qty} readOnly min={0} max={10} />
    <button className="pp-qty-btn" onClick={() => onQtyChange(Math.min(10, qty + 1))} aria-label="Menge erhöhen">+</button>
  </div>
);

/* ─── Ticket Row ─── */
const TicketRow = ({ item, qty, onQtyChange }: { item: TicketItem; qty: number; onQtyChange: (v: number) => void }) => {
  if (item.comingSoon) {
    return (
      <div className="pp-ticket-item" style={{ opacity: 0.5 }}>
        <div className="flex items-center justify-between gap-4">
          <h4 className="pp-ticket-title text-sm sm:text-base">{item.name}</h4>
          <span className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shrink-0"
            style={{ background: "hsl(0 0% 100% / 0.15)", color: "hsl(0 0% 100% / 0.7)", border: "1px dashed hsl(0 0% 100% / 0.3)" }}>
            COMING SOON
          </span>
        </div>
      </div>
    );
  }

  if (item.soldOut) {
    return (
      <div className="pp-ticket-item relative overflow-hidden" style={{ opacity: 0.55 }}>
        {/* Diagonal SOLD OUT stripe */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div
            className="px-12 py-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] rotate-[-8deg]"
            style={{
              background: "hsl(0 70% 50%)",
              color: "hsl(0 0% 100%)",
              boxShadow: "0 0 20px hsl(0 70% 50% / 0.4)",
            }}
          >
            SOLD OUT
          </div>
        </div>
        {/* Desktop */}
        <div className="hidden sm:flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="pp-ticket-title text-base line-through decoration-2" style={{ textDecorationColor: "hsl(0 70% 50% / 0.6)" }}>{item.name}</h4>
            <p className="pp-ticket-desc mt-0.5 text-sm">{item.description}</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="pp-ticket-price text-base line-through decoration-1" style={{ textDecorationColor: "hsl(0 0% 100% / 0.4)" }}>
                <span className="text-xs font-normal mr-1">EUR</span>{item.price}
              </div>
              <div className="pp-ticket-tax text-xs">inkl. MwSt.</div>
            </div>
          </div>
        </div>
        {/* Mobile */}
        <div className="sm:hidden space-y-2">
          <div>
            <h4 className="pp-ticket-title text-sm line-through decoration-2" style={{ textDecorationColor: "hsl(0 70% 50% / 0.6)" }}>{item.name}</h4>
            <p className="pp-ticket-desc mt-0.5 text-xs">{item.description}</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="pp-ticket-price text-sm line-through decoration-1" style={{ textDecorationColor: "hsl(0 0% 100% / 0.4)" }}>
                <span className="text-[10px] font-normal mr-1">EUR</span>{item.price}
              </div>
              <div className="pp-ticket-tax">inkl. MwSt.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-ticket-item">
      <div className="hidden sm:flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="pp-ticket-title text-base">{item.name}</h4>
            {item.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)" }}>
                {item.badge}
              </span>
            )}
          </div>
          <p className="pp-ticket-desc mt-0.5 text-sm">{item.description}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="pp-ticket-price text-base">
              <span className="text-xs font-normal mr-1">EUR</span>{item.price}
            </div>
            <div className="pp-ticket-tax text-xs">inkl. MwSt.</div>
          </div>
          <QuantitySelector qty={qty} onQtyChange={onQtyChange} />
        </div>
      </div>
      <div className="sm:hidden space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="pp-ticket-title text-sm">{item.name}</h4>
            {item.badge && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ background: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)" }}>
                {item.badge}
              </span>
            )}
          </div>
          <p className="pp-ticket-desc mt-0.5 text-xs">{item.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="pp-ticket-price text-sm">
              <span className="text-[10px] font-normal mr-1">EUR</span>{item.price}
            </div>
            <div className="pp-ticket-tax">inkl. MwSt.</div>
          </div>
          <QuantitySelector qty={qty} onQtyChange={onQtyChange} />
        </div>
      </div>
    </div>
  );
};

/* ─── Collapsible ─── */
const InfoAccordion = ({ id, title, content }: { id: string; title: string; content: string }) => {
  const [open, setOpen] = useState(false);
  const isPromoter = id === "promoter";

  return (
    <div className="pp-accordion">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3.5 px-4 sm:px-5 text-left">
        <span className="text-sm sm:text-base font-bold uppercase tracking-wide" style={{ color: "hsl(0 0% 100%)" }}>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "hsl(0 0% 100%)" }} />
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
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
              {isPromoter ? (
                <>
                  <p className="text-sm sm:text-base whitespace-pre-line leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
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
                <p className="text-sm sm:text-base whitespace-pre-line leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
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

/* ─── Ticket Widget ─── */
const PPTicketWidget = ({ event }: { event: EventData }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const { timeLeft, isActive, startTimer, formatTime } = useCartTimer();

  // Reset quantities when event changes
  useEffect(() => {
    setQuantities({});
    setDiscountCode("");
    setDiscountApplied(false);
  }, [event.id]);

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleQtyChange = (id: string, val: number) => {
    const prev = quantities[id] || 0;
    setQuantities((q) => ({ ...q, [id]: val }));
    if (val > prev && !isActive) startTimer();
  };

  const handleApplyDiscount = () => {
    if (discountCode.trim().length > 0) setDiscountApplied(true);
  };

  return (
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
              background: timeLeft < 60 ? "hsl(0 70% 50% / 0.3)" : "hsl(0 0% 100% / 0.15)",
              border: `1px solid ${timeLeft < 60 ? "hsl(0 70% 50% / 0.5)" : "hsl(0 0% 100% / 0.25)"}`,
              color: "hsl(0 0% 100%)",
            }}
          >
            <Timer className="w-4 h-4" />
            <span>Reserviert für: {formatTime()}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location info */}
      {/* Location info - clickable to Google Maps */}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm sm:text-base font-medium px-3 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
        style={{
          color: "hsl(0 0% 100% / 0.9)",
          background: "hsl(0 0% 100% / 0.08)",
          border: "1px solid hsl(0 0% 100% / 0.15)",
        }}
      >
        <MapPin className="w-4 h-4 shrink-0" style={{ color: "hsl(0 80% 60%)" }} />
        <span className="flex-1">{event.venue} · {event.address}</span>
        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
      </a>

      {event.soldOut ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-2xl sm:text-3xl font-black uppercase tracking-wider mb-2" style={{ color: "hsl(0 70% 60%)" }}>
            AUSVERKAUFT
          </div>
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
            Dieses Event ist leider ausverkauft. Schau dir unsere anderen Termine an!
          </p>
        </div>
      ) : (
      <>
      {event.ticketData.map((category) => (
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
          style={{ background: "hsl(0 0% 100% / 0.25)", color: "white", border: "1px solid hsl(0 0% 100% / 0.35)" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Einlösen
        </motion.button>
      </div>
      {discountApplied && (
        <p className="text-xs" style={{ color: "hsl(0 0% 100%)" }}>
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
      </>
      )}

      {/* Instagram */}
      <a
        href={instagramUrl}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all hover:opacity-100"
        style={{ color: "hsl(0 0% 100% / 0.8)", border: "1px solid hsl(0 0% 100% / 0.25)", background: "hsl(0 0% 100% / 0.1)" }}
      >
        <Instagram className="w-3.5 h-3.5" />
        {instagramHandle}
      </a>

      {/* Info Accordions */}
      <div className="space-y-2 pt-2">
        {event.infoSections.map((s) => (
          <InfoAccordion key={s.id} id={s.id} title={s.title} content={s.content} />
        ))}
      </div>

      {/* Weitere Events Button */}
      <Link
        to="/#events"
        className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.02]"
        style={{ background: "hsl(0 0% 100% / 0.15)", border: "1px solid hsl(0 0% 100% / 0.25)", color: "hsl(0 0% 100%)" }}
      >
        Weitere Events entdecken <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

/* ─── Hero Section ─── */
const PPHeroSection = ({ event, selectedEventId, onSelectEvent }: { event: EventData; selectedEventId: string; onSelectEvent: (id: string) => void }) => (
  <motion.div
    className="flex flex-col items-center text-center relative"
    initial={{ opacity: 0, x: -60 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    <h1
      className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase leading-[0.9]"
      style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
    >
      HANNOVER
    </h1>

    <p className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-[0.15em] mt-2 sm:mt-3" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
      MAMMA MIA / ABBA TOUR
    </p>

    {event.openAir && (
      <motion.div
        className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase"
        style={{ background: "hsl(45 100% 50%)", color: "hsl(0 0% 10%)" }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <Sun className="w-3.5 h-3.5" /> Open Air
      </motion.div>
    )}

    <div className="flex items-center justify-center gap-4 sm:gap-8 mt-3 sm:mt-4 text-xs sm:text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
      <span>{event.date.slice(0, 5).replace(".", ". ")}</span>
      <span>AB {event.time} UHR</span>
      <span>{event.city.toUpperCase()}</span>
    </div>

    <div className="w-full flex justify-center mt-8 sm:mt-12 overflow-visible">
      <img
        src={headerImg}
        alt="Gimme Gimme Party Hannover"
        className="w-full rounded-2xl object-cover"
        style={{ maxHeight: "350px" }}
      />
    </div>

    {/* Event Date Tiles - below the logo/header image */}
    <div className="mt-6 sm:mt-8">
      <h2 className="text-center text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 sm:mb-4" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
        Wähle deinen Termin
      </h2>
      <EventDateTiles events={events} selectedId={selectedEventId} onSelect={onSelectEvent} />
    </div>
  </motion.div>
);

/* ─── Footer ─── */
const PPFooter = () => (
  <footer className="mt-8 sm:mt-12 pb-6 sm:pb-8">
    <div className="text-center mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
      <p>Fragen, Probleme oder Reservierungsanfragen?</p>
      <p>
        Kontaktiere uns:{" "}
        <a href="mailto:info@gimmegimmeparty.com" className="underline hover:opacity-80 transition-opacity">
          info@gimmegimmeparty.com
        </a>
      </p>
    </div>
    <div className="hidden md:flex items-start justify-between gap-6 lg:gap-8">
      <div className="flex-1">
        <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="text-xs lg:text-sm font-medium opacity-80 hover:opacity-100 transition-opacity" style={{ color: "hsl(0 0% 100%)" }}>
          powered by smea
        </a>
        <p className="text-xs lg:text-sm mt-2 lg:mt-3 max-w-xs lg:max-w-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
          Veranstalter: Gimme Gimme Party. Der Ticketverkauf erfolgt über unsere eigene Plattform.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 lg:gap-6 text-xs lg:text-sm">
        <a href="/impressum" className="footer-link">Impressum</a>
        <a href="/datenschutz" className="footer-link">Datenschutzerklärung</a>
        <a href="/agb" className="footer-link">AGB</a>
      </div>
    </div>
    <div className="md:hidden text-center space-y-3">
      <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="text-xs font-medium opacity-80 hover:opacity-100 transition-opacity inline-block" style={{ color: "hsl(0 0% 100%)" }}>
        powered by smea
      </a>
      <p className="text-xs px-4 leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
        Veranstalter: Gimme Gimme Party. Der Ticketverkauf erfolgt über unsere eigene Plattform.
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
  const [selectedEventId, setSelectedEventId] = useState(events[0].id);
  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  return (
    <div className="min-h-screen pp-bg">
      {/* Glitter Particles */}
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
          <PPHeroSection event={selectedEvent} selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
          <motion.div
            key={selectedEvent.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <PPTicketWidget event={selectedEvent} />
          </motion.div>
        </div>

        {/* Mobile: stacked */}
        <div className="md:hidden space-y-6">
          <motion.div
            key={`hero-${selectedEvent.id}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <PPHeroSection event={selectedEvent} selectedEventId={selectedEventId} onSelectEvent={setSelectedEventId} />
          </motion.div>
          <motion.div
            key={`tickets-${selectedEvent.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <PPTicketWidget event={selectedEvent} />
          </motion.div>
        </div>

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
