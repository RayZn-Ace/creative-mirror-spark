import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Send, Users, CheckCircle, AlertCircle, Loader2, Filter, Eye,
  Plus, Trash2, GripVertical, Type, Heading1, Image, MousePointerClick, Minus,
  ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight, Bold, Italic, ChevronRight,
  LayoutTemplate, Sparkles, Zap, PartyPopper, Megaphone, Heart, Palette, Sun, Moon, Paintbrush,
  Star, CalendarDays, MapPin, Clock, Wand2, Calendar, Gift, Timer,
  Tag, UserPlus, X, Search, ShoppingCart, Ban, XCircle, List, Smartphone, Monitor, Save,
} from "lucide-react";
import { toast } from "sonner";


// ─── Block Types ───────────────────────────────────────────────
type BlockType = "heading" | "text" | "image" | "button" | "divider" | "spacer" | "event-highlight" | "event-list" | "voucher" | "timer";

interface BaseBlock { id: string; type: BlockType }
interface HeadingBlock extends BaseBlock { type: "heading"; text: string; level: 1 | 2 | 3; align: "left" | "center" | "right"; color: string }
interface TextBlock extends BaseBlock { type: "text"; text: string; align: "left" | "center" | "right"; bold: boolean; italic: boolean; color: string }
interface ImageBlock extends BaseBlock { type: "image"; src: string; alt: string; width: number }
interface ButtonBlock extends BaseBlock { type: "button"; text: string; url: string; bgColor: string; textColor: string; align: "left" | "center" | "right"; borderRadius: number }
interface DividerBlock extends BaseBlock { type: "divider"; color: string; style: "solid" | "dashed" | "dotted" }
interface SpacerBlock extends BaseBlock { type: "spacer"; height: number }
interface EventHighlightBlock extends BaseBlock { type: "event-highlight"; eventTitle: string; eventDate: string; eventTime: string; eventLocation: string; eventCity: string; eventImage: string; ctaText: string; ctaUrl: string; accentColor: string; bgColor: string; textColor: string; magicMode?: boolean }
interface EventListBlock extends BaseBlock { type: "event-list"; title: string; events: { date: string; city: string; location: string; url: string }[]; accentColor: string; textColor: string; bgColor: string; magicMode?: boolean; magicLimit?: number }
interface VoucherBlock extends BaseBlock { type: "voucher"; code: string; title: string; description: string; discount: string; validUntil: string; ctaText: string; ctaUrl: string; accentColor: string; bgColor: string; textColor: string; borderStyle: "dashed" | "solid" | "dotted" }
interface TimerBlock extends BaseBlock { type: "timer"; title: string; targetDate: string; targetTime: string; expiredText: string; accentColor: string; bgColor: string; textColor: string; style: "boxes" | "inline" | "minimal"; timerImageUrl?: string }

type Block = HeadingBlock | TextBlock | ImageBlock | ButtonBlock | DividerBlock | SpacerBlock | EventHighlightBlock | EventListBlock | VoucherBlock | TimerBlock;

const uid = () => Math.random().toString(36).slice(2, 10);

const BLOCK_TYPES: { type: BlockType; label: string; icon: any }[] = [
  { type: "heading", label: "Überschrift", icon: Heading1 },
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Bild", icon: Image },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "event-highlight", label: "Event Highlight", icon: Star },
  { type: "event-list", label: "Terminliste", icon: CalendarDays },
  { type: "voucher", label: "Gutschein", icon: Gift },
  { type: "timer", label: "Countdown", icon: Timer },
  { type: "divider", label: "Trennlinie", icon: Minus },
  { type: "spacer", label: "Abstand", icon: ChevronDown },
];

const createBlock = (type: BlockType, overrides?: Partial<any>): Block => {
  const id = uid();
  const base = (() => {
    switch (type) {
      case "heading": return { id, type, text: "Überschrift", level: 1 as const, align: "center" as const, color: "#ffffff" };
      case "text": return { id, type, text: "Dein Text hier...", align: "left" as const, bold: false, italic: false, color: "#333333" };
      case "image": return { id, type, src: "", alt: "Bild", width: 100 };
      case "button": return { id, type, text: "Jetzt Tickets sichern", url: "https://", bgColor: "#e91e8c", textColor: "#ffffff", align: "center" as const, borderRadius: 8 };
      case "divider": return { id, type, color: "#eeeeee", style: "solid" as const };
      case "spacer": return { id, type, height: 24 };
      case "event-highlight": return { id, type, eventTitle: "Beispiel Event", eventDate: "21. März 2026", eventTime: "19:00 Uhr", eventLocation: "Stadthalle", eventCity: "Paderborn", eventImage: "", ctaText: "🎟 Tickets sichern", ctaUrl: "https://", accentColor: "#e91e8c", bgColor: "#f8f4ff", textColor: "#1a1a1a", magicMode: false };
      case "event-list": return { id, type, title: "Alle Termine", events: [{ date: "21.03.", city: "Pforzheim", location: "Stadthalle", url: "https://" }, { date: "27.03.", city: "Rostock", location: "Stadthalle", url: "https://" }, { date: "28.03.", city: "Paderborn", location: "Stadthalle", url: "https://" }], accentColor: "#e91e8c", textColor: "#333333", bgColor: "#fafafa", magicMode: false, magicLimit: 5 };
      case "voucher": return { id, type, code: "PARTY2026", title: "🎁 Dein Gutschein", description: "Spare bei deinem nächsten Ticket-Kauf!", discount: "15% Rabatt", validUntil: "31.03.2026", ctaText: "Jetzt einlösen", ctaUrl: "https://", accentColor: "#e91e8c", bgColor: "#fff5f9", textColor: "#1a1a1a", borderStyle: "dashed" as const };
      case "timer": return { id, type, title: "⏰ Nur noch wenige Tage!", targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0], targetTime: "23:59", expiredText: "Das Angebot ist abgelaufen!", accentColor: "#e91e8c", bgColor: "#f8f4ff", textColor: "#1a1a1a", style: "boxes" as const };
    }
  })();
  return overrides ? { ...base, ...overrides, id } as Block : base as Block;
};

// ─── Newsletter Templates ──────────────────────────────────────
interface NewsletterTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  gradient: string;
  headerGradient: string;
  colorSchemeId?: string;
  blocks: () => Block[];
}

const TEMPLATES: NewsletterTemplate[] = [
  {
    id: "event-announcement",
    name: "Event Ankündigung",
    description: "Perfekt für neue Events mit Highlight",
    icon: PartyPopper,
    gradient: "linear-gradient(135deg, #e91e8c, #ff6b35)",
    headerGradient: "linear-gradient(135deg, #e91e8c, #ff6b35)",
    colorSchemeId: "light-pink",
    blocks: () => [
      createBlock("heading", { text: "🎉 Neues Event!", level: 1, align: "center", color: "#ffffff" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "Event Name", eventDate: "21. März 2026", eventTime: "19:00 Uhr", eventLocation: "Stadthalle", eventCity: "Paderborn", eventImage: "", ctaText: "🎟 Jetzt Tickets sichern", ctaUrl: "https://", accentColor: "#e91e8c", bgColor: "#f8f4ff", textColor: "#1a1a1a", magicMode: false }),
      createBlock("spacer", { height: 16 }),
      createBlock("text", { text: "Wir freuen uns auf dich! 🙌", align: "center", color: "#999999", italic: true }),
    ],
  },
  {
    id: "magic-personalized",
    name: "Magic Personalisiert",
    description: "Auto-Events je nach Empfänger-Stadt",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    headerGradient: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    colorSchemeId: "dark-purple",
    blocks: () => [
      createBlock("heading", { text: "🪄 Deine nächsten Events", level: 1, align: "center", color: "#ffffff" }),
      createBlock("spacer", { height: 8 }),
      createBlock("text", { text: "Wir haben die besten Events in deiner Nähe für dich zusammengestellt!", align: "center", color: "#555555" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🎟 Tickets sichern", ctaUrl: "", accentColor: "#8b5cf6", bgColor: "#f5f0ff", textColor: "#1a1a1a", magicMode: true }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Weitere Termine in deiner Nähe", events: [], accentColor: "#8b5cf6", textColor: "#333333", bgColor: "#fafafa", magicMode: true, magicLimit: 5 }),
      createBlock("spacer", { height: 16 }),
      createBlock("button", { text: "Alle Events ansehen →", url: "https://", bgColor: "#8b5cf6", textColor: "#ffffff", align: "center", borderRadius: 50 }),
    ],
  },
  {
    id: "tour-overview",
    name: "Tour-Übersicht",
    description: "Highlight + alle Termine auf einen Blick",
    icon: Calendar,
    gradient: "linear-gradient(135deg, #e91e8c, #7c3aed)",
    headerGradient: "linear-gradient(135deg, #e91e8c, #ff6b35)",
    colorSchemeId: "light-pink",
    blocks: () => [
      createBlock("heading", { text: "🎶 Die Tour kommt!", level: 1, align: "center", color: "#ffffff" }),
      createBlock("spacer", { height: 8 }),
      createBlock("text", { text: "Hier ist dein Überblick über alle kommenden Termine.", align: "center", color: "#555555" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "Highlight-Event", eventDate: "21. März 2026", eventTime: "19:00 Uhr", eventLocation: "Stadthalle", eventCity: "Paderborn", eventImage: "", ctaText: "🎟 Tickets sichern", ctaUrl: "https://", accentColor: "#e91e8c", bgColor: "#f8f4ff", textColor: "#1a1a1a", magicMode: false }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Alle Termine", events: [{ date: "21.03.", city: "Pforzheim", location: "Stadthalle", url: "https://" }, { date: "27.03.", city: "Rostock", location: "Stadthalle", url: "https://" }, { date: "28.03.", city: "Paderborn", location: "Stadthalle", url: "https://" }], accentColor: "#e91e8c", textColor: "#333333", bgColor: "#fafafa", magicMode: false }),
      createBlock("spacer", { height: 16 }),
      createBlock("text", { text: "Wir freuen uns auf dich! 🙌", align: "center", color: "#999999", italic: true }),
    ],
  },
  {
    id: "minimal-clean",
    name: "Minimal & Clean",
    description: "Schlicht mit Terminliste",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    headerGradient: "linear-gradient(135deg, #667eea, #764ba2)",
    colorSchemeId: "light-blue",
    blocks: () => [
      createBlock("heading", { text: "Neuigkeiten", level: 1, align: "left", color: "#1a1a1a" }),
      createBlock("divider", { color: "#667eea", style: "solid" }),
      createBlock("spacer", { height: 8 }),
      createBlock("text", { text: "Hallo!\n\nHier sind die neuesten Updates für dich. Wir haben spannende Neuigkeiten, die du nicht verpassen solltest.", align: "left", color: "#333333" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Kommende Termine", events: [{ date: "21.03.", city: "Pforzheim", location: "Stadthalle", url: "https://" }, { date: "27.03.", city: "Rostock", location: "Stadthalle", url: "https://" }], accentColor: "#667eea", textColor: "#333333", bgColor: "#f4f3ff", magicMode: false }),
      createBlock("spacer", { height: 16 }),
      createBlock("button", { text: "Mehr erfahren →", url: "https://", bgColor: "#667eea", textColor: "#ffffff", align: "left", borderRadius: 6 }),
    ],
  },
  {
    id: "neon-party",
    name: "Neon Party",
    description: "Neon-Vibes mit Magic Highlight",
    icon: Zap,
    gradient: "linear-gradient(135deg, #00f5a0, #00d9f5)",
    headerGradient: "linear-gradient(135deg, #0a0a0a, #1a1a2e)",
    colorSchemeId: "dark-neon",
    blocks: () => [
      createBlock("heading", { text: "⚡ NEON NIGHTS ⚡", level: 1, align: "center", color: "#00f5a0" }),
      createBlock("spacer", { height: 8 }),
      createBlock("text", { text: "Die heißeste Party der Stadt ist zurück!", align: "center", bold: true, color: "#00d9f5" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🔥 TICKETS HOLEN", ctaUrl: "", accentColor: "#00f5a0", bgColor: "#111122", textColor: "#eeeeee", magicMode: true }),
      createBlock("spacer", { height: 16 }),
      createBlock("heading", { text: "Line-Up", level: 2, align: "center", color: "#ff006e" }),
      createBlock("text", { text: "🎧 DJ 1 — Main Stage\n🎧 DJ 2 — Floor 2\n🎧 DJ 3 — Outdoor", align: "center", color: "#cccccc" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Alle Neon Nights Termine", events: [], accentColor: "#00f5a0", textColor: "#cccccc", bgColor: "#0d0d1a", magicMode: true, magicLimit: 4 }),
    ],
  },
  {
    id: "sale-promo",
    name: "Sale & Promo",
    description: "Für Aktionen und Rabatte",
    icon: Megaphone,
    gradient: "linear-gradient(135deg, #f5af19, #f12711)",
    headerGradient: "linear-gradient(135deg, #f5af19, #f12711)",
    colorSchemeId: "dark-fire",
    blocks: () => [
      createBlock("heading", { text: "🔥 SPECIAL DEAL 🔥", level: 1, align: "center", color: "#ffffff" }),
      createBlock("spacer", { height: 8 }),
      createBlock("timer", { title: "⏰ Angebot endet in:", targetDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0], expiredText: "Das Angebot ist leider abgelaufen!", accentColor: "#f12711", bgColor: "#fff3f0", textColor: "#1a1a1a", style: "boxes" }),
      createBlock("spacer", { height: 16 }),
      createBlock("voucher", { code: "DEAL2026", title: "🎁 Exklusiver Rabatt", description: "Nur für Newsletter-Abonnenten!", discount: "20% Rabatt", validUntil: "31.03.2026", ctaText: "💰 Jetzt einlösen", ctaUrl: "https://", accentColor: "#f5af19", bgColor: "#fff8f0", textColor: "#1a1a1a", borderStyle: "dashed" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Verfügbare Events", events: [{ date: "21.03.", city: "Pforzheim", location: "Stadthalle", url: "https://" }, { date: "27.03.", city: "Rostock", location: "Stadthalle", url: "https://" }], accentColor: "#f5af19", textColor: "#333333", bgColor: "#fff8f0", magicMode: false }),
    ],
  },
  {
    id: "recap-photos",
    name: "Event Recap",
    description: "Nachbericht + nächstes Highlight",
    icon: Heart,
    gradient: "linear-gradient(135deg, #fc5c7d, #6a82fb)",
    headerGradient: "linear-gradient(135deg, #fc5c7d, #6a82fb)",
    colorSchemeId: "light-pink",
    blocks: () => [
      createBlock("heading", { text: "Was für eine Nacht! 💜", level: 1, align: "center", color: "#ffffff" }),
      createBlock("spacer", { height: 8 }),
      createBlock("text", { text: "Danke an alle, die dabei waren! Hier sind ein paar Impressionen von der letzten Party.", align: "center", color: "#555555" }),
      createBlock("spacer", { height: 16 }),
      createBlock("image", { src: "", alt: "Foto 1", width: 100 }),
      createBlock("spacer", { height: 8 }),
      createBlock("image", { src: "", alt: "Foto 2", width: 100 }),
      createBlock("spacer", { height: 16 }),
      createBlock("divider", { color: "#6a82fb", style: "solid" }),
      createBlock("heading", { text: "Nächstes Highlight 🚀", level: 2, align: "center", color: "#6a82fb" }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🎟 Dabei sein", ctaUrl: "", accentColor: "#fc5c7d", bgColor: "#f8f4ff", textColor: "#1a1a1a", magicMode: true }),
    ],
  },
  {
    id: "classic-dark",
    name: "Classic Dark",
    description: "Elegantes dunkles Design mit Terminliste",
    icon: Heart,
    gradient: "linear-gradient(135deg, #1e3a5f, #c9a84c)",
    headerGradient: "linear-gradient(135deg, #1e3a5f, #2a5298)",
    colorSchemeId: "elegant-gold",
    blocks: () => [
      createBlock("heading", { text: "🎶 EVENT HIGHLIGHTS", level: 1, align: "center", color: "#c9a84c" }),
      createBlock("text", { text: "Die besten Events in deiner Stadt", align: "center", bold: true, color: "#ffffff" }),
      createBlock("spacer", { height: 16 }),
      createBlock("image", { src: "", alt: "Event Banner", width: 100 }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🎟 Tickets sichern", ctaUrl: "", accentColor: "#c9a84c", bgColor: "#f0eadc", textColor: "#1a1a1a", magicMode: true }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Alle Termine", events: [], accentColor: "#c9a84c", textColor: "#333333", bgColor: "#faf7f0", magicMode: true, magicLimit: 6 }),
      createBlock("spacer", { height: 8 }),
      createBlock("divider", { color: "#c9a84c", style: "solid" }),
      createBlock("text", { text: "Sei dabei! 💃", align: "center", italic: true, color: "#c9a84c" }),
    ],
  },
  {
    id: "gold-premium",
    name: "Gold Premium",
    description: "Glamourös mit Event-Highlight",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, #c9a84c, #f5e6a3)",
    headerGradient: "linear-gradient(135deg, #0d0d0d, #1a1a1a)",
    colorSchemeId: "elegant-gold",
    blocks: () => [
      createBlock("heading", { text: "✨ PREMIUM EVENTS ✨", level: 1, align: "center", color: "#c9a84c" }),
      createBlock("heading", { text: "Die besten Partys", level: 2, align: "center", color: "#f5e6a3" }),
      createBlock("spacer", { height: 16 }),
      createBlock("divider", { color: "#c9a84c", style: "solid" }),
      createBlock("spacer", { height: 8 }),
      createBlock("text", { text: "Eine unvergessliche Nacht voller Musik, Emotionen und den größten Hits!", align: "center", color: "#cccccc" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🌟 Jetzt dabei sein", ctaUrl: "", accentColor: "#c9a84c", bgColor: "#1a1a1a", textColor: "#eeeeee", magicMode: true }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Tour-Termine", events: [], accentColor: "#c9a84c", textColor: "#cccccc", bgColor: "#111111", magicMode: true, magicLimit: 5 }),
      createBlock("spacer", { height: 16 }),
      createBlock("text", { text: "Don't miss out! 🪩", align: "center", italic: true, color: "#f5e6a3" }),
    ],
  },
  {
    id: "summer-vibes",
    name: "Sommer Edition",
    description: "Sommer-Vibes mit Terminliste",
    icon: Sun,
    gradient: "linear-gradient(135deg, #0ea5e9, #f97316)",
    headerGradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    colorSchemeId: "warm-sunset",
    blocks: () => [
      createBlock("heading", { text: "☀️ SOMMER EVENTS", level: 1, align: "center", color: "#ffffff" }),
      createBlock("text", { text: "Die heißesten Partys – Summer Edition", align: "center", bold: true, color: "#ffe4c4" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🏖 Tickets holen", ctaUrl: "", accentColor: "#f97316", bgColor: "#fff7ed", textColor: "#1a1a1a", magicMode: true }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Sommer-Termine", events: [], accentColor: "#0ea5e9", textColor: "#333333", bgColor: "#f0f9ff", magicMode: true, magicLimit: 5 }),
      createBlock("spacer", { height: 8 }),
      createBlock("divider", { color: "#0ea5e9", style: "dashed" }),
      createBlock("text", { text: "See you there! 🌺", align: "center", italic: true, color: "#0ea5e9" }),
    ],
  },
  {
    id: "voucher-countdown",
    name: "Gutschein & Countdown",
    description: "Gutschein mit Countdown-Timer",
    icon: Gift,
    gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
    headerGradient: "linear-gradient(135deg, #8b5cf6, #a855f7)",
    colorSchemeId: "dark-purple",
    blocks: () => [
      createBlock("heading", { text: "🎁 Exklusiv für dich!", level: 1, align: "center", color: "#ffffff" }),
      createBlock("spacer", { height: 8 }),
      createBlock("text", { text: "Nur für kurze Zeit — sichere dir deinen exklusiven Rabatt!", align: "center", color: "#555555" }),
      createBlock("spacer", { height: 16 }),
      createBlock("timer", { title: "⏳ Angebot läuft ab in:", targetDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0], expiredText: "Leider abgelaufen!", accentColor: "#8b5cf6", bgColor: "#f5f0ff", textColor: "#1a1a1a", style: "boxes" }),
      createBlock("spacer", { height: 16 }),
      createBlock("voucher", { code: "VIP2026", title: "🎟 VIP Gutschein", description: "Dein persönlicher Rabatt auf alle Events!", discount: "25% Rabatt", validUntil: "30.04.2026", ctaText: "🎉 Jetzt einlösen", ctaUrl: "https://", accentColor: "#ec4899", bgColor: "#fff0f6", textColor: "#1a1a1a", borderStyle: "dashed" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🎟 Tickets sichern", ctaUrl: "", accentColor: "#8b5cf6", bgColor: "#f5f0ff", textColor: "#1a1a1a", magicMode: true }),
    ],
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Frühbucher-Aktion mit Timer",
    icon: Timer,
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    headerGradient: "linear-gradient(135deg, #10b981, #059669)",
    colorSchemeId: "light-green",
    blocks: () => [
      createBlock("heading", { text: "🐣 Early Bird Tickets!", level: 1, align: "center", color: "#ffffff" }),
      createBlock("spacer", { height: 8 }),
      createBlock("text", { text: "Sei schnell und sichere dir die günstigsten Tickets — nur für begrenzte Zeit!", align: "center", color: "#555555" }),
      createBlock("spacer", { height: 16 }),
      createBlock("timer", { title: "Early Bird endet in:", targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0], expiredText: "Die Early Bird Phase ist vorbei!", accentColor: "#10b981", bgColor: "#f0fdf4", textColor: "#1a1a1a", style: "inline" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🐣 Early Bird sichern", ctaUrl: "", accentColor: "#10b981", bgColor: "#f0fdf4", textColor: "#1a1a1a", magicMode: true }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Alle Termine", events: [], accentColor: "#10b981", textColor: "#333333", bgColor: "#f0fdf4", magicMode: true, magicLimit: 5 }),
    ],
  },
];

// ─── Block to HTML ─────────────────────────────────────────────
const blockToHtml = (block: Block): string => {
  switch (block.type) {
    case "heading": {
      const sizes = { 1: "28px", 2: "22px", 3: "18px" };
      return `<h${block.level} style="margin:0 0 8px;font-size:${sizes[block.level]};font-weight:800;text-align:${block.align};color:${block.color};">${block.text}</h${block.level}>`;
    }
    case "text":
      return `<p style="margin:0 0 16px;line-height:1.6;text-align:${block.align};color:${block.color};${block.bold ? "font-weight:700;" : ""}${block.italic ? "font-style:italic;" : ""}">${block.text.replace(/\n/g, "<br/>")}</p>`;
    case "image":
      return block.src ? `<div style="text-align:center;margin:0 0 16px;"><img src="${block.src}" alt="${block.alt}" style="max-width:${block.width}%;height:auto;border-radius:8px;" /></div>` : "";
    case "button":
      return `<div style="text-align:${block.align};margin:0 0 16px;"><a href="${block.url}" style="display:inline-block;padding:14px 32px;background:${block.bgColor};color:${block.textColor};text-decoration:none;font-weight:700;font-size:14px;border-radius:${block.borderRadius}px;">${block.text}</a></div>`;
    case "divider":
      return `<hr style="border:none;border-top:1px ${block.style} ${block.color};margin:16px 0;" />`;
    case "spacer":
      return `<div style="height:${block.height}px;"></div>`;
    case "event-highlight":
      if (block.magicMode) {
        return `<!--MAGIC_HIGHLIGHT:${JSON.stringify({ accentColor: block.accentColor, bgColor: block.bgColor, textColor: block.textColor, ctaText: block.ctaText })}-->
<div style="margin:0 0 16px;border-radius:12px;overflow:hidden;background:${block.bgColor};border:1px solid ${block.accentColor}22;">
<div style="height:8px;background:${block.accentColor};"></div>
<div style="padding:24px;text-align:center;">
<p style="margin:0;font-size:14px;color:${block.accentColor};font-weight:700;">✨ Magic Modus ✨</p>
<p style="margin:8px 0 0;font-size:12px;color:${block.textColor}99;">Wird automatisch mit dem nächsten Event in der Stadt des Empfängers befüllt</p>
</div></div>`;
      }
      return `<div style="margin:0 0 16px;border-radius:12px;overflow:hidden;background:${block.bgColor};border:1px solid ${block.accentColor}22;">
${block.eventImage ? `<img src="${block.eventImage}" alt="${block.eventTitle}" style="width:100%;height:auto;display:block;" />` : `<div style="height:8px;background:${block.accentColor};"></div>`}
<div style="padding:24px;">
<h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:${block.textColor};">${block.eventTitle}</h2>
<table cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tbody>
<tr><td style="padding:4px 12px 4px 0;font-size:14px;color:${block.accentColor};font-weight:700;">📅</td><td style="padding:4px 0;font-size:14px;color:${block.textColor};">${block.eventDate} · ${block.eventTime}</td></tr>
<tr><td style="padding:4px 12px 4px 0;font-size:14px;color:${block.accentColor};font-weight:700;">📍</td><td style="padding:4px 0;font-size:14px;color:${block.textColor};">${block.eventLocation}, ${block.eventCity}</td></tr>
</tbody></table>
<div style="text-align:center;"><a href="${block.ctaUrl}" style="display:inline-block;padding:14px 40px;background:${block.accentColor};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:50px;">${block.ctaText}</a></div>
</div></div>`;
    case "event-list": {
      if (block.magicMode) {
        return `<!--MAGIC_EVENT_LIST:${JSON.stringify({ accentColor: block.accentColor, textColor: block.textColor, bgColor: block.bgColor, title: block.title, limit: block.magicLimit || 5 })}-->
<div style="margin:0 0 16px;">
${block.title ? `<h3 style="margin:0 0 12px;font-size:18px;font-weight:800;color:${block.textColor};text-align:center;">${block.title}</h3>` : ""}
<div style="background:${block.bgColor};border-radius:8px;padding:20px;text-align:center;">
<p style="margin:0;font-size:14px;color:${block.accentColor};font-weight:700;">✨ Magic Modus ✨</p>
<p style="margin:8px 0 0;font-size:12px;color:${block.textColor}99;">Zeigt automatisch die nächsten Termine in der Stadt des Empfängers</p>
</div></div>`;
      }
      const rows = block.events.map((ev) =>
        `<tr>
<td style="padding:10px 12px;font-size:14px;font-weight:700;color:${block.accentColor};border-bottom:1px solid ${block.accentColor}15;white-space:nowrap;">${ev.date}</td>
<td style="padding:10px 12px;font-size:14px;color:${block.textColor};border-bottom:1px solid ${block.accentColor}15;"><strong>${ev.city}</strong><br/><span style="font-size:12px;color:${block.textColor}99;">${ev.location}</span></td>
<td style="padding:10px 12px;border-bottom:1px solid ${block.accentColor}15;text-align:right;"><a href="${ev.url}" style="display:inline-block;padding:6px 16px;background:${block.accentColor};color:#ffffff;text-decoration:none;font-weight:700;font-size:11px;border-radius:50px;text-transform:uppercase;">Tickets</a></td>
</tr>`
      ).join("");
      return `<div style="margin:0 0 16px;">
${block.title ? `<h3 style="margin:0 0 12px;font-size:18px;font-weight:800;color:${block.textColor};text-align:center;">${block.title}</h3>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="background:${block.bgColor};border-radius:8px;overflow:hidden;">
<tbody>${rows}</tbody>
</table></div>`;
    }
    case "voucher":
      return `<div style="margin:0 0 16px;border:2px ${block.borderStyle} ${block.accentColor};border-radius:12px;background:${block.bgColor};overflow:hidden;">
<div style="background:${block.accentColor};padding:12px 24px;text-align:center;">
<span style="font-size:20px;font-weight:800;color:#ffffff;">${block.title}</span>
</div>
<div style="padding:24px;text-align:center;">
<p style="margin:0 0 12px;font-size:14px;color:${block.textColor};">${block.description}</p>
<div style="margin:0 0 16px;padding:16px;background:${block.accentColor}11;border-radius:8px;border:1px dashed ${block.accentColor}44;">
<p style="margin:0 0 4px;font-size:28px;font-weight:900;color:${block.accentColor};">${block.discount}</p>
<p style="margin:0;font-size:18px;font-weight:800;letter-spacing:4px;color:${block.textColor};">${block.code}</p>
</div>
<p style="margin:0 0 16px;font-size:12px;color:${block.textColor}88;">Gültig bis ${block.validUntil}</p>
<a href="${block.ctaUrl}" style="display:inline-block;padding:14px 40px;background:${block.accentColor};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:50px;">${block.ctaText}</a>
</div></div>`;
    case "timer": {
      const now = new Date();
      const target = new Date(block.targetDate + "T" + (block.targetTime || "23:59") + ":00");
      const diff = Math.max(0, target.getTime() - now.getTime());
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const pad = (n: number) => String(n).padStart(2, "0");

      // Build the live countdown image URL (edge function or external)
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
      const autoImageUrl = supabaseUrl
        ? `${supabaseUrl}/functions/v1/countdown-image?d=${encodeURIComponent(block.targetDate)}&t=${encodeURIComponent(block.targetTime || "23:59")}&accent=${encodeURIComponent(block.accentColor)}&bg=${encodeURIComponent(block.bgColor)}&text=${encodeURIComponent(block.textColor)}&title=${encodeURIComponent(block.title || "")}&expired=${encodeURIComponent(block.expiredText || "Abgelaufen!")}`
        : "";
      const imageUrl = block.timerImageUrl || autoImageUrl;

      // For email: always use the image URL (live on every open)
      // For preview: show the static computed countdown (ticks via previewTick)
      const emailTimerHtml = imageUrl
        ? `<img src="${imageUrl}" alt="Countdown: ${pad(days)}T ${pad(hours)}H ${pad(mins)}M" style="display:block;margin:0 auto;max-width:100%;height:auto;border-radius:12px;" />`
        : block.style === "boxes"
        ? `<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tbody><tr>
${[{ v: pad(days), l: "Tage" }, { v: pad(hours), l: "Std" }, { v: pad(mins), l: "Min" }, { v: pad(secs), l: "Sek" }].map(({ v, l }) => `<td style="padding:0 6px;text-align:center;">
<div style="background:${block.accentColor};color:#ffffff;font-size:28px;font-weight:900;padding:12px 16px;border-radius:8px;min-width:50px;">${v}</div>
<p style="margin:4px 0 0;font-size:10px;font-weight:700;color:${block.textColor}88;text-transform:uppercase;">${l}</p>
</td>`).join("")}
</tr></tbody></table>`
        : block.style === "inline"
        ? `<p style="font-size:32px;font-weight:900;color:${block.accentColor};text-align:center;margin:0;letter-spacing:2px;">${pad(days)} : ${pad(hours)} : ${pad(mins)} : ${pad(secs)}</p>
<p style="font-size:10px;color:${block.textColor}88;text-align:center;margin:4px 0 0;">Tage : Stunden : Minuten : Sekunden</p>`
        : `<p style="font-size:24px;font-weight:800;color:${block.accentColor};text-align:center;margin:0;">⏱ Noch ${days} Tage übrig</p>`;

      return `<!--TIMER:${JSON.stringify({ targetDate: block.targetDate, expiredText: block.expiredText, style: block.style, accentColor: block.accentColor, textColor: block.textColor, bgColor: block.bgColor })}-->
<div style="margin:0 0 16px;text-align:center;">
${emailTimerHtml}
</div>`;
    }
    default:
      return "";
  }
};

// ─── Data Types ────────────────────────────────────────────────
type Order = { email: string; name: string | null; status: string; event_id: string | null; birth_date: string | null };
type EventInfo = { id: string; title: string; city: string | null };
type Subscriber = { id: string; email: string; name: string | null; tags: string[]; city: string | null; birth_date: string | null; source: string; unsubscribed: boolean };
type NLList = { id: string; name: string; description: string | null; color: string | null; member_count?: number };

type RecipientMode = "smart" | "list" | "manual";
type OrderFilter = "all" | "paid" | "unpaid" | "cancelled";
type AgeFilter = { min: number | null; max: number | null };

// ─── Shared input style ────────────────────────────────────────
const inputStyle = { background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" };
const labelCls = "text-[10px] font-bold uppercase tracking-wider block mb-1";
const labelStyle = { color: "hsl(0 0% 100% / 0.3)" };

// ─── Alignment Picker ──────────────────────────────────────────
const AlignPicker = ({ value, onChange }: { value: string; onChange: (v: any) => void }) => (
  <div className="flex gap-1">
    {[{ v: "left", I: AlignLeft }, { v: "center", I: AlignCenter }, { v: "right", I: AlignRight }].map(({ v, I }) => (
      <button key={v} onClick={() => onChange(v)} className="p-1.5 rounded-md transition-all" style={{ background: value === v ? "hsl(330 80% 55% / 0.2)" : "transparent", color: value === v ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.3)" }}>
        <I className="w-3.5 h-3.5" />
      </button>
    ))}
  </div>
);

// ─── Placeholder Variables ─────────────────────────────────────
const PLACEHOLDERS = [
  { tag: "{{name}}", label: "Name", icon: "👤" },
  { tag: "{{city}}", label: "Stadt", icon: "📍" },
  { tag: "{{email}}", label: "E-Mail", icon: "✉️" },
];

const PlaceholderPills = ({ onInsert }: { onInsert: (tag: string) => void }) => (
  <div className="flex flex-wrap gap-1 pt-1">
    <span className="text-[9px] font-medium mr-1 self-center" style={{ color: "hsl(0 0% 100% / 0.25)" }}>Platzhalter:</span>
    {PLACEHOLDERS.map((p) => (
      <button
        key={p.tag}
        type="button"
        onClick={() => onInsert(p.tag)}
        className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-all hover:scale-105"
        style={{ background: "hsl(270 80% 55% / 0.15)", color: "hsl(270 80% 55%)", border: "1px solid hsl(270 80% 55% / 0.25)" }}
        title={`${p.tag} — Wird beim Versand durch den ${p.label} des Empfängers ersetzt`}
      >
        {p.icon} {p.tag}
      </button>
    ))}
  </div>
);

// ─── Block Editor Panel ────────────────────────────────────────
const BlockEditor = ({ block, onChange, colorScheme }: { block: Block; onChange: (b: Block) => void; colorScheme?: ColorScheme }) => {
  const upd = (patch: Partial<Block>) => onChange({ ...block, ...patch } as Block);

  const insertPlaceholder = (field: "text", tag: string) => {
    const current = (block as any)[field] || "";
    upd({ [field]: current + tag } as any);
  };

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <input value={block.text} onChange={(e) => upd({ text: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <PlaceholderPills onInsert={(tag) => insertPlaceholder("text", tag)} />
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {([1, 2, 3] as const).map((l) => (
                <button key={l} onClick={() => upd({ level: l })} className="px-2.5 py-1 rounded-md text-[10px] font-bold" style={{ background: block.level === l ? "hsl(330 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.04)", color: block.level === l ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)" }}>H{l}</button>
              ))}
            </div>
            <AlignPicker value={block.align} onChange={(v) => upd({ align: v })} />
            <input type="color" value={block.color} onChange={(e) => upd({ color: e.target.value })} className="w-6 h-6 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
          </div>
        </div>
      );
    case "text":
      return (
        <div className="space-y-2">
          <textarea value={block.text} onChange={(e) => upd({ text: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg text-sm resize-y" style={inputStyle} />
          <PlaceholderPills onInsert={(tag) => insertPlaceholder("text", tag)} />
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <button onClick={() => upd({ bold: !block.bold })} className="p-1.5 rounded-md" style={{ background: block.bold ? "hsl(330 80% 55% / 0.2)" : "transparent", color: block.bold ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.3)" }}><Bold className="w-3.5 h-3.5" /></button>
              <button onClick={() => upd({ italic: !block.italic })} className="p-1.5 rounded-md" style={{ background: block.italic ? "hsl(330 80% 55% / 0.2)" : "transparent", color: block.italic ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.3)" }}><Italic className="w-3.5 h-3.5" /></button>
            </div>
            <AlignPicker value={block.align} onChange={(v) => upd({ align: v })} />
            <input type="color" value={block.color} onChange={(e) => upd({ color: e.target.value })} className="w-6 h-6 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
          </div>
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <label className={labelCls} style={labelStyle}>Bild-URL</label>
          <input value={block.src} onChange={(e) => upd({ src: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <label className={labelCls} style={labelStyle}>Alt-Text</label>
          <input value={block.alt} onChange={(e) => upd({ alt: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <label className={labelCls} style={labelStyle}>Breite: {block.width}%</label>
          <input type="range" min={20} max={100} value={block.width} onChange={(e) => upd({ width: Number(e.target.value) })} className="w-full" />
          {block.src && <img src={block.src} alt={block.alt} className="rounded-lg max-h-[120px] object-contain" style={{ opacity: 0.7 }} />}
        </div>
      );
    case "button":
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls} style={labelStyle}>Button-Text</label>
              <input value={block.text} onChange={(e) => upd({ text: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Link-URL</label>
              <input value={block.url} onChange={(e) => upd({ url: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlignPicker value={block.align} onChange={(v) => upd({ align: v })} />
            <div className="flex items-center gap-2">
              <label className="text-[10px]" style={labelStyle}>BG</label>
              <input type="color" value={block.bgColor} onChange={(e) => upd({ bgColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
              <label className="text-[10px]" style={labelStyle}>Text</label>
              <input type="color" value={block.textColor} onChange={(e) => upd({ textColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[10px]" style={labelStyle}>Radius</label>
              <input type="number" min={0} max={50} value={block.borderRadius} onChange={(e) => upd({ borderRadius: Number(e.target.value) })} className="w-12 px-2 py-1 rounded text-xs text-center" style={inputStyle} />
            </div>
          </div>
        </div>
      );
    case "divider":
      return (
        <div className="flex items-center gap-3">
          <select value={block.style} onChange={(e) => upd({ style: e.target.value as any })} className="px-2 py-1 rounded text-xs" style={inputStyle}>
            <option value="solid" style={{ background: "hsl(220 50% 10%)" }}>Durchgezogen</option>
            <option value="dashed" style={{ background: "hsl(220 50% 10%)" }}>Gestrichelt</option>
            <option value="dotted" style={{ background: "hsl(220 50% 10%)" }}>Gepunktet</option>
          </select>
          <input type="color" value={block.color} onChange={(e) => upd({ color: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
        </div>
      );
    case "spacer":
      return (
        <div className="flex items-center gap-2">
          <label className="text-[10px]" style={labelStyle}>Höhe: {block.height}px</label>
          <input type="range" min={8} max={80} value={block.height} onChange={(e) => upd({ height: Number(e.target.value) })} className="flex-1" />
        </div>
      );
    case "event-highlight":
      return (
        <div className="space-y-2">
          {/* Magic Mode Toggle */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: block.magicMode ? "hsl(270 80% 55% / 0.12)" : "hsl(0 0% 100% / 0.03)", border: `1px solid ${block.magicMode ? "hsl(270 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.06)"}` }}>
            <Wand2 className="w-4 h-4 shrink-0" style={{ color: block.magicMode ? "hsl(270 80% 55%)" : "hsl(0 0% 100% / 0.3)" }} />
            <div className="flex-1">
              <span className="text-[11px] font-bold" style={{ color: block.magicMode ? "hsl(270 80% 55%)" : "hsl(0 0% 100% / 0.5)" }}>Magic Modus</span>
              <p className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Zeigt automatisch das nächste Event in der Stadt des Empfängers</p>
            </div>
            <button onClick={() => upd({ magicMode: !block.magicMode })} className="w-10 h-5 rounded-full relative transition-all" style={{ background: block.magicMode ? "hsl(270 80% 55%)" : "hsl(0 0% 100% / 0.1)" }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: "#fff", left: block.magicMode ? "22px" : "2px" }} />
            </button>
          </div>
          {!block.magicMode && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls} style={labelStyle}>Event-Titel</label>
                  <input value={block.eventTitle} onChange={(e) => upd({ eventTitle: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Stadt</label>
                  <input value={block.eventCity} onChange={(e) => upd({ eventCity: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls} style={labelStyle}>Datum</label>
                  <input value={block.eventDate} onChange={(e) => upd({ eventDate: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>Uhrzeit</label>
                  <input value={block.eventTime} onChange={(e) => upd({ eventTime: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Location</label>
                <input value={block.eventLocation} onChange={(e) => upd({ eventLocation: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>Bild-URL (optional)</label>
                <input value={block.eventImage} onChange={(e) => upd({ eventImage: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls} style={labelStyle}>CTA-Text</label>
                  <input value={block.ctaText} onChange={(e) => upd({ ctaText: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
                <div>
                  <label className={labelCls} style={labelStyle}>CTA-URL</label>
                  <input value={block.ctaUrl} onChange={(e) => upd({ ctaUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                </div>
              </div>
            </>
          )}
          {block.magicMode && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls} style={labelStyle}>CTA-Text</label>
                <input value={block.ctaText} onChange={(e) => upd({ ctaText: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <label className="text-[9px]" style={labelStyle}>Akzent</label>
              <input type="color" value={block.accentColor} onChange={(e) => upd({ accentColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[9px]" style={labelStyle}>Hintergrund</label>
              <input type="color" value={block.bgColor} onChange={(e) => upd({ bgColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[9px]" style={labelStyle}>Text</label>
              <input type="color" value={block.textColor} onChange={(e) => upd({ textColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
            </div>
          </div>
        </div>
      );
    case "event-list":
      return (
        <div className="space-y-2">
          {/* Magic Mode Toggle */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background: block.magicMode ? "hsl(270 80% 55% / 0.12)" : "hsl(0 0% 100% / 0.03)", border: `1px solid ${block.magicMode ? "hsl(270 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.06)"}` }}>
            <Wand2 className="w-4 h-4 shrink-0" style={{ color: block.magicMode ? "hsl(270 80% 55%)" : "hsl(0 0% 100% / 0.3)" }} />
            <div className="flex-1">
              <span className="text-[11px] font-bold" style={{ color: block.magicMode ? "hsl(270 80% 55%)" : "hsl(0 0% 100% / 0.5)" }}>Magic Modus</span>
              <p className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Zeigt automatisch Termine in der Stadt des Empfängers</p>
            </div>
            <button onClick={() => upd({ magicMode: !block.magicMode })} className="w-10 h-5 rounded-full relative transition-all" style={{ background: block.magicMode ? "hsl(270 80% 55%)" : "hsl(0 0% 100% / 0.1)" }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all" style={{ background: "#fff", left: block.magicMode ? "22px" : "2px" }} />
            </button>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Titel</label>
            <input value={block.title} onChange={(e) => upd({ title: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          </div>
          {block.magicMode && (
            <div>
              <label className={labelCls} style={labelStyle}>Max. Termine anzeigen</label>
              <input type="number" min={1} max={20} value={block.magicLimit || 5} onChange={(e) => upd({ magicLimit: Number(e.target.value) })} className="w-20 px-2 py-1.5 rounded text-xs" style={inputStyle} />
            </div>
          )}
          {!block.magicMode && (
            <div className="space-y-1.5">
              <label className={labelCls} style={labelStyle}>Termine</label>
              {block.events.map((ev, i) => (
                <div key={i} className="grid grid-cols-[60px_1fr_1fr_auto] gap-1.5 items-center">
                  <input value={ev.date} onChange={(e) => { const evts = [...block.events]; evts[i] = { ...evts[i], date: e.target.value }; upd({ events: evts }); }} placeholder="Datum" className="px-2 py-1.5 rounded text-[10px]" style={inputStyle} />
                  <input value={ev.city} onChange={(e) => { const evts = [...block.events]; evts[i] = { ...evts[i], city: e.target.value }; upd({ events: evts }); }} placeholder="Stadt" className="px-2 py-1.5 rounded text-[10px]" style={inputStyle} />
                  <input value={ev.location} onChange={(e) => { const evts = [...block.events]; evts[i] = { ...evts[i], location: e.target.value }; upd({ events: evts }); }} placeholder="Location" className="px-2 py-1.5 rounded text-[10px]" style={inputStyle} />
                  <button onClick={() => { const evts = block.events.filter((_, j) => j !== i); upd({ events: evts }); }} className="p-1 rounded hover:bg-red-500/10" style={{ color: "hsl(0 70% 55% / 0.5)" }}><Trash2 className="w-3 h-3" /></button>
                </div>
              ))}
              <button onClick={() => upd({ events: [...block.events, { date: "", city: "", location: "", url: "https://" }] })} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg hover:bg-white/[0.04]" style={{ color: "hsl(330 80% 55% / 0.7)" }}>
                <Plus className="w-3 h-3" /> Termin hinzufügen
              </button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <label className="text-[9px]" style={labelStyle}>Akzent</label>
              <input type="color" value={block.accentColor} onChange={(e) => upd({ accentColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[9px]" style={labelStyle}>BG</label>
              <input type="color" value={block.bgColor} onChange={(e) => upd({ bgColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-[9px]" style={labelStyle}>Text</label>
              <input type="color" value={block.textColor} onChange={(e) => upd({ textColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
            </div>
          </div>
        </div>
      );
    case "voucher":
      return (
        <div className="space-y-2">
          <label className={labelCls} style={labelStyle}>Titel</label>
          <input value={block.title} onChange={(e) => upd({ title: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <label className={labelCls} style={labelStyle}>Beschreibung</label>
          <input value={block.description} onChange={(e) => upd({ description: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls} style={labelStyle}>Rabatt</label>
              <input value={block.discount} onChange={(e) => upd({ discount: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} placeholder="z.B. 15% Rabatt" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Code</label>
              <input value={block.code} onChange={(e) => upd({ code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 rounded-lg text-sm font-mono tracking-widest" style={inputStyle} />
            </div>
          </div>
          <label className={labelCls} style={labelStyle}>Gültig bis</label>
          <input value={block.validUntil} onChange={(e) => upd({ validUntil: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls} style={labelStyle}>CTA Text</label>
              <input value={block.ctaText} onChange={(e) => upd({ ctaText: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>CTA URL</label>
              <input value={block.ctaUrl} onChange={(e) => upd({ ctaUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
            </div>
          </div>
          <label className={labelCls} style={labelStyle}>Rahmen-Stil</label>
          <div className="flex gap-1">
            {(["dashed", "solid", "dotted"] as const).map((s) => (
              <button key={s} onClick={() => upd({ borderStyle: s })} className="px-3 py-1 rounded-md text-[10px] font-bold" style={{ background: block.borderStyle === s ? "hsl(330 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.04)", color: block.borderStyle === s ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)" }}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><label className="text-[9px]" style={labelStyle}>Akzent</label><input type="color" value={block.accentColor} onChange={(e) => upd({ accentColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} /></div>
            <div className="flex items-center gap-1"><label className="text-[9px]" style={labelStyle}>BG</label><input type="color" value={block.bgColor} onChange={(e) => upd({ bgColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} /></div>
            <div className="flex items-center gap-1"><label className="text-[9px]" style={labelStyle}>Text</label><input type="color" value={block.textColor} onChange={(e) => upd({ textColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} /></div>
          </div>
        </div>
      );
    case "timer":
      return (
        <div className="space-y-2">
          <label className={labelCls} style={labelStyle}>Titel</label>
          <input value={block.title} onChange={(e) => upd({ title: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <label className={labelCls} style={labelStyle}>Zieldatum</label>
          <input type="date" value={block.targetDate} onChange={(e) => upd({ targetDate: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <label className={labelCls} style={labelStyle}>Zielzeit</label>
          <input type="time" value={block.targetTime || "23:59"} onChange={(e) => upd({ targetTime: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <label className={labelCls} style={labelStyle}>Text nach Ablauf</label>
          <input value={block.expiredText} onChange={(e) => upd({ expiredText: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
          <label className={labelCls} style={labelStyle}>Darstellung</label>
          <div className="flex gap-1">
            {([{ v: "boxes", l: "Boxen" }, { v: "inline", l: "Inline" }, { v: "minimal", l: "Minimal" }] as const).map(({ v, l }) => (
              <button key={v} onClick={() => upd({ style: v })} className="px-3 py-1 rounded-md text-[10px] font-bold" style={{ background: block.style === v ? "hsl(330 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.04)", color: block.style === v ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)" }}>{l}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><label className="text-[9px]" style={labelStyle}>Akzent</label><input type="color" value={block.accentColor} onChange={(e) => upd({ accentColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} /></div>
            <div className="flex items-center gap-1"><label className="text-[9px]" style={labelStyle}>BG</label><input type="color" value={block.bgColor} onChange={(e) => upd({ bgColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} /></div>
            <div className="flex items-center gap-1"><label className="text-[9px]" style={labelStyle}>Text</label><input type="color" value={block.textColor} onChange={(e) => upd({ textColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} /></div>
          </div>
          <button
            onClick={() => {
              if (!colorScheme) return;
              const accent = colorScheme.headerGradient?.match(/#[0-9a-fA-F]{6}/g)?.[0] || "#e91e8c";
              const isDark = colorScheme.bodyBg?.startsWith("#0") || colorScheme.bodyBg?.startsWith("#1");
              upd({ accentColor: accent, bgColor: isDark ? colorScheme.contentBg : "#f8f4ff", textColor: isDark ? "#eeeeee" : "#1a1a1a" });
            }}
            className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
            style={{ background: "hsl(330 80% 55% / 0.15)", color: "hsl(330 80% 55%)" }}
          >
            <Wand2 className="w-3 h-3" /> An Style anpassen
          </button>
          <div className="mt-2 p-2 rounded-lg" style={{ background: "hsl(140 60% 40% / 0.08)", border: "1px solid hsl(140 60% 40% / 0.15)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle className="w-3 h-3" style={{ color: "hsl(140 60% 50%)" }} />
              <label className={labelCls} style={{ ...labelStyle, color: "hsl(140 60% 50%)", margin: 0 }}>
                Live-Countdown in E-Mail
              </label>
            </div>
            <p className="text-[9px] mb-1.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Das Countdown-Bild wird bei jedem Öffnen der E-Mail automatisch neu generiert und zeigt die aktuelle verbleibende Zeit.
            </p>
            <details className="mt-1">
              <summary className="text-[9px] cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                Eigene Bild-URL verwenden (optional)
              </summary>
              <input
                value={block.timerImageUrl || ""}
                onChange={(e) => upd({ timerImageUrl: e.target.value || undefined })}
                placeholder="https://i.countdownmail.com/xxxx.gif"
                className="w-full px-3 py-2 rounded-lg text-sm mt-1"
                style={inputStyle}
              />
              <p className="text-[8px] mt-0.5" style={{ color: "hsl(0 0% 100% / 0.25)" }}>
                Leer lassen = automatisch generiert
              </p>
            </details>
          </div>
        </div>
      );
  }
};

// ─── Color Schemes ─────────────────────────────────────────────
interface ColorScheme {
  id: string;
  name: string;
  icon: any;
  bodyBg: string;
  cardBg: string;
  headerGradient: string;
  headerText: string;
  contentBg: string;
  footerBg: string;
  footerText: string;
  footerBorder: string;
}

const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: "light-pink", name: "Hell — Pink", icon: Sun,
    bodyBg: "#f4f4f4", cardBg: "#ffffff", headerGradient: "linear-gradient(135deg,#e91e8c,#ff6b35)",
    headerText: "#ffffff", contentBg: "#ffffff", footerBg: "#fafafa", footerText: "#999999", footerBorder: "#eeeeee",
  },
  {
    id: "light-blue", name: "Hell — Blau", icon: Sun,
    bodyBg: "#eef2f7", cardBg: "#ffffff", headerGradient: "linear-gradient(135deg,#667eea,#764ba2)",
    headerText: "#ffffff", contentBg: "#ffffff", footerBg: "#f5f7fa", footerText: "#8899aa", footerBorder: "#e2e8f0",
  },
  {
    id: "light-green", name: "Hell — Grün", icon: Sun,
    bodyBg: "#f0f7f4", cardBg: "#ffffff", headerGradient: "linear-gradient(135deg,#11998e,#38ef7d)",
    headerText: "#ffffff", contentBg: "#ffffff", footerBg: "#f5faf7", footerText: "#88aa99", footerBorder: "#d4e8dc",
  },
  {
    id: "dark-neon", name: "Dunkel — Neon", icon: Moon,
    bodyBg: "#0a0a0a", cardBg: "#1a1a2e", headerGradient: "linear-gradient(135deg,#00f5a0,#00d9f5)",
    headerText: "#0a0a0a", contentBg: "#1a1a2e", footerBg: "#111122", footerText: "#666688", footerBorder: "#2a2a3e",
  },
  {
    id: "dark-purple", name: "Dunkel — Lila", icon: Moon,
    bodyBg: "#0f0515", cardBg: "#1a0a2e", headerGradient: "linear-gradient(135deg,#a855f7,#ec4899)",
    headerText: "#ffffff", contentBg: "#1a0a2e", footerBg: "#150a22", footerText: "#6b5080", footerBorder: "#2a1a3e",
  },
  {
    id: "dark-fire", name: "Dunkel — Feuer", icon: Moon,
    bodyBg: "#0a0505", cardBg: "#1a1010", headerGradient: "linear-gradient(135deg,#f12711,#f5af19)",
    headerText: "#ffffff", contentBg: "#1a1010", footerBg: "#110a0a", footerText: "#805050", footerBorder: "#2e1a1a",
  },
  {
    id: "warm-sunset", name: "Warm — Sunset", icon: Paintbrush,
    bodyBg: "#fff5ee", cardBg: "#ffffff", headerGradient: "linear-gradient(135deg,#ff6b35,#ff2d87)",
    headerText: "#ffffff", contentBg: "#ffffff", footerBg: "#fff0e6", footerText: "#cc8866", footerBorder: "#ffe0cc",
  },
  {
    id: "elegant-gold", name: "Elegant — Gold", icon: Paintbrush,
    bodyBg: "#0d0d0d", cardBg: "#1a1a1a", headerGradient: "linear-gradient(135deg,#bf953f,#fcf6ba,#b38728)",
    headerText: "#0d0d0d", contentBg: "#1a1a1a", footerBg: "#111111", footerText: "#666655", footerBorder: "#2a2a22",
  },
];

// ─── Block Label ───────────────────────────────────────────────
const blockLabel = (type: BlockType) => BLOCK_TYPES.find((b) => b.type === type)!;

// ─── Main Component ────────────────────────────────────────────
const NewsletterAdmin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [nlLists, setNlLists] = useState<NLList[]>([]);
  const [loading, setLoading] = useState(true);
   const [sending, setSending] = useState(false);
   const [sent, setSent] = useState<{ sent: number; failed: number } | null>(null);
   const [sendProgress, setSendProgress] = useState<{ current: number; total: number; sent: number; failed: number } | null>(null);

  const [subject, setSubject] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([
    createBlock("heading"),
    createBlock("text"),
    createBlock("button"),
  ]);
  const [fromName, setFromName] = useState("Nightlife Generation");
  const [fromEmail, setFromEmail] = useState("newsletter@nightlifeticket.app");

  // Recipient filters
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("smart");
  
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("paid");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ageFilter, setAgeFilter] = useState<AgeFilter>({ min: null, max: null });
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [manualEmails, setManualEmails] = useState<string>("");
  const [recipientSearch, setRecipientSearch] = useState("");

  // UI state
  const [preview, setPreview] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showRecipients, setShowRecipients] = useState(true);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [colorScheme, setColorScheme] = useState<ColorScheme>(COLOR_SCHEMES[0]);
  const [showColorSchemes, setShowColorSchemes] = useState(false);

  // Custom templates
  interface CustomTemplate { id: string; name: string; blocks: Block[]; colorSchemeId: string; colorScheme: ColorScheme; createdAt: string }
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = "";
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [previewTick, setPreviewTick] = useState(0);

  // Tick every second so countdown in preview stays live
  useEffect(() => {
    const hasTimer = blocks.some((b) => b.type === "timer");
    if (!hasTimer) return;
    const iv = setInterval(() => setPreviewTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [blocks]);

  // List/subscriber management
  const [showListManager, setShowListManager] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newSubEmail, setNewSubEmail] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubTags, setNewSubTags] = useState("");
  const [newSubCity, setNewSubCity] = useState("");

  // Sync event block colors when color scheme changes
  const applyColorScheme = useCallback((cs: ColorScheme) => {
    setColorScheme(cs);
    const accentFromGradient = cs.headerGradient.match(/#[0-9a-fA-F]{6}/g)?.[0] || "#e91e8c";
    const isDark = cs.bodyBg.startsWith("#0") || cs.bodyBg.startsWith("#1") || cs.bodyBg === "#0a0a0a";
    setBlocks((prev) => prev.map((b) => {
      if (b.type === "event-highlight") return { ...b, accentColor: accentFromGradient, bgColor: isDark ? cs.contentBg : "#f8f4ff", textColor: isDark ? "#eeeeee" : "#1a1a1a" };
      if (b.type === "event-list") return { ...b, accentColor: accentFromGradient, bgColor: isDark ? cs.contentBg : "#fafafa", textColor: isDark ? "#cccccc" : "#333333" };
      if (b.type === "voucher") return { ...b, accentColor: accentFromGradient, bgColor: isDark ? cs.contentBg : "#fff5f9", textColor: isDark ? "#eeeeee" : "#1a1a1a" };
      if (b.type === "timer") return { ...b, accentColor: accentFromGradient, bgColor: isDark ? cs.contentBg : "#f8f4ff", textColor: isDark ? "#eeeeee" : "#1a1a1a" };
      return b;
    }));
  }, []);

  const loadData = useCallback(async () => {
    const [ordersRes, eventsRes, subsRes, listsRes] = await Promise.all([
      supabase.from("orders").select("email, name, status, event_id, birth_date"),
      supabase.from("events").select("id, title, city"),
      supabase.from("newsletter_subscribers").select("*"),
      supabase.from("newsletter_lists").select("*"),
    ]);
    if (ordersRes.data) setOrders(ordersRes.data as Order[]);
    if (eventsRes.data) setEvents(eventsRes.data as EventInfo[]);
    if (subsRes.data) setSubscribers(subsRes.data as Subscriber[]);
    if (listsRes.data) setNlLists(listsRes.data as NLList[]);
    setLoading(false);

    // Load custom templates
    const { data: tplData } = await supabase.from("settings").select("value").eq("key", "newsletter_custom_templates").maybeSingle();
    if (tplData?.value && Array.isArray(tplData.value)) {
      setCustomTemplates(tplData.value as unknown as CustomTemplate[]);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const saveCustomTemplate = useCallback(async (name: string) => {
    const newTpl: CustomTemplate = {
      id: uid(),
      name,
      blocks: blocks.map(({ ...b }) => b),
      colorSchemeId: colorScheme.id,
      colorScheme,
      createdAt: new Date().toISOString(),
    };
    const updated = [...customTemplates, newTpl];
    setCustomTemplates(updated);
    await supabase.from("settings").upsert({ key: "newsletter_custom_templates", value: updated as any }, { onConflict: "key" });
    toast.success(`Vorlage "${name}" gespeichert`);
    setShowSaveTemplateDialog(false);
    setSaveTemplateName("");
  }, [blocks, colorScheme, customTemplates]);

  const deleteCustomTemplate = useCallback(async (id: string) => {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    await supabase.from("settings").upsert({ key: "newsletter_custom_templates", value: updated as any }, { onConflict: "key" });
    toast.success("Vorlage gelöscht");
  }, [customTemplates]);

  const loadCustomTemplate = useCallback((tpl: CustomTemplate) => {
    setBlocks(tpl.blocks.map((b) => ({ ...b, id: uid() })));
    setActiveTemplateId(`custom-${tpl.id}`);
    setShowTemplates(false);
    setSelectedBlock(null);
    const cs = tpl.colorScheme || COLOR_SCHEMES.find((c) => c.id === tpl.colorSchemeId);
    if (cs) applyColorScheme(cs);
    toast.success(`Vorlage "${tpl.name}" geladen`);
  }, [applyColorScheme]);

  const eventMap = useMemo(() => {
    const m = new Map<string, EventInfo>();
    events.forEach((e) => m.set(e.id, e));
    return m;
  }, [events]);

  const allCities = useMemo(() => {
    const cities = new Set<string>();
    events.forEach((e) => { if (e.city) cities.add(e.city); });
    subscribers.forEach((s) => { if (s.city) cities.add(s.city); });
    return Array.from(cities).sort();
  }, [events, subscribers]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    subscribers.forEach((s) => s.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [subscribers]);

  // Calculate age from birth_date
  const getAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const bd = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  };

  const recipients = useMemo(() => {
    const emailMap = new Map<string, { email: string; name: string | null }>();

    if (recipientMode === "manual") {
      // Parse manual emails
      const emails = manualEmails.split(/[\n,;]+/).map((e) => e.trim().toLowerCase()).filter((e) => e.includes("@"));
      emails.forEach((email) => emailMap.set(email, { email, name: null }));
      return Array.from(emailMap.values());
    }

    if (recipientMode === "list") {
      // From newsletter subscribers in selected lists (TODO: load list members)
      subscribers.forEach((s) => {
        if (s.unsubscribed) return;
        emailMap.set(s.email.toLowerCase(), { email: s.email.toLowerCase(), name: s.name });
      });
      return Array.from(emailMap.values());
    }

    // Smart mode: combine orders + subscribers with filters
    // 1. Orders
    orders.forEach((o) => {
      // Order status filter
      if (orderFilter === "paid" && o.status !== "paid") return;
      if (orderFilter === "cancelled" && o.status !== "cancelled") return;
      if (orderFilter === "unpaid" && o.status === "paid") return;


      // Age filter
      if (ageFilter.min != null || ageFilter.max != null) {
        const age = getAge(o.birth_date);
        if (age === null) return;
        if (ageFilter.min != null && age < ageFilter.min) return;
        if (ageFilter.max != null && age > ageFilter.max) return;
      }

      const email = o.email.toLowerCase().trim();
      if (!emailMap.has(email)) emailMap.set(email, { email, name: o.name });
    });

    // 2. Subscribers matching filters
    subscribers.forEach((s) => {
      if (s.unsubscribed) return;

      // Tag filter
      if (selectedTags.length > 0 && !selectedTags.some((t) => s.tags?.includes(t))) return;


      // Age filter
      if (ageFilter.min != null || ageFilter.max != null) {
        const age = getAge(s.birth_date);
        if (age === null) return;
        if (ageFilter.min != null && age < ageFilter.min) return;
        if (ageFilter.max != null && age > ageFilter.max) return;
      }

      const email = s.email.toLowerCase().trim();
      if (!emailMap.has(email)) emailMap.set(email, { email, name: s.name });
    });

    // Search filter
    let result = Array.from(emailMap.values());
    if (recipientSearch) {
      const q = recipientSearch.toLowerCase();
      result = result.filter((r) => r.email.includes(q) || (r.name && r.name.toLowerCase().includes(q)));
    }

    return result;
  }, [orders, subscribers, orderFilter, ageFilter, selectedTags, eventMap, recipientMode, manualEmails, recipientSearch, selectedListIds]);

  // Add subscriber
  const addSubscriber = async () => {
    if (!newSubEmail.trim()) return;
    const { error } = await supabase.from("newsletter_subscribers").upsert({
      email: newSubEmail.trim().toLowerCase(),
      name: newSubName.trim() || null,
      tags: newSubTags.trim() ? newSubTags.split(",").map((t) => t.trim()) : [],
      city: newSubCity.trim() || null,
      source: "manual",
    }, { onConflict: "email" });
    if (error) { toast.error("Fehler: " + error.message); return; }
    toast.success("Abonnent hinzugefügt");
    setNewSubEmail(""); setNewSubName(""); setNewSubTags(""); setNewSubCity("");
    loadData();
  };

  // Add list
  const addList = async () => {
    if (!newListName.trim()) return;
    const { error } = await supabase.from("newsletter_lists").insert({ name: newListName.trim() });
    if (error) { toast.error("Fehler: " + error.message); return; }
    toast.success("Liste erstellt");
    setNewListName("");
    loadData();
  };

  // Delete subscriber
  const deleteSubscriber = async (id: string) => {
    await supabase.from("newsletter_subscribers").delete().eq("id", id);
    loadData();
  };

  // Delete list
  const deleteList = async (id: string) => {
    await supabase.from("newsletter_lists").delete().eq("id", id);
    loadData();
  };

  // ─── Block operations ──────────────────────────────────────
  const addBlock = useCallback((type: BlockType) => {
    setBlocks((prev) => [...prev, createBlock(type)]);
    setShowAddMenu(false);
  }, []);

  const updateBlock = useCallback((id: string, updated: Block) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? updated : b)));
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  }, [selectedBlock]);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  const applyTemplate = useCallback((template: NewsletterTemplate) => {
    setBlocks(template.blocks());
    setActiveTemplateId(template.id);
    setShowTemplates(false);
    setSelectedBlock(null);
    // Auto-match a color scheme based on template
    const matchScheme = template.colorSchemeId
      ? COLOR_SCHEMES.find((cs) => cs.id === template.colorSchemeId)
      : COLOR_SCHEMES.find((cs) => cs.headerGradient === template.headerGradient);
    if (matchScheme) applyColorScheme(matchScheme);
    toast.success(`Vorlage "${template.name}" geladen`);
  }, []);

  const activeTemplate = TEMPLATES.find((t) => t.id === activeTemplateId);

  // ─── Build HTML ────────────────────────────────────────────
  const buildHtml = useCallback(() => {
    const bodyContent = blocks.map(blockToHtml).join("");
    const cs = colorScheme;
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${cs.bodyBg};font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${cs.bodyBg};padding:40px 0;">
<tr><td align="center">
<table cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${cs.cardBg};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:${cs.headerGradient};padding:32px 40px;">
<h1 style="margin:0;color:${cs.headerText};font-size:24px;font-weight:800;">${subject || "Newsletter"}</h1>
</td></tr>
<tr><td style="padding:32px 40px;background:${cs.contentBg};">
${bodyContent}
</td></tr>
<tr><td style="padding:24px 40px;background:${cs.footerBg};border-top:1px solid ${cs.footerBorder};">
<p style="margin:0;font-size:12px;color:${cs.footerText};">Du erhältst diese E-Mail, weil du bei uns ein Ticket gekauft hast.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
  }, [blocks, subject, colorScheme, previewTick]);

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Bitte Betreff ausfüllen"); return; }
    if (blocks.length === 0) { toast.error("Bitte mindestens einen Block hinzufügen"); return; }
    if (recipients.length === 0) { toast.error("Keine Empfänger gefunden"); return; }

    setSending(true);
    setSent(null);
    setSendProgress({ current: 0, total: recipients.length, sent: 0, failed: 0 });

    const hasMagic = blocks.some((b) => (b.type === "event-highlight" || b.type === "event-list") && (b as any).magicMode);
    const htmlContent = buildHtml();
    const allEmails = recipients.map((r) => r.email);

    // Send in batches of 50 to avoid edge function timeouts
    const BATCH_SIZE = 50;
    let totalSent = 0;
    let totalFailed = 0;

    try {
      for (let i = 0; i < allEmails.length; i += BATCH_SIZE) {
        const batch = allEmails.slice(i, i + BATCH_SIZE);
        const { data, error } = await supabase.functions.invoke("send-newsletter", {
          body: {
            subject: subject.trim(),
            html: htmlContent,
            recipients: batch,
            fromName: fromName.trim(),
            fromEmail: fromEmail.trim(),
            magicMode: hasMagic,
          },
        });
        if (error) throw error;
        totalSent += data.sent || 0;
        totalFailed += data.failed || 0;
        setSendProgress({ current: Math.min(i + BATCH_SIZE, allEmails.length), total: allEmails.length, sent: totalSent, failed: totalFailed });
      }

      setSent({ sent: totalSent, failed: totalFailed });
      if (totalSent > 0) toast.success(`${totalSent} E-Mails erfolgreich versendet!`);
      if (totalFailed > 0) toast.error(`${totalFailed} E-Mails fehlgeschlagen`);
    } catch (err: any) {
      console.error("Newsletter send error:", err);
      toast.error("Fehler beim Versenden: " + (err.message || "Unbekannter Fehler"));
      if (totalSent > 0) setSent({ sent: totalSent, failed: totalFailed });
    } finally {
      setSending(false);
      setSendProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Laden...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-black uppercase mb-6" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
        Newsletter
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Editor */}
        <div className="space-y-4">
          {/* Template Picker */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-all"
            >
              <LayoutTemplate className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider flex-1 text-left" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                Vorlagen {activeTemplate ? `— ${activeTemplate.name}` : ""}
              </span>
              <ChevronRight className="w-4 h-4 transition-transform" style={{ color: "hsl(0 0% 100% / 0.3)", transform: showTemplates ? "rotate(90deg)" : "rotate(0deg)" }} />
            </button>
            <AnimatePresence>
              {showTemplates && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 pb-2 pt-1" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
                    {/* Save current design as template */}
                    <div className="mb-3">
                      {showSaveTemplateDialog ? (
                        <div className="flex gap-2 items-center">
                          <input
                            value={saveTemplateName}
                            onChange={(e) => setSaveTemplateName(e.target.value)}
                            placeholder="Vorlagenname..."
                            className="flex-1 px-3 py-2 rounded-lg text-xs"
                            style={{ ...inputStyle, background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)" }}
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && saveTemplateName.trim() && saveCustomTemplate(saveTemplateName.trim())}
                          />
                          <button
                            onClick={() => saveTemplateName.trim() && saveCustomTemplate(saveTemplateName.trim())}
                            className="px-3 py-2 rounded-lg text-[11px] font-bold transition-all"
                            style={{ background: "hsl(140 60% 40%)", color: "#fff" }}
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setShowSaveTemplateDialog(false); setSaveTemplateName(""); }} className="px-2 py-2 rounded-lg" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowSaveTemplateDialog(true)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-all hover:scale-[1.01]"
                          style={{ background: "hsl(270 60% 50% / 0.12)", color: "hsl(270 60% 55%)", border: "1px dashed hsl(270 60% 50% / 0.3)" }}
                        >
                          <Save className="w-3.5 h-3.5" /> Aktuelles Design als Vorlage speichern
                        </button>
                      )}
                    </div>

                    {/* Custom templates */}
                    {customTemplates.length > 0 && (
                      <div className="mb-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider block mb-2" style={{ color: "hsl(270 60% 55% / 0.6)" }}>
                          Eigene Vorlagen ({customTemplates.length})
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {customTemplates.map((ct) => {
                            const isActive = activeTemplateId === `custom-${ct.id}`;
                            return (
                              <div key={ct.id} className="relative group">
                                <motion.button
                                  onClick={() => loadCustomTemplate(ct)}
                                  className="w-full relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-center transition-all overflow-hidden"
                                  style={{
                                    background: isActive ? "hsl(270 60% 50% / 0.15)" : "hsl(0 0% 100% / 0.03)",
                                    border: `1px solid ${isActive ? "hsl(270 60% 55% / 0.4)" : "hsl(0 0% 100% / 0.06)"}`,
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ct.colorScheme?.headerGradient || "linear-gradient(135deg, hsl(270 60% 50%), hsl(330 80% 55%))" }}>
                                    <Paintbrush className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="text-[11px] font-bold" style={{ color: isActive ? "hsl(270 60% 55%)" : "hsl(0 0% 100% / 0.7)" }}>{ct.name}</span>
                                  <span className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{ct.blocks.length} Blöcke</span>
                                  {isActive && <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "hsl(270 60% 55%)" }} />}
                                </motion.button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(ct.id); }}
                                  className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ background: "hsl(0 60% 50% / 0.8)", color: "#fff" }}
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* System templates */}
                    <span className="text-[9px] font-bold uppercase tracking-wider block mb-2" style={{ color: "hsl(0 0% 100% / 0.25)" }}>
                      System-Vorlagen
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-2">
                    {TEMPLATES.map((tpl) => {
                      const Icon = tpl.icon;
                      const isActive = activeTemplateId === tpl.id;
                      return (
                        <motion.button
                          key={tpl.id}
                          onClick={() => applyTemplate(tpl)}
                          className="relative flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-center transition-all overflow-hidden group"
                          style={{
                            background: isActive ? "hsl(0 0% 100% / 0.08)" : "hsl(0 0% 100% / 0.03)",
                            border: `1px solid ${isActive ? "hsl(330 80% 55% / 0.4)" : "hsl(0 0% 100% / 0.06)"}`,
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tpl.gradient }}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[11px] font-bold" style={{ color: isActive ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.7)" }}>{tpl.name}</span>
                          <span className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{tpl.description}</span>
                          {isActive && (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "hsl(330 80% 55%)" }} />
                          )}
                        </motion.button>
                      );
                    })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Color Scheme Picker */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
            <button
              onClick={() => setShowColorSchemes(!showColorSchemes)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-all"
            >
              <Palette className="w-4 h-4" style={{ color: "hsl(45 90% 55%)" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider flex-1 text-left" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                Farbschema — {colorScheme.name}
              </span>
              <ChevronRight className="w-4 h-4 transition-transform" style={{ color: "hsl(0 0% 100% / 0.3)", transform: showColorSchemes ? "rotate(90deg)" : "rotate(0deg)" }} />
            </button>
            <AnimatePresence>
              {showColorSchemes && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
                    <div className="grid grid-cols-4 gap-1.5">
                      {COLOR_SCHEMES.map((cs) => {
                        const isActive = colorScheme.id === cs.id;
                        return (
                          <motion.button
                            key={cs.id}
                            onClick={() => applyColorScheme(cs)}
                            className="relative flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-lg text-center transition-all"
                            style={{
                              background: isActive ? "hsl(0 0% 100% / 0.08)" : "hsl(0 0% 100% / 0.02)",
                              border: `1px solid ${isActive ? "hsl(45 90% 55% / 0.4)" : "hsl(0 0% 100% / 0.04)"}`,
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <div className="w-full h-6 rounded overflow-hidden flex" style={{ border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                              <div className="flex-1" style={{ background: cs.bodyBg }} />
                              <div className="flex-1" style={{ background: cs.headerGradient }} />
                              <div className="flex-1" style={{ background: cs.contentBg }} />
                            </div>
                            <span className="text-[8px] font-bold leading-tight" style={{ color: isActive ? "hsl(45 90% 55%)" : "hsl(0 0% 100% / 0.5)" }}>{cs.name}</span>
                            {isActive && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "hsl(45 90% 55%)" }} />}
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.25)" }}>Farben anpassen</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {([
                          { key: "bodyBg" as const, label: "Hintergrund" },
                          { key: "contentBg" as const, label: "Inhalt" },
                          { key: "footerBg" as const, label: "Footer" },
                          { key: "headerText" as const, label: "Header-Text" },
                        ]).map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-2">
                            <input
                              type="color"
                              value={(colorScheme as any)[key]}
                              onChange={(e) => setColorScheme({ ...colorScheme, [key]: e.target.value })}
                              className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }}
                            />
                            <span className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Header-Gradient</span>
                        <input
                          type="color"
                          value={colorScheme.headerGradient.match(/#[0-9a-fA-F]{6}/g)?.[0] || "#e91e8c"}
                          onChange={(e) => {
                            const colors = colorScheme.headerGradient.match(/#[0-9a-fA-F]{6}/g) || ["#e91e8c", "#ff6b35"];
                            setColorScheme({ ...colorScheme, headerGradient: `linear-gradient(135deg,${e.target.value},${colors[1] || colors[0]})` });
                          }}
                          className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }}
                        />
                        <input
                          type="color"
                          value={colorScheme.headerGradient.match(/#[0-9a-fA-F]{6}/g)?.[1] || "#ff6b35"}
                          onChange={(e) => {
                            const colors = colorScheme.headerGradient.match(/#[0-9a-fA-F]{6}/g) || ["#e91e8c", "#ff6b35"];
                            setColorScheme({ ...colorScheme, headerGradient: `linear-gradient(135deg,${colors[0]},${e.target.value})` });
                          }}
                          className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-2xl p-5 space-y-3" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Absender</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} style={labelStyle}>Name</label>
                <input value={fromName} onChange={(e) => setFromName(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>E-Mail</label>
                <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
            <label className={labelCls} style={{ color: "hsl(0 0% 100% / 0.35)" }}>Betreff</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="z.B. Neues Event: Summer Bash 2025 🎉" className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
            <PlaceholderPills onInsert={(tag) => setSubject((prev) => prev + tag)} />
          </div>

          {/* Blocks */}
          <div className="space-y-2">
            {blocks.map((block, idx) => {
              const isSelected = selectedBlock === block.id;
              const meta = blockLabel(block.type);
              const Icon = meta.icon;
              return (
                <motion.div
                  key={block.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "hsl(0 0% 100% / 0.04)",
                    border: `1px solid ${isSelected ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.06)"}`,
                  }}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/[0.02] transition-all"
                    onClick={() => setSelectedBlock(isSelected ? null : block.id)}
                  >
                    <GripVertical className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(330 80% 55% / 0.6)" }} />
                    <span className="text-xs font-bold flex-1" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{meta.label}</span>
                    <div className="flex items-center gap-0.5">
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} disabled={idx === 0} className="p-1 rounded hover:bg-white/[0.05] disabled:opacity-20" style={{ color: "hsl(0 0% 100% / 0.3)" }}><ChevronUp className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} disabled={idx === blocks.length - 1} className="p-1 rounded hover:bg-white/[0.05] disabled:opacity-20" style={{ color: "hsl(0 0% 100% / 0.3)" }}><ChevronDown className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-1 rounded hover:bg-red-500/10" style={{ color: "hsl(0 70% 55% / 0.5)" }}><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="px-3 pb-3 pt-1" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
                          <BlockEditor block={block} onChange={(b) => updateBlock(block.id, b)} colorScheme={colorScheme} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* Add block */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:bg-white/[0.03]"
                style={{ border: "2px dashed hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.3)" }}
              >
                <Plus className="w-4 h-4" /> Block hinzufügen
              </button>
              <AnimatePresence>
                {showAddMenu && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-10 top-full mt-1 left-0 right-0 rounded-xl overflow-hidden shadow-xl" style={{ background: "hsl(220 50% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {BLOCK_TYPES.map(({ type, label, icon: I }) => (
                        <button key={type} onClick={() => addBlock(type)} className="flex flex-col items-center gap-1.5 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/[0.06] transition-all" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                          <I className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>


          {/* Send button */}
          <motion.button
            onClick={handleSend}
            disabled={sending || !subject.trim() || blocks.length === 0 || recipients.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, hsl(330 80% 55%), hsl(20 90% 55%))", color: "hsl(0 0% 100%)" }}
            whileHover={{ scale: sending ? 1 : 1.01 }}
            whileTap={{ scale: sending ? 1 : 0.98 }}
          >
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Wird gesendet...</> : <><Send className="w-4 h-4" /> Newsletter versenden ({recipients.length})</>}
          </motion.button>

          {/* Progress bar */}
          <AnimatePresence>
            {sendProgress && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl p-4 space-y-2" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                    <Loader2 className="w-3 h-3 animate-spin inline mr-1.5" />
                    Versende E-Mails...
                  </span>
                  <span className="text-xs font-mono" style={{ color: "hsl(330 80% 55%)" }}>
                    {sendProgress.current} / {sendProgress.total}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.08)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, hsl(330 80% 55%), hsl(20 90% 55%))" }}
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.round((sendProgress.current / sendProgress.total) * 100)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                <div className="flex items-center gap-3 text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  <span>✅ {sendProgress.sent} gesendet</span>
                  {sendProgress.failed > 0 && <span>❌ {sendProgress.failed} fehlgeschlagen</span>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {sent && !sendProgress && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl p-4 flex items-center gap-3" style={{ background: sent.failed === 0 ? "hsl(150 60% 40% / 0.12)" : "hsl(45 80% 55% / 0.12)", border: `1px solid ${sent.failed === 0 ? "hsl(150 60% 40% / 0.3)" : "hsl(45 80% 55% / 0.3)"}` }}>
                {sent.failed === 0 ? <CheckCircle className="w-5 h-5 shrink-0" style={{ color: "hsl(150 60% 40%)" }} /> : <AlertCircle className="w-5 h-5 shrink-0" style={{ color: "hsl(45 80% 55%)" }} />}
                <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{sent.sent} gesendet{sent.failed > 0 ? `, ${sent.failed} fehlgeschlagen` : ""}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Live Preview + Recipients */}
        <div className="hidden xl:block">
          <div className="sticky top-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5" style={{ color: "hsl(270 70% 55%)" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Live-Vorschau</span>
                </div>
                <div className="flex gap-1 rounded-lg p-0.5" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                  {([
                    { device: "mobile" as const, icon: Smartphone, label: "Mobil" },
                    { device: "desktop" as const, icon: Monitor, label: "Desktop" },
                  ]).map(({ device, icon: I, label }) => (
                    <button
                      key={device}
                      onClick={() => setPreviewDevice(device)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all"
                      style={{
                        background: previewDevice === device ? "hsl(270 70% 55% / 0.2)" : "transparent",
                        color: previewDevice === device ? "hsl(270 70% 55%)" : "hsl(0 0% 100% / 0.3)",
                      }}
                      title={label}
                    >
                      <I className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-center">
                <div
                  className="rounded-2xl overflow-hidden shadow-xl transition-all duration-300"
                  style={{
                    border: "1px solid hsl(0 0% 100% / 0.08)",
                    width: previewDevice === "mobile" ? 375 : "100%",
                    maxWidth: previewDevice === "desktop" ? 650 : 375,
                  }}
                >
                  <div style={{ background: "#f4f4f4" }} dangerouslySetInnerHTML={{ __html: buildHtml() }} />
                </div>
              </div>
            </div>

            {/* Recipients & Filters */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
              <button
                onClick={() => setShowRecipients(!showRecipients)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-all"
              >
                <Users className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
                <span className="text-[10px] font-bold uppercase tracking-wider flex-1 text-left" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                  Empfänger ({recipients.length})
                </span>
                <ChevronRight className="w-4 h-4 transition-transform" style={{ color: "hsl(0 0% 100% / 0.3)", transform: showRecipients ? "rotate(90deg)" : "rotate(0deg)" }} />
              </button>
              <AnimatePresence>
                {showRecipients && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <div className="px-5 pb-4 space-y-3" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
                      {/* Mode Tabs */}
                      <div className="flex gap-1 pt-3">
                        {([
                          { mode: "smart" as RecipientMode, label: "Smart Filter", icon: Filter },
                          { mode: "list" as RecipientMode, label: "Listen", icon: List },
                          { mode: "manual" as RecipientMode, label: "Manuell", icon: UserPlus },
                        ]).map(({ mode, label, icon: I }) => (
                          <button
                            key={mode}
                            onClick={() => setRecipientMode(mode)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                            style={{
                              background: recipientMode === mode ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.03)",
                              color: recipientMode === mode ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)",
                              border: `1px solid ${recipientMode === mode ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.06)"}`,
                            }}
                          >
                            <I className="w-3 h-3" /> {label}
                          </button>
                        ))}
                      </div>

                      {/* Smart Filter Mode */}
                      {recipientMode === "smart" && (
                        <div className="space-y-2.5">
                          {/* Order Status */}
                          <div>
                            <label className={labelCls} style={labelStyle}>Bestellstatus</label>
                            <div className="flex flex-wrap gap-1">
                              {([
                                { v: "paid" as OrderFilter, l: "Bezahlt", icon: CheckCircle, clr: "hsl(150 60% 40%)" },
                                { v: "unpaid" as OrderFilter, l: "Unbezahlt", icon: Clock, clr: "hsl(45 80% 55%)" },
                                { v: "cancelled" as OrderFilter, l: "Storniert", icon: XCircle, clr: "hsl(0 70% 55%)" },
                                { v: "all" as OrderFilter, l: "Alle", icon: Users, clr: "hsl(215 90% 55%)" },
                              ]).map(({ v, l, icon: I, clr }) => (
                                <button
                                  key={v}
                                  onClick={() => setOrderFilter(v)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all"
                                  style={{
                                    background: orderFilter === v ? `${clr.replace(")", " / 0.15)")}` : "hsl(0 0% 100% / 0.03)",
                                    color: orderFilter === v ? clr : "hsl(0 0% 100% / 0.4)",
                                    border: `1px solid ${orderFilter === v ? `${clr.replace(")", " / 0.3)")}` : "transparent"}`,
                                  }}
                                >
                                  <I className="w-3 h-3" /> {l}
                                </button>
                              ))}
                            </div>
                          </div>


                          {/* Age Filter */}
                          <div>
                            <label className={labelCls} style={labelStyle}>Alter</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder="Min"
                                value={ageFilter.min ?? ""}
                                onChange={(e) => setAgeFilter({ ...ageFilter, min: e.target.value ? Number(e.target.value) : null })}
                                className="w-20 px-2.5 py-1.5 rounded-lg text-xs"
                                style={inputStyle}
                              />
                              <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>bis</span>
                              <input
                                type="number"
                                placeholder="Max"
                                value={ageFilter.max ?? ""}
                                onChange={(e) => setAgeFilter({ ...ageFilter, max: e.target.value ? Number(e.target.value) : null })}
                                className="w-20 px-2.5 py-1.5 rounded-lg text-xs"
                                style={inputStyle}
                              />
                              {(ageFilter.min != null || ageFilter.max != null) && (
                                <button onClick={() => setAgeFilter({ min: null, max: null })} className="p-1 rounded hover:bg-white/[0.05]" style={{ color: "hsl(0 70% 55% / 0.5)" }}><X className="w-3 h-3" /></button>
                              )}
                            </div>
                          </div>

                          {/* Tags */}
                          {allTags.length > 0 && (
                            <div>
                              <label className={labelCls} style={labelStyle}>Tags</label>
                              <div className="flex flex-wrap gap-1">
                                {allTags.map((tag) => {
                                  const active = selectedTags.includes(tag);
                                  return (
                                    <button
                                      key={tag}
                                      onClick={() => setSelectedTags(active ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag])}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all"
                                      style={{
                                        background: active ? "hsl(270 70% 55% / 0.15)" : "hsl(0 0% 100% / 0.03)",
                                        color: active ? "hsl(270 70% 55%)" : "hsl(0 0% 100% / 0.4)",
                                        border: `1px solid ${active ? "hsl(270 70% 55% / 0.3)" : "transparent"}`,
                                      }}
                                    >
                                      <Tag className="w-2.5 h-2.5" /> {tag}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* List Mode */}
                      {recipientMode === "list" && (
                        <div className="space-y-2">
                          {nlLists.length === 0 ? (
                            <p className="text-[11px] py-2" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Noch keine Listen erstellt</p>
                          ) : (
                            nlLists.map((list) => {
                              const active = selectedListIds.includes(list.id);
                              return (
                                <div key={list.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: active ? "hsl(330 80% 55% / 0.08)" : "hsl(0 0% 100% / 0.03)", border: `1px solid ${active ? "hsl(330 80% 55% / 0.2)" : "transparent"}` }}>
                                  <input type="checkbox" checked={active} onChange={() => setSelectedListIds(active ? selectedListIds.filter((id) => id !== list.id) : [...selectedListIds, list.id])} />
                                  <span className="text-xs font-bold flex-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{list.name}</span>
                                  <button onClick={() => deleteList(list.id)} className="p-1 rounded hover:bg-red-500/10" style={{ color: "hsl(0 70% 55% / 0.4)" }}><Trash2 className="w-3 h-3" /></button>
                                </div>
                              );
                            })
                          )}
                          <div className="flex gap-1.5">
                            <input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="Neue Liste..." className="flex-1 px-2.5 py-1.5 rounded-lg text-xs" style={inputStyle} />
                            <button onClick={addList} className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: "hsl(330 80% 55% / 0.15)", color: "hsl(330 80% 55%)" }}>
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Manual Mode */}
                      {recipientMode === "manual" && (
                        <div className="space-y-2">
                          <label className={labelCls} style={labelStyle}>E-Mails (eine pro Zeile, oder kommagetrennt)</label>
                          <textarea
                            value={manualEmails}
                            onChange={(e) => setManualEmails(e.target.value)}
                            placeholder={"max@example.com\nanna@example.com\ntom@example.com"}
                            rows={5}
                            className="w-full px-3 py-2 rounded-lg text-xs font-mono"
                            style={inputStyle}
                          />
                        </div>
                      )}

                      {/* Subscriber Management */}
                      <div>
                        <button
                          onClick={() => setShowListManager(!showListManager)}
                          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
                          style={{ color: "hsl(215 90% 55% / 0.6)" }}
                        >
                          <UserPlus className="w-3 h-3" /> Abonnent hinzufügen
                          <ChevronRight className="w-3 h-3 transition-transform" style={{ transform: showListManager ? "rotate(90deg)" : "rotate(0deg)" }} />
                        </button>
                        <AnimatePresence>
                          {showListManager && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="space-y-2 pt-2">
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input value={newSubEmail} onChange={(e) => setNewSubEmail(e.target.value)} placeholder="E-Mail *" className="px-2.5 py-1.5 rounded-lg text-xs" style={inputStyle} />
                                  <input value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="Name" className="px-2.5 py-1.5 rounded-lg text-xs" style={inputStyle} />
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input value={newSubTags} onChange={(e) => setNewSubTags(e.target.value)} placeholder="Tags (kommagetrennt)" className="px-2.5 py-1.5 rounded-lg text-xs" style={inputStyle} />
                                  <input value={newSubCity} onChange={(e) => setNewSubCity(e.target.value)} placeholder="Stadt" className="px-2.5 py-1.5 rounded-lg text-xs" style={inputStyle} />
                                </div>
                                <button onClick={addSubscriber} className="w-full py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider" style={{ background: "hsl(215 90% 55% / 0.15)", color: "hsl(215 90% 55%)" }}>
                                  Hinzufügen
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
                        <input
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          placeholder="Empfänger suchen..."
                          className="w-full pl-7 pr-3 py-1.5 rounded-lg text-xs"
                          style={inputStyle}
                        />
                      </div>

                      {/* Recipient List */}
                      <div className="space-y-1 max-h-[250px] overflow-y-auto">
                        {recipients.slice(0, 30).map((r) => (
                          <div key={r.email} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px]" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                            <Mail className="w-3 h-3 shrink-0" style={{ color: "hsl(215 90% 55% / 0.5)" }} />
                            <span className="truncate flex-1" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{r.name ? `${r.name} – ` : ""}{r.email}</span>
                          </div>
                        ))}
                        {recipients.length > 30 && <p className="text-[10px] text-center pt-1" style={{ color: "hsl(0 0% 100% / 0.3)" }}>+{recipients.length - 30} weitere</p>}
                        {recipients.length === 0 && <p className="text-[10px] text-center py-3" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Keine Empfänger mit diesen Filtern</p>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile preview toggle */}
        <div className="xl:hidden">
          <button
            onClick={() => setPreview(!preview)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            style={{ background: preview ? "hsl(215 90% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)", color: preview ? "hsl(215 90% 55%)" : "hsl(0 0% 100% / 0.4)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
          >
            <Eye className="w-3.5 h-3.5" /> {preview ? "Vorschau ausblenden" : "Vorschau anzeigen"}
          </button>
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                <div className="rounded-2xl overflow-hidden" style={{ background: "#f4f4f4", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                  <div dangerouslySetInnerHTML={{ __html: buildHtml() }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default NewsletterAdmin;
