import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Check, Search, Globe, Layers, Ticket, FileText, Settings2,
  ChevronDown, ChevronRight, AlertTriangle, Copy,
} from "lucide-react";
import { toast } from "sonner";

/* ─── City → Country mapping (duplicated for standalone usage) ─── */
const CITY_COUNTRY: Record<string, string> = {
  Dornbirn: "Österreich", Gralla: "Österreich", Innsbruck: "Österreich", Kitzbühel: "Österreich",
  Kollerschlag: "Österreich", Linz: "Österreich", Salzburg: "Österreich", "St. Martin": "Österreich",
  Vöcklabruck: "Österreich", Wien: "Österreich",
  Lyss: "Schweiz", Olten: "Schweiz", "St. Gallen": "Schweiz", Winterthur: "Schweiz", Zürich: "Schweiz",
  Amsterdam: "Niederlande", Rotterdam: "Niederlande", Utrecht: "Niederlande",
  Antwerpen: "Belgien",
  "Le Havre": "Frankreich", Mathay: "Frankreich", Paris: "Frankreich",
  Luxembourg: "Luxemburg",
  Krakow: "Polen",
  Zadar: "Kroatien",
  "São Paulo": "Brasilien",
};
const getCountry = (city: string | null) => city ? (CITY_COUNTRY[city] || "Deutschland") : "Unbekannt";

interface EventRow {
  id: string;
  title: string;
  city: string | null;
  series_id: string | null;
  status: string | null;
  date: string | null;
  subtitle: string | null;
  tag: string | null;
  service_fee_enabled: boolean | null;
  service_fee_type: string | null;
  service_fee_value: number | null;
  service_fee_vat: number | null;
  info_sections: any[] | null;
  open_air: boolean | null;
  sold_out: boolean | null;
  highlight: boolean | null;
  insurance_enabled: boolean | null;
  insurance_amount: number | null;
}

interface TicketCategory {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  sold_out: boolean | null;
  sort_order: number | null;
  features: string[] | null;
  badge: string | null;
  coming_soon: boolean | null;
  category_group: string | null;
  sale_start: string | null;
  sale_end: string | null;
  internal_only: boolean | null;
  group_size: number | null;
}

interface SeriesOption {
  id: string;
  title: string;
  city: string | null;
}

type BulkSection = "tickets" | "info_sections" | "metadata";

interface BulkEditDialogProps {
  sourceEvent: EventRow;
  allEvents: EventRow[];
  seriesOptions: SeriesOption[];
  seriesMap: Record<string, string>;
  onClose: () => void;
  onComplete: () => void;
}

const BulkEditDialog = ({ sourceEvent, allEvents, seriesOptions, seriesMap, onClose, onComplete }: BulkEditDialogProps) => {
  const [selectedSections, setSelectedSections] = useState<Set<BulkSection>>(new Set(["tickets"]));
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [applying, setApplying] = useState(false);
  const [sourceTickets, setSourceTickets] = useState<TicketCategory[]>([]);
  const [ticketMode, setTicketMode] = useState<"replace" | "merge">("replace");

  // Filters
  const [filterSeries, setFilterSeries] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set(["Deutschland"]));

  useEffect(() => {
    if (selectedSections.has("tickets")) {
      supabase.from("ticket_categories").select("*").eq("event_id", sourceEvent.id).order("sort_order")
        .then(({ data }) => setSourceTickets((data as TicketCategory[]) || []));
    }
  }, [sourceEvent.id, selectedSections]);

  const otherEvents = useMemo(() => allEvents.filter((e) => e.id !== sourceEvent.id), [allEvents, sourceEvent.id]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    otherEvents.forEach((e) => set.add(getCountry(e.city)));
    return Array.from(set).sort((a, b) => a === "Deutschland" ? -1 : b === "Deutschland" ? 1 : a.localeCompare(b, "de"));
  }, [otherEvents]);

  const seriesInUse = useMemo(() => {
    const ids = new Set<string>();
    otherEvents.forEach((e) => { if (e.series_id) ids.add(e.series_id); });
    return seriesOptions.filter((s) => ids.has(s.id));
  }, [otherEvents, seriesOptions]);

  const filteredEvents = useMemo(() => {
    return otherEvents.filter((e) => {
      if (filterSeries !== "all" && e.series_id !== filterSeries) return false;
      if (filterCountry !== "all" && getCountry(e.city) !== filterCountry) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !e.title.toLowerCase().includes(q) &&
          !(e.city || "").toLowerCase().includes(q) &&
          !(e.series_id && (seriesMap[e.series_id] || "").toLowerCase().includes(q))
        ) return false;
      }
      return true;
    });
  }, [otherEvents, filterSeries, filterCountry, search, seriesMap]);

  const groupedByCountry = useMemo(() => {
    const groups: Record<string, EventRow[]> = {};
    filteredEvents.forEach((e) => {
      const country = getCountry(e.city);
      if (!groups[country]) groups[country] = [];
      groups[country].push(e);
    });
    return groups;
  }, [filteredEvents]);

  const toggleSection = (s: BulkSection) => {
    const next = new Set(selectedSections);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setSelectedSections(next);
  };

  const toggleEvent = (id: string) => {
    const next = new Set(selectedEvents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEvents(next);
  };

  const selectAll = () => {
    setSelectedEvents(new Set(filteredEvents.map((e) => e.id)));
  };

  const deselectAll = () => setSelectedEvents(new Set());

  const selectCountry = (country: string) => {
    const next = new Set(selectedEvents);
    (groupedByCountry[country] || []).forEach((e) => next.add(e.id));
    setSelectedEvents(next);
  };

  const deselectCountry = (country: string) => {
    const next = new Set(selectedEvents);
    (groupedByCountry[country] || []).forEach((e) => next.delete(e.id));
    setSelectedEvents(next);
  };

  const applyBulkEdit = async () => {
    if (selectedEvents.size === 0) return;
    setApplying(true);
    const targetIds = Array.from(selectedEvents);
    let errors = 0;

    try {
      // 1. Ticket categories
      if (selectedSections.has("tickets") && sourceTickets.length > 0) {
        for (const targetId of targetIds) {
          if (ticketMode === "replace") {
            await supabase.from("ticket_categories").delete().eq("event_id", targetId);
          }
          const newTickets = sourceTickets.map((t) => {
            const { id, event_id, ...rest } = t;
            return { ...rest, event_id: targetId };
          });
          const { error } = await supabase.from("ticket_categories").insert(newTickets as any);
          if (error) { console.error(error); errors++; }
        }
      }

      // 2. Info sections
      if (selectedSections.has("info_sections")) {
        const { error } = await supabase
          .from("events")
          .update({ info_sections: sourceEvent.info_sections || [] } as any)
          .in("id", targetIds);
        if (error) { console.error(error); errors++; }
      }

      // 3. Metadata
      if (selectedSections.has("metadata")) {
        const { error } = await supabase
          .from("events")
          .update({
            subtitle: sourceEvent.subtitle,
            tag: sourceEvent.tag,
            service_fee_enabled: sourceEvent.service_fee_enabled,
            service_fee_type: sourceEvent.service_fee_type,
            service_fee_value: sourceEvent.service_fee_value,
            service_fee_vat: sourceEvent.service_fee_vat,
            open_air: sourceEvent.open_air,
            highlight: sourceEvent.highlight,
          } as any)
          .in("id", targetIds);
        if (error) { console.error(error); errors++; }
      }

      if (errors > 0) {
        toast.error(`${errors} Fehler beim Übertragen`);
      } else {
        toast.success(`Änderungen auf ${targetIds.length} Events übertragen!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Fehler beim Übertragen");
    }

    setApplying(false);
    onComplete();
    onClose();
  };

  const sectionOptions: { id: BulkSection; label: string; icon: any; desc: string }[] = [
    { id: "tickets", label: "Ticket-Kategorien & Preise", icon: Ticket, desc: "Alle Ticket-Varianten übertragen" },
    { id: "info_sections", label: "Info-Blöcke (Akkordeons)", icon: FileText, desc: "Block-Editor Inhalte kopieren" },
    { id: "metadata", label: "Event-Metadaten", icon: Settings2, desc: "Subtitle, Tag, Service-Fee, Open Air, Highlight" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "hsl(220 50% 8%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
              Bulk Edit
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Quelle: {sourceEvent.title} {sourceEvent.city ? `· ${sourceEvent.city}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-6 py-3" style={{ background: "hsl(0 0% 100% / 0.02)" }}>
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: step >= s ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.1)",
                  color: step >= s ? "hsl(0 0% 100%)" : "hsl(0 0% 100% / 0.3)",
                }}
              >
                {step > s ? <Check className="w-3 h-3" /> : s}
              </div>
              <span className="text-[10px] font-bold uppercase" style={{ color: step >= s ? "hsl(0 0% 100% / 0.7)" : "hsl(0 0% 100% / 0.3)" }}>
                {s === 1 ? "Was" : s === 2 ? "Wohin" : "Bestätigen"}
              </span>
              {s < 3 && <div className="w-8 h-px" style={{ background: "hsl(0 0% 100% / 0.1)" }} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Step 1: What to copy */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs font-medium mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                Was möchtest du auf andere Events übertragen?
              </p>
              {sectionOptions.map((opt) => {
                const selected = selectedSections.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleSection(opt.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left"
                    style={{
                      background: selected ? "hsl(330 80% 55% / 0.1)" : "hsl(0 0% 100% / 0.04)",
                      border: `1px solid ${selected ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.08)"}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: selected ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.1)" }}
                    >
                      {selected && <Check className="w-3 h-3" style={{ color: "hsl(0 0% 100%)" }} />}
                    </div>
                    <opt.icon className="w-4 h-4 flex-shrink-0" style={{ color: selected ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)" }} />
                    <div>
                      <span className="text-sm font-bold" style={{ color: selected ? "hsl(0 0% 100%)" : "hsl(0 0% 100% / 0.6)" }}>
                        {opt.label}
                      </span>
                      <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>{opt.desc}</p>
                    </div>
                  </button>
                );
              })}

              {selectedSections.has("tickets") && (
                <div className="rounded-xl p-4 space-y-2" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Ticket-Modus</p>
                  <div className="flex gap-2">
                    {(["replace", "merge"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setTicketMode(mode)}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: ticketMode === mode ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.06)",
                          color: ticketMode === mode ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)",
                          border: `1px solid ${ticketMode === mode ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.1)"}`,
                        }}
                      >
                        {mode === "replace" ? "Ersetzen" : "Hinzufügen"}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                    {ticketMode === "replace" ? "Bestehende Tickets werden gelöscht und durch die Quell-Tickets ersetzt." : "Quell-Tickets werden zusätzlich zu den bestehenden hinzugefügt."}
                  </p>
                  {sourceTickets.length > 0 && (
                    <div className="pt-2 space-y-1">
                      <p className="text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Wird kopiert ({sourceTickets.length}):</p>
                      {sourceTickets.map((t) => (
                        <div key={t.id} className="flex items-center justify-between text-xs px-2 py-1 rounded" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
                          <span style={{ color: "hsl(0 0% 100% / 0.6)" }}>{t.name}</span>
                          <span className="font-bold" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{t.price.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Target events */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs font-medium mb-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                Auf welche Events soll übertragen werden?
              </p>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterSeries}
                  onChange={(e) => setFilterSeries(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                >
                  <option value="all" style={{ background: "#1a1a1a" }}>Alle Serien</option>
                  {seriesInUse.map((s) => (
                    <option key={s.id} value={s.id} style={{ background: "#1a1a1a" }}>{s.title}</option>
                  ))}
                </select>
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs outline-none"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                >
                  <option value="all" style={{ background: "#1a1a1a" }}>Alle Länder</option>
                  {countries.map((c) => (
                    <option key={c} value={c} style={{ background: "#1a1a1a" }}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Event oder Stadt suchen..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg text-xs outline-none"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                />
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(330 80% 55%)" }}>
                  Alle auswählen ({filteredEvents.length})
                </button>
                <button onClick={deselectAll} className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.4)" }}>
                  Keine
                </button>
              </div>

              {/* Event list grouped by country */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {Object.entries(groupedByCountry)
                  .sort(([a], [b]) => a === "Deutschland" ? -1 : b === "Deutschland" ? 1 : a.localeCompare(b, "de"))
                  .map(([country, events]) => {
                    const expanded = expandedCountries.has(country);
                    const selectedInCountry = events.filter((e) => selectedEvents.has(e.id)).length;
                    const allSelected = selectedInCountry === events.length;
                    return (
                      <div key={country}>
                        <div className="flex items-center gap-2 py-1.5">
                          <button
                            onClick={() => {
                              const next = new Set(expandedCountries);
                              if (expanded) next.delete(country); else next.add(country);
                              setExpandedCountries(next);
                            }}
                            className="flex items-center gap-1.5"
                          >
                            {expanded ? <ChevronDown className="w-3 h-3" style={{ color: "hsl(0 0% 100% / 0.3)" }} /> : <ChevronRight className="w-3 h-3" style={{ color: "hsl(0 0% 100% / 0.3)" }} />}
                            <Globe className="w-3 h-3" style={{ color: "hsl(200 70% 55%)" }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                              {country} ({events.length})
                            </span>
                          </button>
                          <button
                            onClick={() => allSelected ? deselectCountry(country) : selectCountry(country)}
                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{ background: "hsl(0 0% 100% / 0.06)", color: allSelected ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.3)" }}
                          >
                            {allSelected ? "Abwählen" : "Alle"}
                          </button>
                          {selectedInCountry > 0 && !allSelected && (
                            <span className="text-[10px]" style={{ color: "hsl(330 80% 55%)" }}>{selectedInCountry} gewählt</span>
                          )}
                        </div>
                        <AnimatePresence>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="space-y-1 pl-5 overflow-hidden"
                            >
                              {events.map((event) => {
                                const selected = selectedEvents.has(event.id);
                                return (
                                  <button
                                    key={event.id}
                                    onClick={() => toggleEvent(event.id)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all"
                                    style={{
                                      background: selected ? "hsl(330 80% 55% / 0.08)" : "transparent",
                                      border: `1px solid ${selected ? "hsl(330 80% 55% / 0.2)" : "transparent"}`,
                                    }}
                                  >
                                    <div
                                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                                      style={{ background: selected ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.1)" }}
                                    >
                                      {selected && <Check className="w-2.5 h-2.5" style={{ color: "hsl(0 0% 100%)" }} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-xs font-bold truncate block" style={{ color: selected ? "hsl(0 0% 100%)" : "hsl(0 0% 100% / 0.6)" }}>
                                        {event.date || "–"} · {event.city || "–"}
                                      </span>
                                      <span className="text-[10px] truncate block" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                                        {event.title}{event.series_id ? ` · ${seriesMap[event.series_id] || ""}` : ""}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "hsl(45 80% 55% / 0.08)", border: "1px solid hsl(45 80% 55% / 0.2)" }}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "hsl(45 80% 55%)" }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: "hsl(45 80% 55%)" }}>Bitte überprüfen</p>
                  <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    Die folgenden Änderungen werden auf <strong>{selectedEvents.size} Events</strong> angewendet. 
                    {selectedSections.has("tickets") && ticketMode === "replace" && " Bestehende Tickets werden dabei ersetzt!"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Wird übertragen:</p>
                {Array.from(selectedSections).map((s) => {
                  const opt = sectionOptions.find((o) => o.id === s);
                  if (!opt) return null;
                  return (
                    <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
                      <opt.icon className="w-3.5 h-3.5" style={{ color: "hsl(330 80% 55%)" }} />
                      <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{opt.label}</span>
                      {s === "tickets" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: ticketMode === "replace" ? "hsl(0 70% 50% / 0.15)" : "hsl(142 70% 45% / 0.15)", color: ticketMode === "replace" ? "hsl(0 70% 55%)" : "hsl(142 70% 55%)" }}>
                          {ticketMode === "replace" ? "Ersetzen" : "Hinzufügen"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Ziel-Events ({selectedEvents.size}):</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {allEvents.filter((e) => selectedEvents.has(e.id)).map((e) => (
                    <div key={e.id} className="text-xs px-3 py-1.5 rounded" style={{ background: "hsl(0 0% 100% / 0.04)", color: "hsl(0 0% 100% / 0.6)" }}>
                      {e.date || "–"} · {e.city || "–"} · {e.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.08)" }}>
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as 1 | 2)}
                className="px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)" }}
              >
                Zurück
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedEvents.size > 0 && step >= 2 && (
              <span className="text-[10px] font-bold" style={{ color: "hsl(330 80% 55%)" }}>
                {selectedEvents.size} Events ausgewählt
              </span>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep((step + 1) as 2 | 3)}
                disabled={step === 1 ? selectedSections.size === 0 : selectedEvents.size === 0}
                className="px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-30"
                style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={applyBulkEdit}
                disabled={applying}
                className="px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-2"
                style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
              >
                {applying ? (
                  <>Wird übertragen...</>
                ) : (
                  <><Copy className="w-3.5 h-3.5" /> Jetzt übertragen</>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkEditDialog;
