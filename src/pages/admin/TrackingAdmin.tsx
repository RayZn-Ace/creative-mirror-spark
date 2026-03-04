import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Plus, Trash2, Eye, EyeOff, FlaskConical, Check, X, Search,
  BarChart3, Code2, TestTube, ChevronDown, Settings2, Zap,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type TrackingPixel = {
  id: string;
  provider: string;
  pixel_id: string;
  label: string | null;
  enabled: boolean;
  test_mode: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type EventLog = {
  id: string;
  pixel_id: string | null;
  provider: string;
  event_name: string;
  event_data: Record<string, unknown>;
  page_url: string | null;
  test_mode: boolean;
  created_at: string;
};

type ProviderField = { key: string; label: string; placeholder: string; type?: "text" | "toggle"; description?: string };

const PROVIDERS: { id: string; name: string; placeholder: string; color: string; fields: ProviderField[] }[] = [
  {
    id: "google_analytics", name: "Google Analytics 4", placeholder: "G-XXXXXXXXXX", color: "hsl(45 80% 55%)",
    fields: [
      { key: "pixel_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" },
      { key: "cross_domains", label: "Cross-Domain Tracking (kommasepariert)", placeholder: "shop.example.com, checkout.example.com", description: "Session-Tracking über mehrere Domains" },
      { key: "enhanced_measurement", label: "Enhanced Measurement", placeholder: "", type: "toggle", description: "Scrolls, Outbound Clicks, Site Search, Video, File Downloads automatisch tracken" },
      { key: "debug_mode", label: "Debug Mode (DebugView)", placeholder: "", type: "toggle", description: "Echtzeit-Debugging in Google Analytics" },
    ],
  },
  {
    id: "google_tag_manager", name: "Google Tag Manager", placeholder: "GTM-XXXXXXX", color: "hsl(45 60% 50%)",
    fields: [
      { key: "pixel_id", label: "Container ID", placeholder: "GTM-XXXXXXX" },
      { key: "gtm_auth", label: "Environment Auth (optional)", placeholder: "abc123xyz", description: "Für GTM-Environments (Staging/Preview)" },
      { key: "gtm_preview", label: "Environment Preview ID", placeholder: "env-123", description: "Preview-Container für Testumgebungen" },
      { key: "data_layer_name", label: "DataLayer Name", placeholder: "dataLayer", description: "Custom DataLayer-Name" },
    ],
  },
  {
    id: "meta", name: "Meta Pixel (Facebook/Instagram)", placeholder: "123456789012345", color: "hsl(215 90% 55%)",
    fields: [
      { key: "pixel_id", label: "Pixel ID", placeholder: "123456789012345" },
      { key: "capi_token", label: "Conversions API Access Token", placeholder: "EAAxxxxxxx...", description: "Server-seitiges Tracking für bessere Datenqualität" },
      { key: "test_event_code", label: "Test Event Code", placeholder: "TEST12345", description: "Aus Events Manager → Test Events" },
      { key: "advanced_matching", label: "Advanced Matching (automatisch)", placeholder: "", type: "toggle", description: "E-Mail, Telefon etc. automatisch hashen und senden" },
      { key: "domain_verification", label: "Domain Verification Meta-Tag", placeholder: "xxxxxxxxxxxxxxxxx", description: "Verifizierungs-String für Meta Business Suite" },
      { key: "external_id", label: "External ID Parameter", placeholder: "user_id", description: "Custom Nutzer-ID für besseres Matching" },
    ],
  },
  {
    id: "tiktok", name: "TikTok Pixel", placeholder: "CXXXXXXXXXXXXXXXXX", color: "hsl(330 80% 55%)",
    fields: [
      { key: "pixel_id", label: "Pixel ID", placeholder: "CXXXXXXXXXXXXXXXXX" },
      { key: "capi_token", label: "Events API Access Token", placeholder: "Token...", description: "Server-to-Server Tracking" },
      { key: "advanced_matching", label: "Automatic Advanced Matching", placeholder: "", type: "toggle", description: "E-Mail, Telefon automatisch aus Formularen erfassen" },
      { key: "test_event_code", label: "Test Event Code", placeholder: "TEST...", description: "Für Server-Event-Tests" },
    ],
  },
  {
    id: "snapchat", name: "Snapchat Pixel", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx", color: "hsl(55 80% 55%)",
    fields: [
      { key: "pixel_id", label: "Pixel ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx" },
      { key: "capi_token", label: "Conversions API Token", placeholder: "Token...", description: "Server-seitiges Event-Tracking" },
      { key: "advanced_matching", label: "Advanced Matching", placeholder: "", type: "toggle", description: "User-Informationen für besseres Targeting" },
    ],
  },
  {
    id: "pinterest", name: "Pinterest Tag", placeholder: "1234567890123", color: "hsl(0 70% 50%)",
    fields: [
      { key: "pixel_id", label: "Tag ID", placeholder: "1234567890123" },
      { key: "capi_token", label: "Conversions API Token", placeholder: "pina_...", description: "Serverseitiges Tracking" },
      { key: "enhanced_match", label: "Enhanced Match", placeholder: "", type: "toggle", description: "Automatisches Matching von Kundendaten" },
    ],
  },
  {
    id: "linkedin", name: "LinkedIn Insight Tag", placeholder: "123456", color: "hsl(210 70% 50%)",
    fields: [
      { key: "pixel_id", label: "Partner ID", placeholder: "123456" },
      { key: "conversion_id", label: "Conversion ID", placeholder: "12345678", description: "Für spezifische Conversion-Aktionen" },
    ],
  },
  {
    id: "twitter", name: "Twitter/X Pixel", placeholder: "xxxxx", color: "hsl(200 80% 55%)",
    fields: [
      { key: "pixel_id", label: "Pixel ID", placeholder: "xxxxx" },
      { key: "capi_token", label: "Conversions API Token", placeholder: "Token...", description: "Server-seitiges Conversion-Tracking" },
    ],
  },
  {
    id: "google_ads", name: "Google Ads", placeholder: "AW-XXXXXXXXX", color: "hsl(30 80% 50%)",
    fields: [
      { key: "pixel_id", label: "Conversion ID", placeholder: "AW-XXXXXXXXX" },
      { key: "conversion_label", label: "Conversion Label", placeholder: "AbCdEfGhIj...", description: "Label für Conversion-Aktionen" },
      { key: "enhanced_conversions", label: "Enhanced Conversions", placeholder: "", type: "toggle", description: "First-Party-Daten für bessere Zuordnung" },
    ],
  },
  {
    id: "hotjar", name: "Hotjar", placeholder: "1234567", color: "hsl(15 85% 55%)",
    fields: [
      { key: "pixel_id", label: "Site ID", placeholder: "1234567" },
      { key: "snippet_version", label: "Snippet Version", placeholder: "6", description: "Standard: 6" },
    ],
  },
  {
    id: "microsoft_ads", name: "Microsoft/Bing Ads", placeholder: "12345678", color: "hsl(195 80% 45%)",
    fields: [
      { key: "pixel_id", label: "UET Tag ID", placeholder: "12345678" },
      { key: "enhanced_conversions", label: "Enhanced Conversions", placeholder: "", type: "toggle", description: "First-Party-Daten für verbesserte Attribution" },
    ],
  },
];

const STANDARD_EVENTS = [
  "PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase",
  "Lead", "CompleteRegistration", "Search", "AddPaymentInfo",
];

const TrackingAdmin = () => {
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [activeTab, setActiveTab] = useState<"config" | "logs" | "test">("config");
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<string>("all");
  const [testProvider, setTestProvider] = useState<string>("");
  const [testEvent, setTestEvent] = useState("PageView");
  const [testFiring, setTestFiring] = useState(false);
  // Track inline edits per provider
  const [editingIds, setEditingIds] = useState<Record<string, string>>({});

  const loadPixels = async () => {
    const { data } = await supabase.from("tracking_pixels").select("*").order("created_at", { ascending: false });
    if (data) setPixels(data as unknown as TrackingPixel[]);
  };

  const loadEventLogs = async () => {
    const { data } = await supabase
      .from("tracking_event_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setEventLogs(data as unknown as EventLog[]);
  };

  useEffect(() => {
    loadPixels();
    loadEventLogs();
  }, []);

  const savePixelId = async (providerId: string, fields: { key: string; value: string }[]) => {
    const pixelIdField = fields.find((f) => f.key === "pixel_id");
    if (!pixelIdField?.value.trim()) {
      toast({ title: "Pixel-ID eingeben", variant: "destructive" });
      return;
    }
    const existing = pixels.find((p) => p.provider === providerId);
    const config: Record<string, string> = {};
    fields.filter((f) => f.key !== "pixel_id" && f.value.trim()).forEach((f) => { config[f.key] = f.value.trim(); });
    
    if (existing) {
      await supabase.from("tracking_pixels").update({ pixel_id: pixelIdField.value.trim(), config }).eq("id", existing.id);
    } else {
      await supabase.from("tracking_pixels").insert({ provider: providerId, pixel_id: pixelIdField.value.trim(), enabled: true, config });
    }
    setEditingIds((prev) => { const n = { ...prev }; delete n[providerId]; return n; });
    loadPixels();
    toast({ title: "Gespeichert" });
  };

  const handleToggleProvider = async (providerId: string, enable: boolean) => {
    const existing = pixels.find((p) => p.provider === providerId);
    if (enable && !existing) {
      // Just create a placeholder — user will fill in IDs in the expanded section
      await supabase.from("tracking_pixels").insert({ provider: providerId, pixel_id: "PENDING", enabled: false });
      loadPixels();
    } else if (!enable && existing) {
      await supabase.from("tracking_pixels").delete().eq("id", existing.id);
      setEditingIds((prev) => { const n = { ...prev }; delete n[providerId]; return n; });
      loadPixels();
      toast({ title: `${PROVIDERS.find(p => p.id === providerId)?.name} entfernt` });
    }
  };

  const togglePixel = async (id: string, field: "enabled" | "test_mode", value: boolean) => {
    await supabase.from("tracking_pixels").update({ [field]: value }).eq("id", id);
    loadPixels();
  };

  const deletePixel = async (id: string) => {
    if (!confirm("Pixel wirklich löschen?")) return;
    await supabase.from("tracking_pixels").delete().eq("id", id);
    loadPixels();
    toast({ title: "Pixel gelöscht" });
  };

  const fireTestEvent = async () => {
    if (!testProvider) return;
    setTestFiring(true);
    const pixel = pixels.find((p) => p.provider === testProvider && (p.enabled || p.test_mode));
    await supabase.from("tracking_event_logs").insert({
      pixel_id: pixel?.id || null,
      provider: testProvider,
      event_name: testEvent,
      event_data: { test: true, timestamp: new Date().toISOString() },
      page_url: window.location.href,
      test_mode: true,
    });
    toast({ title: "Test-Event gefeuert", description: `${testEvent} → ${PROVIDERS.find(p => p.id === testProvider)?.name}` });
    setTimeout(() => {
      setTestFiring(false);
      loadEventLogs();
    }, 800);
  };

  const filteredLogs = useMemo(() => {
    return eventLogs.filter((log) => {
      if (logFilter !== "all" && log.provider !== logFilter) return false;
      if (logSearch && !log.event_name.toLowerCase().includes(logSearch.toLowerCase()) && !log.provider.toLowerCase().includes(logSearch.toLowerCase())) return false;
      return true;
    });
  }, [eventLogs, logFilter, logSearch]);

  const getProviderInfo = (id: string) => PROVIDERS.find((p) => p.id === id) || { name: id, color: "hsl(0 0% 50%)" };

  const tabs = [
    { id: "config" as const, label: "Konfigurator", icon: Settings2 },
    { id: "logs" as const, label: "Event-Log", icon: BarChart3 },
    { id: "test" as const, label: "Testmodus", icon: TestTube },
  ];

  return (
    <div>
      <h1
        className="text-xl sm:text-2xl font-black uppercase mb-6"
        style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
      >
        Tracking & Pixel
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? "hsl(330 80% 55% / 0.15)" : "transparent",
              color: activeTab === tab.id ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
            }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONFIGURATOR TAB */}
      {activeTab === "config" && (
        <div className="space-y-2">
          {PROVIDERS.map((provider, i) => {
            const pixel = pixels.find((p) => p.provider === provider.id);
            const isActive = !!pixel;
            const pixelConfig = (pixel?.config || {}) as Record<string, string>;

            return (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: "hsl(0 0% 100% / 0.04)", border: `1px solid ${isActive ? provider.color + "25" : "hsl(0 0% 100% / 0.06)"}` }}
              >
                {/* Header row — always visible */}
                <div
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer select-none"
                  onClick={() => handleToggleProvider(provider.id, !isActive)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: isActive ? provider.color : "hsl(0 0% 100% / 0.12)" }} />
                    <span className="text-sm font-bold" style={{ color: isActive ? "hsl(0 0% 100%)" : "hsl(0 0% 100% / 0.45)" }}>
                      {provider.name}
                    </span>
                    {pixel?.enabled && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "hsl(150 60% 40% / 0.12)", color: "hsl(150 60% 40%)" }}>
                        Live
                      </span>
                    )}
                    {pixel?.test_mode && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "hsl(45 80% 55% / 0.12)", color: "hsl(45 80% 55%)" }}>
                        Test
                      </span>
                    )}
                  </div>
                  {/* Switch */}
                  <div
                    className="relative w-11 h-6 rounded-full transition-all duration-200"
                    style={{ background: isActive ? provider.color : "hsl(0 0% 100% / 0.1)" }}
                    onClick={(e) => { e.stopPropagation(); handleToggleProvider(provider.id, !isActive); }}
                  >
                    <motion.div
                      className="absolute top-0.5 w-5 h-5 rounded-full"
                      style={{ background: "hsl(0 0% 100%)" }}
                      animate={{ left: isActive ? "calc(100% - 22px)" : "2px" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                </div>

                {/* Expanded settings — only when active */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-1 space-y-3" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
                        {/* Field inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {provider.fields.map((field) => {
                            const savedValue = field.key === "pixel_id" ? (pixel?.pixel_id === "PENDING" ? "" : pixel?.pixel_id ?? "") : (pixelConfig[field.key] ?? "");
                            const editKey = `${provider.id}__${field.key}`;
                            const currentVal = editingIds[editKey] ?? savedValue;

                            if (field.type === "toggle") {
                              const isOn = currentVal === "true" || currentVal === "1";
                              return (
                                <div key={field.key} className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                                  <div>
                                    <span className="text-[11px] font-medium block" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{field.label}</span>
                                    {field.description && <span className="text-[10px] block mt-0.5" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{field.description}</span>}
                                  </div>
                                  <button
                                    onClick={() => setEditingIds((prev) => ({ ...prev, [editKey]: String(!isOn) }))}
                                    className="relative w-9 h-5 rounded-full transition-all duration-200 shrink-0 ml-3"
                                    style={{ background: isOn ? provider.color : "hsl(0 0% 100% / 0.1)" }}
                                  >
                                    <motion.div
                                      className="absolute top-0.5 w-4 h-4 rounded-full"
                                      style={{ background: "hsl(0 0% 100%)" }}
                                      animate={{ left: isOn ? "calc(100% - 18px)" : "2px" }}
                                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div key={field.key}>
                                <label className="text-[11px] font-medium mb-1 block" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                                  {field.label}
                                </label>
                                {field.description && <span className="text-[10px] block mb-1.5" style={{ color: "hsl(0 0% 100% / 0.25)" }}>{field.description}</span>}
                                <input
                                  value={currentVal}
                                  onChange={(e) => setEditingIds((prev) => ({ ...prev, [editKey]: e.target.value }))}
                                  placeholder={field.placeholder}
                                  className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.8)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Action row */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {/* Save */}
                          <button
                            onClick={() => {
                              const fieldValues = provider.fields.map((f) => ({
                                key: f.key,
                                value: editingIds[`${provider.id}__${f.key}`] ?? (f.key === "pixel_id" ? (pixel?.pixel_id === "PENDING" ? "" : pixel?.pixel_id ?? "") : (pixelConfig[f.key] ?? "")),
                              }));
                              savePixelId(provider.id, fieldValues);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                            style={{ background: provider.color, color: "hsl(0 0% 100%)" }}
                          >
                            <Check className="w-3.5 h-3.5" /> Speichern
                          </button>

                          {/* Enable / Disable live */}
                          <button
                            onClick={() => pixel && togglePixel(pixel.id, "enabled", !pixel.enabled)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: pixel?.enabled ? "hsl(150 60% 40% / 0.12)" : "hsl(0 0% 100% / 0.06)",
                              color: pixel?.enabled ? "hsl(150 60% 40%)" : "hsl(0 0% 100% / 0.4)",
                            }}
                          >
                            {pixel?.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            {pixel?.enabled ? "Live" : "Deaktiviert"}
                          </button>

                          {/* Test mode */}
                          <button
                            onClick={() => pixel && togglePixel(pixel.id, "test_mode", !pixel.test_mode)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: pixel?.test_mode ? "hsl(45 80% 55% / 0.12)" : "hsl(0 0% 100% / 0.06)",
                              color: pixel?.test_mode ? "hsl(45 80% 55%)" : "hsl(0 0% 100% / 0.4)",
                            }}
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            Testmodus
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => deletePixel(pixel!.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-red-500/10 ml-auto"
                            style={{ color: "hsl(0 70% 50% / 0.5)" }}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Entfernen
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* EVENT LOG TAB */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
              <input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Event suchen..."
                className="w-full pl-10 pr-3 py-2 rounded-lg text-sm"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              />
            </div>
            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            >
              <option value="all" style={{ background: "hsl(220 50% 10%)" }}>Alle Anbieter</option>
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id} style={{ background: "hsl(220 50% 10%)" }}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={loadEventLogs}
              className="px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}
            >
              Aktualisieren
            </button>
          </div>

          {/* Log Table */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
          >
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
                <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Events gefunden</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Zeit</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Anbieter</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Event</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Seite</th>
                      <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Modus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const info = getProviderInfo(log.provider);
                      return (
                        <tr key={log.id} style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.04)" }}>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                            {new Date(log.created_at).toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "2-digit" })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: `${info.color}20`, color: info.color }}>
                              {info.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{log.event_name}</td>
                          <td className="px-4 py-3 text-xs truncate max-w-[200px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                            {log.page_url || "–"}
                          </td>
                          <td className="px-4 py-3">
                            {log.test_mode ? (
                              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "hsl(45 80% 55% / 0.15)", color: "hsl(45 80% 55%)" }}>Test</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "hsl(150 60% 40% / 0.15)", color: "hsl(150 60% 40%)" }}>Live</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEST MODE TAB */}
      {activeTab === "test" && (
        <div className="space-y-6">
          <div
            className="rounded-2xl p-6"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TestTube className="w-4 h-4" style={{ color: "hsl(45 80% 55%)" }} />
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                Test-Event feuern
              </h3>
            </div>
            <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Feuere ein Test-Event, um zu prüfen, ob dein Pixel korrekt konfiguriert ist. Test-Events werden im Event-Log als "Test" markiert.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Anbieter</label>
                <select
                  value={testProvider}
                  onChange={(e) => setTestProvider(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                >
                  <option value="" style={{ background: "hsl(220 50% 10%)" }}>Wählen...</option>
                  {pixels.map((p) => {
                    const info = getProviderInfo(p.provider);
                    return (
                      <option key={p.id} value={p.provider} style={{ background: "hsl(220 50% 10%)" }}>
                        {info.name} – {p.pixel_id}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Event</label>
                <select
                  value={testEvent}
                  onChange={(e) => setTestEvent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                >
                  {STANDARD_EVENTS.map((e) => (
                    <option key={e} value={e} style={{ background: "hsl(220 50% 10%)" }}>{e}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fireTestEvent}
                  disabled={!testProvider || testFiring}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: "hsl(45 80% 55%)", color: "hsl(0 0% 10%)" }}
                >
                  {testFiring ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.6 }}>
                      <Zap className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {testFiring ? "Wird gefeuert..." : "Event feuern"}
                </button>
              </div>
            </div>
          </div>

          {/* Pixel status overview */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
          >
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
              Pixel-Status Übersicht
            </h3>
            {pixels.length === 0 ? (
              <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Pixel konfiguriert. Gehe zum Konfigurator, um Pixel hinzuzufügen.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pixels.map((pixel) => {
                  const info = getProviderInfo(pixel.provider);
                  return (
                    <div
                      key={pixel.id}
                      className="rounded-xl p-4"
                      style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: pixel.enabled ? "hsl(150 60% 40%)" : "hsl(0 0% 100% / 0.2)" }} />
                        <span className="text-xs font-bold" style={{ color: info.color }}>{info.name}</span>
                      </div>
                      <code className="text-xs font-mono" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{pixel.pixel_id}</code>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{
                          background: pixel.enabled ? "hsl(150 60% 40% / 0.1)" : "hsl(0 70% 50% / 0.1)",
                          color: pixel.enabled ? "hsl(150 60% 40%)" : "hsl(0 70% 50%)",
                        }}>
                          {pixel.enabled ? "Aktiv" : "Inaktiv"}
                        </span>
                        {pixel.test_mode && (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "hsl(45 80% 55% / 0.1)", color: "hsl(45 80% 55%)" }}>
                            Testmodus
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Code snippet */}
          <div
            className="rounded-2xl p-6"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="w-4 h-4" style={{ color: "hsl(200 80% 55%)" }} />
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                Integration
              </h3>
            </div>
            <p className="text-xs mb-3" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Die Pixel werden automatisch auf allen öffentlichen Seiten geladen, wenn sie aktiviert sind. 
              Im Testmodus werden Events nur geloggt, aber nicht an die Anbieter gesendet.
            </p>
            <div className="text-xs font-mono p-3 rounded-lg" style={{ background: "hsl(0 0% 0% / 0.3)", color: "hsl(150 60% 60%)" }}>
              {`<TrackingProvider /> ist in der App eingebunden.`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingAdmin;
