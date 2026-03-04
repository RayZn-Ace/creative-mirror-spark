import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Globe } from "lucide-react";

// Country mapping for common cities
const CITY_COUNTRY: Record<string, string> = {
  // Deutschland
  Berlin: "Deutschland", Hamburg: "Deutschland", München: "Deutschland", Köln: "Deutschland",
  Frankfurt: "Deutschland", Stuttgart: "Deutschland", Düsseldorf: "Deutschland", Dortmund: "Deutschland",
  Essen: "Deutschland", Leipzig: "Deutschland", Bremen: "Deutschland", Dresden: "Deutschland",
  Hannover: "Deutschland", Nürnberg: "Deutschland", Duisburg: "Deutschland", Bochum: "Deutschland",
  Wuppertal: "Deutschland", Bielefeld: "Deutschland", Bonn: "Deutschland", Münster: "Deutschland",
  Karlsruhe: "Deutschland", Mannheim: "Deutschland", Augsburg: "Deutschland", Wiesbaden: "Deutschland",
  Gelsenkirchen: "Deutschland", Braunschweig: "Deutschland", Kiel: "Deutschland", Chemnitz: "Deutschland",
  Aachen: "Deutschland", Halle: "Deutschland", Magdeburg: "Deutschland", Freiburg: "Deutschland",
  Krefeld: "Deutschland", Lübeck: "Deutschland", Oberhausen: "Deutschland", Erfurt: "Deutschland",
  Mainz: "Deutschland", Rostock: "Deutschland", Kassel: "Deutschland", Hagen: "Deutschland",
  Saarbrücken: "Deutschland", Hamm: "Deutschland", Mülheim: "Deutschland", Potsdam: "Deutschland",
  Ludwigshafen: "Deutschland", Oldenburg: "Deutschland", Leverkusen: "Deutschland", Osnabrück: "Deutschland",
  Solingen: "Deutschland", Heidelberg: "Deutschland", Herne: "Deutschland", Neuss: "Deutschland",
  Darmstadt: "Deutschland", Paderborn: "Deutschland", Regensburg: "Deutschland", Ingolstadt: "Deutschland",
  Würzburg: "Deutschland", Wolfsburg: "Deutschland", Ulm: "Deutschland", Göttingen: "Deutschland",
  Offenbach: "Deutschland", Heilbronn: "Deutschland", Pforzheim: "Deutschland", Recklinghausen: "Deutschland",
  Bottrop: "Deutschland", Reutlingen: "Deutschland", Koblenz: "Deutschland", Remscheid: "Deutschland",
  Bergisch: "Deutschland", Trier: "Deutschland", Jena: "Deutschland", Erlangen: "Deutschland",
  Moers: "Deutschland", Siegen: "Deutschland", Hildesheim: "Deutschland", Salzgitter: "Deutschland",
  Cottbus: "Deutschland", Kaiserslautern: "Deutschland", Gütersloh: "Deutschland", Schwerin: "Deutschland",
  Witten: "Deutschland", Gera: "Deutschland", Iserlohn: "Deutschland", Zwickau: "Deutschland",
  Lünen: "Deutschland", Konstanz: "Deutschland", Marburg: "Deutschland", Gießen: "Deutschland",
  Esslingen: "Deutschland", Ludwigsburg: "Deutschland", Tübingen: "Deutschland", Flensburg: "Deutschland",
  Villingen: "Deutschland", Neumünster: "Deutschland", Plauen: "Deutschland", Minden: "Deutschland",
  Worms: "Deutschland", Dessau: "Deutschland", Norderstedt: "Deutschland", Dorsten: "Deutschland",
  Detmold: "Deutschland", Gladbeck: "Deutschland", Friedrichshafen: "Deutschland", Bamberg: "Deutschland",
  Bayreuth: "Deutschland", Lüneburg: "Deutschland", Celle: "Deutschland", Aschaffenburg: "Deutschland",
  Weimar: "Deutschland", Fulda: "Deutschland", Landshut: "Deutschland", Stralsund: "Deutschland",
  Greifswald: "Deutschland", Görlitz: "Deutschland", Passau: "Deutschland", Ravensburg: "Deutschland",
  // Österreich
  Wien: "Österreich", Graz: "Österreich", Linz: "Österreich", Salzburg: "Österreich",
  Innsbruck: "Österreich", Klagenfurt: "Österreich", Villach: "Österreich", Wels: "Österreich",
  "St. Pölten": "Österreich", Dornbirn: "Österreich", Bregenz: "Österreich",
  // Schweiz
  Zürich: "Schweiz", Genf: "Schweiz", Basel: "Schweiz", Bern: "Schweiz",
  Lausanne: "Schweiz", Winterthur: "Schweiz", Luzern: "Schweiz", "St. Gallen": "Schweiz",
  Lugano: "Schweiz",
  // Niederlande
  Amsterdam: "Niederlande", Rotterdam: "Niederlande", "Den Haag": "Niederlande", Utrecht: "Niederlande",
  Eindhoven: "Niederlande", Groningen: "Niederlande", Tilburg: "Niederlande", Almere: "Niederlande",
  // Belgien
  Brüssel: "Belgien", Antwerpen: "Belgien", Gent: "Belgien", Brügge: "Belgien", Lüttich: "Belgien",
  // Frankreich
  Paris: "Frankreich", Lyon: "Frankreich", Marseille: "Frankreich", Toulouse: "Frankreich",
  Nizza: "Frankreich", Nantes: "Frankreich", Strasbourg: "Frankreich", Bordeaux: "Frankreich",
  Lille: "Frankreich", Montpellier: "Frankreich",
  // Italien
  Rom: "Italien", Mailand: "Italien", Neapel: "Italien", Turin: "Italien",
  Florenz: "Italien", Bologna: "Italien", Venedig: "Italien", Verona: "Italien",
  // Spanien
  Madrid: "Spanien", Barcelona: "Spanien", Valencia: "Spanien", Sevilla: "Spanien",
  Bilbao: "Spanien", Málaga: "Spanien",
  // UK
  London: "UK", Manchester: "UK", Birmingham: "UK", Glasgow: "UK", Liverpool: "UK",
  Edinburgh: "UK", Bristol: "UK", Leeds: "UK",
  // Skandinavien
  Kopenhagen: "Dänemark", Aarhus: "Dänemark",
  Stockholm: "Schweden", Göteborg: "Schweden", Malmö: "Schweden",
  Oslo: "Norwegen", Bergen: "Norwegen",
  Helsinki: "Finnland",
  // Osteuropa
  Prag: "Tschechien", Brünn: "Tschechien",
  Warschau: "Polen", Krakau: "Polen", Breslau: "Polen", Danzig: "Polen",
  Budapest: "Ungarn",
  Bukarest: "Rumänien",
  // Luxemburg
  Luxemburg: "Luxemburg",
};

function getCountry(city: string): string {
  return CITY_COUNTRY[city] || "Sonstige";
}

interface CitySearchFilterProps {
  cities: string[];
  value: string;
  onChange: (v: string) => void;
  /** compact mode for inline filters */
  compact?: boolean;
}

export const CitySearchFilter = ({ cities, value, onChange, compact }: CitySearchFilterProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Group cities by country
  const countryCities = useMemo(() => {
    const map = new Map<string, string[]>();
    cities.forEach((c) => {
      const country = getCountry(c);
      if (!map.has(country)) map.set(country, []);
      map.get(country)!.push(c);
    });
    // Sort countries: Deutschland first, then alphabetical
    const sorted = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Deutschland") return -1;
      if (b === "Deutschland") return 1;
      if (a === "Sonstige") return 1;
      if (b === "Sonstige") return -1;
      return a.localeCompare(b);
    });
    return sorted;
  }, [cities]);

  const countries = useMemo(() => countryCities.map(([c]) => c), [countryCities]);

  const filtered = useMemo(() => {
    let result = cities;
    if (countryFilter !== "all") {
      result = result.filter((c) => getCountry(c) === countryFilter);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((c) => c.toLowerCase().includes(q));
    }
    return result;
  }, [cities, query, countryFilter]);

  // Group filtered results by country
  const groupedFiltered = useMemo(() => {
    const map = new Map<string, string[]>();
    filtered.forEach((c) => {
      const country = getCountry(c);
      if (!map.has(country)) map.set(country, []);
      map.get(country)!.push(c);
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === "Deutschland") return -1;
      if (b === "Deutschland") return 1;
      if (a === "Sonstige") return 1;
      if (b === "Sonstige") return -1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  return (
    <div className="relative" ref={ref}>
      <div
        className={`flex items-center gap-2 rounded-lg cursor-pointer ${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"} min-w-[160px]`}
        style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: `1px solid ${value !== "all" ? "hsl(215 90% 55% / 0.4)" : "hsl(0 0% 100% / 0.1)"}` }}
        onClick={() => setOpen(!open)}
      >
        <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: value !== "all" ? "hsl(215 90% 55%)" : "hsl(0 0% 100% / 0.3)" }} />
        <span className="truncate flex-1" style={{ color: value !== "all" ? "hsl(215 90% 55%)" : "hsl(0 0% 100% / 0.5)" }}>
          {value === "all" ? "Stadt filtern…" : value}
        </span>
        {value !== "all" && (
          <X
            className="w-3.5 h-3.5 shrink-0 hover:opacity-80"
            style={{ color: "hsl(0 0% 100% / 0.4)" }}
            onClick={(e) => { e.stopPropagation(); onChange("all"); setQuery(""); setCountryFilter("all"); }}
          />
        )}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 w-full min-w-[240px] rounded-xl overflow-hidden shadow-xl"
            style={{ background: "hsl(220 50% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
          >
            {/* Search */}
            <div className="p-2 space-y-1.5">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Stadt suchen…"
                className="w-full px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              />
              {/* Country filter pills */}
              {countries.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setCountryFilter("all")}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors"
                    style={{
                      background: countryFilter === "all" ? "hsl(215 90% 55%)" : "hsl(0 0% 100% / 0.08)",
                      color: countryFilter === "all" ? "#fff" : "hsl(0 0% 100% / 0.5)",
                    }}
                  >
                    Alle
                  </button>
                  {countries.map((country) => (
                    <button
                      key={country}
                      onClick={() => setCountryFilter(countryFilter === country ? "all" : country)}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors"
                      style={{
                        background: countryFilter === country ? "hsl(215 90% 55%)" : "hsl(0 0% 100% / 0.08)",
                        color: countryFilter === country ? "#fff" : "hsl(0 0% 100% / 0.5)",
                      }}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* City list grouped by country */}
            <div className="max-h-[240px] overflow-y-auto">
              {groupedFiltered.length === 0 ? (
                <div className="px-3 py-2 text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Keine Stadt gefunden</div>
              ) : (
                groupedFiltered.map(([country, countryCityList]) => (
                  <div key={country}>
                    {countryFilter === "all" && groupedFiltered.length > 1 && (
                      <div
                        className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 sticky top-0"
                        style={{ color: "hsl(0 0% 100% / 0.35)", background: "hsl(220 50% 10%)", borderBottom: "1px solid hsl(0 0% 100% / 0.05)" }}
                      >
                        <Globe className="w-3 h-3" />
                        {country}
                      </div>
                    )}
                    {countryCityList.map((city) => (
                      <button
                        key={city}
                        onClick={() => { onChange(city); setOpen(false); setQuery(""); }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                        style={{ color: city === value ? "hsl(215 90% 55%)" : "hsl(0 0% 100% / 0.7)" }}
                      >
                        <MapPin className="w-3 h-3 shrink-0" style={{ color: "hsl(215 90% 55% / 0.5)" }} />
                        {city}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
