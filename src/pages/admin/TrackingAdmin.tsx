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

const PROVIDERS = [
  { id: "google_analytics", name: "Google Analytics", placeholder: "G-XXXXXXXXXX", color: "hsl(45 80% 55%)" },
  { id: "google_tag_manager", name: "Google Tag Manager", placeholder: "GTM-XXXXXXX", color: "hsl(45 60% 50%)" },
  { id: "meta", name: "Meta Pixel", placeholder: "123456789012345", color: "hsl(215 90% 55%)" },
  { id: "tiktok", name: "TikTok Pixel", placeholder: "CXXXXXXXXXXXXXXXXX", color: "hsl(330 80% 55%)" },
  { id: "snapchat", name: "Snapchat Pixel", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx", color: "hsl(55 80% 55%)" },
  { id: "pinterest", name: "Pinterest Tag", placeholder: "1234567890123", color: "hsl(0 70% 50%)" },
  { id: "linkedin", name: "LinkedIn Insight", placeholder: "123456", color: "hsl(210 70% 50%)" },
  { id: "twitter", name: "Twitter/X Pixel", placeholder: "xxxxx", color: "hsl(200 80% 55%)" },
];

const STANDARD_EVENTS = [
  "PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase",
  "Lead", "CompleteRegistration", "Search", "AddPaymentInfo",
];

const TrackingAdmin = () => {
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [activeTab, setActiveTab] = useState<"config" | "logs" | "test">("config");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState(PROVIDERS[0].id);
  const [newPixelId, setNewPixelId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<string>("all");
  const [testProvider, setTestProvider] = useState<string>("");
  const [testEvent, setTestEvent] = useState("PageView");
  const [testFiring, setTestFiring] = useState(false);

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

  const addPixel = async () => {
    if (!newPixelId.trim()) return;
    const { error } = await supabase.from("tracking_pixels").insert({
      provider: newProvider,
      pixel_id: newPixelId.trim(),
      label: newLabel.trim() || null,
    });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pixel hinzugefügt" });
      setNewPixelId("");
      setNewLabel("");
      setShowAddForm(false);
      loadPixels();
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
        <div className="space-y-4">
          {/* Add Pixel Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
            style={{ background: "hsl(330 80% 55%)", color: "hsl(0 0% 100%)" }}
          >
            <Plus className="w-4 h-4" />
            Pixel hinzufügen
          </button>

          {/* Add Form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-2xl p-5 space-y-4"
                  style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                >
                  <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                    Neues Pixel hinzufügen
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Anbieter</label>
                      <select
                        value={newProvider}
                        onChange={(e) => setNewProvider(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p.id} value={p.id} style={{ background: "hsl(220 50% 10%)" }}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Pixel-ID</label>
                      <input
                        value={newPixelId}
                        onChange={(e) => setNewPixelId(e.target.value)}
                        placeholder={PROVIDERS.find((p) => p.id === newProvider)?.placeholder}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Label (optional)</label>
                      <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="z.B. Hauptseite"
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={addPixel}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
                      style={{ background: "hsl(150 60% 40%)", color: "hsl(0 0% 100%)" }}
                    >
                      <Check className="w-4 h-4" /> Speichern
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}
                    >
                      <X className="w-4 h-4" /> Abbrechen
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pixel List */}
          {pixels.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
            >
              <Activity className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
              <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Noch keine Pixel konfiguriert</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pixels.map((pixel, i) => {
                const info = getProviderInfo(pixel.provider);
                return (
                  <motion.div
                    key={pixel.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl p-4"
                    style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Provider badge */}
                      <div
                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase"
                        style={{ background: `${info.color}20`, color: info.color }}
                      >
                        {info.name}
                      </div>

                      {/* Pixel ID */}
                      <code className="text-xs font-mono px-2 py-1 rounded" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.8)" }}>
                        {pixel.pixel_id}
                      </code>

                      {pixel.label && (
                        <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                          {pixel.label}
                        </span>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        {/* Test mode toggle */}
                        <button
                          onClick={() => togglePixel(pixel.id, "test_mode", !pixel.test_mode)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: pixel.test_mode ? "hsl(45 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.06)",
                            color: pixel.test_mode ? "hsl(45 80% 55%)" : "hsl(0 0% 100% / 0.4)",
                          }}
                          title="Testmodus"
                        >
                          <FlaskConical className="w-3.5 h-3.5" />
                          Test
                        </button>

                        {/* Enable toggle */}
                        <button
                          onClick={() => togglePixel(pixel.id, "enabled", !pixel.enabled)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: pixel.enabled ? "hsl(150 60% 40% / 0.15)" : "hsl(0 0% 100% / 0.06)",
                            color: pixel.enabled ? "hsl(150 60% 40%)" : "hsl(0 0% 100% / 0.4)",
                          }}
                        >
                          {pixel.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {pixel.enabled ? "Aktiv" : "Inaktiv"}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deletePixel(pixel.id)}
                          className="p-1.5 rounded-lg transition-all hover:bg-red-500/10"
                          style={{ color: "hsl(0 70% 50% / 0.5)" }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
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
