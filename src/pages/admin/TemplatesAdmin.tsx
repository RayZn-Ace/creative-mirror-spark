import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Palette, Mail, FileText, Paperclip, Save, Loader2, Upload, X, Plus, Eye,
  Type, Minus, Image, MousePointerClick, Calendar, Star, ArrowUp, ArrowDown, Trash2, Sparkles,
} from "lucide-react";
import { format } from "date-fns";

/* ─── Shared styles ─── */
const sectionStyle = {
  background: "hsl(0 0% 100% / 0.03)",
  border: "1px solid hsl(0 0% 100% / 0.06)",
  borderRadius: "16px",
  padding: "24px",
};
const labelStyle = {
  color: "hsl(0 0% 100% / 0.5)",
  fontSize: "12px",
  fontWeight: 600 as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  marginBottom: "6px",
  display: "block",
};
const inputStyle = {
  background: "hsl(0 0% 100% / 0.06)",
  border: "1px solid hsl(0 0% 100% / 0.1)",
  color: "hsl(0 0% 100%)",
  outline: "none",
};

const TABS = [
  { id: "ticket" as const, label: "Ticket", icon: Palette },
  { id: "email" as const, label: "E-Mail", icon: Mail },
  { id: "invoice" as const, label: "Rechnung", icon: FileText },
  { id: "attachments" as const, label: "Anhänge", icon: Paperclip },
];

type TabId = typeof TABS[number]["id"];

/* ─── Email Block Types ─── */
type EmailBlock =
  | { type: "text"; id: string; content: string }
  | { type: "heading"; id: string; content: string }
  | { type: "divider"; id: string }
  | { type: "event_highlight"; id: string; title: string; date: string; time: string; location: string; image_url: string; city_based?: boolean; exclude_purchased?: boolean }
  | { type: "event_list"; id: string; heading: string; events: Array<{ title: string; date: string; location: string }>; city_based?: boolean; exclude_purchased?: boolean }
  | { type: "cta_button"; id: string; text: string; url: string }
  | { type: "image"; id: string; url: string; alt: string }
  | { type: "spacer"; id: string; height: number };

/* ─── Email Template Types ─── */
interface EmailTemplate {
  subject: string;
  greeting: string;
  intro_text: string;
  footer_text: string;
  accent_color: string;
  bg_color: string;
  text_color: string;
  card_bg: string;
  logo_url: string;
  show_order_summary: boolean;
  show_event_details: boolean;
  blocks: EmailBlock[];
}

const defaultEmailTemplate: EmailTemplate = {
  subject: "Deine Tickets für {{event_title}}",
  greeting: "Hallo {{first_name}}",
  intro_text: "vielen Dank für deine Bestellung! Dein(e) Ticket(s) sind im Anhang als PDF mit QR-Code(s) beigefügt.",
  footer_text: "Bei Fragen antworte einfach auf diese E-Mail.\nWir freuen uns auf dich! 🎉",
  accent_color: "#d9338a",
  bg_color: "#ffffff",
  text_color: "#333333",
  card_bg: "#f9f9f9",
  logo_url: "",
  show_order_summary: true,
  show_event_details: true,
  blocks: [],
};

const uid = () => Math.random().toString(36).slice(2, 9);

/* ─── Email Presets ─── */
const EMAIL_PRESETS: Array<{ name: string; emoji: string; dark?: boolean; template: Partial<EmailTemplate> }> = [
  {
    name: "Party Classic",
    emoji: "🎉",
    template: {
      subject: "Deine Tickets für {{event_title}} 🎉",
      greeting: "Hey {{first_name}}",
      intro_text: "vielen Dank für deine Bestellung! Dein(e) Ticket(s) sind im Anhang als PDF mit QR-Code(s) beigefügt.",
      footer_text: "Bei Fragen antworte einfach auf diese E-Mail.\nWir freuen uns auf dich! 🎉",
      accent_color: "#d9338a",
      bg_color: "#ffffff",
      text_color: "#333333",
      card_bg: "#f9f9f9",
    },
  },
  {
    name: "Elegant & Formal",
    emoji: "✨",
    template: {
      subject: "Ihre Tickets für {{event_title}}",
      greeting: "Sehr geehrte/r {{name}}",
      intro_text: "wir bestätigen hiermit Ihre Bestellung. Ihre Eintrittskarte(n) finden Sie als PDF im Anhang dieser E-Mail.",
      footer_text: "Für Rückfragen stehen wir Ihnen gerne zur Verfügung.\nMit freundlichen Grüßen",
      accent_color: "#c8a84e",
      bg_color: "#ffffff",
      text_color: "#1a1a1a",
      card_bg: "#faf8f4",
    },
  },
  {
    name: "Festival Vibes",
    emoji: "🔥",
    template: {
      subject: "LET'S GO! Deine Tickets für {{event_title}} 🔥",
      greeting: "Yooo {{first_name}}",
      intro_text: "deine Tickets sind ready! Check den Anhang – da findest du dein(e) Ticket(s) als PDF mit QR-Code. Screenshot oder Ausdruck reicht am Einlass!",
      footer_text: "Stay hyped! 🔥🎶\nBei Fragen einfach antworten.",
      accent_color: "#f97316",
      bg_color: "#ffffff",
      text_color: "#333333",
      card_bg: "#fff7ed",
    },
  },
  {
    name: "Minimalist",
    emoji: "◻️",
    template: {
      subject: "Tickets: {{event_title}}",
      greeting: "Hallo {{first_name}}",
      intro_text: "anbei deine Tickets als PDF.",
      footer_text: "Bis bald.",
      accent_color: "#1a1a1a",
      bg_color: "#ffffff",
      text_color: "#333333",
      card_bg: "#f5f5f5",
    },
  },
  // ─── DARK PRESETS ───
  {
    name: "Midnight Club",
    emoji: "🌙",
    dark: true,
    template: {
      subject: "🌙 Deine Tickets für {{event_title}}",
      greeting: "Hey {{first_name}}",
      intro_text: "deine Tickets sind da! Im Anhang findest du alles als PDF mit QR-Code. Einfach am Einlass vorzeigen – fertig!",
      footer_text: "See you on the dancefloor! 🌙\nFragen? Einfach antworten.",
      accent_color: "#d9338a",
      bg_color: "#0f0f0f",
      text_color: "#e0e0e0",
      card_bg: "#1a1a1a",
    },
  },
  {
    name: "Neon Night",
    emoji: "💜",
    dark: true,
    template: {
      subject: "🎶 Deine Tickets für {{event_title}}",
      greeting: "Hey {{first_name}} 💜",
      intro_text: "deine Tickets sind da! Im Anhang findest du dein(e) Ticket(s) als PDF. Zeig den QR-Code einfach am Einlass vor – fertig!",
      footer_text: "Can't wait to see you! 💜✨\nFragen? Einfach antworten!",
      accent_color: "#a855f7",
      bg_color: "#0a0a12",
      text_color: "#d4d4e8",
      card_bg: "#16162a",
    },
  },
  {
    name: "Dark Gold",
    emoji: "👑",
    dark: true,
    template: {
      subject: "Ihre Eintrittskarten – {{event_title}} 👑",
      greeting: "Guten Abend {{name}}",
      intro_text: "Ihre Tickets liegen als PDF im Anhang bereit. Wir wünschen Ihnen einen unvergesslichen Abend.",
      footer_text: "Mit exklusiven Grüßen,\nIhr GIMME GIMME Team",
      accent_color: "#c8a84e",
      bg_color: "#111111",
      text_color: "#d4cfc4",
      card_bg: "#1c1a15",
    },
  },
  {
    name: "Cyber Punk",
    emoji: "⚡",
    dark: true,
    template: {
      subject: "⚡ TICKETS READY – {{event_title}}",
      greeting: "Yo {{first_name}}",
      intro_text: "Your tickets are attached as PDF. Show the QR at the door. LET'S GO!",
      footer_text: "Stay electric. ⚡\nQuestions? Hit reply.",
      accent_color: "#22d3ee",
      bg_color: "#050510",
      text_color: "#c4f0f8",
      card_bg: "#0c1829",
    },
  },
  {
    name: "Dark Sunset",
    emoji: "🌅",
    dark: true,
    template: {
      subject: "Deine Tickets – {{event_title}} 🌅",
      greeting: "Hey {{first_name}}",
      intro_text: "vielen Dank für deine Bestellung! Deine Tickets findest du als PDF im Anhang.",
      footer_text: "Wir freuen uns auf dich! 🧡\nBei Fragen einfach antworten.",
      accent_color: "#f97316",
      bg_color: "#0f0a07",
      text_color: "#e8d5c4",
      card_bg: "#1a1208",
    },
  },
  {
    name: "Freundlich & Warm",
    emoji: "☀️",
    template: {
      subject: "Deine Tickets sind da! {{event_title}} ☀️",
      greeting: "Liebe/r {{first_name}}",
      intro_text: "wie schön, dass du dabei bist! Deine Tickets findest du im Anhang als PDF mit QR-Code. Wir empfehlen dir, sie auf dem Handy zu speichern oder auszudrucken.",
      footer_text: "Wir freuen uns riesig auf dich! ☀️\nBei Fragen sind wir nur eine Antwort entfernt.",
      accent_color: "#38bdf8",
      bg_color: "#ffffff",
      text_color: "#333333",
      card_bg: "#f0f9ff",
    },
  },
];

/* ─── Invoice Template Types ─── */
interface InvoiceTemplate {
  accent_color: string;
  logo_url: string;
  additional_text: string;
  payment_terms: string;
  bank_override: string;
  show_bank_details: boolean;
  footer_note: string;
}

const defaultInvoiceTemplate: InvoiceTemplate = {
  accent_color: "#d9338a",
  logo_url: "",
  additional_text: "",
  payment_terms: "",
  bank_override: "",
  show_bank_details: true,
  footer_note: "",
};

/* ─── Invoice Presets ─── */
const INVOICE_PRESETS: Array<{ name: string; emoji: string; template: Partial<InvoiceTemplate> }> = [
  {
    name: "Standard Pink",
    emoji: "💖",
    template: {
      accent_color: "#d9338a",
      payment_terms: "Zahlung erfolgte per Online-Überweisung. Keine weitere Zahlung erforderlich.",
      footer_note: "Vielen Dank für Ihren Einkauf!",
      show_bank_details: true,
    },
  },
  {
    name: "Business Classic",
    emoji: "📋",
    template: {
      accent_color: "#1a1a1a",
      payment_terms: "Betrag wurde per Onlinezahlung beglichen. Diese Rechnung dient als Zahlungsbestätigung.",
      additional_text: "Es gelten unsere Allgemeinen Geschäftsbedingungen. Widerrufsrecht gemäß § 312g BGB ist bei Veranstaltungen ausgeschlossen.",
      footer_note: "",
      show_bank_details: true,
    },
  },
  {
    name: "Gold Premium",
    emoji: "👑",
    template: {
      accent_color: "#c8a84e",
      payment_terms: "Zahlung erhalten – vielen Dank.",
      additional_text: "",
      footer_note: "Wir schätzen Ihr Vertrauen und freuen uns auf Ihren Besuch.",
      show_bank_details: true,
    },
  },
  {
    name: "Neon Modern",
    emoji: "⚡",
    template: {
      accent_color: "#a855f7",
      payment_terms: "Payment received via online transfer.",
      additional_text: "",
      footer_note: "Thanks for your order! 🎶",
      show_bank_details: false,
    },
  },
  {
    name: "Ocean Blue",
    emoji: "🌊",
    template: {
      accent_color: "#0ea5e9",
      payment_terms: "Der Rechnungsbetrag wurde bereits beglichen.",
      additional_text: "Bitte bewahren Sie diese Rechnung für Ihre Unterlagen auf.",
      footer_note: "Wir freuen uns auf Sie!",
      show_bank_details: true,
    },
  },
  {
    name: "Sunset Warm",
    emoji: "🌅",
    template: {
      accent_color: "#f97316",
      payment_terms: "Bezahlt per Online-Zahlung.",
      additional_text: "",
      footer_note: "Danke für deine Unterstützung! 🧡",
      show_bank_details: true,
    },
  },
];

/* ─── Attachment Types ─── */
interface Attachment {
  id: string;
  name: string;
  url: string;
  type: "pdf" | "image";
  size_kb: number;
  enabled: boolean;
}

interface AttachmentsConfig {
  items: Attachment[];
}

const TemplatesAdmin = () => {
  const [activeTab, setActiveTab] = useState<TabId>("ticket");

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Palette className="w-5 h-5" style={{ color: "hsl(230 80% 56%)" }} />
        <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)" }}>
          Vorlagen
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex-1 justify-center"
              style={{
                background: active ? "hsl(230 80% 56% / 0.15)" : "transparent",
                color: active ? "hsl(230 80% 56%)" : "hsl(0 0% 100% / 0.5)",
              }}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "ticket" && <TicketTab />}
      {activeTab === "email" && <EmailTab />}
      {activeTab === "invoice" && <InvoiceTab />}
      {activeTab === "attachments" && <AttachmentsTab />}
    </div>
  );
};

/* ─── Ticket Tab: Redirect to existing page ─── */
import TicketTemplateAdmin from "./TicketTemplateAdmin";

const TicketTab = () => <TicketTemplateAdmin />;

/* ─── Block Add Menu ─── */
const BLOCK_TYPES: Array<{ type: EmailBlock["type"]; label: string; icon: any; desc: string }> = [
  { type: "text", label: "Text", icon: Type, desc: "Freitext-Absatz" },
  { type: "heading", label: "Überschrift", icon: Type, desc: "Fette Headline" },
  { type: "divider", label: "Trennlinie", icon: Minus, desc: "Horizontale Linie" },
  { type: "event_highlight", label: "Event Highlight", icon: Star, desc: "Einzelnes Event hervorheben" },
  { type: "event_list", label: "Terminliste", icon: Calendar, desc: "Mehrere Events auflisten" },
  { type: "cta_button", label: "Button", icon: MousePointerClick, desc: "Call-to-Action Link" },
  { type: "image", label: "Bild", icon: Image, desc: "Bild einfügen" },
  { type: "spacer", label: "Abstand", icon: Minus, desc: "Vertikaler Abstand" },
];

const createBlock = (type: EmailBlock["type"]): EmailBlock => {
  const id = uid();
  switch (type) {
    case "text": return { type: "text", id, content: "Hier steht dein Text..." };
    case "heading": return { type: "heading", id, content: "Deine Überschrift" };
    case "divider": return { type: "divider", id };
    case "event_highlight": return { type: "event_highlight", id, title: "Beispiel Event", date: "15.03.2026", time: "22:00", location: "Club XY", image_url: "" };
    case "event_list": return { type: "event_list", id, heading: "Unsere nächsten Events", events: [{ title: "Beispiel Event", date: "15.03.2026", location: "Club XY" }, { title: "City Party", date: "22.03.2026", location: "Residenz" }] };
    case "cta_button": return { type: "cta_button", id, text: "Jetzt Tickets sichern", url: "https://partyticket.app" };
    case "image": return { type: "image", id, url: "", alt: "" };
    case "spacer": return { type: "spacer", id, height: 24 };
    default: return { type: "text", id, content: "" };
  }
};

/* ─── Email Tab ─── */
const EmailTab = () => {
  const [tpl, setTpl] = useState<EmailTemplate>(defaultEmailTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [dbEvents, setDbEvents] = useState<Array<{ id: string; title: string; date: string | null; time: string | null; location_name: string | null; image_url: string | null }>>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  const loadEvents = async () => {
    if (eventsLoaded) return dbEvents;
    const { data } = await supabase.from("events").select("id, title, date, time, location_name, image_url").eq("status", "published").order("date", { ascending: true });
    const events = data || [];
    setDbEvents(events);
    setEventsLoaded(true);
    return events;
  };

  const magicFillHighlight = async (blockId: string) => {
    updateBlock(blockId, {
      title: "{{next_event_title}}",
      date: "{{next_event_date}}",
      time: "{{next_event_time}}",
      location: "{{next_event_location}}",
      image_url: "{{next_event_image}}",
      city_based: true,
      exclude_purchased: true,
    });
    toast.success("✨ Dynamisch – nächstes Event in der Stadt (ohne bereits gekauftes)");
  };

  const magicFillList = async (blockId: string) => {
    updateBlock(blockId, {
      heading: "Events in deiner Stadt",
      city_based: true,
      exclude_purchased: true,
      events: [
        { title: "{{event_1_title}}", date: "{{event_1_date}}", location: "{{event_1_location}}" },
        { title: "{{event_2_title}}", date: "{{event_2_date}}", location: "{{event_2_location}}" },
        { title: "{{event_3_title}}", date: "{{event_3_date}}", location: "{{event_3_location}}" },
      ],
    });
    toast.success("✨ Dynamisch – Events aus der Stadt (ohne bereits gekauftes)");
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "email_template").maybeSingle();
      if (data?.value) setTpl({ ...defaultEmailTemplate, ...(data.value as any) });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("settings").select("id").eq("key", "email_template").maybeSingle();
    if (existing) {
      await supabase.from("settings").update({ value: tpl as any, updated_at: new Date().toISOString() }).eq("key", "email_template");
    } else {
      await supabase.from("settings").insert({ key: "email_template", value: tpl as any });
    }
    setSaving(false);
    toast.success("E-Mail-Vorlage gespeichert");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `email-template/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload fehlgeschlagen"); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
    setTpl(p => ({ ...p, logo_url: urlData.publicUrl }));
    toast.success("Logo hochgeladen");
  };

  const addBlock = (type: EmailBlock["type"]) => {
    setTpl(p => ({ ...p, blocks: [...p.blocks, createBlock(type)] }));
    setShowBlockMenu(false);
  };

  const updateBlock = (id: string, updates: any) => {
    setTpl(p => ({ ...p, blocks: p.blocks.map(b => b.id === id ? { ...b, ...updates } : b) }));
  };

  const removeBlock = (id: string) => {
    setTpl(p => ({ ...p, blocks: p.blocks.filter(b => b.id !== id) }));
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    setTpl(p => {
      const idx = p.blocks.findIndex(b => b.id === id);
      if ((dir === -1 && idx === 0) || (dir === 1 && idx === p.blocks.length - 1)) return p;
      const arr = [...p.blocks];
      [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
      return { ...p, blocks: arr };
    });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;

  const placeholders = ["{{first_name}}", "{{name}}", "{{event_title}}", "{{date}}", "{{time}}", "{{location}}", "{{ticket_count}}", "{{invoice_number}}"];

  /* ─── Block Editor Item ─── */
  const renderBlockEditor = (block: EmailBlock) => {
    const wrapper = (children: React.ReactNode) => (
      <div key={block.id} className="relative group" style={{ ...sectionStyle, padding: "16px" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
            {BLOCK_TYPES.find(b => b.type === block.type)?.label}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => moveBlock(block.id, -1)} className="p-1 rounded" style={{ color: "hsl(0 0% 100% / 0.4)" }}><ArrowUp className="w-3 h-3" /></button>
            <button onClick={() => moveBlock(block.id, 1)} className="p-1 rounded" style={{ color: "hsl(0 0% 100% / 0.4)" }}><ArrowDown className="w-3 h-3" /></button>
            <button onClick={() => removeBlock(block.id)} className="p-1 rounded" style={{ color: "hsl(0 70% 50%)" }}><Trash2 className="w-3 h-3" /></button>
          </div>
        </div>
        {children}
      </div>
    );

    switch (block.type) {
      case "text":
        return wrapper(
          <textarea value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            rows={2} className="w-full text-sm px-3 py-2 rounded-lg resize-none" style={inputStyle} />
        );
      case "heading":
        return wrapper(
          <input type="text" value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className="w-full text-sm font-bold px-3 py-2 rounded-lg" style={inputStyle} />
        );
      case "divider":
        return wrapper(<div className="h-px w-full" style={{ background: "hsl(0 0% 100% / 0.1)" }} />);
      case "event_highlight":
        return wrapper(
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {block.city_based && (
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: "hsl(280 80% 55% / 0.15)", color: "hsl(280 80% 65%)", border: "1px solid hsl(280 80% 55% / 0.2)" }}>
                  🏙️ Personalisiert nach Stadt
                </span>
              )}
              <button onClick={() => magicFillHighlight(block.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 ml-auto"
                style={{ background: "linear-gradient(135deg, hsl(280 80% 55% / 0.2), hsl(330 80% 55% / 0.2))", color: "hsl(280 80% 65%)", border: "1px solid hsl(280 80% 55% / 0.3)" }}>
                <Sparkles className="w-3 h-3" /> Magic – Events nach Stadt
              </button>
            </div>
            {block.city_based && (
              <div className="text-[10px] px-2 py-1.5 rounded-lg" style={{ background: "hsl(280 80% 55% / 0.08)", color: "hsl(280 80% 65% / 0.8)" }}>
                💡 Zeigt das nächste Event in der Stadt des Empfängers (ohne das gekaufte). Falls keine Events in der Stadt → Hinweis + nächstgelegene Events mit ca. km-Entfernung.
              </div>
            )}
            <input type="text" value={block.title} onChange={(e) => updateBlock(block.id, { title: e.target.value })} placeholder="Event-Titel" className="w-full text-sm px-3 py-2 rounded-lg" style={inputStyle} />
            <div className="grid grid-cols-3 gap-2">
              <input type="text" value={block.date} onChange={(e) => updateBlock(block.id, { date: e.target.value })} placeholder="Datum" className="text-sm px-3 py-2 rounded-lg" style={inputStyle} />
              <input type="text" value={block.time} onChange={(e) => updateBlock(block.id, { time: e.target.value })} placeholder="Uhrzeit" className="text-sm px-3 py-2 rounded-lg" style={inputStyle} />
              <input type="text" value={block.location} onChange={(e) => updateBlock(block.id, { location: e.target.value })} placeholder="Location" className="text-sm px-3 py-2 rounded-lg" style={inputStyle} />
            </div>
            <input type="text" value={block.image_url} onChange={(e) => updateBlock(block.id, { image_url: e.target.value })} placeholder="Bild-URL (optional)" className="w-full text-sm px-3 py-2 rounded-lg" style={inputStyle} />
          </div>
        );
      case "event_list":
        return wrapper(
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <input type="text" value={block.heading} onChange={(e) => updateBlock(block.id, { heading: e.target.value })} placeholder="Überschrift" className="flex-1 text-sm font-bold px-3 py-2 rounded-lg mr-2" style={inputStyle} />
              <button onClick={() => magicFillList(block.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 shrink-0"
                style={{ background: "linear-gradient(135deg, hsl(280 80% 55% / 0.2), hsl(330 80% 55% / 0.2))", color: "hsl(280 80% 65%)", border: "1px solid hsl(280 80% 55% / 0.3)" }}>
                <Sparkles className="w-3 h-3" /> Magic – Events nach Stadt
              </button>
            </div>
            {block.city_based && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: "hsl(280 80% 55% / 0.15)", color: "hsl(280 80% 65%)", border: "1px solid hsl(280 80% 55% / 0.2)" }}>
                  🏙️ Personalisiert nach Stadt
                </span>
                <span className="text-[10px]" style={{ color: "hsl(280 80% 65% / 0.7)" }}>
                  Ohne gekauftes Event · Fallback: Termine in der Umgebung mit km
                </span>
              </div>
            )}
            {block.events.map((ev, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={ev.title} onChange={(e) => { const evs = [...block.events]; evs[i] = { ...evs[i], title: e.target.value }; updateBlock(block.id, { events: evs }); }}
                  placeholder="Titel" className="flex-1 text-xs px-2 py-1.5 rounded-lg" style={inputStyle} />
                <input type="text" value={ev.date} onChange={(e) => { const evs = [...block.events]; evs[i] = { ...evs[i], date: e.target.value }; updateBlock(block.id, { events: evs }); }}
                  placeholder="Datum" className="w-24 text-xs px-2 py-1.5 rounded-lg" style={inputStyle} />
                <input type="text" value={ev.location} onChange={(e) => { const evs = [...block.events]; evs[i] = { ...evs[i], location: e.target.value }; updateBlock(block.id, { events: evs }); }}
                  placeholder="Location" className="w-28 text-xs px-2 py-1.5 rounded-lg" style={inputStyle} />
                <button onClick={() => { const evs = block.events.filter((_, j) => j !== i); updateBlock(block.id, { events: evs }); }}
                  style={{ color: "hsl(0 70% 50%)" }}><X className="w-3 h-3" /></button>
              </div>
            ))}
            <button onClick={() => updateBlock(block.id, { events: [...block.events, { title: "", date: "", location: "" }] })}
              className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg" style={{ color: "hsl(230 80% 56%)", background: "hsl(230 80% 56% / 0.1)" }}>
              <Plus className="w-3 h-3" /> Event hinzufügen
            </button>
          </div>
        );
      case "cta_button":
        return wrapper(
          <div className="space-y-2">
            <input type="text" value={block.text} onChange={(e) => updateBlock(block.id, { text: e.target.value })} placeholder="Button-Text" className="w-full text-sm px-3 py-2 rounded-lg" style={inputStyle} />
            <input type="text" value={block.url} onChange={(e) => updateBlock(block.id, { url: e.target.value })} placeholder="https://..." className="w-full text-sm px-3 py-2 rounded-lg" style={inputStyle} />
          </div>
        );
      case "image":
        return wrapper(
          <div className="space-y-2">
            <input type="text" value={block.url} onChange={(e) => updateBlock(block.id, { url: e.target.value })} placeholder="Bild-URL" className="w-full text-sm px-3 py-2 rounded-lg" style={inputStyle} />
            <input type="text" value={block.alt} onChange={(e) => updateBlock(block.id, { alt: e.target.value })} placeholder="Alt-Text" className="w-full text-sm px-3 py-2 rounded-lg" style={inputStyle} />
          </div>
        );
      case "spacer":
        return wrapper(
          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Höhe (px)</label>
            <input type="number" value={block.height} onChange={(e) => updateBlock(block.id, { height: parseInt(e.target.value) || 8 })}
              className="w-20 text-sm px-2 py-1.5 rounded-lg" style={inputStyle} />
          </div>
        );
      default: return null;
    }
  };

  /* ─── Block Preview Item ─── */
  const renderBlockPreview = (block: EmailBlock) => {
    switch (block.type) {
      case "text":
        return <p key={block.id} style={{ fontSize: "12px", color: tpl.text_color, lineHeight: 1.6, margin: "0 0 12px", whiteSpace: "pre-line" }}>{block.content}</p>;
      case "heading":
        return <h3 key={block.id} style={{ fontSize: "16px", fontWeight: 800, color: tpl.text_color, margin: "0 0 8px" }}>{block.content}</h3>;
      case "divider":
        return <hr key={block.id} style={{ border: "none", borderTop: `1px solid ${tpl.accent_color}33`, margin: "12px 0" }} />;
      case "event_highlight":
        return (
          <div key={block.id} style={{ background: tpl.card_bg, borderRadius: "10px", padding: "14px", marginBottom: "12px", borderLeft: `3px solid ${tpl.accent_color}` }}>
            {block.city_based && (
              <div style={{ fontSize: "9px", fontWeight: 700, color: tpl.accent_color, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>🏙️ Personalisiert nach Stadt des Empfängers</div>
            )}
            {block.image_url && !block.image_url.startsWith("{{") && <img src={block.image_url} alt="" style={{ width: "100%", borderRadius: "6px", marginBottom: "8px", height: "60px", objectFit: "cover" }} />}
            {block.image_url && block.image_url.startsWith("{{") && <div style={{ width: "100%", borderRadius: "6px", marginBottom: "8px", height: "60px", background: tpl.accent_color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: tpl.accent_color }}>📷 Event-Bild</div>}
            <div style={{ fontSize: "13px", fontWeight: 700, color: tpl.text_color }}>{block.title.startsWith("{{") ? "Beispiel Event" : block.title}</div>
            <div style={{ fontSize: "11px", color: tpl.text_color + "99", marginTop: "4px" }}>{block.date.startsWith("{{") ? "15.03.2026" : block.date} · {block.time.startsWith("{{") ? "22:00" : block.time} · {block.location.startsWith("{{") ? "Paderborn" : block.location}</div>
          </div>
        );
      case "event_list":
        return (
          <div key={block.id} style={{ marginBottom: "12px" }}>
            {block.city_based && (
              <div style={{ fontSize: "9px", fontWeight: 700, color: tpl.accent_color, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>🏙️ Personalisiert nach Stadt</div>
            )}
            <div style={{ fontSize: "13px", fontWeight: 700, color: tpl.text_color, marginBottom: "8px" }}>{block.heading}</div>
            {block.city_based ? (
              <>
                {/* Beispiel: Events in der Stadt */}
                {["Event Paderborn", "Event Bielefeld"].map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: i % 2 === 0 ? tpl.card_bg : "transparent", borderRadius: "6px", marginBottom: "2px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: tpl.text_color }}>{t}</span>
                    <span style={{ fontSize: "10px", color: tpl.text_color + "88" }}>15.03. · Paderborn</span>
                  </div>
                ))}
                {/* Fallback-Vorschau */}
                <div style={{ margin: "10px 0 6px", padding: "8px 10px", borderRadius: "8px", background: tpl.accent_color + "11", borderLeft: `2px solid ${tpl.accent_color}44` }}>
                  <div style={{ fontSize: "10px", color: tpl.text_color + "aa", fontStyle: "italic", marginBottom: "6px" }}>
                    Falls keine Events in der Stadt:
                  </div>
                  <div style={{ fontSize: "11px", color: tpl.text_color, fontStyle: "italic", marginBottom: "6px" }}>
                    „Es sind bisher noch keine weiteren Termine in deiner Stadt bestätigt, aber hier hast du weitere Termine in der Umgebung:"
                  </div>
                  {[
                    { title: "Event Bielefeld", city: "Bielefeld", km: "~45 km", date: "22.03." },
                    { title: "Event Dortmund", city: "Dortmund", km: "~120 km", date: "29.03." },
                  ].map((ev, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", background: i % 2 === 0 ? tpl.card_bg : "transparent", borderRadius: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: tpl.text_color }}>{ev.title}</span>
                      <span style={{ fontSize: "10px", color: tpl.text_color + "88" }}>{ev.date} · {ev.city} · {ev.km}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: "9px", color: tpl.text_color + "66", marginTop: "4px", fontStyle: "italic" }}>Vorschau – wird beim Versand dynamisch befüllt</div>
              </>
            ) : block.events.map((ev, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: i % 2 === 0 ? tpl.card_bg : "transparent", borderRadius: "6px", marginBottom: "2px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: tpl.text_color }}>{ev.title}</span>
                <span style={{ fontSize: "10px", color: tpl.text_color + "88" }}>{ev.date} · {ev.location}</span>
              </div>
            ))}
          </div>
        );
      case "cta_button":
        return (
          <div key={block.id} style={{ textAlign: "center", margin: "16px 0" }}>
            <span style={{ display: "inline-block", background: tpl.accent_color, color: "#fff", padding: "10px 24px", borderRadius: "8px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>{block.text}</span>
          </div>
        );
      case "image":
        return block.url ? <img key={block.id} src={block.url} alt={block.alt} style={{ width: "100%", borderRadius: "8px", marginBottom: "12px" }} /> : null;
      case "spacer":
        return <div key={block.id} style={{ height: block.height }} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(330 80% 55%)", color: "hsl(0 0% 100%)" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          {/* Email Presets */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-1" style={{ color: "hsl(0 0% 100%)" }}>Vorlagen</h3>
            <p className="text-[11px] mb-3" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Hell & Dunkel – Klicken zum Anwenden</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EMAIL_PRESETS.map((p) => (
                <button key={p.name} onClick={() => setTpl(prev => ({ ...prev, ...p.template }))}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-[11px] font-semibold transition-all hover:scale-105 text-left"
                  style={{ background: p.dark ? "hsl(0 0% 4%)" : "hsl(0 0% 100% / 0.04)", color: "hsl(0 0% 100% / 0.7)", border: `1px solid ${p.dark ? p.template.accent_color + "44" : "hsl(0 0% 100% / 0.08)"}` }}>
                  <span className="text-base">{p.emoji}</span>
                  <div>
                    <div>{p.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.template.accent_color }} />
                      <span className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{p.dark ? "Dark" : "Light"}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Betreffzeile</h3>
            <input type="text" value={tpl.subject} onChange={(e) => setTpl(p => ({ ...p, subject: e.target.value }))}
              className="w-full text-sm px-3 py-2.5 rounded-lg" style={inputStyle} />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["{{event_title}}", "{{date}}", "{{ticket_count}}"].map(p => (
                <button key={p} onClick={() => setTpl(prev => ({ ...prev, subject: prev.subject + " " + p }))}
                  className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "hsl(330 80% 55% / 0.1)", color: "hsl(330 80% 55%)" }}>{p}</button>
              ))}
            </div>
          </div>

          {/* Greeting + Text */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Begrüßung</h3>
            <input type="text" value={tpl.greeting} onChange={(e) => setTpl(p => ({ ...p, greeting: e.target.value }))}
              className="w-full text-sm px-3 py-2.5 rounded-lg mb-3" style={inputStyle} />
            <label style={labelStyle}>Einleitungstext</label>
            <textarea value={tpl.intro_text} onChange={(e) => setTpl(p => ({ ...p, intro_text: e.target.value }))}
              rows={3} className="w-full text-sm px-3 py-2.5 rounded-lg resize-none" style={inputStyle} />
          </div>

          {/* ─── BLOCK EDITOR ─── */}
          <div style={sectionStyle}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>Inhaltsblöcke</h3>
              <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{tpl.blocks.length} Blöcke</span>
            </div>

            <div className="space-y-2">
              {tpl.blocks.map(block => renderBlockEditor(block))}
            </div>

            {/* Add Block */}
            <div className="mt-3 relative">
              <button onClick={() => setShowBlockMenu(!showBlockMenu)}
                className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{ background: "hsl(0 0% 100% / 0.04)", color: "hsl(330 80% 55%)", border: "1px dashed hsl(330 80% 55% / 0.3)" }}>
                <Plus className="w-4 h-4" /> Block hinzufügen
              </button>
              {showBlockMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl p-2 z-50 grid grid-cols-2 gap-1.5"
                  style={{ background: "hsl(0 0% 8%)", border: "1px solid hsl(0 0% 100% / 0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                  {BLOCK_TYPES.map(bt => (
                    <button key={bt.type} onClick={() => addBlock(bt.type)}
                      className="flex items-center gap-2 p-2.5 rounded-lg text-left transition-all hover:scale-[1.02]"
                      style={{ background: "hsl(0 0% 100% / 0.04)", color: "hsl(0 0% 100% / 0.7)" }}>
                      <bt.icon className="w-4 h-4 shrink-0" style={{ color: "hsl(330 80% 55%)" }} />
                      <div>
                        <div className="text-[11px] font-bold">{bt.label}</div>
                        <div className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{bt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Footer-Text</h3>
            <textarea value={tpl.footer_text} onChange={(e) => setTpl(p => ({ ...p, footer_text: e.target.value }))}
              rows={3} className="w-full text-sm px-3 py-2.5 rounded-lg resize-none" style={inputStyle} />
          </div>

          {/* Toggles */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Abschnitte</h3>
            <div className="flex gap-3">
              {[
                { key: "show_event_details" as const, label: "Event-Details" },
                { key: "show_order_summary" as const, label: "Bestellübersicht" },
              ].map(t => (
                <button key={t.key} onClick={() => setTpl(p => ({ ...p, [t.key]: !p[t.key] }))}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: tpl[t.key] ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)", border: `1.5px solid ${tpl[t.key] ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.08)"}`, color: tpl[t.key] ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)" }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors & Logo */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Farben & Logo</h3>
            <div className="flex flex-wrap items-center gap-4 mb-4">
              {[
                { key: "accent_color" as const, label: "Akzent" },
                { key: "bg_color" as const, label: "Hintergrund" },
                { key: "text_color" as const, label: "Text" },
                { key: "card_bg" as const, label: "Karten" },
              ].map(c => (
                <div key={c.key}>
                  <label style={labelStyle}>{c.label}</label>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={tpl[c.key]} onChange={(e) => setTpl(p => ({ ...p, [c.key]: e.target.value }))}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0" style={{ background: "transparent" }} />
                    <input type="text" value={tpl[c.key]} onChange={(e) => setTpl(p => ({ ...p, [c.key]: e.target.value }))}
                      className="w-20 text-[10px] font-mono px-2 py-1 rounded-lg" style={inputStyle} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label style={labelStyle}>E-Mail Logo</label>
              {tpl.logo_url ? (
                <div className="flex items-center gap-3">
                  <img src={tpl.logo_url} alt="" className="h-12 rounded-lg object-contain" style={{ background: "hsl(0 0% 100% / 0.06)" }} />
                  <button onClick={() => setTpl(p => ({ ...p, logo_url: "" }))} className="text-xs" style={{ color: "hsl(0 70% 50%)" }}>Entfernen</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)", border: "1px dashed hsl(0 0% 100% / 0.15)" }}>
                  <Upload className="w-4 h-4" /> Logo hochladen
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Placeholder Reference */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Verfügbare Platzhalter</h3>
            <div className="flex flex-wrap gap-2">
              {placeholders.map(p => (
                <span key={p} className="px-2.5 py-1 rounded-lg text-[11px] font-mono" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Email Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Vorschau</span>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: tpl.bg_color, border: "1px solid hsl(0 0% 100% / 0.1)" }}>
              {/* Accent bar */}
              <div style={{ height: "4px", background: tpl.accent_color }} />
              <div style={{ padding: "24px", fontFamily: "-apple-system, sans-serif" }}>
                {tpl.logo_url && <img src={tpl.logo_url} alt="" style={{ height: "32px", marginBottom: "16px", objectFit: "contain" }} />}
                <p style={{ fontSize: "14px", color: tpl.text_color, lineHeight: 1.6, margin: "0 0 16px" }}>
                  {tpl.greeting.replace("{{first_name}}", "Max").replace("{{name}}", "Max Mustermann")},<br /><br />
                  {tpl.intro_text}
                </p>
                {tpl.show_event_details && (
                  <div style={{ background: tpl.card_bg, borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: tpl.text_color + "88", fontWeight: 600, marginBottom: "4px" }}>Event</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: tpl.text_color, marginBottom: "8px" }}>Beispiel Event</div>
                    <div style={{ fontSize: "12px", color: tpl.text_color + "99" }}>15.03.2026 · 22:00 Uhr · Club XY</div>
                  </div>
                )}
                {tpl.show_order_summary && (
                  <div style={{ borderTop: `1px solid ${tpl.text_color}22`, paddingTop: "12px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color: tpl.text_color + "99", display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>2x Early Bird</span><span>19,98 €</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: tpl.text_color, display: "flex", justifyContent: "space-between" }}>
                      <span>Gesamt</span><span>19,98 €</span>
                    </div>
                  </div>
                )}

                {/* Render blocks in preview */}
                {tpl.blocks.length > 0 && (
                  <div style={{ borderTop: `1px solid ${tpl.text_color}22`, paddingTop: "12px", marginBottom: "12px" }}>
                    {tpl.blocks.map(block => renderBlockPreview(block))}
                  </div>
                )}

                <div style={{ borderTop: `1px solid ${tpl.text_color}22`, paddingTop: "16px" }}>
                  <p style={{ fontSize: "11px", color: tpl.text_color + "88", margin: 0, whiteSpace: "pre-line" }}>{tpl.footer_text}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Invoice Tab ─── */
const InvoiceTab = () => {
  const [tpl, setTpl] = useState<InvoiceTemplate>(defaultInvoiceTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "invoice_template").maybeSingle();
      if (data?.value) setTpl({ ...defaultInvoiceTemplate, ...(data.value as any) });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("settings").select("id").eq("key", "invoice_template").maybeSingle();
    if (existing) {
      await supabase.from("settings").update({ value: tpl as any, updated_at: new Date().toISOString() }).eq("key", "invoice_template");
    } else {
      await supabase.from("settings").insert({ key: "invoice_template", value: tpl as any });
    }
    setSaving(false);
    toast.success("Rechnungsvorlage gespeichert");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `invoice-template/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload fehlgeschlagen"); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
    setTpl(p => ({ ...p, logo_url: urlData.publicUrl }));
    toast.success("Logo hochgeladen");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(330 80% 55%)", color: "hsl(0 0% 100%)" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          {/* Invoice Presets */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Vorlagen</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INVOICE_PRESETS.map((p) => (
                <button key={p.name} onClick={() => setTpl(prev => ({ ...prev, ...p.template }))}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-[11px] font-semibold transition-all hover:scale-105 text-left"
                  style={{ background: "hsl(0 0% 100% / 0.04)", color: "hsl(0 0% 100% / 0.7)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                  <span className="text-base">{p.emoji}</span>
                  <div>
                    <div>{p.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: p.template.accent_color }} />
                      <span className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{p.template.accent_color}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Colors & Logo */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Farben & Logo</h3>
            <div className="flex items-center gap-4 mb-4">
              <div>
                <label style={labelStyle}>Akzentfarbe</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={tpl.accent_color} onChange={(e) => setTpl(p => ({ ...p, accent_color: e.target.value }))}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0" style={{ background: "transparent" }} />
                  <input type="text" value={tpl.accent_color} onChange={(e) => setTpl(p => ({ ...p, accent_color: e.target.value }))}
                    className="w-24 text-xs font-mono px-2 py-1.5 rounded-lg" style={inputStyle} />
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Rechnungs-Logo</label>
              {tpl.logo_url ? (
                <div className="flex items-center gap-3">
                  <img src={tpl.logo_url} alt="" className="h-12 rounded-lg object-contain" style={{ background: "hsl(0 0% 100% / 0.06)" }} />
                  <button onClick={() => setTpl(p => ({ ...p, logo_url: "" }))} className="text-xs" style={{ color: "hsl(0 70% 50%)" }}>Entfernen</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)", border: "1px dashed hsl(0 0% 100% / 0.15)" }}>
                  <Upload className="w-4 h-4" /> Logo hochladen
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* Additional Fields */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Zusatzfelder</h3>

            <div className="space-y-4">
              <div>
                <label style={labelStyle}>Zahlungsbedingungen</label>
                <textarea value={tpl.payment_terms}
                  onChange={(e) => setTpl(p => ({ ...p, payment_terms: e.target.value }))}
                  placeholder="z.B. Zahlung erfolgte per Online-Überweisung. Keine weitere Zahlung erforderlich."
                  rows={2} className="w-full text-sm px-3 py-2.5 rounded-lg resize-none" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Zusätzlicher Text (unter Positionen)</label>
                <textarea value={tpl.additional_text}
                  onChange={(e) => setTpl(p => ({ ...p, additional_text: e.target.value }))}
                  placeholder="z.B. AGB-Hinweis, Widerrufsbelehrung..."
                  rows={3} className="w-full text-sm px-3 py-2.5 rounded-lg resize-none" style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Bankverbindung (überschreibt Einstellungen)</label>
                <textarea value={tpl.bank_override}
                  onChange={(e) => setTpl(p => ({ ...p, bank_override: e.target.value }))}
                  placeholder="z.B. Sparkasse Paderborn · IBAN: DE89... · BIC: ..."
                  rows={2} className="w-full text-sm px-3 py-2.5 rounded-lg resize-none" style={inputStyle} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Bankdaten im Footer anzeigen</span>
                <button onClick={() => setTpl(p => ({ ...p, show_bank_details: !p.show_bank_details }))}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                  style={{ background: tpl.show_bank_details ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.06)", color: tpl.show_bank_details ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.3)" }}>
                  {tpl.show_bank_details ? "AN" : "AUS"}
                </button>
              </div>

              <div>
                <label style={labelStyle}>Footer-Notiz</label>
                <textarea value={tpl.footer_note}
                  onChange={(e) => setTpl(p => ({ ...p, footer_note: e.target.value }))}
                  placeholder="z.B. Vielen Dank für Ihren Einkauf!"
                  rows={2} className="w-full text-sm px-3 py-2.5 rounded-lg resize-none" style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Vorschau</span>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid hsl(0 0% 100% / 0.1)", aspectRatio: "210/297" }}>
              <div style={{ padding: "20px", fontFamily: "-apple-system, sans-serif", height: "100%", display: "flex", flexDirection: "column" }}>
                {tpl.logo_url && <img src={tpl.logo_url} alt="" style={{ height: "24px", marginBottom: "8px", objectFit: "contain", alignSelf: "flex-start" }} />}
                <div style={{ fontSize: "8px", color: "#999", marginBottom: "4px" }}>GIMME GIMME GmbH · Musterstr. 1 · 33098 Paderborn</div>
                <div style={{ height: "2px", background: tpl.accent_color, marginBottom: "12px" }} />
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#1a1a1a", marginBottom: "12px" }}>RECHNUNG</div>
                <div style={{ fontSize: "8px", color: "#666", marginBottom: "4px" }}>Rechnungsempfänger</div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#1a1a1a", marginBottom: "12px" }}>Max Mustermann</div>

                {/* Table */}
                <div style={{ background: "#f5f5f5", padding: "6px 8px", borderRadius: "4px", fontSize: "7px", color: "#999", fontWeight: 700, display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span>Bezeichnung</span><span>Gesamt</span>
                </div>
                <div style={{ fontSize: "8px", color: "#333", display: "flex", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid #eee" }}>
                  <span>2x Early Bird</span><span style={{ fontWeight: 700 }}>19,98 €</span>
                </div>
                {/* Totals */}
                <div style={{ fontSize: "8px", color: "#999", display: "flex", justifyContent: "flex-end", padding: "6px 8px 0", gap: "16px" }}>
                  <span>Nettobetrag</span><span>16,79 €</span>
                </div>
                <div style={{ fontSize: "8px", color: "#999", display: "flex", justifyContent: "flex-end", padding: "2px 8px 0", gap: "16px" }}>
                  <span>MwSt. (19%)</span><span>3,19 €</span>
                </div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#1a1a1a", display: "flex", justifyContent: "flex-end", padding: "6px 8px 0", gap: "16px", background: "#f5f5f5", borderRadius: "4px", marginTop: "4px", paddingBottom: "6px" }}>
                  <span>Gesamtbetrag</span><span>19,98 €</span>
                </div>

                {/* Additional texts - compact with overflow protection */}
                <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                  {tpl.payment_terms && <div style={{ fontSize: "6px", color: "#666", whiteSpace: "pre-line", lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis" }}>{tpl.payment_terms}</div>}
                  {tpl.additional_text && <div style={{ fontSize: "6px", color: "#666", whiteSpace: "pre-line", lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis" }}>{tpl.additional_text}</div>}
                </div>

                <div style={{ flexShrink: 0, borderTop: "1px solid #eee", paddingTop: "6px", marginTop: "auto" }}>
                  {tpl.footer_note && <div style={{ fontSize: "7px", color: "#666", marginBottom: "4px" }}>{tpl.footer_note}</div>}
                  {tpl.show_bank_details && (
                    <div style={{ fontSize: "6px", color: "#999" }}>
                      {tpl.bank_override || "GIMME GIMME GmbH · IBAN: DE89... · BIC: ..."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Attachments Tab ─── */
const AttachmentsTab = () => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "order_attachments").maybeSingle();
      if (data?.value) setAttachments((data.value as any).items || []);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const val: AttachmentsConfig = { items: attachments };
    const { data: existing } = await supabase.from("settings").select("id").eq("key", "order_attachments").maybeSingle();
    if (existing) {
      await supabase.from("settings").update({ value: val as any, updated_at: new Date().toISOString() }).eq("key", "order_attachments");
    } else {
      await supabase.from("settings").insert({ key: "order_attachments", value: val as any });
    }
    setSaving(false);
    toast.success("Anhänge gespeichert");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isPdf = ext === "pdf";
    const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
    if (!isPdf && !isImage) { toast.error("Nur PDF oder Bild-Dateien erlaubt"); setUploading(false); return; }

    const path = `order-attachments/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload fehlgeschlagen"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);

    const newAtt: Attachment = {
      id: Math.random().toString(36).slice(2, 9),
      name: file.name,
      url: urlData.publicUrl,
      type: isPdf ? "pdf" : "image",
      size_kb: Math.round(file.size / 1024),
      enabled: true,
    };
    setAttachments(prev => [...prev, newAtt]);
    setUploading(false);
    toast.success("Anhang hochgeladen");
  };

  const toggleAttachment = (id: string) => setAttachments(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  const removeAttachment = (id: string) => setAttachments(prev => prev.filter(a => a.id !== id));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(330 80% 55%)", color: "hsl(0 0% 100%)" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>

      <div style={sectionStyle}>
        <h3 className="text-sm font-bold mb-2" style={{ color: "hsl(0 0% 100%)" }}>Zusätzliche Anhänge</h3>
        <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
          Diese Dateien werden automatisch jeder Ticket-E-Mail als Anhang beigefügt (z.B. AGB, Hausordnung, Lageplan).
        </p>

        {attachments.length > 0 && (
          <div className="space-y-2 mb-4">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: att.enabled ? "hsl(330 80% 55% / 0.05)" : "hsl(0 0% 100% / 0.02)", border: `1px solid ${att.enabled ? "hsl(330 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.06)"}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: att.type === "pdf" ? "hsl(0 70% 50% / 0.15)" : "hsl(210 70% 50% / 0.15)", color: att.type === "pdf" ? "hsl(0 70% 50%)" : "hsl(210 70% 50%)" }}>
                  {att.type === "pdf" ? "PDF" : "IMG"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{att.name}</div>
                  <div className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{att.size_kb} KB</div>
                </div>
                <button onClick={() => toggleAttachment(att.id)} className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: att.enabled ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.06)", color: att.enabled ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.3)" }}>
                  {att.enabled ? "AN" : "AUS"}
                </button>
                <button onClick={() => removeAttachment(att.id)}><X className="w-4 h-4" style={{ color: "hsl(0 70% 50%)" }} /></button>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all hover:opacity-80" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)", border: "1px dashed hsl(0 0% 100% / 0.15)" }}>
          <Upload className="w-4 h-4" />
          {uploading ? "Wird hochgeladen..." : "PDF oder Bild hochladen"}
          <input type="file" accept=".pdf,image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      <div style={sectionStyle}>
        <h3 className="text-sm font-bold mb-2" style={{ color: "hsl(0 0% 100%)" }}>Hinweise</h3>
        <ul className="space-y-1 text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
          <li>• Anhänge werden <strong>global</strong> an alle Ticket-E-Mails angehängt</li>
          <li>• Max. Dateigröße pro Anhang: 10 MB (E-Mail-Limit)</li>
          <li>• Deaktivierte Anhänge werden nicht mitgesendet</li>
        </ul>
      </div>
    </div>
  );
};

export default TemplatesAdmin;
