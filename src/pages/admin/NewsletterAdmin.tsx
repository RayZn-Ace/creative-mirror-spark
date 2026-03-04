import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Send, Users, CheckCircle, AlertCircle, Loader2, Filter, Eye,
  Plus, Trash2, GripVertical, Type, Heading1, Image, MousePointerClick, Minus,
  ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight, Bold, Italic, ChevronRight,
  LayoutTemplate, Sparkles, Zap, PartyPopper, Megaphone, Heart, Palette, Sun, Moon, Paintbrush,
  Star, CalendarDays, MapPin, Clock, Wand2, Calendar,
} from "lucide-react";
import { toast } from "sonner";

// ─── Block Types ───────────────────────────────────────────────
type BlockType = "heading" | "text" | "image" | "button" | "divider" | "spacer" | "event-highlight" | "event-list";

interface BaseBlock { id: string; type: BlockType }
interface HeadingBlock extends BaseBlock { type: "heading"; text: string; level: 1 | 2 | 3; align: "left" | "center" | "right"; color: string }
interface TextBlock extends BaseBlock { type: "text"; text: string; align: "left" | "center" | "right"; bold: boolean; italic: boolean; color: string }
interface ImageBlock extends BaseBlock { type: "image"; src: string; alt: string; width: number }
interface ButtonBlock extends BaseBlock { type: "button"; text: string; url: string; bgColor: string; textColor: string; align: "left" | "center" | "right"; borderRadius: number }
interface DividerBlock extends BaseBlock { type: "divider"; color: string; style: "solid" | "dashed" | "dotted" }
interface SpacerBlock extends BaseBlock { type: "spacer"; height: number }
interface EventHighlightBlock extends BaseBlock { type: "event-highlight"; eventTitle: string; eventDate: string; eventTime: string; eventLocation: string; eventCity: string; eventImage: string; ctaText: string; ctaUrl: string; accentColor: string; bgColor: string; textColor: string; magicMode?: boolean }
interface EventListBlock extends BaseBlock { type: "event-list"; title: string; events: { date: string; city: string; location: string; url: string }[]; accentColor: string; textColor: string; bgColor: string; magicMode?: boolean; magicLimit?: number }

type Block = HeadingBlock | TextBlock | ImageBlock | ButtonBlock | DividerBlock | SpacerBlock | EventHighlightBlock | EventListBlock;

const uid = () => Math.random().toString(36).slice(2, 10);

const BLOCK_TYPES: { type: BlockType; label: string; icon: any }[] = [
  { type: "heading", label: "Überschrift", icon: Heading1 },
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Bild", icon: Image },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "event-highlight", label: "Event Highlight", icon: Star },
  { type: "event-list", label: "Terminliste", icon: CalendarDays },
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
      case "event-highlight": return { id, type, eventTitle: "MAMMA MIA Mitsing Konzert", eventDate: "21. März 2026", eventTime: "19:00 Uhr", eventLocation: "Stadthalle", eventCity: "Paderborn", eventImage: "", ctaText: "🎟 Tickets sichern", ctaUrl: "https://", accentColor: "#e91e8c", bgColor: "#f8f4ff", textColor: "#1a1a1a", magicMode: false };
      case "event-list": return { id, type, title: "Alle Termine", events: [{ date: "21.03.", city: "Pforzheim", location: "Stadthalle", url: "https://" }, { date: "27.03.", city: "Rostock", location: "Stadthalle", url: "https://" }, { date: "28.03.", city: "Paderborn", location: "Stadthalle", url: "https://" }], accentColor: "#e91e8c", textColor: "#333333", bgColor: "#fafafa", magicMode: false, magicLimit: 5 };
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
    blocks: () => [
      createBlock("heading", { text: "🔥 SPECIAL DEAL 🔥", level: 1, align: "center", color: "#ffffff" }),
      createBlock("spacer", { height: 8 }),
      createBlock("heading", { text: "Nur für kurze Zeit!", level: 2, align: "center", color: "#f5af19" }),
      createBlock("text", { text: "Sichere dir jetzt exklusive Vorteile und spare bei deinem nächsten Ticket-Kauf. Dieses Angebot gilt nur solange der Vorrat reicht!", align: "center", color: "#333333" }),
      createBlock("spacer", { height: 8 }),
      createBlock("button", { text: "💰 Jetzt zuschlagen", url: "https://", bgColor: "#f12711", textColor: "#ffffff", align: "center", borderRadius: 12 }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Verfügbare Events", events: [{ date: "21.03.", city: "Pforzheim", location: "Stadthalle", url: "https://" }, { date: "27.03.", city: "Rostock", location: "Stadthalle", url: "https://" }], accentColor: "#f5af19", textColor: "#333333", bgColor: "#fff8f0", magicMode: false }),
      createBlock("spacer", { height: 8 }),
      createBlock("text", { text: "⏰ Angebot endet am XX.XX.XXXX", align: "center", bold: true, color: "#f12711" }),
    ],
  },
  {
    id: "recap-photos",
    name: "Event Recap",
    description: "Nachbericht + nächstes Highlight",
    icon: Heart,
    gradient: "linear-gradient(135deg, #fc5c7d, #6a82fb)",
    headerGradient: "linear-gradient(135deg, #fc5c7d, #6a82fb)",
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
    id: "mamma-mia-classic",
    name: "Mamma Mia Classic",
    description: "ABBA-Vibes mit Magic-Terminliste",
    icon: Heart,
    gradient: "linear-gradient(135deg, #1e3a5f, #c9a84c)",
    headerGradient: "linear-gradient(135deg, #1e3a5f, #2a5298)",
    blocks: () => [
      createBlock("heading", { text: "🎶 MAMMA MIA!", level: 1, align: "center", color: "#c9a84c" }),
      createBlock("text", { text: "Das Mitsing-Konzert deines Lebens", align: "center", bold: true, color: "#ffffff" }),
      createBlock("spacer", { height: 16 }),
      createBlock("image", { src: "", alt: "Mamma Mia Banner", width: 100 }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🎟 Tickets sichern", ctaUrl: "", accentColor: "#c9a84c", bgColor: "#f0eadc", textColor: "#1a1a1a", magicMode: true }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Alle Termine", events: [], accentColor: "#c9a84c", textColor: "#333333", bgColor: "#faf7f0", magicMode: true, magicLimit: 6 }),
      createBlock("spacer", { height: 8 }),
      createBlock("divider", { color: "#c9a84c", style: "solid" }),
      createBlock("text", { text: "My my, how can I resist you? 💃", align: "center", italic: true, color: "#c9a84c" }),
    ],
  },
  {
    id: "mamma-mia-gold",
    name: "Mamma Mia Gold",
    description: "Glamourös mit Event-Highlight",
    icon: Sparkles,
    gradient: "linear-gradient(135deg, #c9a84c, #f5e6a3)",
    headerGradient: "linear-gradient(135deg, #0d0d0d, #1a1a1a)",
    blocks: () => [
      createBlock("heading", { text: "✨ MAMMA MIA ✨", level: 1, align: "center", color: "#c9a84c" }),
      createBlock("heading", { text: "Mitsing Konzert", level: 2, align: "center", color: "#f5e6a3" }),
      createBlock("spacer", { height: 16 }),
      createBlock("divider", { color: "#c9a84c", style: "solid" }),
      createBlock("spacer", { height: 8 }),
      createBlock("text", { text: "Eine unvergessliche Nacht voller Musik, Emotionen und den größten Hits von ABBA — live zum Mitsingen!", align: "center", color: "#cccccc" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🌟 Jetzt dabei sein", ctaUrl: "", accentColor: "#c9a84c", bgColor: "#1a1a1a", textColor: "#eeeeee", magicMode: true }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Tour-Termine", events: [], accentColor: "#c9a84c", textColor: "#cccccc", bgColor: "#111111", magicMode: true, magicLimit: 5 }),
      createBlock("spacer", { height: 16 }),
      createBlock("text", { text: "Gimme! Gimme! Gimme! 🪩", align: "center", italic: true, color: "#f5e6a3" }),
    ],
  },
  {
    id: "mamma-mia-summer",
    name: "Mamma Mia Sommer",
    description: "Sommer-Vibes mit Terminliste",
    icon: Sun,
    gradient: "linear-gradient(135deg, #0ea5e9, #f97316)",
    headerGradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    blocks: () => [
      createBlock("heading", { text: "☀️ MAMMA MIA", level: 1, align: "center", color: "#ffffff" }),
      createBlock("text", { text: "Mitsing Konzert — Summer Edition", align: "center", bold: true, color: "#ffe4c4" }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-highlight", { eventTitle: "", eventDate: "", eventTime: "", eventLocation: "", eventCity: "", eventImage: "", ctaText: "🏖 Tickets holen", ctaUrl: "", accentColor: "#f97316", bgColor: "#fff7ed", textColor: "#1a1a1a", magicMode: true }),
      createBlock("spacer", { height: 16 }),
      createBlock("event-list", { title: "Sommer-Termine", events: [], accentColor: "#0ea5e9", textColor: "#333333", bgColor: "#f0f9ff", magicMode: true, magicLimit: 5 }),
      createBlock("spacer", { height: 8 }),
      createBlock("divider", { color: "#0ea5e9", style: "dashed" }),
      createBlock("text", { text: "Take a chance on me! 🌺", align: "center", italic: true, color: "#0ea5e9" }),
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
    default:
      return "";
  }
};

// ─── Data Types ────────────────────────────────────────────────
type Order = { email: string; name: string | null; status: string; event_id: string | null };
type EventInfo = { id: string; title: string; city: string | null };

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

// ─── Block Editor Panel ────────────────────────────────────────
const BlockEditor = ({ block, onChange }: { block: Block; onChange: (b: Block) => void }) => {
  const upd = (patch: Partial<Block>) => onChange({ ...block, ...patch } as Block);

  switch (block.type) {
    case "heading":
      return (
        <div className="space-y-2">
          <input value={block.text} onChange={(e) => upd({ text: e.target.value })} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ sent: number; failed: number } | null>(null);

  const [subject, setSubject] = useState("");
  const [blocks, setBlocks] = useState<Block[]>([
    createBlock("heading"),
    createBlock("text"),
    createBlock("button"),
  ]);
  const [fromName, setFromName] = useState("GIMME Events");
  const [fromEmail, setFromEmail] = useState("newsletter@gimmegimmeparty.com");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [onlyPaid, setOnlyPaid] = useState(true);
  const [preview, setPreview] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showRecipients, setShowRecipients] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(COLOR_SCHEMES[0]);
  const [showColorSchemes, setShowColorSchemes] = useState(false);

  // Sync event block colors when color scheme changes
  const applyColorScheme = useCallback((cs: ColorScheme) => {
    setColorScheme(cs);
    const accentFromGradient = cs.headerGradient.match(/#[0-9a-fA-F]{6}/g)?.[0] || "#e91e8c";
    // Determine if scheme is dark or light
    const isDark = cs.bodyBg.startsWith("#0") || cs.bodyBg.startsWith("#1") || cs.bodyBg === "#0a0a0a";
    setBlocks((prev) => prev.map((b) => {
      if (b.type === "event-highlight") {
        return { ...b, accentColor: accentFromGradient, bgColor: isDark ? cs.contentBg : "#f8f4ff", textColor: isDark ? "#eeeeee" : "#1a1a1a" };
      }
      if (b.type === "event-list") {
        return { ...b, accentColor: accentFromGradient, bgColor: isDark ? cs.contentBg : "#fafafa", textColor: isDark ? "#cccccc" : "#333333" };
      }
      return b;
    }));
  }, []);

  useEffect(() => {
    const load = async () => {
      const [ordersRes, eventsRes] = await Promise.all([
        supabase.from("orders").select("email, name, status, event_id"),
        supabase.from("events").select("id, title, city"),
      ]);
      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (eventsRes.data) setEvents(eventsRes.data as EventInfo[]);
      setLoading(false);
    };
    load();
  }, []);

  const eventMap = useMemo(() => {
    const m = new Map<string, EventInfo>();
    events.forEach((e) => m.set(e.id, e));
    return m;
  }, [events]);

  const allCities = useMemo(() => {
    const cities = new Set<string>();
    events.forEach((e) => { if (e.city) cities.add(e.city); });
    return Array.from(cities).sort();
  }, [events]);

  const recipients = useMemo(() => {
    const emailMap = new Map<string, string | null>();
    orders.forEach((o) => {
      if (onlyPaid && o.status !== "paid") return;
      if (cityFilter !== "all") {
        const eventCity = o.event_id ? eventMap.get(o.event_id)?.city : null;
        if (eventCity !== cityFilter) return;
      }
      const email = o.email.toLowerCase().trim();
      if (!emailMap.has(email)) emailMap.set(email, o.name);
    });
    return Array.from(emailMap.entries()).map(([email, name]) => ({ email, name }));
  }, [orders, onlyPaid, cityFilter, eventMap]);

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
    const matchScheme = COLOR_SCHEMES.find((cs) => cs.headerGradient === template.headerGradient);
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
<table width="600" cellpadding="0" cellspacing="0" style="background:${cs.cardBg};border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
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
  }, [blocks, subject, colorScheme]);

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Bitte Betreff ausfüllen"); return; }
    if (blocks.length === 0) { toast.error("Bitte mindestens einen Block hinzufügen"); return; }
    if (recipients.length === 0) { toast.error("Keine Empfänger gefunden"); return; }

    setSending(true);
    setSent(null);

    const hasMagic = blocks.some((b) => (b.type === "event-highlight" || b.type === "event-list") && (b as any).magicMode);

    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter", {
        body: {
          subject: subject.trim(),
          html: buildHtml(),
          recipients: recipients.map((r) => r.email),
          fromName: fromName.trim(),
          fromEmail: fromEmail.trim(),
          magicMode: hasMagic,
        },
      });
      if (error) throw error;
      setSent({ sent: data.sent, failed: data.failed });
      if (data.sent > 0) toast.success(`${data.sent} E-Mails erfolgreich versendet!`);
      if (data.failed > 0) toast.error(`${data.failed} E-Mails fehlgeschlagen`);
    } catch (err: any) {
      console.error("Newsletter send error:", err);
      toast.error("Fehler beim Versenden: " + (err.message || "Unbekannter Fehler"));
    } finally {
      setSending(false);
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
                  <div className="px-4 pb-4 pt-1 grid grid-cols-2 sm:grid-cols-3 gap-2" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
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
                          <BlockEditor block={block} onChange={(b) => updateBlock(block.id, b)} />
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

          {/* Result */}
          <AnimatePresence>
            {sent && (
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
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-3.5 h-3.5" style={{ color: "hsl(215 90% 55%)" }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Live-Vorschau</span>
              </div>
              <div
                className="rounded-2xl overflow-hidden shadow-xl"
                style={{ border: "1px solid hsl(0 0% 100% / 0.08)", transform: "scale(0.85)", transformOrigin: "top center" }}
              >
                <div style={{ background: "#f4f4f4" }} dangerouslySetInnerHTML={{ __html: buildHtml() }} />
              </div>
            </div>

            {/* Recipients */}
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
                      <div className="flex items-center gap-3 pt-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={onlyPaid} onChange={(e) => setOnlyPaid(e.target.checked)} className="rounded" />
                          <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Nur bezahlte Kunden</span>
                        </label>
                        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="px-2 py-1 rounded-lg text-xs" style={inputStyle}>
                          <option value="all" style={{ background: "hsl(220 50% 10%)" }}>Alle Städte</option>
                          {allCities.map((c) => <option key={c} value={c} style={{ background: "hsl(220 50% 10%)" }}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {recipients.slice(0, 20).map((r) => (
                          <div key={r.email} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px]" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                            <Mail className="w-3 h-3 shrink-0" style={{ color: "hsl(215 90% 55% / 0.5)" }} />
                            <span className="truncate" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{r.name ? `${r.name} – ` : ""}{r.email}</span>
                          </div>
                        ))}
                        {recipients.length > 20 && <p className="text-[10px] text-center pt-1" style={{ color: "hsl(0 0% 100% / 0.3)" }}>+{recipients.length - 20} weitere</p>}
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
