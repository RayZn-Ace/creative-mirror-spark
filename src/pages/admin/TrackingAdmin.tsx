import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Plus, Trash2, Eye, EyeOff, FlaskConical, Check, X, Search,
  BarChart3, Code2, TestTube, ChevronDown, Settings2, Zap, HelpCircle, Radio,
} from "lucide-react";
import LiveAnalyticsTab from "@/components/admin/LiveAnalyticsTab";
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

type ProviderField = { key: string; label: string; placeholder: string; type?: "text" | "toggle"; description?: string; required?: boolean; guide?: string[] };

const PROVIDERS: { id: string; name: string; placeholder: string; color: string; fields: ProviderField[] }[] = [
  {
    id: "google_analytics", name: "Google Analytics 4", placeholder: "G-XXXXXXXXXX", color: "hsl(45 80% 55%)",
    fields: [
      { key: "pixel_id", label: "Measurement ID", placeholder: "G-XXXXXXXXXX", required: true, guide: [
        "Gehe zu analytics.google.com und logge dich ein.",
        "Klicke links unten auf ⚙️ Verwaltung (Admin).",
        "Unter 'Property' klicke auf Datenstreams → Wähle deinen Web-Stream.",
        "Kopiere die Mess-ID (beginnt mit G-).",
        "Füge sie hier ein."
      ] },
      { key: "cross_domains", label: "Cross-Domain Tracking (kommasepariert)", placeholder: "shop.example.com, checkout.example.com", description: "Session-Tracking über mehrere Domains", guide: [
        "Gib alle Domains ein, über die deine Nutzer navigieren (z.B. Hauptseite + Shop).",
        "Trenne mehrere Domains mit Komma.",
        "Dadurch wird ein Nutzer über beide Domains als eine Session gezählt.",
        "In GA4 unter Verwaltung → Datenstreams → Tag-Einstellungen → Domains konfigurieren findest du die gleiche Einstellung."
      ] },
      { key: "enhanced_measurement", label: "Enhanced Measurement", placeholder: "", type: "toggle", description: "Scrolls, Outbound Clicks, Site Search, Video, File Downloads automatisch tracken", guide: [
        "Aktiviere diesen Schalter, um automatisch zusätzliche Events zu erfassen.",
        "GA4 trackt dann: Scrolltiefe, ausgehende Links, Website-Suche, Video-Wiedergabe, Datei-Downloads.",
        "Du brauchst keinen zusätzlichen Code – alles läuft automatisch."
      ] },
      { key: "debug_mode", label: "Debug Mode (DebugView)", placeholder: "", type: "toggle", description: "Echtzeit-Debugging in Google Analytics", guide: [
        "Aktiviere dies zum Testen deiner Events.",
        "Gehe in GA4 zu Verwaltung → DebugView.",
        "Dort siehst du in Echtzeit alle Events, die von dieser Seite gesendet werden.",
        "⚠️ Deaktiviere den Debug Mode wieder, bevor du live gehst."
      ] },
    ],
  },
  {
    id: "google_tag_manager", name: "Google Tag Manager", placeholder: "GTM-XXXXXXX", color: "hsl(45 60% 50%)",
    fields: [
      { key: "pixel_id", label: "Container ID", placeholder: "GTM-XXXXXXX", required: true, guide: [
        "Gehe zu tagmanager.google.com und logge dich ein.",
        "Wähle deinen Container aus oder erstelle einen neuen.",
        "Die Container-ID steht oben rechts (beginnt mit GTM-).",
        "Kopiere sie und füge sie hier ein."
      ] },
      { key: "gtm_auth", label: "Environment Auth", placeholder: "abc123xyz", description: "Für GTM-Environments (Staging/Preview)", guide: [
        "Gehe in GTM zu Verwaltung → Environments.",
        "Wähle das gewünschte Environment (z.B. Staging).",
        "Klicke auf 'Snippet abrufen' → Kopiere den gtm_auth Wert aus der URL.",
        "Nur nötig, wenn du verschiedene GTM-Versionen für Test/Live nutzen willst."
      ] },
      { key: "gtm_preview", label: "Environment Preview ID", placeholder: "env-123", description: "Preview-Container für Testumgebungen", guide: [
        "Steht im gleichen Snippet wie gtm_auth.",
        "Suche nach gtm_preview= in der URL.",
        "Kopiere den Wert (z.B. env-123)."
      ] },
      { key: "data_layer_name", label: "DataLayer Name", placeholder: "dataLayer", description: "Custom DataLayer-Name", guide: [
        "Standardmäßig heißt der DataLayer 'dataLayer' – du musst hier nichts ändern.",
        "Nur ändern, wenn du einen Custom DataLayer-Namen in deinem GTM-Setup verwendest.",
        "Falls unsicher: lass dieses Feld leer."
      ] },
    ],
  },
  {
    id: "meta", name: "Meta Pixel (Facebook/Instagram)", placeholder: "123456789012345", color: "hsl(215 90% 55%)",
    fields: [
      { key: "pixel_id", label: "Pixel ID", placeholder: "123456789012345", required: true, guide: [
        "Gehe zu business.facebook.com → Events Manager.",
        "Klicke links auf 'Datenquellen' und wähle dein Pixel aus.",
        "Die Pixel-ID steht oben unter dem Pixel-Namen (15-stellige Zahl).",
        "Kopiere sie und füge sie hier ein."
      ] },
      { key: "capi_token", label: "Conversions API Access Token", placeholder: "EAAxxxxxxx...", description: "Server-seitiges Tracking für bessere Datenqualität (empfohlen)", guide: [
        "Gehe zu business.facebook.com → Events Manager → Dein Pixel.",
        "Klicke auf 'Einstellungen' (Settings).",
        "Scrolle zu 'Conversions API' → Klicke auf 'Access Token generieren'.",
        "Kopiere den generierten Token (beginnt mit EAA...).",
        "💡 Empfohlen für bessere Datenqualität, da iOS-Einschränkungen das Browser-Tracking limitieren."
      ] },
      { key: "test_event_code", label: "Test Event Code", placeholder: "TEST12345", description: "Aus Events Manager → Test Events", guide: [
        "Gehe zu Events Manager → Dein Pixel → 'Events testen' Tab.",
        "Dort steht oben ein Test Event Code (z.B. TEST12345).",
        "Trage ihn hier ein, um Events im Testmodus zu verifizieren.",
        "⚠️ Entferne den Code wieder, bevor du live gehst."
      ] },
      { key: "advanced_matching", label: "Advanced Matching (automatisch)", placeholder: "", type: "toggle", description: "E-Mail, Telefon etc. automatisch hashen und senden", guide: [
        "Aktiviere dies, um Kundendaten (E-Mail, Telefon) automatisch gehasht an Meta zu senden.",
        "Verbessert die Zuordnung von Website-Aktionen zu Facebook-Profilen um bis zu 30%.",
        "Daten werden mit SHA-256 verschlüsselt – Meta sieht nie die Rohdaten.",
        "⚠️ Stelle sicher, dass deine Datenschutzerklärung dies abdeckt."
      ] },
      { key: "domain_verification", label: "Domain Verification Meta-Tag", placeholder: "xxxxxxxxxxxxxxxxx", description: "Verifizierungs-String für Meta Business Suite", guide: [
        "Gehe zu business.facebook.com → Business-Einstellungen → Brand Safety → Domains.",
        "Klicke auf 'Domain hinzufügen' und gib deine Domain ein.",
        "Wähle 'Meta-Tag-Verifizierung' und kopiere den Content-Wert.",
        "Füge ihn hier ein – er wird automatisch als Meta-Tag auf deiner Seite eingefügt."
      ] },
      { key: "external_id", label: "External ID Parameter", placeholder: "user_id", description: "Custom Nutzer-ID für besseres Matching", guide: [
        "Falls du eine eigene User-ID hast (z.B. aus deinem Login-System), trage den Parameter-Namen hier ein.",
        "Meta nutzt diese ID, um Nutzer über Geräte hinweg zuzuordnen.",
        "Meistens nicht nötig – Advanced Matching reicht in den meisten Fällen."
      ] },
    ],
  },
  {
    id: "tiktok", name: "TikTok Pixel", placeholder: "CXXXXXXXXXXXXXXXXX", color: "hsl(330 80% 55%)",
    fields: [
      { key: "pixel_id", label: "Pixel ID", placeholder: "CXXXXXXXXXXXXXXXXX", required: true, guide: [
        "Gehe zu ads.tiktok.com → Tools → Events → Web Events.",
        "Klicke auf 'Pixel verwalten' oder erstelle einen neuen.",
        "Die Pixel-ID steht unter dem Pixel-Namen (beginnt mit C...).",
        "Kopiere sie und füge sie hier ein."
      ] },
      { key: "capi_token", label: "Events API Access Token", placeholder: "Token...", description: "Server-to-Server Tracking (empfohlen)", guide: [
        "Gehe zu ads.tiktok.com → Tools → Events → Web Events → Dein Pixel.",
        "Klicke auf 'Einstellungen' → Scrolle zu 'Events API'.",
        "Generiere einen Access Token und kopiere ihn.",
        "💡 Empfohlen für bessere Match-Raten, besonders bei iOS-Nutzern."
      ] },
      { key: "advanced_matching", label: "Automatic Advanced Matching", placeholder: "", type: "toggle", description: "E-Mail, Telefon automatisch aus Formularen erfassen", guide: [
        "Aktiviere dies, damit TikTok automatisch Formularfelder (E-Mail, Telefon) erkennt.",
        "Die Daten werden gehasht (SHA-256) und an TikTok gesendet.",
        "Verbessert die Zuordnung von Website-Aktionen zu TikTok-Nutzern.",
        "Findest du auch unter ads.tiktok.com → Events Manager → Pixel-Einstellungen."
      ] },
      { key: "test_event_code", label: "Test Event Code", placeholder: "TEST...", description: "Für Server-Event-Tests", guide: [
        "Gehe zu Events Manager → Dein Pixel → 'Events testen' Tab.",
        "Kopiere den angezeigten Test Event Code.",
        "Events mit diesem Code werden nur als Test gezählt.",
        "⚠️ Entferne den Code wieder, bevor du live gehst."
      ] },
    ],
  },
  {
    id: "snapchat", name: "Snapchat Pixel", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx", color: "hsl(55 80% 55%)",
    fields: [
      { key: "pixel_id", label: "Pixel ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx", required: true, guide: [
        "Gehe zu ads.snapchat.com → Events Manager.",
        "Wähle dein Snap Pixel aus oder erstelle eins.",
        "Kopiere die Pixel-ID (UUID-Format).",
      ] },
      { key: "capi_token", label: "Conversions API Token", placeholder: "Token...", description: "Server-seitiges Event-Tracking", guide: [
        "Gehe zu Events Manager → Dein Pixel → Einstellungen.",
        "Unter 'Conversions API' generiere einen Token.",
        "Ermöglicht serverseitiges Tracking unabhängig vom Browser."
      ] },
      { key: "advanced_matching", label: "Advanced Matching", placeholder: "", type: "toggle", description: "User-Informationen für besseres Targeting", guide: [
        "Aktiviere dies für besseres Ad-Targeting.",
        "Snapchat kann Nutzer besser zuordnen, wenn E-Mail/Telefon-Daten verfügbar sind.",
        "Daten werden gehasht übertragen."
      ] },
    ],
  },
  {
    id: "pinterest", name: "Pinterest Tag", placeholder: "1234567890123", color: "hsl(0 70% 50%)",
    fields: [
      { key: "pixel_id", label: "Tag ID", placeholder: "1234567890123", required: true, guide: [
        "Gehe zu ads.pinterest.com → Conversions → Tag Manager.",
        "Deine Tag-ID steht oben (13-stellige Zahl).",
        "Kopiere sie und füge sie hier ein."
      ] },
      { key: "capi_token", label: "Conversions API Token", placeholder: "pina_...", description: "Serverseitiges Tracking", guide: [
        "Gehe zu ads.pinterest.com → Conversions → Conversions API.",
        "Erstelle einen API-Token (beginnt mit pina_...).",
        "Ermöglicht serverseitige Event-Übermittlung."
      ] },
      { key: "enhanced_match", label: "Enhanced Match", placeholder: "", type: "toggle", description: "Automatisches Matching von Kundendaten", guide: [
        "Aktiviere dies, um Kundendaten für besseres Matching zu nutzen.",
        "Pinterest kann Nutzer besser zuordnen und Kampagnen besser optimieren."
      ] },
    ],
  },
  {
    id: "linkedin", name: "LinkedIn Insight Tag", placeholder: "123456", color: "hsl(210 70% 50%)",
    fields: [
      { key: "pixel_id", label: "Partner ID", placeholder: "123456", required: true, guide: [
        "Gehe zu linkedin.com/campaignmanager → Account Assets → Insight Tag.",
        "Deine Partner-ID steht im Insight-Tag-Code (6-stellige Zahl).",
        "Kopiere sie und füge sie hier ein."
      ] },
      { key: "conversion_id", label: "Conversion ID", placeholder: "12345678", description: "Für spezifische Conversion-Aktionen", guide: [
        "Gehe zu Campaign Manager → Conversions → Erstelle eine Conversion.",
        "Nach dem Erstellen bekommst du eine Conversion-ID.",
        "Trage sie hier ein, um spezifische Aktionen zu tracken (z.B. Käufe)."
      ] },
    ],
  },
  {
    id: "twitter", name: "Twitter/X Pixel", placeholder: "xxxxx", color: "hsl(200 80% 55%)",
    fields: [
      { key: "pixel_id", label: "Pixel ID", placeholder: "xxxxx", required: true, guide: [
        "Gehe zu ads.twitter.com → Tools → Events Manager.",
        "Erstelle ein Pixel oder wähle ein bestehendes aus.",
        "Kopiere die Pixel-ID und füge sie hier ein."
      ] },
      { key: "capi_token", label: "Conversions API Token", placeholder: "Token...", description: "Server-seitiges Conversion-Tracking", guide: [
        "Gehe zu Events Manager → API-Einstellungen.",
        "Generiere einen Conversions API Token.",
        "Ermöglicht Tracking unabhängig von Browser-Einschränkungen."
      ] },
    ],
  },
  {
    id: "google_ads", name: "Google Ads", placeholder: "AW-XXXXXXXXX", color: "hsl(30 80% 50%)",
    fields: [
      { key: "pixel_id", label: "Conversion ID", placeholder: "AW-XXXXXXXXX", required: true, guide: [
        "Gehe zu ads.google.com → Tools → Conversions.",
        "Wähle eine Conversion-Aktion oder erstelle eine neue.",
        "Unter 'Tag einrichten' findest du die Conversion-ID (beginnt mit AW-).",
        "Kopiere sie und füge sie hier ein."
      ] },
      { key: "conversion_label", label: "Conversion Label", placeholder: "AbCdEfGhIj...", description: "Label für Conversion-Aktionen", guide: [
        "Das Conversion Label steht im gleichen Tag-Snippet wie die Conversion-ID.",
        "Es ist ein alphanumerischer String (z.B. AbCdEfGhIj...).",
        "Jede Conversion-Aktion hat ein eigenes Label."
      ] },
      { key: "enhanced_conversions", label: "Enhanced Conversions", placeholder: "", type: "toggle", description: "First-Party-Daten für bessere Zuordnung", guide: [
        "Aktiviere dies, um gehashte Kundendaten an Google zu senden.",
        "Verbessert die Conversion-Zuordnung um bis zu 17%.",
        "Muss auch in Google Ads unter Tools → Conversions → Einstellungen aktiviert sein."
      ] },
    ],
  },
  {
    id: "hotjar", name: "Hotjar", placeholder: "1234567", color: "hsl(15 85% 55%)",
    fields: [
      { key: "pixel_id", label: "Site ID", placeholder: "1234567", required: true, guide: [
        "Gehe zu hotjar.com und logge dich ein.",
        "Klicke oben links auf dein Projekt/deine Organisation.",
        "Die Site-ID steht unter dem Projektnamen (7-stellige Zahl).",
        "Alternativ: Gehe zu Einstellungen → Tracking Code → Dort steht die hjid."
      ] },
      { key: "snippet_version", label: "Snippet Version", placeholder: "6", description: "Standard: 6 – nur ändern wenn nötig", guide: [
        "Die Snippet-Version ist standardmäßig 6 – du musst hier normalerweise nichts ändern.",
        "Nur ändern, wenn Hotjar dir eine andere Version empfiehlt."
      ] },
    ],
  },
  {
    id: "microsoft_ads", name: "Microsoft/Bing Ads", placeholder: "12345678", color: "hsl(195 80% 45%)",
    fields: [
      { key: "pixel_id", label: "UET Tag ID", placeholder: "12345678", required: true, guide: [
        "Gehe zu ads.microsoft.com → Tools → UET Tag.",
        "Erstelle einen Tag oder wähle einen bestehenden aus.",
        "Kopiere die Tag-ID (8-stellige Zahl)."
      ] },
      { key: "enhanced_conversions", label: "Enhanced Conversions", placeholder: "", type: "toggle", description: "First-Party-Daten für verbesserte Attribution", guide: [
        "Aktiviere dies für bessere Conversion-Zuordnung.",
        "Muss auch in Microsoft Ads unter UET-Tag-Einstellungen aktiviert sein.",
        "Sendet gehashte Kundendaten für genaueres Tracking."
      ] },
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
  const [activeTab, setActiveTab] = useState<"config" | "logs" | "test" | "live">("config");
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<string>("all");
  const [testProvider, setTestProvider] = useState<string>("");
  const [testEvent, setTestEvent] = useState("PageView");
  const [testFiring, setTestFiring] = useState(false);
  // Track inline edits per provider
  const [editingIds, setEditingIds] = useState<Record<string, string>>({});
  // Track which guide is open
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);

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
    { id: "live" as const, label: "Liveanalyse", icon: Radio },
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
                            const guideKey = `${provider.id}__${field.key}`;
                            const currentVal = editingIds[editKey] ?? savedValue;
                            const isGuideOpen = openGuide === guideKey;

                            const HelpButton = () => field.guide ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenGuide(isGuideOpen ? null : guideKey); }}
                                className="p-0.5 rounded transition-all"
                                style={{ color: isGuideOpen ? provider.color : "hsl(0 0% 100% / 0.25)" }}
                                title="Anleitung anzeigen"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </button>
                            ) : null;

                            const GuidePanel = () => (field.guide && isGuideOpen) ? (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="col-span-full rounded-xl p-3 mt-1"
                                style={{ background: `${provider.color}08`, border: `1px solid ${provider.color}20` }}
                              >
                                <div className="flex items-center gap-1.5 mb-2">
                                  <HelpCircle className="w-3.5 h-3.5" style={{ color: provider.color }} />
                                  <span className="text-[11px] font-bold" style={{ color: provider.color }}>Schritt-für-Schritt Anleitung</span>
                                </div>
                                <ol className="space-y-1.5">
                                  {field.guide.map((step, si) => (
                                    <li key={si} className="flex gap-2 text-[11px]" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                                      <span className="font-bold shrink-0" style={{ color: provider.color }}>{si + 1}.</span>
                                      <span>{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </motion.div>
                            ) : null;

                            const OptionalBadge = () => !field.required ? (
                              <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded ml-1" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.3)" }}>
                                Optional
                              </span>
                            ) : null;

                            if (field.type === "toggle") {
                              const isOn = currentVal === "true" || currentVal === "1";
                              return (
                                <div key={field.key} className="col-span-full">
                                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[11px] font-medium" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{field.label}</span>
                                        <OptionalBadge />
                                        <HelpButton />
                                      </div>
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
                                  <AnimatePresence><GuidePanel /></AnimatePresence>
                                </div>
                              );
                            }

                            return (
                              <div key={field.key} className={field.guide && isGuideOpen ? "col-span-full" : ""}>
                                <div className="flex items-center gap-1 mb-1">
                                  <label className="text-[11px] font-medium" style={{ color: field.required ? "hsl(0 0% 100% / 0.5)" : "hsl(0 0% 100% / 0.35)" }}>
                                    {field.label}
                                  </label>
                                  <OptionalBadge />
                                  <HelpButton />
                                </div>
                                {field.description && <span className="text-[10px] block mb-1.5" style={{ color: "hsl(0 0% 100% / 0.25)" }}>{field.description}</span>}
                                <input
                                  value={currentVal}
                                  onChange={(e) => setEditingIds((prev) => ({ ...prev, [editKey]: e.target.value }))}
                                  placeholder={field.placeholder}
                                  className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.8)", border: `1px solid ${field.required ? "hsl(0 0% 100% / 0.12)" : "hsl(0 0% 100% / 0.07)"}` }}
                                />
                                <AnimatePresence><GuidePanel /></AnimatePresence>
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
            <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
              Klicke auf einen Pixel, um Details und Diagnose-Infos zu sehen.
            </p>
            {pixels.length === 0 ? (
              <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Pixel konfiguriert. Gehe zum Konfigurator, um Pixel hinzuzufügen.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pixels.map((pixel) => {
                  const info = getProviderInfo(pixel.provider);
                  const providerDef = PROVIDERS.find(p => p.id === pixel.provider);
                  const pixelConfig = (pixel.config || {}) as Record<string, string>;
                  const isExpanded = expandedStatus === pixel.id;

                  // Diagnose status
                  const isPending = pixel.pixel_id === "PENDING" || !pixel.pixel_id?.trim();
                  const requiredFields = providerDef?.fields.filter(f => f.required) || [];
                  const missingRequired = requiredFields.filter(f => {
                    if (f.key === "pixel_id") return isPending;
                    return !pixelConfig[f.key]?.trim();
                  });
                  const hasError = missingRequired.length > 0;
                  const isLive = pixel.enabled && !hasError;
                  const isTestMode = pixel.test_mode;

                  // Build diagnostic items
                  type DiagItem = { icon: "check" | "warn" | "error" | "info"; text: string; color: string };
                  const diagnostics: DiagItem[] = [];

                  if (isPending) {
                    diagnostics.push({ icon: "error", text: "Pixel-ID fehlt. Gehe zum Konfigurator und trage deine Pixel-ID ein.", color: "hsl(0 70% 55%)" });
                  } else {
                    diagnostics.push({ icon: "check", text: `Pixel-ID gesetzt: ${pixel.pixel_id}`, color: "hsl(150 60% 40%)" });
                  }

                  missingRequired.filter(f => f.key !== "pixel_id").forEach(f => {
                    diagnostics.push({ icon: "error", text: `Pflichtfeld "${f.label}" fehlt. Gehe zum Konfigurator und trage es ein.`, color: "hsl(0 70% 55%)" });
                  });

                  if (!pixel.enabled && !hasError) {
                    diagnostics.push({ icon: "warn", text: "Pixel ist konfiguriert aber nicht aktiviert. Klicke auf 'Live' im Konfigurator, um ihn zu aktivieren.", color: "hsl(45 80% 55%)" });
                  }

                  if (pixel.enabled && hasError) {
                    diagnostics.push({ icon: "error", text: "Pixel ist als 'Live' markiert, aber es fehlen Pflichtfelder. Events werden nicht korrekt gesendet.", color: "hsl(0 70% 55%)" });
                  }

                  if (isLive) {
                    diagnostics.push({ icon: "check", text: "Pixel ist live und sendet Events an den Anbieter.", color: "hsl(150 60% 40%)" });
                  }

                  if (isTestMode) {
                    diagnostics.push({ icon: "info", text: "Testmodus aktiv – Events werden geloggt, aber nicht an den Anbieter gesendet.", color: "hsl(45 80% 55%)" });
                  }

                  // Optional field hints
                  const optionalFields = providerDef?.fields.filter(f => !f.required) || [];
                  const configuredOptional = optionalFields.filter(f => pixelConfig[f.key]?.trim());
                  const unconfiguredOptional = optionalFields.filter(f => !pixelConfig[f.key]?.trim() && f.type !== "toggle");
                  
                  if (configuredOptional.length > 0) {
                    diagnostics.push({ icon: "check", text: `${configuredOptional.length} optionale Feature(s) konfiguriert: ${configuredOptional.map(f => f.label).join(", ")}`, color: "hsl(150 60% 40%)" });
                  }
                  if (unconfiguredOptional.length > 0 && !hasError) {
                    diagnostics.push({ icon: "info", text: `${unconfiguredOptional.length} optionale Feature(s) verfügbar: ${unconfiguredOptional.map(f => f.label).join(", ")}`, color: "hsl(200 60% 55%)" });
                  }

                  // Recent events count
                  const recentLogs = eventLogs.filter(l => l.pixel_id === pixel.id);
                  if (recentLogs.length > 0) {
                    diagnostics.push({ icon: "check", text: `${recentLogs.length} Event(s) im Log gefunden.`, color: "hsl(150 60% 40%)" });
                  } else if (isLive) {
                    diagnostics.push({ icon: "warn", text: "Noch keine Events im Log. Besuche deine Seite, um ein PageView auszulösen.", color: "hsl(45 80% 55%)" });
                  }

                  const statusColor = hasError ? "hsl(0 70% 55%)" : isPending ? "hsl(45 80% 55%)" : isLive ? "hsl(150 60% 40%)" : "hsl(0 0% 100% / 0.3)";
                  const statusLabel = hasError ? "Fehler" : isPending ? "Ausstehend" : isLive ? "Aktiv" : "Inaktiv";

                  return (
                    <div key={pixel.id} className="col-span-1">
                      <div
                        className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01]"
                        style={{ background: "hsl(0 0% 100% / 0.03)", border: `1px solid ${isExpanded ? info.color + "40" : "hsl(0 0% 100% / 0.06)"}` }}
                        onClick={() => setExpandedStatus(isExpanded ? null : pixel.id)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor }} />
                          <span className="text-xs font-bold" style={{ color: info.color }}>{info.name}</span>
                          <ChevronDown className="w-3 h-3 ml-auto transition-transform" style={{ color: "hsl(0 0% 100% / 0.3)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }} />
                        </div>
                        <code className="text-xs font-mono" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                          {isPending ? "–" : pixel.pixel_id}
                        </code>
                        <div className="flex gap-2 mt-2">
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{
                            background: statusColor.replace(")", " / 0.12)").replace("hsl", "hsl"),
                            color: statusColor,
                          }}>
                            {statusLabel}
                          </span>
                          {isTestMode && (
                            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "hsl(45 80% 55% / 0.1)", color: "hsl(45 80% 55%)" }}>
                              Testmodus
                            </span>
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="rounded-b-xl px-4 pb-4 pt-3 space-y-2 -mt-2" style={{ background: "hsl(0 0% 100% / 0.02)", borderLeft: `1px solid ${info.color}20`, borderRight: `1px solid ${info.color}20`, borderBottom: `1px solid ${info.color}20` }}>
                              <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Diagnose</span>
                              {diagnostics.map((d, di) => (
                                <div key={di} className="flex items-start gap-2 py-1">
                                  <div className="mt-0.5 shrink-0">
                                    {d.icon === "check" && <Check className="w-3.5 h-3.5" style={{ color: d.color }} />}
                                    {d.icon === "error" && <X className="w-3.5 h-3.5" style={{ color: d.color }} />}
                                    {d.icon === "warn" && <Activity className="w-3.5 h-3.5" style={{ color: d.color }} />}
                                    {d.icon === "info" && <HelpCircle className="w-3.5 h-3.5" style={{ color: d.color }} />}
                                  </div>
                                  <span className="text-[11px] leading-relaxed" style={{ color: d.color }}>{d.text}</span>
                                </div>
                              ))}
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveTab("config"); }}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                                style={{ background: info.color + "20", color: info.color }}
                              >
                                <Settings2 className="w-3.5 h-3.5" /> Zum Konfigurator
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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

      {/* LIVE ANALYTICS TAB */}
      {activeTab === "live" && <LiveAnalyticsTab />}
    </div>
  );
};

export default TrackingAdmin;
