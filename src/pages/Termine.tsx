import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Calendar, ArrowRight, Ticket, Navigation, X, ChevronDown, Sun, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportChatbot from "@/components/SupportChatbot";
import { supabase } from "@/integrations/supabase/client";
import { getGlobalTranslations, getBrowserLang } from "@/lib/i18n";

/* ─── City name aliases (multilingual) ─── */
const CITY_ALIASES: Record<string, string[]> = {
  Aachen: ["Aix-la-Chapelle", "Aken", "Akwizgran"],
  Amsterdam: ["Ámsterdam"],
  Antwerpen: ["Antwerp", "Anvers", "Amberes", "Anversa"],
  Augsburg: ["Augusta"],
  Berlin: ["Berlín", "Berlino", "Berlim"],
  Dresden: ["Dresde", "Dresda"],
  Düsseldorf: ["Dusseldorf", "Duesseldorf"],
  Frankfurt: ["Francfort", "Francoforte", "Fráncfort"],
  Hamburg: ["Hamburgo", "Hambourg", "Amburgo"],
  Hannover: ["Hanover", "Hanovre", "Hanóver"],
  Köln: ["Cologne", "Colonia", "Kolonia", "Keulen"],
  Krakow: ["Kraków", "Cracow", "Cracovia", "Cracovie", "Krakau"],
  Leipzig: ["Lipsia", "Lípsia"],
  Luxembourg: ["Luxemburg", "Luxemburgo", "Lussemburgo", "Luksemburg"],
  München: ["Munich", "Múnich", "Monaco di Baviera", "Munique", "Monachium"],
  Nürnberg: ["Nuremberg", "Norimberga", "Núremberg", "Norymberga"],
  Paris: ["Parigi", "Paryż", "Paříž"],
  Salzburg: ["Salisburgo", "Salzburgo"],
  SãoPaulo: ["São Paulo", "Sao Paulo", "San Pablo"],
  Stuttgart: ["Stoccarda", "Estugarda", "Sztutgart"],
  Wien: ["Vienna", "Vienne", "Viena", "Bécs", "Vídeň", "Wiedeń"],
  Zadar: ["Zara"],
  Zürich: ["Zurich", "Zurigo", "Zúrich", "Curych"],
};

/** Normalize diacritics: ã→a, ü→u, é→e etc. */
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Check if a city matches a search query (including multilingual aliases + diacritics) */
const cityMatchesSearch = (city: string, query: string): boolean => {
  const q = normalize(query);
  if (normalize(city).includes(q)) return true;
  const aliases = CITY_ALIASES[city];
  if (aliases) return aliases.some(a => normalize(a).includes(q));
  for (const [key, list] of Object.entries(CITY_ALIASES)) {
    if (key.toLowerCase() === city.toLowerCase()) {
      return list.some(a => normalize(a).includes(q));
    }
  }
  return false;
};

/* ─── City Coordinates ─── */
const CITY_COORDS: Record<string, [number, number]> = {
  Aachen:[50.7753,6.0839],Albstadt:[48.2106,9.0254],Amsterdam:[52.3676,4.9041],
  Antwerpen:[51.2194,4.4025],Apolda:[51.0260,11.5152],Augsburg:[48.3705,10.8978],
  Bautzen:[51.1814,14.4244],Berlin:[52.5200,13.4050],Bielefeld:[52.0302,8.5325],
  Bochum:[51.4818,7.2162],Bonn:[50.7374,7.0982],Bottrop:[51.5247,6.9227],
  Buxtehude:[53.4677,9.6861],Darmstadt:[49.8728,8.6512],Dortmund:[51.5136,7.4653],
  Dresden:[51.0504,13.7373],Düsseldorf:[51.2277,6.7735],Erfurt:[50.9787,11.0328],
  Essen:[51.4556,7.0116],Frankfurt:[50.1109,8.6821],Hamburg:[53.5511,9.9937],
  Hannover:[52.3759,9.7320],Karlsruhe:[49.0069,8.4037],Köln:[50.9375,6.9603],
  Krakow:[50.0647,19.9450],Leipzig:[51.3397,12.3731],Linz:[48.3069,14.2858],
  Luxembourg:[49.6117,6.1300],München:[48.1351,11.5820],Nürnberg:[49.4521,11.0767],
  Paris:[48.8566,2.3522],Salzburg:[47.8095,13.0550],SãoPaulo:[-23.5505,-46.6333],
  Stuttgart:[48.7758,9.1829],Wien:[48.2082,16.3738],Zadar:[44.1194,15.2314],
  Zürich:[47.3769,8.5417],
};

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getCityCoords = (city: string): [number, number] | null => {
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  for (const [key, val] of Object.entries(CITY_COORDS)) {
    if (key.toLowerCase() === city.toLowerCase().replace(/\s+/g, "")) return val;
  }
  return null;
};

/* ─── i18n for this page ─── */
const termineI18n: Record<string, Record<string, string>> = {
  de: {
    title: "ALLE TERMINE",
    subtitle: "Finde dein Event in deiner Nähe",
    searchPlaceholder: "Stadt oder Location suchen...",
    nearYou: "In deiner Nähe",
    allCities: "Alle Städte",
    noResults: "Keine Events gefunden",
    noResultsHint: "Versuche einen anderen Suchbegriff",
    kmAway: "km entfernt",
    tickets: "Tickets",
    dates: "Termine",
    rangeLabel: "Umkreis",
    rangeAll: "Alle",
    locationDenied: "Standort nicht verfügbar – sortiert nach Alphabet",
    nextDate: "Nächster Termin",
    moreDates: "weitere Termine",
  },
  en: {
    title: "ALL DATES",
    subtitle: "Find your event nearby",
    searchPlaceholder: "Search city or venue...",
    nearYou: "Near you",
    allCities: "All cities",
    noResults: "No events found",
    noResultsHint: "Try a different search term",
    kmAway: "km away",
    tickets: "Tickets",
    dates: "Dates",
    rangeLabel: "Range",
    rangeAll: "All",
    locationDenied: "Location unavailable – sorted alphabetically",
    nextDate: "Next date",
    moreDates: "more dates",
  },
  nl: {
    title: "ALLE DATA",
    subtitle: "Vind je evenement in de buurt",
    searchPlaceholder: "Zoek stad of locatie...",
    nearYou: "In de buurt",
    allCities: "Alle steden",
    noResults: "Geen evenementen gevonden",
    noResultsHint: "Probeer een andere zoekterm",
    kmAway: "km verwijderd",
    tickets: "Tickets",
    dates: "Data",
    rangeLabel: "Bereik",
    rangeAll: "Alle",
    locationDenied: "Locatie niet beschikbaar – alfabetisch gesorteerd",
    nextDate: "Volgende datum",
    moreDates: "meer data",
  },
  fr: {
    title: "TOUTES LES DATES",
    subtitle: "Trouvez votre événement à proximité",
    searchPlaceholder: "Rechercher une ville ou un lieu...",
    nearYou: "Près de chez vous",
    allCities: "Toutes les villes",
    noResults: "Aucun événement trouvé",
    noResultsHint: "Essayez un autre terme de recherche",
    kmAway: "km",
    tickets: "Billets",
    dates: "Dates",
    rangeLabel: "Rayon",
    rangeAll: "Tous",
    locationDenied: "Localisation indisponible – tri alphabétique",
    nextDate: "Prochaine date",
    moreDates: "autres dates",
  },
  pl: {
    title: "WSZYSTKIE TERMINY",
    subtitle: "Znajdź wydarzenie w pobliżu",
    searchPlaceholder: "Szukaj miasta lub miejsca...",
    nearYou: "W pobliżu",
    allCities: "Wszystkie miasta",
    noResults: "Nie znaleziono wydarzeń",
    noResultsHint: "Spróbuj innego hasła",
    kmAway: "km",
    tickets: "Bilety",
    dates: "Terminy",
    rangeLabel: "Zasięg",
    rangeAll: "Wszystkie",
    locationDenied: "Lokalizacja niedostępna – sortowanie alfabetyczne",
    nextDate: "Następny termin",
    moreDates: "więcej terminów",
  },
};

const getTermineT = (lang: string) => termineI18n[lang] || termineI18n.en || termineI18n.de;

/* ─── Derive category from event title ─── */
const deriveCategory = (title: string): string => {
  const t = title.toUpperCase();
  if (t.includes("MAMMA MIA") || t.includes("ABBA")) return "Mamma Mia";
  if (t.includes("COLLEGE CLUB")) return "College Club";
  if (t.includes("PROJECT") || t.includes("PROJEKT")) return "Project Party";
  if (t.includes("MÄDELSABEND") || t.includes("MAEDELSABEND")) return "Mädelsabend";
  if (t.includes("90ER") || t.includes("90S") || t.includes("90'S")) return "90er Party";
  if (t.includes("16+")) return "16+ Events";
  if (t.includes("OPEN AIR")) return "Open Air";
  if (t.includes("FESTIVAL")) return "Festival";
  return "Sonstige";
};

/* ─── Types ─── */
interface CityGroup {
  city: string;
  slug: string;
  coords: [number, number] | null;
  km: number | null;
  events: { id: string; date: string; time: string | null; locationName: string | null; soldOut: boolean; openAir: boolean }[];
  imageUrl: string | null;
  category: string;
}

const RANGE_OPTIONS = [50, 100, 200, 500, 0]; // 0 = all

export default function Termine() {
  const lang = getBrowserLang();
  const gt = getGlobalTranslations(lang);
  const t = getTermineT(lang);
  const [search, setSearch] = useState("");
  const [cityGroups, setCityGroups] = useState<CityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [rangeKm, setRangeKm] = useState(0); // 0 = all
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch all published events grouped by series/city
  useEffect(() => {
    const load = async () => {
      const { data: series } = await supabase
        .from("event_series")
        .select("id, slug, city, image_url")
        .eq("status", "published");

      const { data: events } = await supabase
        .from("events")
        .select("id, series_id, date, time, location_name, sold_out, open_air, city, status, slug, title, subtitle, image_url, tag")
        .eq("status", "published")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (!events) { setLoading(false); return; }

      const groups: CityGroup[] = [];
      const usedEventIds = new Set<string>();

      // 1) Series-based groups
      (series || []).forEach((s) => {
        const cityEvents = events
          .filter((e) => e.series_id === s.id)
          .map((e) => {
            usedEventIds.add(e.id);
            return {
              id: e.id,
              date: e.date || "",
              time: e.time,
              locationName: e.location_name,
              soldOut: e.sold_out || false,
              openAir: e.open_air || false,
            };
          });

        if (cityEvents.length > 0) {
          const city = s.city || "Unknown";
          const firstEvent = events.find((e) => e.series_id === s.id);
          groups.push({
            city,
            slug: s.slug,
            coords: getCityCoords(city),
            km: null,
            events: cityEvents,
            imageUrl: s.image_url,
            category: deriveCategory(firstEvent?.title || s.slug),
          });
        }
      });

      // 2) Standalone events (no series_id) – group by slug
      const standaloneEvents = events.filter((e) => !usedEventIds.has(e.id));
      standaloneEvents.forEach((e) => {
        const city = e.city || "Unknown";
        groups.push({
          city: e.title || city,
          slug: e.slug,
          coords: getCityCoords(city),
          km: null,
          events: [{
            id: e.id,
            date: e.date || "",
            time: e.time,
            locationName: e.location_name,
            soldOut: e.sold_out || false,
            openAir: e.open_air || false,
          }],
          imageUrl: e.image_url,
          category: deriveCategory(e.title || ""),
        });
      });

      setCityGroups(groups);
      setLoading(false);
    };
    load();
  }, []);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("denied");
      return;
    }

    // Try saved checkout info city as fallback
    const savedInfo = JSON.parse(localStorage.getItem("gimme_checkout_info") || "{}");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLocationStatus("granted");
      },
      () => {
        // Fallback: try to guess from saved city or timezone
        if (savedInfo.city) {
          const coords = getCityCoords(savedInfo.city);
          if (coords) {
            setUserPos(coords);
            setLocationStatus("granted");
            return;
          }
        }
        // Timezone-based rough guess
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz.includes("Berlin") || tz.includes("Europe/Berlin")) setUserPos([52.52, 13.405]);
        else if (tz.includes("Vienna")) setUserPos([48.2082, 16.3738]);
        else if (tz.includes("Zurich")) setUserPos([47.3769, 8.5417]);
        else if (tz.includes("Amsterdam")) setUserPos([52.3676, 4.9041]);
        else if (tz.includes("Paris")) setUserPos([48.8566, 2.3522]);
        else if (tz.includes("Warsaw")) setUserPos([52.2297, 21.0122]);
        else setUserPos([51.1657, 10.4515]); // center of Germany as last resort
        setLocationStatus("denied");
      },
      { timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  // Calculate distances and sort
  const sortedGroups = useMemo(() => {
    let groups = cityGroups.map((g) => {
      if (!userPos || !g.coords) return { ...g, km: null };
      const km = Math.round(haversineKm(userPos[0], userPos[1], g.coords[0], g.coords[1]));
      return { ...g, km };
    });

    // Filter by range
    if (rangeKm > 0) {
      groups = groups.filter((g) => g.km !== null && g.km <= rangeKm);
    }

    // Filter by search (multilingual city names + location)
    if (search.trim()) {
      const q = search.toLowerCase();
      groups = groups.filter(
        (g) =>
          cityMatchesSearch(g.city, q) ||
          g.events.some((e) => e.locationName?.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (selectedCategory) {
      groups = groups.filter((g) => g.category === selectedCategory);
    }

    // Sort by distance (if available), then alphabetically
    groups.sort((a, b) => {
      if (a.km !== null && b.km !== null) return a.km - b.km;
      if (a.km !== null) return -1;
      if (b.km !== null) return 1;
      return a.city.localeCompare(b.city);
    });

    return groups;
  }, [cityGroups, userPos, search, rangeKm, selectedCategory]);

  // Derive available categories from all groups
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    cityGroups.forEach((g) => cats.add(g.category));
    return Array.from(cats).sort();
  }, [cityGroups]);

  const formatDate = useCallback((iso: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const weekdayShort = d.toLocaleDateString(lang === "de" ? "de-DE" : lang, { weekday: "short" });
    return `${weekdayShort}, ${dd}.${mm}.${yyyy}`;
  }, [lang]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar gt={gt} />

      {/* Hero */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="container relative z-10 text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-3"
          >
            {t.title.split(" ")[0]}{" "}
            <span className="text-gradient-primary">{t.title.split(" ").slice(1).join(" ")}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto"
          >
            {t.subtitle}
          </motion.p>
        </div>
      </section>

      {/* Search + Filters */}
      <div className="container px-4 -mt-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-border bg-card/80 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Range filter */}
          <div className="relative">
            <button
              onClick={() => setShowRangeDropdown(!showRangeDropdown)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-border bg-card/80 backdrop-blur-sm hover:bg-muted/50 transition-colors whitespace-nowrap"
            >
              <Navigation className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {rangeKm > 0 ? `${rangeKm} km` : t.rangeAll}
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showRangeDropdown ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showRangeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[140px]"
                >
                  {RANGE_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRangeKm(r); setShowRangeDropdown(false); }}
                      className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                        rangeKm === r ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {r > 0 ? `${r} km` : t.rangeAll}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toggle filters */}
        <div className="flex flex-wrap gap-2 max-w-3xl mx-auto mt-3">
          <button
            onClick={() => setOnlyOpenAir(!onlyOpenAir)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              onlyOpenAir
                ? "border-amber-500/50 bg-amber-500/15 text-amber-400"
                : "border-border bg-card/80 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Nur Open Air
          </button>
          <button
            onClick={() => setShowSoldOut(!showSoldOut)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              !showSoldOut
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border bg-card/80 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Ausverkaufte ausblenden
          </button>
        </div>

        {locationStatus === "denied" && (
          <p className="text-center text-xs text-muted-foreground mt-3">{t.locationDenied}</p>
        )}
      </div>

      {/* Results */}
      <div className="container px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : sortedGroups.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t.noResults}</h3>
            <p className="text-muted-foreground">{t.noResultsHint}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedGroups.map((group, idx) => (
              <motion.div
                key={group.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.04, 0.4) }}
              >
                <Link
                  to={`/${group.slug}`}
                  className="group block rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  {/* Image */}
                  {group.imageUrl && (
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={group.imageUrl}
                        alt={group.city}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                      {group.km !== null && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-background/90 text-xs font-medium">
                          <MapPin className="w-3 h-3 text-primary" />
                          {group.km} {t.kmAway}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5">
                    {/* City name + distance */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-display uppercase tracking-wide group-hover:text-primary transition-colors" style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
                          {group.city}
                        </h3>
                        {group.events[0]?.locationName && (
                          <p className="text-sm text-muted-foreground mt-0.5">{group.events[0].locationName}</p>
                        )}
                      </div>
                      {!group.imageUrl && group.km !== null && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full shrink-0">
                          <MapPin className="w-3 h-3 text-primary" />
                          {group.km} km
                        </span>
                      )}
                    </div>

                    {/* All dates listed */}
                    {/* All dates as horizontal wrap */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {group.events.map((ev) => (
                        <span
                          key={ev.id}
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${
                            ev.soldOut
                              ? "border-destructive/30 bg-destructive/10 text-destructive line-through"
                              : ev.openAir
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                              : "border-border bg-muted/30 text-foreground"
                          }`}
                        >
                          {ev.openAir && <Sun className="w-3 h-3" />}
                          {ev.soldOut && <XCircle className="w-3 h-3" />}
                          {formatDate(ev.date)}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                        <Ticket className="w-4 h-4" />
                        {t.tickets}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Count */}
        {!loading && sortedGroups.length > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-8">
            {sortedGroups.length} {sortedGroups.length === 1 ? "Stadt" : t.dates === "Termine" ? "Städte" : "cities"}
          </p>
        )}
      </div>

      <Footer gt={gt} />
      <SupportChatbot />
    </div>
  );
}
