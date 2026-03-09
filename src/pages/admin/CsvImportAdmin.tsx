import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Loader2, X, Eye, Ticket, TrendingUp, Users, DollarSign, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─── */
interface ParsedRow {
  checkoutId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ticketType: string;
  pricePerTicket: number;
  quantity: number;
  subtotal: number;
  fees: number;
  totalWithFees: number;
  taxRate: number;
  taxes: number;
  grossTotal: number;
}

interface ImportConfig {
  eventTitle: string;
  eventDate: string;
  eventCity: string;
  eventLocation: string;
  eventSlug: string;
}

/* ─── Helpers ─── */
const parseEuro = (val: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace("€", "").replace(",", ".").trim()) || 0;
};

const parsePercent = (val: string): number => {
  if (!val) return 0;
  return parseFloat(val.replace("%", "").trim()) || 0;
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ";") { result.push(current.trim()); current = ""; }
      else current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

export const parseFilename = (filename: string): { title: string; date: string; city: string; location: string } => {
  const name = filename.replace(/\.csv$/i, "");
  // Try to extract date (YYYY-MM-DD or DD.MM.YYYY or DD-MM-YYYY)
  const isoMatch = name.match(/(\d{4})-(\d{2})-(\d{2})/);
  const euMatch = name.match(/(\d{2})[.\-](\d{2})[.\-](\d{4})/);
  let date = "";
  let rest = name;
  if (isoMatch) {
    date = isoMatch[0];
    rest = name.replace(isoMatch[0], "");
  } else if (euMatch) {
    date = `${euMatch[3]}-${euMatch[2]}-${euMatch[1]}`;
    rest = name.replace(euMatch[0], "");
  }
  // Split remaining by common separators
  const parts = rest.split(/[-_\s]+/).filter(Boolean);
  // Known German cities for auto-detection
  const knownCities = ["Mainz","Berlin","Hamburg","München","Muenchen","Köln","Koeln","Frankfurt","Stuttgart","Dortmund","Essen","Leipzig","Dresden","Hannover","Düsseldorf","Duesseldorf","Bonn","Paderborn","Bielefeld","Aachen","Augsburg","Bochum","Braunschweig","Karlsruhe","Nürnberg","Nuernberg","Erfurt","Bautzen","Celle","Detmold","Bottrop","Salzburg","Wien","Zürich","Zuerich","Amsterdam","Paris"];
  // Known locations for auto-detection
  const knownLocations: Record<string, string> = {
    "penthouse": "Finn's Penthouse Eventlocation",
    "finns": "Finn's Penthouse Eventlocation",
    "finnspenthouse": "Finn's Penthouse Eventlocation",
    "stadtpark": "Stadtpark",
    "clubinio": "Clubinio",
    "warehouse": "Warehouse",
    "halle": "Halle",
    "fabrik": "Fabrik",
    "palace": "Palace",
    "arena": "Arena",
  };
  let city = "";
  let location = "";
  const titleParts: string[] = [];
  for (const p of parts) {
    const cityMatch = knownCities.find(c => c.toLowerCase() === p.toLowerCase());
    const locKey = Object.keys(knownLocations).find(k => k === p.toLowerCase());
    if (cityMatch && !city) { city = cityMatch; }
    else if (locKey && !location) { location = knownLocations[locKey]; }
    else { titleParts.push(p); }
  }
  const title = titleParts.join(" ").trim();
  return { title, date, city, location };
};

const generateSlug = (title: string, date: string): string => {
  const base = title
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const d = date ? `-${date}` : "";
  return `${base}${d}`;
};

/* ─── Inline styles (admin dark theme) ─── */
const s = {
  card: { background: "hsl(220 40% 10%)", border: "1px solid hsl(0 0% 100% / 0.06)", borderRadius: 12 },
  input: {
    background: "hsl(220 40% 8%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 8,
    color: "hsl(0 0% 100%)", padding: "8px 12px", fontSize: 14, width: "100%", outline: "none",
  } as React.CSSProperties,
  label: { color: "hsl(0 0% 100% / 0.6)", fontSize: 12, fontWeight: 600, marginBottom: 4, display: "block" } as React.CSSProperties,
  btn: {
    background: "hsl(230 80% 56%)", color: "#fff", border: "none", borderRadius: 8,
    padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  } as React.CSSProperties,
  btnOutline: {
    background: "transparent", color: "hsl(0 0% 100% / 0.7)", border: "1px solid hsl(0 0% 100% / 0.1)",
    borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  } as React.CSSProperties,
  muted: { color: "hsl(0 0% 100% / 0.4)", fontSize: 13 },
  white: { color: "hsl(0 0% 100%)" },
  accent: { color: "hsl(230 80% 56%)" },
};

export default function CsvImportAdmin() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [config, setConfig] = useState<ImportConfig>({
    eventTitle: "", eventDate: "", eventCity: "Mainz", eventLocation: "Finn's Penthouse", eventSlug: "",
  });
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [importLog, setImportLog] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [detectedFromFilename, setDetectedFromFilename] = useState<{ title: string; date: string; city: string; location: string } | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    // Auto-detect event info from filename
    const detected = parseFilename(f.name);
    setDetectedFromFilename(detected);
    setConfig(prev => ({
      ...prev,
      eventTitle: detected.title || prev.eventTitle,
      eventDate: detected.date || prev.eventDate,
      eventCity: detected.city || prev.eventCity,
      eventSlug: detected.title && detected.date ? generateSlug(detected.title, detected.date) : prev.eventSlug,
    }));
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast.error("CSV hat keine Datenzeilen"); return; }

      const rows: ParsedRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 10) continue;
        rows.push({
          checkoutId: cols[0] || "",
          firstName: cols[1] || "",
          lastName: cols[2] || "",
          email: cols[3] || "",
          phone: cols[4] || "",
          ticketType: cols[5] || "",
          pricePerTicket: parseEuro(cols[6]),
          quantity: parseInt(cols[7]) || 1,
          subtotal: parseEuro(cols[8]),
          fees: parseEuro(cols[9]),
          totalWithFees: parseEuro(cols[10]),
          taxRate: parsePercent(cols[11]),
          taxes: parseEuro(cols[12]),
          grossTotal: parseEuro(cols[20] || cols[10]),
        });
      }
      setParsed(rows);
      setStep("preview");
      toast.success(`${rows.length} Zeilen erkannt`);
    };
    reader.readAsText(f, "utf-8");
  }, []);

  const totalRevenue = parsed.reduce((s, r) => s + r.grossTotal, 0);
  const totalTickets = parsed.reduce((s, r) => s + r.quantity, 0);
  const totalFees = parsed.reduce((s, r) => s + r.fees, 0);
  const totalNet = parsed.reduce((s, r) => s + r.subtotal, 0);
  const totalTaxes = parsed.reduce((s, r) => s + r.taxes, 0);
  const uniqueEmails = new Set(parsed.map(r => r.email.toLowerCase().trim()));

  // Auto-detected ticket category breakdown
  const ticketBreakdown = useMemo(() => {
    const map: Record<string, { type: string; price: number; qty: number; revenue: number; fees: number }> = {};
    for (const r of parsed) {
      if (!map[r.ticketType]) map[r.ticketType] = { type: r.ticketType, price: r.pricePerTicket, qty: 0, revenue: 0, fees: 0 };
      map[r.ticketType].qty += r.quantity;
      map[r.ticketType].revenue += r.grossTotal;
      map[r.ticketType].fees += r.fees;
    }
    return Object.values(map);
  }, [parsed]);

  // Average order value
  const avgOrderValue = parsed.length > 0 ? totalRevenue / parsed.length : 0;
  const avgTicketsPerOrder = parsed.length > 0 ? totalTickets / parsed.length : 0;

  const doImport = async () => {
    if (!config.eventTitle || !config.eventDate) {
      toast.error("Bitte Event-Titel und Datum angeben");
      return;
    }
    setStep("importing");
    const log: string[] = [];
    const addLog = (msg: string) => { log.push(msg); setImportLog([...log]); };

    try {
      const slug = config.eventSlug || generateSlug(config.eventTitle, config.eventDate);

      // 1. Create past event
      addLog("Erstelle Event...");
      const { data: event, error: eventErr } = await supabase.from("events").insert({
        title: config.eventTitle,
        slug,
        date: config.eventDate,
        city: config.eventCity,
        location_name: config.eventLocation,
        status: "published",
        sold_out: true,
        tag: "Vergangenes Event",
      }).select().single();

      if (eventErr) throw new Error(`Event: ${eventErr.message}`);
      addLog(`✅ Event erstellt: ${event.title} (${event.id.slice(0, 8)}...)`);

      // 2. Create ticket category
      addLog("Erstelle Ticket-Kategorie...");
      const ticketTypes = [...new Set(parsed.map(r => r.ticketType))];
      const categoryMap: Record<string, string> = {};

      for (const tt of ticketTypes) {
        const price = parsed.find(r => r.ticketType === tt)?.pricePerTicket || 0;
        const { data: cat, error: catErr } = await supabase.from("ticket_categories").insert({
          event_id: event.id,
          name: tt,
          price,
          sold_out: true,
        }).select().single();
        if (catErr) throw new Error(`Kategorie: ${catErr.message}`);
        categoryMap[tt] = cat.id;
        addLog(`✅ Kategorie "${tt}" erstellt`);
      }

      // 3. Create orders + tickets per checkout row
      addLog("Importiere Bestellungen & Tickets...");
      let orderCount = 0;
      let ticketCount = 0;

      for (const row of parsed) {
        const fullName = `${row.firstName} ${row.lastName}`.trim();
        const items = [{
          category: row.ticketType,
          quantity: row.quantity,
          price: row.pricePerTicket,
        }];

        const { data: order, error: orderErr } = await supabase.from("orders").insert({
          email: row.email.trim(),
          name: fullName,
          phone: row.phone,
          event_id: event.id,
          status: "paid",
          total_amount: row.grossTotal,
          service_fee: row.fees,
          items,
          paid_at: config.eventDate ? `${config.eventDate}T12:00:00Z` : new Date().toISOString(),
        }).select().single();

        if (orderErr) { addLog(`⚠️ Order für ${row.email}: ${orderErr.message}`); continue; }
        orderCount++;

        // Create tickets
        for (let t = 0; t < row.quantity; t++) {
          const qr = `IMPORT-${event.id.slice(0, 8)}-${order.id.slice(0, 8)}-${t}`;
          const { error: tickErr } = await supabase.from("tickets").insert({
            event_id: event.id,
            order_id: order.id,
            ticket_category_id: categoryMap[row.ticketType] || null,
            qr_code: qr,
            status: "used",
            holder_name: fullName,
            holder_email: row.email.trim(),
            checked_in_at: config.eventDate ? `${config.eventDate}T22:00:00Z` : null,
          });
          if (tickErr) { addLog(`⚠️ Ticket: ${tickErr.message}`); continue; }
          ticketCount++;
        }
      }
      addLog(`✅ ${orderCount} Bestellungen, ${ticketCount} Tickets importiert`);

      // 4. Add unique customers to newsletter_subscribers (if not exists)
      addLog("Aktualisiere Kundendaten...");
      let newCustomers = 0;
      for (const row of parsed) {
        const email = row.email.toLowerCase().trim();
        if (!email) continue;
        const fullName = `${row.firstName} ${row.lastName}`.trim();

        const { data: existing } = await supabase
          .from("newsletter_subscribers")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (!existing) {
          const { error } = await supabase.from("newsletter_subscribers").insert({
            email,
            name: fullName,
            city: config.eventCity,
            source: "csv-import",
            tags: ["csv-import", config.eventTitle],
          });
          if (!error) newCustomers++;
        }
      }
      addLog(`✅ ${newCustomers} neue Kunden hinzugefügt (${uniqueEmails.size} gesamt)`);

      addLog("🎉 Import abgeschlossen!");
      setStep("done");
      toast.success("Import erfolgreich abgeschlossen!");
    } catch (err: any) {
      addLog(`❌ Fehler: ${err.message}`);
      toast.error(err.message);
      setStep("preview");
    }
  };

  const reset = () => {
    setFile(null);
    setParsed([]);
    setConfig({ eventTitle: "", eventDate: "", eventCity: "Mainz", eventLocation: "Finn's Penthouse", eventSlug: "" });
    setStep("upload");
    setImportLog([]);
    setShowPreview(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="w-6 h-6" style={s.accent} />
        <h1 className="text-xl font-bold" style={s.white}>CSV-Import / Migration</h1>
      </div>
      <p style={s.muted}>
        Importiere vergangene Events aus CSV-Dateien (z.B. Ticketio-Export). Event, Bestellungen, Tickets und Kundendaten werden automatisch angelegt.
      </p>

      {/* STEP 1: Upload */}
      {step === "upload" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={s.card} className="p-8">
          <label
            className="flex flex-col items-center justify-center gap-4 cursor-pointer py-12 rounded-xl border-2 border-dashed"
            style={{ borderColor: "hsl(0 0% 100% / 0.1)" }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          >
            <Upload className="w-10 h-10" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
            <span style={s.muted}>CSV-Datei hierher ziehen oder klicken</span>
            <span style={{ ...s.muted, fontSize: 11 }}>Unterstützt: Ticketio Checkout-Export (Semikolon-getrennt)</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
          </label>
        </motion.div>
      )}

      {/* STEP 2: Preview & Config */}
      {step === "preview" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Filename detection banner */}
          {detectedFromFilename && (detectedFromFilename.title || detectedFromFilename.date || detectedFromFilename.city) && (
            <div style={{ ...s.card, background: "hsl(230 80% 56% / 0.1)", border: "1px solid hsl(230 80% 56% / 0.3)" }} className="p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "hsl(140 60% 50%)" }} />
              <div>
                <div className="text-sm font-semibold mb-1" style={s.white}>📎 Aus Dateiname erkannt</div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={s.muted}>
                  {detectedFromFilename.title && (
                    <span>Titel: <strong style={s.white}>{detectedFromFilename.title}</strong></span>
                  )}
                  {detectedFromFilename.city && (
                    <span>Stadt: <strong style={s.white}>{detectedFromFilename.city}</strong></span>
                  )}
                  {detectedFromFilename.date && (
                    <span>Datum: <strong style={s.white}>{detectedFromFilename.date.split('-').reverse().join('.')}</strong></span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Auto-detected overview */}
          <div style={s.card} className="p-5 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2" style={s.white}>
              <BarChart3 className="w-4 h-4" style={s.accent} />
              Automatisch erkannte Daten
            </h2>

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Bestellungen", value: parsed.length, icon: <FileSpreadsheet className="w-4 h-4" /> },
                { label: "Tickets gesamt", value: totalTickets, icon: <Ticket className="w-4 h-4" /> },
                { label: "Einzigartige Kunden", value: uniqueEmails.size, icon: <Users className="w-4 h-4" /> },
                { label: "Brutto-Umsatz", value: `${totalRevenue.toFixed(2)} €`, icon: <TrendingUp className="w-4 h-4" /> },
              ].map((s2) => (
                <div key={s2.label} style={{ ...s.card, background: "hsl(220 40% 8%)" }} className="p-4">
                  <div className="flex items-center gap-2 mb-2" style={{ color: "hsl(230 80% 56%)" }}>{s2.icon}</div>
                  <div className="text-lg font-bold" style={s.white}>{s2.value}</div>
                  <div style={s.muted} className="text-xs">{s2.label}</div>
                </div>
              ))}
            </div>

            {/* Revenue breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "Netto-Umsatz", value: `${totalNet.toFixed(2)} €` },
                { label: "Gebühren", value: `${totalFees.toFixed(2)} €` },
                { label: "Steuern", value: `${totalTaxes.toFixed(2)} €` },
                { label: "Ø Bestellwert", value: `${avgOrderValue.toFixed(2)} €` },
                { label: "Ø Tickets/Bestellung", value: avgTicketsPerOrder.toFixed(1) },
              ].map((s2) => (
                <div key={s2.label} style={{ ...s.card, background: "hsl(220 40% 8%)" }} className="p-3 text-center">
                  <div style={s.muted} className="text-xs mb-1">{s2.label}</div>
                  <div className="text-sm font-semibold" style={s.white}>{s2.value}</div>
                </div>
              ))}
            </div>

            {/* Ticket categories breakdown */}
            <div>
              <h3 className="text-xs font-semibold mb-2" style={s.muted}>Erkannte Ticket-Kategorien</h3>
              <div className="space-y-2">
                {ticketBreakdown.map((tb) => (
                  <div
                    key={tb.type}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "hsl(220 40% 8%)", border: "1px solid hsl(0 0% 100% / 0.04)" }}
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="w-4 h-4" style={s.accent} />
                      <div>
                        <div className="text-sm font-medium" style={s.white}>{tb.type}</div>
                        <div className="text-xs" style={s.muted}>{tb.price.toFixed(2)} € pro Ticket</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <div className="text-sm font-semibold" style={s.white}>{tb.qty}×</div>
                        <div className="text-xs" style={s.muted}>Tickets</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={s.white}>{tb.revenue.toFixed(2)} €</div>
                        <div className="text-xs" style={s.muted}>Umsatz</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: "hsl(40 90% 60%)" }}>{tb.fees.toFixed(2)} €</div>
                        <div className="text-xs" style={s.muted}>Gebühren</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Event config */}
          <div style={s.card} className="p-5 space-y-4">
            <h2 className="text-sm font-bold" style={s.white}>Event-Details (manuell)</h2>
            <p className="text-xs" style={s.muted}>Diese Infos sind nicht in der CSV enthalten – bitte ergänzen.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label style={s.label}>Event-Titel *</label>
                <input
                  style={s.input}
                  value={config.eventTitle}
                  onChange={(e) => setConfig(c => ({ ...c, eventTitle: e.target.value }))}
                  placeholder="z.B. Penthouse Mainz 28.03."
                />
              </div>
              <div>
                <label style={s.label}>Datum *</label>
                <input
                  type="date"
                  style={s.input}
                  value={config.eventDate}
                  onChange={(e) => setConfig(c => ({ ...c, eventDate: e.target.value }))}
                />
              </div>
              <div>
                <label style={s.label}>Stadt</label>
                <input
                  style={s.input}
                  value={config.eventCity}
                  onChange={(e) => setConfig(c => ({ ...c, eventCity: e.target.value }))}
                />
              </div>
              <div>
                <label style={s.label}>Location</label>
                <input
                  style={s.input}
                  value={config.eventLocation}
                  onChange={(e) => setConfig(c => ({ ...c, eventLocation: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label style={s.label}>Slug (optional, wird automatisch generiert)</label>
                <input
                  style={s.input}
                  value={config.eventSlug}
                  onChange={(e) => setConfig(c => ({ ...c, eventSlug: e.target.value }))}
                  placeholder={generateSlug(config.eventTitle || "event", config.eventDate)}
                />
              </div>
            </div>
          </div>

          {/* Data preview toggle */}
          <div style={s.card} className="p-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 text-sm"
              style={s.accent}
            >
              <Eye className="w-4 h-4" />
              {showPreview ? "Vorschau ausblenden" : "Daten-Vorschau anzeigen"}
            </button>
            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-auto mt-3"
                  style={{ maxHeight: 300 }}
                >
                  <table className="w-full text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
                        {["#", "Name", "E-Mail", "Ticketart", "Anzahl", "Summe"].map(h => (
                          <th key={h} className="text-left p-2 font-semibold" style={s.muted}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.slice(0, 50).map((r, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.03)" }}>
                          <td className="p-2">{r.checkoutId}</td>
                          <td className="p-2">{r.firstName} {r.lastName}</td>
                          <td className="p-2">{r.email}</td>
                          <td className="p-2">{r.ticketType}</td>
                          <td className="p-2">{r.quantity}</td>
                          <td className="p-2">{r.grossTotal.toFixed(2)} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsed.length > 50 && <p className="text-xs p-2" style={s.muted}>... und {parsed.length - 50} weitere</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button style={s.btnOutline} onClick={reset}>
              <span className="flex items-center gap-2"><X className="w-4 h-4" /> Abbrechen</span>
            </button>
            <button style={s.btn} onClick={doImport}>
              <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Import starten</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: Importing */}
      {step === "importing" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={s.card} className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" style={s.accent} />
            <span className="text-sm font-semibold" style={s.white}>Import läuft...</span>
          </div>
          <div className="space-y-1 max-h-60 overflow-auto">
            {importLog.map((l, i) => (
              <div key={i} className="text-xs font-mono" style={s.muted}>{l}</div>
            ))}
          </div>
        </motion.div>
      )}

      {/* STEP 4: Done */}
      {step === "done" && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={s.card} className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6" style={{ color: "hsl(140 60% 50%)" }} />
            <span className="font-bold" style={s.white}>Import abgeschlossen!</span>
          </div>
          <div className="space-y-1 max-h-60 overflow-auto">
            {importLog.map((l, i) => (
              <div key={i} className="text-xs font-mono" style={s.muted}>{l}</div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {[
              { label: "Tickets", value: totalTickets },
              { label: "Kunden", value: uniqueEmails.size },
              { label: "Umsatz", value: `${totalRevenue.toFixed(2)} €` },
              { label: "Gebühren", value: `${totalFees.toFixed(2)} €` },
            ].map((s2) => (
              <div key={s2.label} style={{ ...s.card, background: "hsl(220 40% 8%)" }} className="p-3 text-center">
                <div style={s.muted} className="text-xs mb-1">{s2.label}</div>
                <div className="text-sm font-bold" style={s.white}>{s2.value}</div>
              </div>
            ))}
          </div>
          <button style={s.btn} onClick={reset}>
            <span className="flex items-center gap-2"><Upload className="w-4 h-4" /> Weiteren Import starten</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
