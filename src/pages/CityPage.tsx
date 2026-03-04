import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MessageCircle, Instagram, Timer, MapPin, X, ArrowRight, Sun } from "lucide-react";
import headerImg from "@/assets/mamma-mia-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { getTranslations, translateBadge, translateTicketDesc, getCurrencyForCity, getCurrencySymbol, convertPrice, getLangForCity, type Translations } from "@/lib/i18n";

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
  priceEur: number;
  soldOut: boolean;
  badge?: string;
  comingSoon?: boolean;
}

interface TicketCategory {
  title: string;
  items: TicketItem[];
}

/* ─── Helpers ─── */
const WEEKDAYS_DE_UNUSED = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];

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

const getWeekday = (iso: string, weekdays?: string[]) => {
  const d = new Date(iso + "T00:00:00");
  const wd = weekdays || WEEKDAYS_DE_UNUSED;
  return wd[d.getDay()];
};

const MONTHS_SHORT_DEFAULT = ["", "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

const makeInfoSections = (event: CityEvent, t: Translations) => [
  {
    id: "eventinfo",
    title: t.eventInfoTitle,
    content: t.eventInfoContent(event.weekday, event.date, event.venue, event.address, event.time),
  },
  {
    id: "einlass",
    title: t.admissionTitle,
    content: t.admissionContent,
  },
  {
    id: "whatsapp",
    title: t.freeTicketsTitle,
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
const EventDateTiles = ({ events, selectedId, onSelect, t }: { events: CityEvent[]; selectedId: string; onSelect: (id: string) => void; t: Translations }) => (
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
              {t.soldOutLabel}
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
            {t.monthsShort[parseInt(event.dateShort.split(".")[1])]}
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
const TicketRow = ({ item, qty, onQtyChange, t, currency }: { item: TicketItem; qty: number; onQtyChange: (v: number) => void; t: Translations; currency: string }) => {
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
            {t.comingSoonLabel}
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
            <span className="pp-ticket-price text-xs sm:text-sm line-through decoration-1"><span className="text-[9px] sm:text-xs font-normal mr-0.5">{currency}</span>{item.price}</span>
            <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase" style={{ background: "hsl(0 70% 50%)", color: "hsl(0 0% 100%)" }}>{t.soldOutBadge}</span>
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
            {item.badge && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)" }}>{translateBadge(item.badge, t)}</span>}
          </div>
          <p className="pp-ticket-desc mt-0.5 text-sm">{translateTicketDesc(item.name, item.description, t)}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="pp-ticket-price text-base"><span className="text-xs font-normal mr-1">{currency}</span>{item.price}</div>
            <div className="pp-ticket-tax text-xs">{t.inclVat}</div>
          </div>
          <QuantitySelector qty={qty} onQtyChange={onQtyChange} />
        </div>
      </div>
      <div className="sm:hidden space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="pp-ticket-title text-sm">{item.name}</h4>
            {item.badge && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{ background: "hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)" }}>{translateBadge(item.badge, t)}</span>}
          </div>
          <p className="pp-ticket-desc mt-0.5 text-xs">{translateTicketDesc(item.name, item.description, t)}</p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="pp-ticket-price text-sm"><span className="text-[10px] font-normal mr-1">{currency}</span>{item.price}</div>
            <div className="pp-ticket-tax">{t.inclVat}</div>
          </div>
          <QuantitySelector qty={qty} onQtyChange={onQtyChange} />
        </div>
      </div>
    </div>
  );
};

/* ─── Info Accordion ─── */
const InfoAccordion = ({ id, title, content, t }: { id: string; title: string; content: string; t: Translations }) => {
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
                  <p className="text-sm sm:text-base leading-relaxed font-semibold" style={{ color: "hsl(0 0% 100%)" }}>{t.whatsappDesc}</p>
                  <a href="http://bit.ly/mammamiacommunity" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide mt-2 hover:scale-[1.02]"
                    style={{ background: "hsl(142, 70%, 45%)", color: "white" }}>
                    <MessageCircle className="w-4 h-4" /> {t.whatsappJoin}
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

/* ─── City Coordinates for distance calc ─── */
const CITY_COORDS: Record<string, [number, number]> = {
  Aachen:[50.7753,6.0839],Aalen:[48.8375,10.0933],Albstadt:[48.2106,9.0254],Amsterdam:[52.3676,4.9041],
  Antwerpen:[51.2194,4.4025],Apolda:[51.0260,11.5152],Aschaffenburg:[49.9757,9.1539],Augsburg:[48.3705,10.8978],
  Balingen:[48.2753,8.8501],Bautzen:[51.1814,14.4244],Berlin:[52.5200,13.4050],Bielefeld:[52.0302,8.5325],
  Bochum:[51.4818,7.2162],Bonn:[50.7374,7.0982],Bottrop:[51.5247,6.9227],Braunschweig:[52.2689,10.5268],
  Bremen:[53.0793,8.8017],Bremervörde:[53.4856,9.1408],Buxtehude:[53.4677,9.6861],Celle:[52.6224,10.0805],
  Cloppenburg:[52.8476,8.0445],Cuxhaven:[53.8617,8.6907],Darmstadt:[49.8728,8.6512],Detmold:[51.9386,8.8789],
  Dornbirn:[47.4125,9.7417],Dortmund:[51.5136,7.4653],Dresden:[51.0504,13.7373],Düsseldorf:[51.2277,6.7735],
  Erfurt:[50.9787,11.0328],Essen:[51.4556,7.0116],Frankfurt:[50.1109,8.6821],Freiburg:[47.9990,7.8421],
  Freilassing:[47.8396,12.9822],Fulda:[50.5558,9.6808],Geldern:[51.5178,6.3225],Gera:[50.8810,12.0836],
  Gießen:[50.5840,8.6784],Gotha:[50.9489,10.7018],Göttingen:[51.5413,9.9158],Gralla:[46.7333,15.5333],
  Hagen:[51.3671,7.4633],Halle:[51.4969,11.9688],Hamburg:[53.5511,9.9937],Hamm:[51.6739,7.8160],
  Hanau:[50.1337,8.9167],Hannover:[52.3759,9.7320],Heide:[54.1961,9.0939],Ingolstadt:[48.7665,11.4258],
  Innsbruck:[47.2692,11.4041],Kaiserslautern:[49.4401,7.7491],Karlsruhe:[49.0069,8.4037],Kiel:[54.3233,10.1228],
  Kitzbühel:[47.4493,12.3922],Koblenz:[50.3569,7.5890],Kollerschlag:[48.6000,13.8333],Köln:[50.9375,6.9603],
  Krakow:[50.0647,19.9450],Krefeld:[51.3388,6.5853],LeHavre:[49.4944,0.1079],Leingarten:[49.1500,9.1167],
  Leipzig:[51.3397,12.3731],Linz:[48.3069,14.2858],Lörrach:[47.6151,7.6614],Lübeck:[53.8655,10.6866],
  Luxembourg:[49.6117,6.1300],Lyss:[47.0743,7.3069],Magdeburg:[52.1205,11.6276],Mainz:[49.9929,8.2473],
  Mathay:[47.4333,6.7833],Melle:[52.2036,8.3381],Merenberg:[50.5167,8.1833],Mönchengladbach:[51.1805,6.4428],
  Monheim:[51.0917,6.8917],München:[48.1351,11.5820],Münster:[51.9607,7.6261],Nabburg:[49.4542,12.1789],
  Naumburg:[51.1521,11.8097],Neuss:[51.2042,6.6879],Nürnberg:[49.4521,11.0767],Oberhausen:[51.4963,6.8634],
  Offenburg:[48.4738,7.9452],Oldenburg:[53.1435,8.2146],Olpe:[51.0289,7.8514],Olten:[47.3500,7.9000],
  Osnabrück:[52.2799,8.0472],Paderborn:[51.7189,8.7575],Paris:[48.8566,2.3522],Pforzheim:[48.8922,8.6947],
  Potsdam:[52.3906,13.0645],Rastatt:[48.8583,8.2039],Ravensburg:[47.7811,9.6122],Recklinghausen:[51.6139,7.1979],
  Regensburg:[49.0134,12.1016],Reutlingen:[48.4914,9.2108],Rosenheim:[47.8561,12.1283],Rostock:[54.0924,12.0991],
  Rotterdam:[51.9244,4.4777],Saarbrücken:[49.2402,6.9969],Salzburg:[47.8095,13.0550],SãoPaulo:[-23.5505,-46.6333],
  Schwerin:[53.6355,11.4015],Siegen:[50.8748,8.0243],Singen:[47.7600,8.8400],Sinsheim:[49.2528,8.8789],
  StGallen:[47.4245,9.3767],StMartin:[47.1167,14.4833],Stollberg:[50.7097,12.7789],Stuttgart:[48.7758,9.1829],
  Trier:[49.7490,6.6371],Ulm:[48.4011,9.9876],Utrecht:[52.0907,5.1214],Verl:[51.8833,8.5167],
  Vöcklabruck:[48.0025,13.6578],Wien:[48.2082,16.3738],Winterthur:[47.5006,8.7234],Wuppertal:[51.2562,7.1508],
  Würzburg:[49.7913,9.9534],Zadar:[44.1194,15.2314],Zürich:[47.3769,8.5417],Zwickau:[50.7183,12.4964],
};

const getCityCoords = (city: string): [number, number] | null => {
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  // Try without spaces/special chars
  const normalized = city.replace(/\s+/g, "").replace("ö", "ö").replace("ü", "ü").replace("ä", "ä");
  for (const [key, val] of Object.entries(CITY_COORDS)) {
    if (key.replace(/\s+/g, "") === normalized) return val;
  }
  return null;
};

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ─── Nearby Events (from DB) ─── */
const NearbyEvents = ({ currentSlug, currentCity, t }: { currentSlug: string; currentCity: string; t: Translations }) => {
  const [nearby, setNearby] = useState<{ slug: string; city: string; km: number | null }[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadAndSort = async (refLat: number, refLon: number, allSeries: { slug: string; city: string }[]) => {
      const withDist = allSeries
        .map((s) => {
          const coords = getCityCoords(s.city);
          const km = coords ? Math.round(haversineKm(refLat, refLon, coords[0], coords[1])) : null;
          return { slug: s.slug, city: s.city, km };
        })
        .sort((a, b) => (a.km ?? 99999) - (b.km ?? 99999));
      if (!cancelled) setNearby(withDist.slice(0, 4));
    };

    supabase
      .from("event_series")
      .select("slug, city, title")
      .eq("status", "published")
      .neq("slug", currentSlug)
      .then(({ data }) => {
        if (!data || cancelled) return;
        const series = data.map((s) => ({ slug: s.slug, city: s.city || s.title }));

        // Try user geolocation first
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              loadAndSort(pos.coords.latitude, pos.coords.longitude, series);
            },
            () => {
              // Fallback: use current event city coords
              const fallback = getCityCoords(currentCity);
              if (fallback) loadAndSort(fallback[0], fallback[1], series);
              else if (!cancelled) setNearby(series.slice(0, 4).map((s) => ({ ...s, km: null })));
            },
            { timeout: 5000, maximumAge: 300000 }
          );
        } else {
          const fallback = getCityCoords(currentCity);
          if (fallback) loadAndSort(fallback[0], fallback[1], series);
          else if (!cancelled) setNearby(series.slice(0, 4).map((s) => ({ ...s, km: null })));
        }
      });

    return () => { cancelled = true; };
  }, [currentSlug, currentCity]);

  if (nearby.length === 0) return null;

  return (
    <div className="pt-6">
      <div className="text-center mb-4">
        <h3 className="text-base sm:text-lg font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 4px hsl(210 80% 15% / 0.8)" }}>
          {t.moreCities}
        </h3>
        <p className="text-[11px] sm:text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.95)" }}>{t.moreCitiesDesc}</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {nearby.map((ev) => (
          <Link key={ev.slug} to={`/${ev.slug}`}
            className="group flex flex-col items-center py-4 sm:py-5 px-3 rounded-2xl text-center transition-all hover:scale-[1.03] backdrop-blur-sm"
            style={{ background: "linear-gradient(135deg, hsl(210 70% 45% / 0.35), hsl(200 60% 55% / 0.2))", border: "1px solid hsl(0 0% 100% / 0.2)", color: "hsl(0 0% 100%)" }}>
            <MapPin className="w-4 h-4 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm sm:text-base font-black uppercase tracking-wide">{ev.city}</span>
            {ev.km !== null && (
              <span className="text-[10px] sm:text-xs mt-1 font-semibold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                ~{ev.km} {t.kmAway}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

/* ─── Ticket Widget ─── */
const CityTicketWidget = ({ event, allEvents, citySlug, t }: { event: CityEvent; allEvents: CityEvent[]; citySlug: string; t: Translations }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [discountCode, setDiscountCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutBirthDate, setCheckoutBirthDate] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const resetCart = useCallback(() => { setQuantities({}); setDiscountCode(""); setDiscountApplied(false); setShowCheckout(false); }, []);
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
        const now = new Date();
        for (const row of data) {
          // Skip internal-only tickets (free tickets for admin use)
          if (row.internal_only) continue;
          // Skip tickets outside sale window
          if (row.sale_start && new Date(row.sale_start) > now) continue;
          if (row.sale_end && new Date(row.sale_end) < now) continue;

          const group = row.category_group || "TICKETS";
          if (!groups[group]) groups[group] = [];
          const currency = getCurrencyForCity(event.city);
          const lang = getLangForCity(event.city);
          groups[group].push({
            id: row.id,
            name: row.name,
            description: row.description || "",
            priceEur: row.price,
            price: row.price > 0 ? convertPrice(row.price, currency, lang) : "",
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

  const handleCheckout = async () => {
    if (!checkoutEmail || !checkoutEmail.includes("@")) {
      setCheckoutError(t.invalidEmail);
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError("");

    // Build items array from selected tickets
    const allItems = ticketCategories.flatMap((c) => c.items);
    const selectedItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = allItems.find((i) => i.id === id);
        return { ticketId: id, name: item?.name || "", quantity: qty, priceEur: item?.priceEur || 0 };
      });

    const currency = getCurrencyForCity(event.city);
    const redirectBase = window.location.origin;

    try {
      const { data, error } = await supabase.functions.invoke("create-mollie-payment", {
        body: {
          email: checkoutEmail,
          name: checkoutName || null,
          birthDate: checkoutBirthDate || null,
          phone: checkoutPhone || null,
          eventId: event.id,
          items: selectedItems,
          currency,
          discountCode: discountApplied ? discountCode : null,
          redirectBase,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setCheckoutError("Zahlung konnte nicht erstellt werden. Bitte versuche es erneut.");
        setCheckoutLoading(false);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-7">
      <AnimatePresence>
        {isActive && timeLeft !== null && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold"
            style={{ background: timeLeft < 60 ? "hsl(0 70% 50% / 0.3)" : "hsl(0 0% 100% / 0.15)", border: `1px solid ${timeLeft < 60 ? "hsl(0 70% 50% / 0.5)" : "hsl(0 0% 100% / 0.25)"}`, color: "hsl(0 0% 100%)" }}>
            <Timer className="w-4 h-4" /><span>{t.reservedFor} {formatTime()}</span>
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
          <div className="text-2xl sm:text-3xl font-black uppercase tracking-wider mb-2" style={{ color: "hsl(0 70% 60%)" }}>{t.soldOutTitle}</div>
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{t.soldOutDesc}</p>
        </div>
      ) : loadingTickets ? (
        <div className="text-center py-8"><div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{t.ticketsLoading}</div></div>
      ) : (
        <>
          {ticketCategories.map((category) => (
            <div key={category.title}>
              <h3 className="pp-category-title mb-2 sm:mb-3 text-sm sm:text-base">{category.title}</h3>
              <div>
                {category.items.map((item) => (
                  <TicketRow key={item.id} item={item} qty={quantities[item.id] || 0} onQtyChange={(v) => handleQtyChange(item.id, v)} t={t} currency={getCurrencyForCity(event.city)} />
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <input type="text" placeholder={t.discountPlaceholder} value={discountCode}
              onChange={(e) => { setDiscountCode(e.target.value); setDiscountApplied(false); }} maxLength={30} className="pp-form-input flex-1 text-sm" />
            <motion.button onClick={() => { if (discountCode.trim().length > 0) setDiscountApplied(true); }}
              className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wide shrink-0"
              style={{ background: "hsl(0 0% 100% / 0.25)", color: "white", border: "1px solid hsl(0 0% 100% / 0.35)" }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {t.discountApply}
            </motion.button>
          </div>
          {discountApplied && <p className="text-xs" style={{ color: "hsl(0 0% 100%)" }}>{t.discountApplied}</p>}

          {!showCheckout ? (
            <motion.button 
              className="pp-cart-btn mt-1 text-sm sm:text-base py-3.5 sm:py-4 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={() => { if (totalItems > 0) setShowCheckout(true); }}
              style={{ opacity: totalItems > 0 ? 1 : 0.5, cursor: totalItems > 0 ? "pointer" : "not-allowed" }}
            >
              {t.continueBtn} {totalItems > 0 && `(${totalItems})`} <ArrowRight className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-3 p-5 rounded-2xl" 
              style={{ background: "hsl(210 40% 18% / 0.85)", border: "1px solid hsl(0 0% 100% / 0.15)", backdropFilter: "blur(16px)", boxShadow: "0 8px 32px hsl(210 50% 5% / 0.5)" }}
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-center" style={{ color: "hsl(0 0% 100%)" }}>
                {t.checkoutTitle}
              </h3>
              <input type="text" placeholder={t.namePlaceholder} value={checkoutName}
                onChange={(e) => setCheckoutName(e.target.value)}
                className="pp-form-input text-sm w-full" />
              <input type="date" placeholder={t.birthDatePlaceholder} value={checkoutBirthDate}
                onChange={(e) => setCheckoutBirthDate(e.target.value)}
                className="pp-form-input text-sm w-full"
                style={{ colorScheme: "dark" }} />
              <input type="email" placeholder={t.emailPlaceholder} value={checkoutEmail}
                onChange={(e) => { setCheckoutEmail(e.target.value); setCheckoutError(""); }}
                className="pp-form-input text-sm w-full" required />
              <input type="tel" placeholder={t.phonePlaceholder} value={checkoutPhone}
                onChange={(e) => setCheckoutPhone(e.target.value)}
                className="pp-form-input text-sm w-full" />
              {checkoutError && (
                <p className="text-xs font-semibold" style={{ color: "hsl(0 70% 60%)" }}>{checkoutError}</p>
              )}
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold uppercase tracking-wide"
                  style={{ background: "hsl(0 0% 100% / 0.15)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.25)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t.backBtn}
                </motion.button>
                <motion.button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="flex-[2] py-3 rounded-xl text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2"
                  style={{ 
                    background: checkoutLoading ? "hsl(0 0% 100% / 0.2)" : "hsl(140 60% 45%)", 
                    color: "hsl(0 0% 100%)", 
                    border: "1px solid hsl(0 0% 100% / 0.3)" 
                  }}
                  whileHover={checkoutLoading ? {} : { scale: 1.01 }} 
                  whileTap={checkoutLoading ? {} : { scale: 0.98 }}
                >
                  {checkoutLoading ? t.checkoutLoadingBtn : t.payNowBtn} 
                  {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
                </motion.button>
              </div>
            </motion.div>
          )}
        </>
      )}

      <a href={instagramUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition-all hover:opacity-100"
        style={{ color: "hsl(0 0% 100% / 0.8)", border: "1px solid hsl(0 0% 100% / 0.25)", background: "hsl(0 0% 100% / 0.1)" }}>
        <Instagram className="w-3.5 h-3.5" /> {instagramHandle}
      </a>

      <div className="space-y-2 pt-2">
        {event.infoSections.map((s) => (
          <InfoAccordion key={s.id} id={s.id} title={s.title} content={s.content} t={t} />
        ))}
      </div>

      <NearbyEvents currentSlug={citySlug} currentCity={event.city} t={t} />
    </div>
  );
};

/* ─── Hero ─── */
const CityHero = ({ cityName, event, events, selectedId, onSelect, t }: { cityName: string; event: CityEvent; events: CityEvent[]; selectedId: string; onSelect: (id: string) => void; t: Translations }) => (
  <motion.div className="flex flex-col items-center text-center relative"
    initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase leading-[0.9]"
      style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)", textShadow: "0 2px 6px hsl(210 80% 15% / 0.7)" }}>
      {cityName}
    </h1>
    <p className="text-sm sm:text-lg md:text-xl font-extrabold uppercase tracking-[0.15em] mt-0.5 sm:mt-3"
      style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 4px hsl(210 80% 15% / 0.7)" }}>
      {t.tourSubtitle}
    </p>
    {event.openAir && (
      <motion.div className="flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-bold uppercase"
        style={{ background: "hsl(45 100% 50%)", color: "hsl(0 0% 10%)" }}
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
        <Sun className="w-3.5 h-3.5" /> Open Air
      </motion.div>
    )}
    <div className="flex items-center justify-center gap-4 sm:gap-8 mt-0.5 sm:mt-4 text-[11px] sm:text-sm font-bold uppercase tracking-wider"
      style={{ color: "hsl(0 0% 100%)", textShadow: "0 1px 3px hsl(210 80% 15% / 0.7)" }}>
      <span>{event.dateShort}</span>
      <span>{t.from} {event.time} {t.clock}</span>
      <span>{event.city.toUpperCase()}</span>
    </div>
    <div className="w-full flex justify-center -mt-1 sm:mt-4">
      <img src={headerImg} alt="Mamma Mia Party" className="w-[90%] max-w-[360px] sm:max-w-[460px] lg:max-w-[520px] object-contain" />
    </div>
    {events.length > 1 && (
      <div className="-mt-2 sm:mt-6">
        <h2 className="text-center text-[10px] sm:text-sm font-bold uppercase tracking-widest mb-2 sm:mb-4" style={{ color: "hsl(0 0% 100% / 0.95)" }}>
          {t.selectDate}
        </h2>
        <EventDateTiles events={events} selectedId={selectedId} onSelect={onSelect} t={t} />
      </div>
    )}
  </motion.div>
);

/* ─── Footer ─── */
const CityFooter = ({ t }: { t: Translations }) => (
  <footer className="mt-8 sm:mt-12 pb-6 sm:pb-8">
    <div className="text-center mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed" style={{ color: "hsl(0 0% 100%)" }}>
      <p>{t.footerQuestion}</p>
      <p>{t.footerContact} <a href="mailto:info@gimmegimmeparty.com" className="underline hover:opacity-80">info@gimmegimmeparty.com</a></p>
    </div>
    <div className="hidden md:flex items-start justify-between gap-6 lg:gap-8">
      <div className="flex-1">
        <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="text-xs lg:text-sm font-medium opacity-80 hover:opacity-100" style={{ color: "hsl(0 0% 100%)" }}>powered by smea</a>
        <p className="text-xs lg:text-sm mt-2 lg:mt-3 max-w-xs lg:max-w-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
          {t.footerOrganizer}
        </p>
      </div>
      <div className="flex flex-wrap gap-4 lg:gap-6 text-xs lg:text-sm">
        <a href="/impressum" className="footer-link">{t.imprint}</a>
        <a href="/datenschutz" className="footer-link">{t.privacy}</a>
        <a href="/agb" className="footer-link">{t.terms}</a>
      </div>
    </div>
    <div className="md:hidden text-center space-y-3">
      <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="text-xs font-medium opacity-80 hover:opacity-100 inline-block" style={{ color: "hsl(0 0% 100%)" }}>powered by smea</a>
      <p className="text-xs px-4 leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.9)" }}>{t.footerOrganizer}</p>
      <div className="flex justify-center gap-4 text-xs">
        <a href="/impressum" className="footer-link">{t.imprint}</a>
        <a href="/datenschutz" className="footer-link">{t.privacy}</a>
        <a href="/agb" className="footer-link">{t.terms}</a>
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
  const [t, setT] = useState<Translations>(getTranslations("Berlin"));

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

      const city = series.city || series.title;
      setCityName(city);
      const translations = getTranslations(city);
      setT(translations);

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
        weekday: e.date ? getWeekday(e.date, translations.weekdays) : "",
        time: e.time || "20:00",
        venue: e.location_name || "TBA",
        address: e.location_address || e.city || "",
        city: e.city || series.city || "",
        openAir: e.tag === "Open Air",
        soldOut: false,
        ticketLink: e.ticket_link,
        infoSections: [],
      }));

      mapped.forEach((m) => { m.infoSections = makeInfoSections(m, translations); });

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
        <div className="text-lg font-bold uppercase tracking-wider animate-pulse" style={{ color: "hsl(0 0% 100%)" }}>{t.loading}</div>
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-8 lg:py-12">
        <div className="hidden md:grid md:grid-cols-2 gap-6 lg:gap-8 items-start">
          <CityHero cityName={cityName} event={selectedEvent} events={events} selectedId={selectedEventId} onSelect={setSelectedEventId} t={t} />
          <motion.div key={selectedEvent.id} initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <CityTicketWidget event={selectedEvent} allEvents={events} citySlug={citySlug!} t={t} />
          </motion.div>
        </div>
        <div className="md:hidden space-y-2">
          <motion.div key={`hero-${selectedEvent.id}`} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <CityHero cityName={cityName} event={selectedEvent} events={events} selectedId={selectedEventId} onSelect={setSelectedEventId} t={t} />
          </motion.div>
          <motion.div key={`tickets-${selectedEvent.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <CityTicketWidget event={selectedEvent} allEvents={events} citySlug={citySlug!} t={t} />
          </motion.div>
        </div>
        <CityFooter t={t} />
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
