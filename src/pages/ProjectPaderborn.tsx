import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Instagram, Timer, MapPin, X, ArrowRight, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import headerImg from "@/assets/mamma-mia-logo.png";
import { supabase } from "@/integrations/supabase/client";

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

/* DB event ID mapping */
const eventDbIds: Record<string, string> = {
  "388": "287d328d-6e36-4e96-b03a-b771ddccc3ec",
  "440": "768f3cf0-7528-4605-9abb-64d0e246d2c8",
  "410": "5a0db3d3-822f-4fb8-80fd-bff41f7a4fe0",
  "411": "b667d01b-fa51-49db-86a5-c8b4340aa875",
  "412": "838a6c36-5c1d-4f10-b9b1-3663e346a443",
};

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
    id: "whatsapp",
    title: "Freikarten & mehr?",
    content: "whatsapp",
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
    ticketData: [],
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
    ticketData: [],
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
    ticketData: [],
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
    ticketData: [],
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
    ticketData: [],
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

const useCartTimer = (onExpire?: () => void) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive || timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          setIsActive(false);
          onExpire?.();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onExpire]);

  const startTimer = useCallback(() => {
    setTimeLeft(CART_TIMER_SECONDS);
    setIsActive(true);
  }, []);

  const stopTimer = useCallback(() => {
    setTimeLeft(null);
    setIsActive(false);
  }, []);

  const formatTime = () => {
    if (timeLeft === null) return "";
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return { timeLeft, isActive, startTimer, stopTimer, formatTime };
};

/* ─── Event Date Tiles ─── */
const EventDateTiles = ({ events, selectedId, onSelect }: { events: EventData[]; selectedId: string; onSelect: (id: string) => void }) => (
  <div className="flex gap-1.5 sm:gap-3 pb-2 scrollbar-hide justify-center overflow-visible">
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
          {event.openAir && event.soldOut && (
            <span className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase"
              style={{ background: "hsl(45 100% 50%)", color: "hsl(0 0% 10%)" }}>
              <Sun className="w-2.5 h-2.5" />
            </span>
          )}
          <span className="text-base sm:text-lg font-black leading-none" style={{ textShadow: "0 1px 3px hsl(210 80% 15% / 0.7), 0 2px 8px hsl(210 60% 15% / 0.5)" }}>{event.dateShort.split(".")[0]}</span>
          <span className="text-[10px] sm:text-xs font-extrabold uppercase mt-0.5" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.7), 0 2px 8px hsl(210 60% 15% / 0.5)" }}>
            {["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"][parseInt(event.dateShort.split(".")[1])]}
          </span>
          <span className="text-[9px] sm:text-[11px] font-bold mt-0.5 leading-tight" style={{ color: "hsl(0 0% 100% / 0.95)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.6), 0 2px 6px hsl(210 60% 15% / 0.4)" }}>{event.venue.split("/")[0].trim()}</span>
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
            style={{
              background: "linear-gradient(135deg, hsl(280 60% 50% / 0.3), hsl(200 80% 50% / 0.3))",
              color: "hsl(0 0% 100%)",
              border: "1px solid hsl(200 80% 60% / 0.5)",
              boxShadow: "0 0 12px hsl(200 80% 50% / 0.2)",
            }}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
        {/* Desktop */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          <h4 className="pp-ticket-title text-sm line-through decoration-1" style={{ textDecorationColor: "hsl(0 0% 100% / 0.4)" }}>{item.name}</h4>
          <div className="flex items-center gap-3 shrink-0">
            <span className="pp-ticket-price text-sm line-through decoration-1" style={{ textDecorationColor: "hsl(0 0% 100% / 0.4)" }}>
              <span className="text-xs font-normal mr-1">EUR</span>{item.price}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
              style={{ background: "hsl(0 70% 50%)", color: "hsl(0 0% 100%)" }}>
              SOLD OUT
            </span>
          </div>
        </div>
        {/* Mobile - kompakt mit Preis */}
        <div className="sm:hidden flex items-center justify-between gap-2">
          <h4 className="pp-ticket-title text-xs line-through decoration-1" style={{ textDecorationColor: "hsl(0 0% 100% / 0.4)" }}>{item.name}</h4>
          <div className="flex items-center gap-2 shrink-0">
            <span className="pp-ticket-price text-xs line-through decoration-1" style={{ textDecorationColor: "hsl(0 0% 100% / 0.4)" }}>
              <span className="text-[9px] font-normal mr-0.5">EUR</span>{item.price}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0"
              style={{ background: "hsl(0 70% 50%)", color: "hsl(0 0% 100%)" }}>
              SOLD OUT
            </span>
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
  const isWhatsapp = content === "whatsapp";
  return (
    <div className="pp-accordion">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3.5 px-4 sm:px-5 text-left">
        <span className="text-sm sm:text-base font-bold uppercase tracking-wide" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.7), 0 2px 8px hsl(210 60% 15% / 0.5)" }}>{title}</span>
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
              ) : isWhatsapp ? (
                <>
                  <p className="text-sm sm:text-base leading-relaxed font-semibold" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 6px hsl(210 70% 10% / 0.7), 0 0 2px hsl(210 60% 10% / 0.3)" }}>
                    Werde Teil unserer WhatsApp-Community.
                  </p>
                  <a
                    href="http://bit.ly/mammamiacommunity"
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all mt-2 hover:scale-[1.02]"
                    style={{ background: "hsl(142, 70%, 45%)", color: "white" }}
                  >
                    <MessageCircle className="w-4 h-4" /> Jetzt beitreten
                  </a>
                </>
              ) : (
                <p className="text-sm sm:text-base whitespace-pre-line leading-relaxed font-semibold" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 6px hsl(210 70% 10% / 0.7), 0 0 2px hsl(210 60% 10% / 0.3)" }}>
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

/* ─── Nearby Events ─── */
const nearbyEventsList = [
  { id: "pb", name: "MAMMA MIA PARTY", city: "Paderborn", date: "15.05.2025", lat: 51.7189, lng: 8.7544, url: "/paderborn" },
  { id: "bi", name: "MAMMA MIA PARTY", city: "Bielefeld", date: "22.05.2025", lat: 52.0302, lng: 8.5325, url: "/bielefeld" },
  { id: "os", name: "MAMMA MIA PARTY", city: "Osnabrück", date: "29.05.2025", lat: 52.2799, lng: 8.0472, url: "/osnabrueck" },
  { id: "hh", name: "MAMMA MIA PARTY", city: "Hamburg", date: "05.06.2025", lat: 53.5511, lng: 9.9937, url: "/hamburg" },
  { id: "hb", name: "MAMMA MIA PARTY", city: "Bremen", date: "12.06.2025", lat: 53.0793, lng: 8.8017, url: "/bremen" },
  { id: "bs", name: "MAMMA MIA PARTY", city: "Braunschweig", date: "26.06.2025", lat: 52.2689, lng: 10.5268, url: "/braunschweig" },
];

const cityCoords: Record<string, { lat: number; lng: number }> = {
  "Hannover": { lat: 52.3759, lng: 9.7320 },
  "Garbsen": { lat: 52.4182, lng: 9.5988 },
};

const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const NearbyEvents = ({ currentEvent }: { currentEvent: EventData }) => {
  const [sortedEvents, setSortedEvents] = useState(nearbyEventsList);
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    const fallback = cityCoords[currentEvent.city] || { lat: 52.3759, lng: 9.7320 };

    const sortByLocation = (lat: number, lng: number, label?: string) => {
      if (label) setUserCity(label);
      const sorted = [...nearbyEventsList]
        .map((e) => ({ ...e, distance: getDistance(lat, lng, e.lat, e.lng) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 4);
      setSortedEvents(sorted);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => sortByLocation(pos.coords.latitude, pos.coords.longitude, "deiner Nähe"),
        () => sortByLocation(fallback.lat, fallback.lng, currentEvent.city),
        { timeout: 5000 }
      );
    } else {
      sortByLocation(fallback.lat, fallback.lng, currentEvent.city);
    }
  }, [currentEvent.city]);

  return (
    <div className="pt-6">
      <div className="text-center mb-4">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 4px hsl(210 80% 15% / 0.8), 0 3px 10px hsl(210 60% 15% / 0.5)" }}>
          🎶 Weitere Events {userCity ? (userCity === "deiner Nähe" ? "in deiner Nähe" : `nahe ${userCity}`) : ""}
        </h3>
        <p className="text-[11px] sm:text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.95)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.6)" }}>
          Sichere dir jetzt Tickets für weitere Städte
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {sortedEvents.map((ev) => (
          <Link
            key={ev.id}
            to={ev.url}
            className="group flex flex-col items-center py-4 sm:py-5 px-3 rounded-2xl text-center transition-all hover:scale-[1.03] backdrop-blur-sm"
            style={{
              background: "linear-gradient(135deg, hsl(210 70% 45% / 0.35), hsl(200 60% 55% / 0.2))",
              border: "1px solid hsl(0 0% 100% / 0.2)",
              color: "hsl(0 0% 100%)",
              boxShadow: "0 4px 16px hsl(210 80% 30% / 0.15)",
            }}
          >
            <MapPin className="w-4 h-4 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm sm:text-base font-black uppercase tracking-wide">{ev.city}</span>
            <span className="text-[10px] sm:text-xs font-medium mt-1 px-2.5 py-0.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.15)" }}>
              {ev.date}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

/* ─── Ticket Widget ─── */
const PPTicketWidget = ({ event }: { event: EventData }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const resetCart = useCallback(() => {
    setQuantities({});
    setDiscountCode("");
    setDiscountApplied(false);
  }, []);
  const { timeLeft, isActive, startTimer, stopTimer, formatTime } = useCartTimer(resetCart);

  // Fetch tickets from DB
  useEffect(() => {
    setQuantities({});
    setDiscountCode("");
    setDiscountApplied(false);
    setLoadingTickets(true);

    const dbId = eventDbIds[event.id];
    if (!dbId) { setTicketCategories([]); setLoadingTickets(false); return; }

    supabase
      .from("ticket_categories")
      .select("*")
      .eq("event_id", dbId)
      .order("sort_order")
      .then(({ data }) => {
        if (!data || data.length === 0) { setTicketCategories([]); setLoadingTickets(false); return; }
        // Group by category_group
        const groups: Record<string, TicketItem[]> = {};
        for (const row of data) {
          const group = (row as any).category_group || "TICKETS";
          if (!groups[group]) groups[group] = [];
          groups[group].push({
            id: row.id,
            name: row.name,
            description: row.description || "",
            price: row.price > 0 ? row.price.toFixed(2).replace(".", ",") : "",
            soldOut: row.sold_out || false,
            badge: (row as any).badge || undefined,
            comingSoon: (row as any).coming_soon || false,
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
    if (newTotal === 0 && isActive) {
      stopTimer();
    } else if (val > prev && !isActive) {
      startTimer();
    }
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
        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.venue + ", " + event.address)}`}
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
      ) : loadingTickets ? (
        <div className="text-center py-8">
          <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Tickets laden...</div>
        </div>
      ) : (
      <>
      {ticketCategories.map((category) => (
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
        className="pp-cart-btn mt-1 text-sm sm:text-base py-3.5 sm:py-4 flex items-center justify-center gap-2"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        WEITER {totalItems > 0 && `(${totalItems})`} <ArrowRight className="w-5 h-5" />
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

      {/* Weitere Events in deiner Nähe */}
      <NearbyEvents currentEvent={event} />
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
      className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase leading-[0.9]"
      style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)", textShadow: "0 2px 6px hsl(210 80% 15% / 0.7), 0 4px 16px hsl(210 60% 15% / 0.5)" }}
    >
      HANNOVER
    </h1>

    <p className="text-sm sm:text-lg md:text-xl font-extrabold uppercase tracking-[0.15em] mt-1 sm:mt-3" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 4px hsl(210 80% 15% / 0.7), 0 3px 10px hsl(210 60% 15% / 0.5)" }}>
      MAMMA MIA / ABBA TOUR
    </p>

    {event.openAir && (
      <motion.div
        className="flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase"
        style={{ background: "hsl(45 100% 50%)", color: "hsl(0 0% 10%)" }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <Sun className="w-3.5 h-3.5" /> Open Air
      </motion.div>
    )}

    <div className="flex items-center justify-center gap-4 sm:gap-8 mt-1.5 sm:mt-4 text-[11px] sm:text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.7), 0 2px 8px hsl(210 60% 15% / 0.5)" }}>
      <span>{event.date.slice(0, 5).replace(".", ". ")}</span>
      <span>AB {event.time} UHR</span>
      <span>{event.city.toUpperCase()}</span>
    </div>

    <div className="w-full flex justify-center mt-1 sm:mt-6">
      <img src={headerImg} alt="Mamma Mia Party" className="max-w-[260px] sm:max-w-[460px] lg:max-w-[520px] object-contain" />
    </div>

    {/* Event Date Tiles - below the logo/header image */}
    <div className="mt-1 sm:mt-6">
      <h2 className="text-center text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-4" style={{ color: "hsl(0 0% 100% / 0.95)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.6)" }}>
        Wähle deinen Termin
      </h2>
      <EventDateTiles events={events} selectedId={selectedEventId} onSelect={onSelectEvent} />
    </div>
  </motion.div>
);

/* ─── Footer ─── */
const PPFooter = () => (
  <footer className="mt-8 sm:mt-12 pb-6 sm:pb-8">
    <div className="text-center mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 4px hsl(210 80% 15% / 0.6)" }}>
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
        <p className="text-xs lg:text-sm mt-2 lg:mt-3 max-w-xs lg:max-w-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.9)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.5)" }}>
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
      <p className="text-xs px-4 leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.9)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.5)" }}>
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
  const [showWhatsapp, setShowWhatsapp] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setShowWhatsapp(scrollPercent > 0.5);

      // Smooth background gradient shift on scroll
      const bg = document.querySelector('.pp-bg::before') as HTMLElement | null;
      const root = document.querySelector('.pp-bg') as HTMLElement | null;
      if (root) {
        const hue = 210 - scrollPercent * 15; // 210 → 195
        const light = 52 + scrollPercent * 14; // 52% → 66%
        const sat = 55 - scrollPercent * 10;   // 55% → 45%
        root.style.setProperty('--pp-hue', `${hue}`);
        root.style.setProperty('--pp-light', `${light}%`);
        root.style.setProperty('--pp-sat', `${sat}%`);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        <div className="md:hidden space-y-4">
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

      {/* WhatsApp Floating Button - shows after scrolling 50% */}
      <AnimatePresence>
        {showWhatsapp && (
          <motion.a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pp-whatsapp-btn"
            aria-label="WhatsApp Chat"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MessageCircle className="w-6 h-6" />
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectPaderborn;
