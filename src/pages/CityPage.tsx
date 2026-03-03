import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Instagram, Timer, MapPin, X, ArrowRight, Sun } from "lucide-react";
import headerImg from "@/assets/mamma-mia-logo.png";
import { supabase } from "@/integrations/supabase/client";

/* ─── Types ─── */
interface CityEvent {
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
  ticketLink: string | null;
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

/* ─── Helpers ─── */
const WEEKDAYS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

const formatDateDE = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

const formatDateShort = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
};

const getWeekday = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return WEEKDAYS_DE[d.getDay()];
};

const MONTHS_SHORT = ["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

const makeInfoSections = (event: CityEvent) => [
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
    id: "whatsapp",
    title: "Freikarten & mehr?",
    content: "whatsapp",
  },
];

/* ─── Instagram / WhatsApp config ─── */
const instagramHandle = "@gimmegimmeparty";
const instagramUrl = "https://instagram.com/gimmegimmeparty";
const whatsappNumber = "49123456789";

/* ─── Cart Timer ─── */
const CART_TIMER_SECONDS = 600;

const useCartTimer = (onExpire?: () => void) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive || timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) { setIsActive(false); onExpire?.(); return null; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onExpire]);

  const startTimer = useCallback(() => { setTimeLeft(CART_TIMER_SECONDS); setIsActive(true); }, []);
  const stopTimer = useCallback(() => { setTimeLeft(null); setIsActive(false); }, []);
  const formatTime = () => {
    if (timeLeft === null) return "";
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return { timeLeft, isActive, startTimer, stopTimer, formatTime };
};

/* ─── Event Date Tiles ─── */
const EventDateTiles = ({ events, selectedId, onSelect }: { events: CityEvent[]; selectedId: string; onSelect: (id: string) => void }) => (
  <div className="flex gap-1.5 sm:gap-3 pb-2 scrollbar-hide justify-center overflow-visible flex-wrap">
    {events.map((event) => {
      const isSelected = event.id === selectedId;
      return (
        <motion.button
          key={event.id}
          onClick={() => onSelect(event.id)}
          className="relative flex flex-col items-center px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-center shrink-0 transition-all backdrop-blur-sm"
          style={{
            background: isSelected ? "hsl(210 80% 30% / 0.5)" : event.soldOut ? "hsl(0 0% 100% / 0.08)" : "hsl(0 0% 100% / 0.15)",
            border: `2px solid ${isSelected ? "hsl(0 0% 100% / 0.8)" : "hsl(0 0% 100% / 0.25)"}`,
            color: "hsl(0 0% 100%)",
            minWidth: "56px",
            opacity: event.soldOut ? 0.5 : 1,
            boxShadow: isSelected ? "0 4px 20px hsl(210 80% 40% / 0.3)" : "none",
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
          <span className="text-base sm:text-lg font-black leading-none" style={{ textShadow: "0 1px 3px hsl(210 80% 15% / 0.7)" }}>{event.dateShort.split(".")[0]}</span>
          <span className="text-[10px] sm:text-xs font-extrabold uppercase mt-0.5" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.7)" }}>
            {MONTHS_SHORT[parseInt(event.dateShort.split(".")[1])]}
          </span>
          <span className="text-[9px] sm:text-[11px] font-bold mt-0.5 leading-tight" style={{ color: "hsl(0 0% 100% / 0.95)" }}>{event.venue.split("/")[0].trim().substring(0, 15)}</span>
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
      <div className="pp-ticket-item" style={{ opacity: 0.7 }}>
        <div className="flex items-center justify-between gap-4">
          <h4 className="pp-ticket-title text-sm sm:text-base">{item.name}</h4>
          <motion.span
            className="px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(280 60% 50% / 0.3), hsl(200 80% 50% / 0.3))", color: "hsl(0 0% 100%)", border: "1px solid hsl(200 80% 60% / 0.5)" }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            COMING SOON
          </motion.span>
        </div>
      </div>
    );
  }

  if (item.soldOut) {
    return (
      <div className="pp-ticket-item relative overflow-hidden" style={{ opacity: 0.5, padding: "8px 12px" }}>
        <div className="flex items-center justify-between gap-2">
          <h4 className="pp-ticket-title text-xs sm:text-sm line-through decoration-1" style={{ textDecorationColor: "hsl(0 0% 100% / 0.4)" }}>{item.name}</h4>
          <div className="flex items-center gap-2 shrink-0">
            <span className="pp-ticket-price text-xs sm:text-sm line-through decoration-1"><span className="text-[9px] sm:text-xs font-normal mr-0.5">EUR</span>{item.price}</span>
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase" style={{ background: "hsl(0 70% 50%)", color: "hsl(0 0% 100%)" }}>SOLD OUT</span>
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
            {item.badge && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)" }}>{item.badge}</span>}
          </div>
          <p className="pp-ticket-desc mt-0.5 text-sm">{item.description}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="pp-ticket-price text-base"><span className="text-xs font-normal mr-1">EUR</span>{item.price}</div>
            <div className="pp-ticket-tax text-xs">inkl. MwSt.</div>
          </div>
          <QuantitySelector qty={qty} onQtyChange={onQtyChange} />
        </div>
      </div>
      <div className="sm:hidden space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="pp-ticket-title text-sm">{item.name}</h4>
            {item.badge && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ background: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)" }}>{item.badge}</span>}
          </div>
          <p className="pp-ticket-desc mt-0.5 text-xs">{item.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="pp-ticket-price text-sm"><span className="text-[10px] font-normal mr-1">EUR</span>{item.price}</div>
            <div className="pp-ticket-tax">inkl. MwSt.</div>
          </div>
          <QuantitySelector qty={qty} onQtyChange={onQtyChange} />
        </div>
      </div>
    </div>
  );
};

/* ─── Info Accordion ─── */
const InfoAccordion = ({ id, title, content }: { id: string; title: string; content: string }) => {
  const [open, setOpen] = useState(false);
  const isWhatsapp = content === "whatsapp";
  return (
    <div className="pp-accordion">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3.5 px-4 sm:px-5 text-left">
        <span className="text-sm sm:text-base font-bold uppercase tracking-wide" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.7)" }}>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: "hsl(0 0% 100%)" }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
              {isWhatsapp ? (
                <>
                  <p className="text-sm sm:text-base leading-relaxed font-semibold" style={{ color: "hsl(0 0% 100%)" }}>Werde Teil unserer WhatsApp-Community.</p>
                  <a href="http://bit.ly/mammamiacommunity" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide mt-2 hover:scale-[1.02]"
                    style={{ background: "hsl(142, 70%, 45%)", color: "white" }}>
                    <MessageCircle className="w-4 h-4" /> Jetzt beitreten
                  </a>
                </>
              ) : (
                <p className="text-sm sm:text-base whitespace-pre-line leading-relaxed font-semibold" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 6px hsl(210 70% 10% / 0.7)" }}>{content}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Nearby Events (from DB) ─── */
const NearbyEvents = ({ currentSlug }: { currentSlug: string }) => {
  const [nearby, setNearby] = useState<{ slug: string; city: string; eventCount: number }[]>([]);

  useEffect(() => {
    supabase
      .from("event_series")
      .select("slug, city, title")
      .eq("status", "published")
      .neq("slug", currentSlug)
      .limit(6)
      .then(({ data }) => {
        if (data) setNearby(data.map((s) => ({ slug: s.slug, city: s.city || s.title, eventCount: 0 })));
      });
  }, [currentSlug]);

  if (nearby.length === 0) return null;

  return (
    <div className="pt-6">
      <div className="text-center mb-4">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 4px hsl(210 80% 15% / 0.8)" }}>
          🎶 Weitere Städte
        </h3>
        <p className="text-[11px] sm:text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.95)" }}>Sichere dir jetzt Tickets für weitere Städte</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {nearby.slice(0, 4).map((ev) => (
          <Link key={ev.slug} to={`/${ev.slug}`}
            className="group flex flex-col items-center py-4 sm:py-5 px-3 rounded-2xl text-center transition-all hover:scale-[1.03] backdrop-blur-sm"
            style={{ background: "linear-gradient(135deg, hsl(210 70% 45% / 0.35), hsl(200 60% 55% / 0.2))", border: "1px solid hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)" }}>
            <MapPin className="w-4 h-4 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm sm:text-base font-black uppercase tracking-wide">{ev.city}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

/* ─── Ticket Widget ─── */
const CityTicketWidget = ({ event, allEvents, citySlug }: { event: CityEvent; allEvents: CityEvent[]; citySlug: string }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const resetCart = useCallback(() => { setQuantities({}); setDiscountCode(""); setDiscountApplied(false); }, []);
  const { timeLeft, isActive, startTimer, stopTimer, formatTime } = useCartTimer(resetCart);

  useEffect(() => {
    setQuantities({});
    setDiscountCode("");
    setDiscountApplied(false);
    setLoadingTickets(true);

    supabase
      .from("ticket_categories")
      .select("*")
      .eq("event_id", event.id)
      .order("sort_order")
      .then(({ data }) => {
        if (!data || data.length === 0) { setTicketCategories([]); setLoadingTickets(false); return; }
        const groups: Record<string, TicketItem[]> = {};
        for (const row of data) {
          const group = row.category_group || "TICKETS";
          if (!groups[group]) groups[group] = [];
          groups[group].push({
            id: row.id,
            name: row.name,
            description: row.description || "",
            price: row.price > 0 ? row.price.toFixed(2).replace(".", ",") : "",
            soldOut: row.sold_out || false,
            badge: row.badge || undefined,
            comingSoon: row.coming_soon || false,
          });
        }
        setTicketCategories(Object.entries(groups).map(([title, items]) => ({ title, items })));
        setLoadingTickets(false);
      });
  }, [event.id]);

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleQtyChange = (id: string, val: number) => {
    const prev = quantities[id] || 0;
    const newQuantities = { ...quantities, [id]: val };
    setQuantities(newQuantities);
    const newTotal = Object.values(newQuantities).reduce((a, b) => a + b, 0);
    if (newTotal === 0 && isActive) stopTimer();
    else if (val > prev && !isActive) startTimer();
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <AnimatePresence>
        {isActive && timeLeft !== null && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold"
            style={{ background: timeLeft < 60 ? "hsl(0 70% 50% / 0.3)" : "hsl(0 0% 100% / 0.15)", border: `1px solid ${timeLeft < 60 ? "hsl(0 70% 50% / 0.5)" : "hsl(0 0% 100% / 0.25)"}`, color: "hsl(0 0% 100%)" }}>
            <Timer className="w-4 h-4" /><span>Reserviert für: {formatTime()}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.venue + ", " + event.address)}`}
        target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm sm:text-base font-medium px-3 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
        style={{ color: "hsl(0 0% 100% / 0.9)", background: "hsl(0 0% 100% / 0.08)", border: "1px solid hsl(0 0% 100% / 0.15)" }}>
        <MapPin className="w-4 h-4 shrink-0" style={{ color: "hsl(0 80% 60%)" }} />
        <span className="flex-1">{event.venue} · {event.address}</span>
        <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-50" />
      </a>

      {event.soldOut ? (
        <div className="text-center py-8 sm:py-12">
          <div className="text-2xl sm:text-3xl font-black uppercase tracking-wider mb-2" style={{ color: "hsl(0 70% 60%)" }}>AUSVERKAUFT</div>
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Dieses Event ist leider ausverkauft. Schau dir unsere anderen Termine an!</p>
        </div>
      ) : loadingTickets ? (
        <div className="text-center py-8"><div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Tickets laden...</div></div>
      ) : (
        <>
          {ticketCategories.map((category) => (
            <div key={category.title}>
              <h3 className="pp-category-title mb-2 sm:mb-3 text-sm sm:text-base">{category.title}</h3>
              <div>
                {category.items.map((item) => (
                  <TicketRow key={item.id} item={item} qty={quantities[item.id] || 0} onQtyChange={(v) => handleQtyChange(item.id, v)} />
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <input type="text" placeholder="Rabattcode eingeben" value={discountCode}
              onChange={(e) => { setDiscountCode(e.target.value); setDiscountApplied(false); }} maxLength={30} className="pp-form-input flex-1 text-sm" />
            <motion.button onClick={() => { if (discountCode.trim().length > 0) setDiscountApplied(true); }}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide shrink-0"
              style={{ background: "hsl(0 0% 100% / 0.25)", color: "white", border: "1px solid hsl(0 0% 100% / 0.35)" }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Einlösen
            </motion.button>
          </div>
          {discountApplied && <p className="text-xs" style={{ color: "hsl(0 0% 100%)" }}>✓ Code wird beim Checkout geprüft</p>}

          <motion.button className="pp-cart-btn mt-1 text-sm sm:text-base py-3.5 sm:py-4 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            WEITER {totalItems > 0 && `(${totalItems})`} <ArrowRight className="w-5 h-5" />
          </motion.button>
        </>
      )}

      <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all hover:opacity-100"
        style={{ color: "hsl(0 0% 100% / 0.8)", border: "1px solid hsl(0 0% 100% / 0.25)", background: "hsl(0 0% 100% / 0.1)" }}>
        <Instagram className="w-3.5 h-3.5" /> {instagramHandle}
      </a>

      <div className="space-y-2 pt-2">
        {event.infoSections.map((s) => (
          <InfoAccordion key={s.id} id={s.id} title={s.title} content={s.content} />
        ))}
      </div>

      <NearbyEvents currentSlug={citySlug} />
    </div>
  );
};

/* ─── Hero ─── */
const CityHero = ({ cityName, event, events, selectedId, onSelect }: { cityName: string; event: CityEvent; events: CityEvent[]; selectedId: string; onSelect: (id: string) => void }) => (
  <motion.div className="flex flex-col items-center text-center relative"
    initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase leading-[0.9]"
      style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)", textShadow: "0 2px 6px hsl(210 80% 15% / 0.7)" }}>
      {cityName}
    </h1>
    <p className="text-sm sm:text-lg md:text-xl font-extrabold uppercase tracking-[0.15em] mt-1 sm:mt-3"
      style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 4px hsl(210 80% 15% / 0.7)" }}>
      MAMMA MIA / ABBA TOUR
    </p>
    {event.openAir && (
      <motion.div className="flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase"
        style={{ background: "hsl(45 100% 50%)", color: "hsl(0 0% 10%)" }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
        <Sun className="w-3.5 h-3.5" /> Open Air
      </motion.div>
    )}
    <div className="flex items-center justify-center gap-4 sm:gap-8 mt-1.5 sm:mt-4 text-[11px] sm:text-sm font-bold uppercase tracking-wider"
      style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.7)" }}>
      <span>{event.dateShort}</span>
      <span>AB {event.time} UHR</span>
      <span>{event.city.toUpperCase()}</span>
    </div>
    <div className="w-full flex justify-center mt-1 sm:mt-6">
      <img src={headerImg} alt="Mamma Mia Party" className="max-w-[260px] sm:max-w-[460px] lg:max-w-[520px] object-contain" />
    </div>
    {events.length > 1 && (
      <div className="mt-1 sm:mt-6">
        <h2 className="text-center text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-4" style={{ color: "hsl(0 0% 100% / 0.95)" }}>
          Wähle deinen Termin
        </h2>
        <EventDateTiles events={events} selectedId={selectedId} onSelect={onSelect} />
      </div>
    )}
  </motion.div>
);

/* ─── Footer ─── */
const CityFooter = () => (
  <footer className="mt-8 sm:mt-12 pb-6 sm:pb-8">
    <div className="text-center mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed" style={{ color: "hsl(0 0% 100%)" }}>
      <p>Fragen, Probleme oder Reservierungsanfragen?</p>
      <p>Kontaktiere uns: <a href="mailto:info@gimmegimmeparty.com" className="underline hover:opacity-80">info@gimmegimmeparty.com</a></p>
    </div>
    <div className="hidden md:flex items-start justify-between gap-6 lg:gap-8">
      <div className="flex-1">
        <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="text-xs lg:text-sm font-medium opacity-80 hover:opacity-100" style={{ color: "hsl(0 0% 100%)" }}>powered by smea</a>
        <p className="text-xs lg:text-sm mt-2 lg:mt-3 max-w-xs lg:max-w-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
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
      <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="text-xs font-medium opacity-80 hover:opacity-100 inline-block" style={{ color: "hsl(0 0% 100%)" }}>powered by smea</a>
      <p className="text-xs px-4 leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.9)" }}>Veranstalter: Gimme Gimme Party.</p>
      <div className="flex justify-center gap-4 text-xs">
        <a href="/impressum" className="footer-link">Impressum</a>
        <a href="/datenschutz" className="footer-link">Datenschutz</a>
        <a href="/agb" className="footer-link">AGB</a>
      </div>
    </div>
  </footer>
);

/* ─── Main Page ─── */
const CityPage = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cityName, setCityName] = useState("");
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [showWhatsapp, setShowWhatsapp] = useState(false);

  useEffect(() => {
    if (!citySlug) return;
    setLoading(true);

    const fetchData = async () => {
      // Get series
      const { data: series } = await supabase
        .from("event_series")
        .select("*")
        .eq("slug", citySlug)
        .eq("status", "published")
        .maybeSingle();

      if (!series) { navigate("/", { replace: true }); return; }

      setCityName(series.city || series.title);

      // Get events
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("series_id", series.id)
        .eq("status", "published")
        .order("date");

      if (!eventsData || eventsData.length === 0) { navigate("/", { replace: true }); return; }

      const mapped: CityEvent[] = eventsData.map((e) => ({
        id: e.id,
        date: e.date ? formatDateDE(e.date) : "TBA",
        dateShort: e.date ? formatDateShort(e.date) : "TBA",
        weekday: e.date ? getWeekday(e.date) : "",
        time: e.time || "20:00",
        venue: e.location_name || "TBA",
        address: e.location_address || e.city || "",
        city: e.city || series.city || "",
        openAir: e.tag === "Open Air",
        soldOut: false,
        ticketLink: e.ticket_link,
        infoSections: [],
      }));

      mapped.forEach((m) => { m.infoSections = makeInfoSections(m); });

      setEvents(mapped);
      setSelectedEventId(mapped[0].id);
      setLoading(false);
    };

    fetchData();
  }, [citySlug, navigate]);

  useEffect(() => {
    const onScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setShowWhatsapp(scrollPercent > 0.5);

      const root = document.querySelector('.pp-bg') as HTMLElement | null;
      if (root) {
        const hue = 210 - scrollPercent * 15;
        const light = 52 + scrollPercent * 14;
        const sat = 55 - scrollPercent * 10;
        root.style.setProperty('--pp-hue', `${hue}`);
        root.style.setProperty('--pp-light', `${light}%`);
        root.style.setProperty('--pp-sat', `${sat}%`);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(210 55% 52%)" }}>
        <div className="text-lg font-bold uppercase tracking-wider animate-pulse" style={{ color: "hsl(0 0% 100%)" }}>Laden...</div>
      </div>
    );
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  return (
    <div className="min-h-screen pp-bg">
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
        <div className="hidden md:grid md:grid-cols-2 gap-6 lg:gap-8 items-start">
          <CityHero cityName={cityName} event={selectedEvent} events={events} selectedId={selectedEventId} onSelect={setSelectedEventId} />
          <motion.div key={selectedEvent.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <CityTicketWidget event={selectedEvent} allEvents={events} citySlug={citySlug!} />
          </motion.div>
        </div>
        <div className="md:hidden space-y-4">
          <motion.div key={`hero-${selectedEvent.id}`} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <CityHero cityName={cityName} event={selectedEvent} events={events} selectedId={selectedEventId} onSelect={setSelectedEventId} />
          </motion.div>
          <motion.div key={`tickets-${selectedEvent.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <CityTicketWidget event={selectedEvent} allEvents={events} citySlug={citySlug!} />
          </motion.div>
        </div>
        <CityFooter />
      </div>
      <AnimatePresence>
        {showWhatsapp && (
          <motion.a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
            className="pp-whatsapp-btn" aria-label="WhatsApp Chat"
            initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}>
            <MessageCircle className="w-6 h-6" />
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CityPage;
