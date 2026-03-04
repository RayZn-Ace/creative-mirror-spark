import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Keyboard, CheckCircle2, XCircle, AlertTriangle, RotateCcw, Loader2, QrCode } from "lucide-react";

type ScanResult = {
  valid: boolean;
  status: string;
  error?: string;
  checked_in_at?: string;
  ticket?: {
    id?: string;
    holder_name?: string;
    holder_email?: string;
    category?: string;
    group?: string;
    event?: string;
    event_date?: string;
    location?: string;
  };
};

const Scanner = () => {
  const [searchParams] = useSearchParams();
  const scannerToken = searchParams.get("token");

  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [eventInfo, setEventInfo] = useState<{ title: string; id: string } | null>(null);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

  // Load event info from scanner token
  useEffect(() => {
    if (!scannerToken) return;
    (async () => {
      const { data } = await supabase
        .from("scanner_links")
        .select("event_id, label")
        .eq("token", scannerToken)
        .eq("active", true)
        .single();
      if (data) {
        if (data.event_id) {
          const { data: event } = await supabase
            .from("events")
            .select("title, id")
            .eq("id", data.event_id)
            .single();
          if (event) setEventInfo({ title: event.title, id: event.id });
        } else {
          // All-events scanner
          setEventInfo({ title: data.label || "Alle Events", id: "__ALL__" });
        }
      }
    })();
  }, [scannerToken]);

  // Load stats
  useEffect(() => {
    if (!eventInfo?.id) return;
    const isAll = eventInfo.id === "__ALL__";
    const loadStats = async () => {
      let totalQuery = supabase.from("tickets").select("*", { count: "exact", head: true });
      let checkedQuery = supabase.from("tickets").select("*", { count: "exact", head: true }).eq("status", "checked_in");
      if (!isAll) {
        totalQuery = totalQuery.eq("event_id", eventInfo.id);
        checkedQuery = checkedQuery.eq("event_id", eventInfo.id);
      }
      const { count: total } = await totalQuery;
      const { count: checkedIn } = await checkedQuery;
      setStats({ total: total || 0, checkedIn: checkedIn || 0 });
    };
    loadStats();

    // Realtime updates
    const channelConfig = isAll
      ? { event: "*" as const, schema: "public", table: "tickets" }
      : { event: "*" as const, schema: "public", table: "tickets", filter: `event_id=eq.${eventInfo.id}` };
    const channel = supabase
      .channel("scanner-tickets")
      .on("postgres_changes", channelConfig, () => {
        loadStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventInfo?.id]);

  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === 2) { // SCANNING
          await html5QrCodeRef.current.stop();
        }
      } catch (e) {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      // Small delay to ensure DOM is ready
      await new Promise((r) => setTimeout(r, 200));
      
      const el = document.getElementById(scannerContainerId);
      if (!el) return;

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 200, height: 200 }, aspectRatio: 1.0 },
        (decodedText) => {
          // Prevent duplicate scans
          if (decodedText && decodedText !== lastScannedCode) {
            setLastScannedCode(decodedText);
            validateTicket(decodedText);
          }
        },
        () => {
          // ignore scan failures
        }
      );
    } catch {
      setCameraError("Kamera-Zugriff verweigert. Bitte erlaube den Kamera-Zugriff in den Browser-Einstellungen.");
      setMode("manual");
    }
  }, [lastScannedCode]);

  useEffect(() => {
    if (mode === "camera" && !result) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => { stopCamera(); };
  }, [mode, result]);

  const validateTicket = async (code: string) => {
    if (scanning || !code.trim()) return;
    setScanning(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("validate-ticket", {
        body: {
          qr_code: code.trim().toUpperCase(),
          event_id: eventInfo?.id === "__ALL__" ? null : eventInfo?.id,
          scanner_token: scannerToken,
          action: "checkin",
        },
      });

      if (error) throw error;
      setResult(data as ScanResult);

      // Vibrate on result
      if (navigator.vibrate) {
        navigator.vibrate(data?.valid ? [100] : [100, 50, 100, 50, 100]);
      }
    } catch (err) {
      setResult({ valid: false, status: "error", error: "Netzwerkfehler" });
    } finally {
      setScanning(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateTicket(manualCode);
  };

  const resetScan = () => {
    setResult(null);
    setManualCode("");
    setLastScannedCode(null);
  };

  const statusConfig = {
    checked_in: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20 border-green-500/40", label: "EINGECHECKT ✓" },
    already_checked_in: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/20 border-amber-500/40", label: "BEREITS EINGECHECKT" },
    not_found: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20 border-red-500/40", label: "NICHT GEFUNDEN" },
    wrong_event: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20 border-red-500/40", label: "FALSCHES EVENT" },
    cancelled: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20 border-red-500/40", label: "STORNIERT" },
    valid: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20 border-green-500/40", label: "GÜLTIG" },
    error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20 border-red-500/40", label: "FEHLER" },
  };

  const currentStatus = result ? statusConfig[result.status as keyof typeof statusConfig] || statusConfig.error : null;
  const StatusIcon = currentStatus?.icon || XCircle;

  return (
    <div className="min-h-screen bg-[hsl(220,50%,8%)] text-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-[hsl(220,40%,12%)] border-b border-white/10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              <h1 className="text-sm font-bold uppercase tracking-wider">Scanner</h1>
            </div>
            {eventInfo && (
              <p className="text-xs text-white/60 mt-0.5">{eventInfo.title}</p>
            )}
          </div>
          {eventInfo && (
            <div className="text-right">
              <div className="text-lg font-black tabular-nums">{stats.checkedIn}<span className="text-white/40 text-sm">/{stats.total}</span></div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider">Eingecheckt</div>
            </div>
          )}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 p-2 max-w-lg mx-auto w-full">
        <button
          onClick={() => { setMode("camera"); resetScan(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            mode === "camera" ? "bg-primary/20 text-primary border border-primary/40" : "bg-white/5 text-white/50 border border-white/10"
          }`}
        >
          <Camera className="w-4 h-4" /> Kamera
        </button>
        <button
          onClick={() => { setMode("manual"); resetScan(); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            mode === "manual" ? "bg-primary/20 text-primary border border-primary/40" : "bg-white/5 text-white/50 border border-white/10"
          }`}
        >
          <Keyboard className="w-4 h-4" /> Manuell
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 pb-4 max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center ${currentStatus?.bg} border`}
              >
                <StatusIcon className={`w-10 h-10 ${currentStatus?.color}`} />
              </motion.div>

              <div className="text-center">
                <div className={`text-lg font-black uppercase tracking-wider ${currentStatus?.color}`}>
                  {currentStatus?.label}
                </div>
                {result.error && (
                  <p className="text-sm text-white/60 mt-1">{result.error}</p>
                )}
              </div>

              {result.ticket && (
                <div className="w-full bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
                  {result.ticket.holder_name && (
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">Name</span>
                      <span className="text-sm font-bold">{result.ticket.holder_name}</span>
                    </div>
                  )}
                  {result.ticket.category && (
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">Ticket</span>
                      <span className="text-sm font-semibold">{result.ticket.category}</span>
                    </div>
                  )}
                  {result.ticket.group && (
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">Kategorie</span>
                      <span className="text-sm">{result.ticket.group}</span>
                    </div>
                  )}
                  {result.ticket.event && (
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">Event</span>
                      <span className="text-sm">{result.ticket.event}</span>
                    </div>
                  )}
                  {result.checked_in_at && (
                    <div className="flex justify-between">
                      <span className="text-xs text-white/50">Eingecheckt um</span>
                      <span className="text-sm">{new Date(result.checked_in_at).toLocaleTimeString("de-DE")}</span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={resetScan}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 rounded-xl text-sm font-bold uppercase tracking-wider border border-white/20 hover:bg-white/20 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Nächstes Ticket
              </button>
            </motion.div>
          ) : mode === "camera" ? (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-4"
            >
              {cameraError ? (
                <div className="text-center p-6">
                  <Camera className="w-12 h-12 text-white/30 mx-auto mb-3" />
                  <p className="text-sm text-white/60">{cameraError}</p>
                </div>
              ) : (
                <>
                  <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden border-2 border-white/20">
                    <div id={scannerContainerId} className="w-full h-full" />
                  </div>
                  <p className="text-xs text-white/40 text-center">QR-Code in den Rahmen halten</p>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="manual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Keyboard className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-sm text-white/60 text-center">Ticket-Code eingeben</p>
              <form onSubmit={handleManualSubmit} className="w-full max-w-sm space-y-3">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-center text-lg font-mono font-bold tracking-[0.2em] placeholder:text-white/20 focus:border-primary/50 focus:outline-none transition-all"
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={scanning || !manualCode.trim()}
                  className="w-full py-3 bg-primary/20 border border-primary/40 rounded-xl text-sm font-bold uppercase tracking-wider text-primary hover:bg-primary/30 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  {scanning ? "Prüfe..." : "Einchecken"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Scanner;
