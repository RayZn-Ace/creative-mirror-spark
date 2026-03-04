import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Html5Qrcode } from "html5-qrcode";
import {
  Plus, Trash2, Copy, ExternalLink, QrCode, ToggleLeft, ToggleRight,
  Link2, ScanLine, CalendarDays, Loader2, Camera, X, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Keyboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "links" | "scanner" | "bulk";

interface ScannerLink {
  id: string;
  event_id: string;
  token: string;
  label: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  date: string | null;
  city: string | null;
}

const ALL_EVENTS_VALUE = "__ALL__";

const ScannerAdmin = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("scanner");
  const [links, setLinks] = useState<ScannerLink[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // For direct scanner
  const [scanEventId, setScanEventId] = useState("");
  const [scannerActive, setScannerActive] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanningInProgress, setScanningInProgress] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "admin-qr-reader";
  const activeEventId = useRef<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [linksRes, eventsRes] = await Promise.all([
      supabase.from("scanner_links").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("id, title, date, city").eq("status", "published").order("date", { ascending: true }),
    ]);
    if (linksRes.data) setLinks(linksRes.data as ScannerLink[]);
    if (eventsRes.data) setEvents(eventsRes.data);
    setLoading(false);
  };

  const createLink = async (eventId?: string | null, label?: string) => {
    const eid = eventId === undefined ? selectedEvent : eventId;
    const isAllEvents = eid === ALL_EVENTS_VALUE || eid === null;
    
    const insertData: any = {
      label: label || newLabel || (isAllEvents ? "Alle Events" : null),
    };
    if (!isAllEvents && eid) {
      insertData.event_id = eid;
    }

    const { error } = await supabase.from("scanner_links").insert(insertData);
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return false;
    }
    if (eventId === undefined) {
      toast({ title: "Scanner-Link erstellt" });
      setNewLabel("");
    }
    loadData();
    return true;
  };

  const toggleLink = async (id: string, active: boolean) => {
    await supabase.from("scanner_links").update({ active: !active }).eq("id", id);
    loadData();
  };

  const deleteLink = async (id: string) => {
    await supabase.from("scanner_links").delete().eq("id", id);
    loadData();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/scan?token=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link kopiert!" });
  };

  const getEventTitle = (eventId: string | null) => {
    if (!eventId) return "Alle Events";
    return events.find((e) => e.id === eventId)?.title || "Unbekannt";
  };

  const createBulkLinks = async () => {
    setBulkLoading(true);
    const existingEventIds = new Set(links.filter(l => l.event_id).map((l) => l.event_id));
    const missing = events.filter((e) => !existingEventIds.has(e.id));
    let created = 0;
    for (const ev of missing) {
      const ok = await createLink(ev.id, ev.title);
      if (ok) created++;
    }
    setBulkLoading(false);
    toast({ title: `${created} Scanner-Links erstellt`, description: `Für ${created} Events ohne bestehenden Link.` });
    loadData();
  };

  // Inline scanner logic
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) await html5QrCodeRef.current.stop();
      } catch {}
      html5QrCodeRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    await new Promise((r) => setTimeout(r, 300));
    const el = document.getElementById(scannerContainerId);
    if (!el) return;
    try {
      const qr = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1.0 },
        (decodedText) => {
          if (decodedText && decodedText !== lastScannedCode) {
            setLastScannedCode(decodedText);
            validateInlineTicket(decodedText);
          }
        },
        () => {}
      );
    } catch {
      setCameraError("Kamera-Zugriff verweigert.");
      setScanMode("manual");
    }
  }, [lastScannedCode]);

  useEffect(() => {
    if (scannerActive && scanMode === "camera" && !scanResult) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => { stopCamera(); };
  }, [scannerActive, scanMode, scanResult]);

  const validateInlineTicket = async (code: string) => {
    if (scanningInProgress || !code.trim()) return;
    setScanningInProgress(true);
    setScanResult(null);
    try {
      const eid = activeEventId.current;
      const { data, error } = await supabase.functions.invoke("validate-ticket", {
        body: {
          qr_code: code.trim().toUpperCase(),
          event_id: eid === ALL_EVENTS_VALUE ? null : (eid || null),
          action: "checkin",
        },
      });
      if (error) throw error;
      setScanResult(data);
      if (navigator.vibrate) navigator.vibrate(data?.valid ? [100] : [100, 50, 100, 50, 100]);
    } catch {
      setScanResult({ valid: false, status: "error", error: "Netzwerkfehler" });
    } finally {
      setScanningInProgress(false);
    }
  };

  const openInlineScanner = () => {
    if (!scanEventId) return;
    activeEventId.current = scanEventId;
    setScanResult(null);
    setLastScannedCode(null);
    setManualCode("");
    setCameraError(null);
    setScanMode("camera");
    setScannerActive(true);
  };

  const closeInlineScanner = () => {
    stopCamera();
    setScannerActive(false);
    setScanResult(null);
  };

  const resetInlineScan = () => {
    setScanResult(null);
    setManualCode("");
    setLastScannedCode(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateInlineTicket(manualCode);
  };

  const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
    checked_in: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20 border-green-500/40", label: "EINGECHECKT ✓" },
    already_checked_in: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/40", label: "BEREITS EINGECHECKT" },
    not_found: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20 border-red-500/40", label: "NICHT GEFUNDEN" },
    wrong_event: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20 border-red-500/40", label: "FALSCHES EVENT" },
    cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20 border-red-500/40", label: "STORNIERT" },
    error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20 border-red-500/40", label: "FEHLER" },
  };

  const filteredEvents = events.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.title.toLowerCase().includes(q) || e.city?.toLowerCase().includes(q);
  });

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "links", label: "Links", icon: Link2 },
    { key: "scanner", label: "Direkt-Scanner", icon: ScanLine },
    { key: "bulk", label: "Alle Events", icon: CalendarDays },
  ];

  if (loading) return <div className="p-6 text-center text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Laden…</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: "hsl(0 0% 100%)" }}>
          <QrCode className="w-5 h-5" /> Scanner
        </h2>
        <p className="text-xs sm:text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
          Scanner-Links verwalten, direkt scannen oder Links für alle Events erstellen.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? "hsl(330 80% 55% / 0.15)" : "transparent",
              color: tab === t.key ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
            }}
          >
            <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split("-")[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab: Links */}
      {tab === "links" && (
        <div className="space-y-4">
          {/* Create new */}
          <div className="rounded-xl p-3 sm:p-4 space-y-3" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Neuen Link erstellen</h3>
            <div className="flex flex-col gap-2">
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)" }}
              >
                <option value="">Event auswählen…</option>
                <option value={ALL_EVENTS_VALUE}>⚡ Alle Events</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title} {e.date ? `(${e.date})` : ""}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Label (z.B. Eingang A)"
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)" }}
                />
                <button
                  onClick={() => createLink()}
                  disabled={!selectedEvent}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: "hsl(330 80% 55%)", color: "hsl(0 0% 100%)" }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Erstellen</span>
                </button>
              </div>
            </div>
          </div>

          {/* Links list */}
          <div className="space-y-2">
            {links.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Noch keine Scanner-Links erstellt.</p>
            ) : (
              links.map((link) => (
                <div
                  key={link.id}
                  className="rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                  style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${link.active ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>
                        {link.label || "Kein Label"}
                      </span>
                      {!link.event_id && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "hsl(270 60% 55% / 0.2)", color: "hsl(270 60% 65%)" }}>
                          Alle
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{getEventTitle(link.event_id)}</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                      {link.token.slice(0, 12)}…
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyLink(link.token)} className="p-2 rounded-lg transition-colors hover:bg-white/5" title="Link kopieren" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                      <Copy className="w-4 h-4" />
                    </button>
                    <a href={`/scan?token=${link.token}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-colors hover:bg-white/5" title="Öffnen" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => toggleLink(link.id, link.active)} className="p-2 rounded-lg transition-colors hover:bg-white/5" title={link.active ? "Deaktivieren" : "Aktivieren"}>
                      {link.active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.4)" }} />}
                    </button>
                    <button onClick={() => deleteLink(link.id)} className="p-2 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: "hsl(0 70% 55%)" }} title="Löschen">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Direct Scanner */}
      {tab === "scanner" && (
        <div className="space-y-4">
          {!scannerActive ? (
            <>
              <div className="rounded-xl p-4 sm:p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                  Direkt scannen
                </h3>
                <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  Wähle ein Event oder scanne für alle Events gleichzeitig.
                </p>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Event suchen…"
                  className="w-full px-3 py-2 rounded-lg text-sm mb-2"
                  style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)" }}
                />
                <select
                  value={scanEventId}
                  onChange={(e) => setScanEventId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm mb-3"
                  style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)" }}
                >
                  <option value="">Event auswählen…</option>
                  <option value={ALL_EVENTS_VALUE}>⚡ Alle Events</option>
                  {filteredEvents.map((e) => (
                    <option key={e.id} value={e.id}>{e.title} {e.city ? `(${e.city})` : ""} {e.date ? `– ${e.date}` : ""}</option>
                  ))}
                </select>
                <button
                  onClick={openInlineScanner}
                  disabled={!scanEventId}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: "hsl(200 80% 55%)", color: "hsl(0 0% 100%)" }}
                >
                  <ScanLine className="w-5 h-5" />
                  {scanEventId === ALL_EVENTS_VALUE ? "Scanner starten (Alle Events)" : "Scanner starten"}
                </button>
              </div>

              {/* Quick access */}
              <div className="rounded-xl p-4 sm:p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                  Schnellzugriff
                </h3>
                <div className="space-y-1.5">
                  <button
                    onClick={() => { setScanEventId(ALL_EVENTS_VALUE); activeEventId.current = ALL_EVENTS_VALUE; setScannerActive(true); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/5"
                    style={{ border: "1px solid hsl(270 60% 55% / 0.3)", background: "hsl(270 60% 55% / 0.05)" }}
                  >
                    <span className="text-sm font-bold" style={{ color: "hsl(270 60% 65%)" }}>⚡ Alle Events</span>
                    <ScanLine className="w-4 h-4 shrink-0" style={{ color: "hsl(270 60% 65%)" }} />
                  </button>
                  {events.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => { setScanEventId(e.id); activeEventId.current = e.id; setScannerActive(true); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/5"
                      style={{ border: "1px solid hsl(0 0% 100% / 0.06)" }}
                    >
                      <div>
                        <span className="text-sm font-medium" style={{ color: "hsl(0 0% 100%)" }}>{e.title}</span>
                        <span className="text-xs ml-2" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{e.date || ""}</span>
                      </div>
                      <ScanLine className="w-4 h-4 shrink-0" style={{ color: "hsl(200 80% 55%)" }} />
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Inline Scanner View */
            <div className="space-y-3">
              {/* Scanner header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>
                    {activeEventId.current === ALL_EVENTS_VALUE
                      ? "⚡ Alle Events"
                      : events.find((e) => e.id === activeEventId.current)?.title || "Scanner"}
                  </h3>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Scanner aktiv</p>
                </div>
                <button
                  onClick={closeInlineScanner}
                  className="p-2 rounded-lg transition-all hover:bg-white/10"
                  style={{ color: "hsl(0 0% 100% / 0.6)" }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-1">
                <button
                  onClick={() => { setScanMode("camera"); resetInlineScan(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: scanMode === "camera" ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)",
                    color: scanMode === "camera" ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
                    border: `1px solid ${scanMode === "camera" ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.08)"}`,
                  }}
                >
                  <Camera className="w-3.5 h-3.5" /> Kamera
                </button>
                <button
                  onClick={() => { setScanMode("manual"); resetInlineScan(); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: scanMode === "manual" ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)",
                    color: scanMode === "manual" ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
                    border: `1px solid ${scanMode === "manual" ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.08)"}`,
                  }}
                >
                  <Keyboard className="w-3.5 h-3.5" /> Manuell
                </button>
              </div>

              {/* Scanner content */}
              <AnimatePresence mode="wait">
                {scanResult ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl p-6 flex flex-col items-center gap-4"
                    style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                  >
                    {(() => {
                      const cfg = statusConfig[scanResult.status] || statusConfig.error;
                      const Icon = cfg.icon;
                      return (
                        <>
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${cfg.bg} border`}>
                            <Icon className={`w-8 h-8 ${cfg.color}`} />
                          </div>
                          <div className={`text-sm font-black uppercase tracking-wider ${cfg.color}`}>{cfg.label}</div>
                          {scanResult.error && <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{scanResult.error}</p>}
                          {scanResult.ticket && (
                            <div className="w-full space-y-1.5 rounded-lg p-3" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
                              {scanResult.ticket.holder_name && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: "hsl(0 0% 100% / 0.4)" }}>Name</span>
                                  <span className="font-bold" style={{ color: "hsl(0 0% 100%)" }}>{scanResult.ticket.holder_name}</span>
                                </div>
                              )}
                              {scanResult.ticket.category && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: "hsl(0 0% 100% / 0.4)" }}>Ticket</span>
                                  <span className="font-semibold" style={{ color: "hsl(0 0% 100%)" }}>{scanResult.ticket.category}</span>
                                </div>
                              )}
                              {scanResult.ticket.event && (
                                <div className="flex justify-between text-xs">
                                  <span style={{ color: "hsl(0 0% 100% / 0.4)" }}>Event</span>
                                  <span style={{ color: "hsl(0 0% 100%)" }}>{scanResult.ticket.event}</span>
                                </div>
                              )}
                            </div>
                          )}
                          <button
                            onClick={resetInlineScan}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/10"
                            style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.7)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Nächstes Ticket
                          </button>
                        </>
                      );
                    })()}
                  </motion.div>
                ) : scanMode === "camera" ? (
                  <motion.div
                    key="camera"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    {cameraError ? (
                      <div className="text-center py-8">
                        <Camera className="w-10 h-10 mx-auto mb-2" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
                        <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{cameraError}</p>
                      </div>
                    ) : (
                      <>
                        <div className="relative w-full aspect-square max-w-xs rounded-2xl overflow-hidden" style={{ border: "2px solid hsl(0 0% 100% / 0.15)" }}>
                          <div id={scannerContainerId} className="w-full h-full" />
                        </div>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)" }}>QR-Code in den Rahmen halten</p>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="manual"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl p-6 flex flex-col items-center gap-4"
                    style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                  >
                    <Keyboard className="w-8 h-8" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                    <form onSubmit={handleManualSubmit} className="w-full space-y-3">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        className="w-full px-4 py-3 rounded-xl text-center text-sm font-mono font-bold tracking-[0.15em] focus:outline-none transition-all"
                        style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.15)", color: "hsl(0 0% 100%)" }}
                        autoComplete="off"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={scanningInProgress || !manualCode.trim()}
                        className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                        style={{ background: "hsl(330 80% 55% / 0.15)", color: "hsl(330 80% 55%)", border: "1px solid hsl(330 80% 55% / 0.3)" }}
                      >
                        {scanningInProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {scanningInProgress ? "Prüfe…" : "Einchecken"}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Tab: Bulk create */}
      {tab === "bulk" && (
        <div className="space-y-4">
          <div className="rounded-xl p-4 sm:p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Links für alle Events
            </h3>
            <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Erstelle automatisch Scanner-Links für alle veröffentlichten Events, die noch keinen Link haben.
            </p>
            {(() => {
              const existingIds = new Set(links.map((l) => l.event_id));
              const missing = events.filter((e) => !existingIds.has(e.id));
              return (
                <>
                  <div className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    <span className="font-bold" style={{ color: "hsl(330 80% 55%)" }}>{missing.length}</span> Events ohne Scanner-Link · <span className="font-bold" style={{ color: "hsl(200 80% 55%)" }}>{events.length - missing.length}</span> bereits verlinkt
                  </div>
                  <button
                    onClick={createBulkLinks}
                    disabled={missing.length === 0 || bulkLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                    style={{ background: "hsl(270 60% 55%)", color: "hsl(0 0% 100%)" }}
                  >
                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {bulkLoading ? "Erstelle Links…" : `${missing.length} Links erstellen`}
                  </button>
                </>
              );
            })()}
          </div>

          {/* Event overview */}
          <div className="rounded-xl p-4 sm:p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Übersicht
            </h3>
            <div className="space-y-1">
              {events.map((e) => {
                const hasLink = links.some((l) => l.event_id === e.id);
                return (
                  <div key={e.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: hasLink ? "hsl(120 40% 25% / 0.1)" : "hsl(0 40% 25% / 0.1)" }}>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-medium truncate block" style={{ color: "hsl(0 0% 100%)" }}>{e.title}</span>
                      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{e.city} · {e.date || "Kein Datum"}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${hasLink ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {hasLink ? "✓ Link" : "Kein Link"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerAdmin;