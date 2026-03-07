import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Pencil, Trash2, Star, Eye, EyeOff, Layers, ChevronDown, ChevronRight,
  ArrowLeft, ImageIcon, MapPin, Clock, Ticket, Upload, X, Globe, Search, Copy,
  Sun, XCircle, Filter, Send, Type, Minus, Space, MessageCircle, Map, Image,
  FileText, HelpCircle, Gift, Music, Video, LayoutGrid, RefreshCw, AlertTriangle,
  Check, Calendar, Import, ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import BulkEditDialog from "@/components/admin/BulkEditDialog";

/* ─── City → Country mapping ─── */
const CITY_COUNTRY: Record<string, string> = {
  // Austria
  Dornbirn: "Österreich", Gralla: "Österreich", Innsbruck: "Österreich", Kitzbühel: "Österreich",
  Kollerschlag: "Österreich", Linz: "Österreich", Salzburg: "Österreich", "St. Martin": "Österreich",
  Vöcklabruck: "Österreich", Wien: "Österreich",
  // Switzerland
  Lyss: "Schweiz", Olten: "Schweiz", "St. Gallen": "Schweiz", Winterthur: "Schweiz", Zürich: "Schweiz",
  // Netherlands
  Amsterdam: "Niederlande", Rotterdam: "Niederlande", Utrecht: "Niederlande",
  // Belgium
  Antwerpen: "Belgien",
  // France
  "Le Havre": "Frankreich", Mathay: "Frankreich", Paris: "Frankreich",
  // Luxembourg
  Luxembourg: "Luxemburg",
  // Poland
  Krakow: "Polen",
  // Croatia
  Zadar: "Kroatien",
  // Brazil
  "São Paulo": "Brasilien",
};
const getCountry = (city: string | null) => {
  if (!city) return "Unbekannt";
  return CITY_COUNTRY[city] || "Deutschland";
};

interface GalleryConfig {
  grid_cols?: number;
  view_mode?: "grid" | "masonry" | "slideshow";
  slideshow_speed?: number;
  slideshow_transition?: "simultaneous" | "staggered";
  slideshow_order?: "sequential" | "random";
  aspect_ratio?: "square" | "4:3" | "16:9" | "3:4" | "9:16";
  hover_effect?: boolean;
  show_captions?: boolean;
  lightbox_enabled?: boolean;
}

interface InfoBlock {
  id: string;
  title: string;
  content: string;
  show_title?: boolean;
  external_urls?: string[];
  gallery_config?: GalleryConfig;
}

interface EventRow {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  description: string | null;
  date: string | null;
  time: string | null;
  end_time: string | null;
  location_name: string | null;
  location_address: string | null;
  city: string | null;
  image_url: string | null;
  tag: string | null;
  status: string | null;
  highlight: boolean | null;
  open_air: boolean | null;
  sold_out: boolean | null;
  ticket_link: string | null;
  sort_order: number | null;
  series_id: string | null;
  service_fee_enabled: boolean | null;
  service_fee_type: string | null;
  service_fee_value: number | null;
  service_fee_vat: number | null;
  info_sections: InfoBlock[] | null;
}

interface TicketRow {
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

const DEFAULT_INFO_SECTIONS: InfoBlock[] = [
  { id: "eventinfo", title: "Eventinformationen", content: "auto-eventinfo" },
  { id: "einlass", title: "Einlassinformationen", content: "Einlass ab 20:00 Uhr.\nDer Eintritt ist nur mit einem gültigen Ticket möglich.\nBitte halte deinen QR-Code bereit.\n\nMindestalter: 16 Jahre (mit Muttizettel ab 14 Jahre)." },
  { id: "whatsapp", title: "Freikarten & mehr", content: "whatsapp" },
  { id: "weitere-staedte", title: "Weitere Städte", content: "weitere-staedte" },
];

/* ─── Block Templates ─── */
interface BlockTemplate {
  id: string;
  label: string;
  icon: any;
  category: string;
  block: InfoBlock;
}

const BLOCK_TEMPLATES: BlockTemplate[] = [
  // Content
  { id: "text", label: "Textblock", icon: Type, category: "Inhalt", block: { id: "", title: "Neuer Textblock", content: "Hier Text eingeben..." } },
  { id: "eventinfo", label: "Eventinformationen (auto)", icon: FileText, category: "Inhalt", block: { id: "", title: "Eventinformationen", content: "auto-eventinfo" } },
  { id: "einlass", label: "Einlassinformationen", icon: Clock, category: "Inhalt", block: { id: "", title: "Einlassinformationen", content: "Einlass ab 20:00 Uhr.\nDer Eintritt ist nur mit einem gültigen Ticket möglich.\nBitte halte deinen QR-Code bereit.\n\nMindestalter: 16 Jahre (mit Muttizettel ab 14 Jahre)." } },
  { id: "dresscode", label: "Dresscode", icon: Star, category: "Inhalt", block: { id: "", title: "Dresscode", content: "Komm so, wie du dich wohlfühlst! 🎉\nWir empfehlen bequeme Schuhe und partygerechte Kleidung." } },
  { id: "anfahrt", label: "Anfahrt & Parken", icon: MapPin, category: "Inhalt", block: { id: "", title: "Anfahrt & Parken", content: "🚗 Parkplätze stehen in begrenzter Anzahl vor der Location zur Verfügung.\n🚌 Mit den öffentlichen Verkehrsmitteln erreichst du uns über die Haltestelle [Name].\n\n🔗 Google Maps-Link folgt in Kürze." } },
  { id: "faq", label: "Häufige Fragen", icon: HelpCircle, category: "Inhalt", block: { id: "", title: "Häufige Fragen", content: "❓ Kann ich mein Ticket umbuchen?\nJa, eine Umbuchung ist bis 48h vor dem Event möglich. Weitere Infos unter gimme-gimme.de/ticket-umbuchung\n\n❓ Gibt es eine Garderobe?\nJa, eine Garderobe ist vor Ort verfügbar.\n\n❓ Ab welchem Alter darf ich rein?\nMindestalter: 16 Jahre (mit Muttizettel ab 14 Jahre)." } },
  { id: "hinweise", label: "Wichtige Hinweise", icon: FileText, category: "Inhalt", block: { id: "", title: "Wichtige Hinweise", content: "⚠️ Bitte beachtet folgende Hinweise:\n\n• Kein Einlass mit Glasflaschen oder gefährlichen Gegenständen.\n• Es wird Einlasskontrollen geben.\n• Tickets sind personengebunden und nicht übertragbar.\n• Bei Missachtung der Hausordnung behalten wir uns das Recht vor, den Zutritt zu verweigern." } },
  // Layout
  { id: "divider", label: "Visueller Trenner", icon: Minus, category: "Layout", block: { id: "", title: "───", content: "divider" } },
  { id: "spacer", label: "Abstand", icon: Space, category: "Layout", block: { id: "", title: "", content: "spacer" } },
  // Widgets
  { id: "whatsapp", label: "WhatsApp Community", icon: MessageCircle, category: "Widgets", block: { id: "", title: "Freikarten & mehr", content: "whatsapp" } },
  { id: "weitere-staedte", label: "Weitere Städte", icon: Map, category: "Widgets", block: { id: "", title: "Weitere Städte", content: "weitere-staedte" } },
  { id: "gallery-photos", label: "Mediengalerie – Fotos", icon: Image, category: "Widgets", block: { id: "", title: "Impressionen", content: "gallery-photos" } },
  { id: "gallery-videos", label: "Mediengalerie – Videos", icon: Video, category: "Widgets", block: { id: "", title: "Videos", content: "gallery-videos" } },
  { id: "spotify", label: "Spotify Playlist", icon: Music, category: "Widgets", block: { id: "", title: "Unsere Playlist", content: "spotify" } },
  { id: "countdown", label: "Event Countdown", icon: Clock, category: "Widgets", block: { id: "", title: "Countdown", content: "countdown" } },
];

const TEMPLATE_CATEGORIES = ["Inhalt", "Layout", "Widgets"];

const emptyEvent: Omit<EventRow, "id"> = {
  title: "", subtitle: "", slug: "", description: "", date: null, time: "20:00", end_time: "23:00",
  location_name: "", location_address: "", city: "", image_url: "", tag: "Konzert",
  status: "draft", highlight: false, open_air: false, sold_out: false, ticket_link: "", sort_order: 0, series_id: null,
  service_fee_enabled: false, service_fee_type: "absolute", service_fee_value: 0, service_fee_vat: 19,
  info_sections: [...DEFAULT_INFO_SECTIONS],
};

const emptyTicket = { name: "", description: "", price: 0, currency: "EUR", sold_out: false, sort_order: 0, features: [] as string[], badge: "", coming_soon: false, category_group: "REGULAR", sale_start: null as string | null, sale_end: null as string | null, internal_only: false, group_size: 1 };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/* ─── Shared Components ─── */
const Field = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
  <div>
    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
      {label}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1"
      style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}
    />
  </div>
);

const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="rounded-2xl p-5 sm:p-6 space-y-4" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.07)" }}>
    <div className="flex items-center gap-2.5 pb-2" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
      <Icon className="w-4 h-4" style={{ color: "hsl(230 80% 56%)" }} />
      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{title}</h3>
    </div>
    {children}
  </div>
);

/* ─── Ticket Editor Inline ─── */
const TicketEditor = ({ eventId, tickets, onReload }: { eventId: string; tickets: TicketRow[]; onReload: () => void }) => {
  const [editingTicket, setEditingTicket] = useState<Partial<TicketRow> | null>(null);
  const [featuresInput, setFeaturesInput] = useState("");

  const saveTicket = async () => {
    if (!editingTicket?.name) { toast.error("Ticketname ist Pflicht"); return; }
    const payload: any = {
      name: editingTicket.name,
      description: editingTicket.description || null,
      price: editingTicket.price || 0,
      currency: editingTicket.currency || "EUR",
      sold_out: editingTicket.sold_out || false,
      sort_order: editingTicket.sort_order || 0,
      features: editingTicket.features || [],
      badge: editingTicket.badge || null,
      coming_soon: editingTicket.coming_soon || false,
      category_group: editingTicket.category_group || "REGULAR",
      sale_start: editingTicket.sale_start || null,
      sale_end: editingTicket.sale_end || null,
      internal_only: editingTicket.internal_only || false,
      group_size: editingTicket.group_size || 1,
      event_id: eventId,
    };
    if (editingTicket.id) {
      const { error } = await supabase.from("ticket_categories").update(payload).eq("id", editingTicket.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Ticket aktualisiert");
    } else {
      const { error } = await supabase.from("ticket_categories").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Ticket erstellt");
    }
    setEditingTicket(null);
    onReload();
  };

  const removeTicket = async (id: string) => {
    if (!confirm("Ticket-Variante löschen?")) return;
    await supabase.from("ticket_categories").delete().eq("id", id);
    toast.success("Ticket gelöscht");
    onReload();
  };

  const addFeature = () => {
    if (!featuresInput.trim() || !editingTicket) return;
    setEditingTicket({ ...editingTicket, features: [...(editingTicket.features || []), featuresInput.trim()] });
    setFeaturesInput("");
  };

  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <div
          key={t.id}
          className="rounded-xl p-4 flex items-center justify-between"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(200 80% 55% / 0.15)", color: "hsl(200 80% 55%)" }}>
                {t.category_group || "REGULAR"}
              </span>
              <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{t.name}</span>
              {t.badge && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(330 80% 55% / 0.15)", color: "hsl(330 80% 55%)" }}>
                  {t.badge}
                </span>
              )}
              {t.coming_soon && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(45 80% 55% / 0.15)", color: "hsl(45 80% 55%)" }}>
                  COMING SOON
                </span>
              )}
              {t.sold_out && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>
                  Ausverkauft
                </span>
              )}
              {(t.sale_start || t.sale_end) && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(270 60% 55% / 0.15)", color: "hsl(270 60% 55%)" }}>
                  {t.sale_start ? new Date(t.sale_start).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "∞"}
                  {" → "}
                  {t.sale_end ? new Date(t.sale_end).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "∞"}
                </span>
              )}
              {t.internal_only && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(45 80% 55% / 0.15)", color: "hsl(45 80% 55%)" }}>
                  Nur intern
                </span>
              )}
              {(t.group_size || 1) > 1 && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(180 60% 50% / 0.15)", color: "hsl(180 60% 50%)" }}>
                  {t.group_size}er Gruppe
                </span>
              )}
            </div>
            {t.description && <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{t.description}</p>}
            {t.features && t.features.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {t.features.map((f, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsl(142 70% 45% / 0.1)", color: "hsl(142 70% 55%)" }}>
                    ✅ {f}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <div className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
              {t.price.toFixed(2)} €
            </div>
            <button onClick={() => { setEditingTicket(t); setFeaturesInput(""); }} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => removeTicket(t.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Create / Edit Ticket Form */}
      {editingTicket ? (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
          <h4 className="text-xs font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
            {editingTicket.id ? "Ticket bearbeiten" : "Neues Ticket erstellen"}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *" value={editingTicket.name} onChange={(v: string) => setEditingTicket({ ...editingTicket, name: v })} placeholder="z.B. LAST CHANCE TICKET" />
            <Field label="Preis (€)" value={editingTicket.price} onChange={(v: string) => setEditingTicket({ ...editingTicket, price: parseFloat(v) || 0 })} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategorie-Gruppe" value={editingTicket.category_group} onChange={(v: string) => setEditingTicket({ ...editingTicket, category_group: v })} placeholder="z.B. REGULAR, DELUXE, FAN" />
            <Field label="Badge" value={editingTicket.badge} onChange={(v: string) => setEditingTicket({ ...editingTicket, badge: v })} placeholder="z.B. FAST AUSVERKAUFT" />
          </div>
          <Field label="Beschreibung" value={editingTicket.description} onChange={(v: string) => setEditingTicket({ ...editingTicket, description: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sortierung" value={editingTicket.sort_order} onChange={(v: string) => setEditingTicket({ ...editingTicket, sort_order: parseInt(v) || 0 })} type="number" />
            <div className="flex items-end pb-1 gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                <input type="checkbox" checked={editingTicket.sold_out || false} onChange={(e) => setEditingTicket({ ...editingTicket, sold_out: e.target.checked })} className="rounded w-4 h-4" />
                Ausverkauft
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                <input type="checkbox" checked={editingTicket.coming_soon || false} onChange={(e) => setEditingTicket({ ...editingTicket, coming_soon: e.target.checked })} className="rounded w-4 h-4" />
                Coming Soon
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(45 80% 55% / 0.9)" }}>
                <input type="checkbox" checked={editingTicket.internal_only || false} onChange={(e) => setEditingTicket({ ...editingTicket, internal_only: e.target.checked })} className="rounded w-4 h-4" />
                Nur intern (Freiticket)
              </label>
            </div>
          </div>
          {/* Group size */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gruppengröße (1 = Einzelticket)" value={editingTicket.group_size || 1} onChange={(v: string) => setEditingTicket({ ...editingTicket, group_size: parseInt(v) || 1 })} type="number" />
          </div>
          {/* Sale Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Verkaufsstart (optional)</label>
              <input
                type="datetime-local"
                value={editingTicket.sale_start || ""}
                onChange={(e) => setEditingTicket({ ...editingTicket, sale_start: e.target.value || null })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Verkaufsende (optional)</label>
              <input
                type="datetime-local"
                value={editingTicket.sale_end || ""}
                onChange={(e) => setEditingTicket({ ...editingTicket, sale_end: e.target.value || null })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              />
            </div>
          </div>
          {/* Features */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Features</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {(editingTicket.features || []).map((f, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.7)" }}>
                  {f}
                  <button onClick={() => setEditingTicket({ ...editingTicket, features: (editingTicket.features || []).filter((_, j) => j !== i) })} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                placeholder="z.B. VERGÜNSTIGTER EINTRITT"
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              />
              <button onClick={addFeature} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>
                +
              </button>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setEditingTicket(null)} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>
              Abbrechen
            </button>
            <button onClick={saveTicket} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
              Speichern
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditingTicket({ ...emptyTicket })}
          className="w-full rounded-xl p-6 flex flex-col items-center gap-2 transition-all hover:border-white/15"
          style={{ border: "2px dashed hsl(0 0% 100% / 0.1)", background: "transparent" }}
        >
          <Ticket className="w-6 h-6" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
          <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Weiteres Ticket erstellen</span>
          <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.25)" }}>Du kannst beliebig viele Ticket-Varianten erstellen.</span>
        </button>
      )}
    </div>
  );
};

/* ─── Media Editor (inline, for photos & videos) ─── */
const MediaEditor = ({ eventId, type, showTitle, onToggleTitle, externalUrls, onUpdateExternalUrls, galleryConfig, onUpdateGalleryConfig }: { eventId: string; type: "photos" | "videos"; showTitle: boolean; onToggleTitle: (val: boolean) => void; externalUrls: string[]; onUpdateExternalUrls: (urls: string[]) => void; galleryConfig?: GalleryConfig; onUpdateGalleryConfig?: (config: GalleryConfig) => void }) => {
  const [storageFiles, setStorageFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showScrapeInput, setShowScrapeInput] = useState(false);
  const [showGallerySettings, setShowGallerySettings] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeResults, setScrapeResults] = useState<string[]>([]);
  const [selectedScrapeResults, setSelectedScrapeResults] = useState<Set<string>>(new Set());
  const [detectedAlbums, setDetectedAlbums] = useState<{ index: number; title: string; coverImage: string | null; date: string | null }[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const prefix = `gallery-${type}/${eventId}/`;
  const isVideo = type === "videos";
  const acceptTypes = isVideo ? "video/mp4,video/webm,video/quicktime" : "image/*";
  const emoji = isVideo ? "🎬" : "🖼️";
  const label = isVideo ? "Mediengalerie – Videos" : "Mediengalerie – Fotos";
  const itemLabel = isVideo ? "Videos" : "Bilder";
  const totalCount = storageFiles.length + externalUrls.length;

  const loadFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("event-images").list(`gallery-${type}/${eventId}`, { sortBy: { column: "created_at", order: "asc" } });
    if (!error && data) {
      setStorageFiles(data.filter(f => f.name !== ".emptyFolderPlaceholder").map(f => `${SUPABASE_URL}/storage/v1/object/public/event-images/${prefix}${f.name}`));
    }
    setLoading(false);
  };

  useEffect(() => { loadFiles(); }, [eventId, type]);

  const uploadFiles = async (fileList: FileList) => {
    setUploading(true);
    for (const file of Array.from(fileList)) {
      const ext = file.name.split(".").pop();
      const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("event-images").upload(path, file);
      if (error) toast.error("Upload fehlgeschlagen: " + error.message);
    }
    await loadFiles();
    setUploading(false);
    toast.success(`${itemLabel} hochgeladen`);
  };

  const deleteStorageFile = async (url: string) => {
    const path = url.split("/event-images/")[1];
    if (!path) return;
    await supabase.storage.from("event-images").remove([path]);
    setStorageFiles(prev => prev.filter(i => i !== url));
    toast.success(`${isVideo ? "Video" : "Bild"} gelöscht`);
  };

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    if (!externalUrls.includes(url)) {
      onUpdateExternalUrls([...externalUrls, url]);
    }
    setLinkInput("");
    setShowLinkInput(false);
    toast.success("Link hinzugefügt");
  };

  const scrapePage = async () => {
    const url = scrapeUrl.trim();
    if (!url) return;
    setScraping(true);
    setScrapeResults([]);
    setSelectedScrapeResults(new Set());
    setDetectedAlbums([]);
    setSelectedAlbums(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("scrape-media", {
        body: { url, type },
      });
      if (error) throw error;

      // Check if albums were detected
      if (data?.hasAlbums && data.albums?.length > 0) {
        setDetectedAlbums(data.albums);
        setSelectedAlbums(new Set(data.albums.map((a: any) => a.index)));
        toast.success(`${data.albums.length} Alben gefunden! Wähle aus, welche du importieren möchtest.`);
        setScraping(false);
        return;
      }

      if (data?.success && data.urls?.length > 0) {
        const newUrls = (data.urls as string[]).filter(u => !externalUrls.includes(u));
        setScrapeResults(newUrls);
        setSelectedScrapeResults(new Set(newUrls));
        toast.success(`${newUrls.length} ${itemLabel} gefunden`);
      } else {
        toast.error(`Keine ${itemLabel} auf der Seite gefunden`);
      }
    } catch (err: any) {
      toast.error("Scan fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
    }
    setScraping(false);
  };

  const scrapeSelectedAlbums = async () => {
    if (selectedAlbums.size === 0) return;
    setScraping(true);
    setScrapeResults([]);
    setSelectedScrapeResults(new Set());
    try {
      const { data, error } = await supabase.functions.invoke("scrape-media", {
        body: { url: scrapeUrl.trim(), type, mode: "scrape_albums", albumIndices: Array.from(selectedAlbums) },
      });
      if (error) throw error;
      if (data?.success && data.urls?.length > 0) {
        const newUrls = (data.urls as string[]).filter(u => !externalUrls.includes(u));
        setScrapeResults(newUrls);
        setSelectedScrapeResults(new Set(newUrls));
        setDetectedAlbums([]);
        toast.success(`${newUrls.length} ${itemLabel} aus ${selectedAlbums.size} Alben gefunden`);
      } else {
        toast.error(`Keine ${itemLabel} in den ausgewählten Alben gefunden`);
      }
    } catch (err: any) {
      toast.error("Scan fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
    }
    setScraping(false);
  };

  const toggleAlbumSelection = (index: number) => {
    setSelectedAlbums(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const toggleScrapeResult = (url: string) => {
    setSelectedScrapeResults(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  };

  const importSelectedScrapeResults = () => {
    const toAdd = Array.from(selectedScrapeResults).filter(u => !externalUrls.includes(u));
    if (toAdd.length === 0) return;
    onUpdateExternalUrls([...externalUrls, ...toAdd]);
    setScrapeResults([]);
    setSelectedScrapeResults(new Set());
    setShowScrapeInput(false);
    setScrapeUrl("");
    toast.success(`${toAdd.length} ${itemLabel} importiert`);
  };

  const removeLink = (url: string) => {
    onUpdateExternalUrls(externalUrls.filter(u => u !== url));
  };

  return (
    <div className="space-y-3">
      <div className="px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between gap-2 flex-wrap" style={{ background: "hsl(270 60% 55% / 0.08)", color: "hsl(270 60% 70%)", border: "1px dashed hsl(270 60% 55% / 0.2)" }}>
        <span>{emoji} {label}</span>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => onToggleTitle(!showTitle)} className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: showTitle ? "hsl(142 60% 40% / 0.2)" : "hsl(0 0% 100% / 0.06)", color: showTitle ? "hsl(142 60% 60%)" : "hsl(0 0% 100% / 0.4)" }}>
            {showTitle ? "Titel ✓" : "Titel ✗"}
          </button>
          <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{totalCount} {itemLabel}</span>
          <input ref={fileRef} type="file" accept={acceptTypes} multiple className="hidden" onChange={e => e.target.files && uploadFiles(e.target.files)} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: "hsl(270 60% 55% / 0.2)", color: "hsl(270 60% 70%)" }}>
            {uploading ? "Lädt..." : `+ ${itemLabel}`}
          </button>
          <button onClick={() => { setShowLinkInput(!showLinkInput); setShowScrapeInput(false); }} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: "hsl(200 60% 50% / 0.2)", color: "hsl(200 60% 70%)" }}>
            🔗 Link
          </button>
          <button onClick={() => { setShowScrapeInput(!showScrapeInput); setShowLinkInput(false); setShowGallerySettings(false); }} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: "hsl(150 60% 40% / 0.2)", color: "hsl(150 60% 65%)" }}>
            🌐 Seite scannen
          </button>
          {onUpdateGalleryConfig && (
            <button onClick={() => { setShowGallerySettings(!showGallerySettings); setShowLinkInput(false); setShowScrapeInput(false); }} className="px-3 py-1 rounded-lg text-xs font-bold" style={{ background: showGallerySettings ? "hsl(45 80% 50% / 0.3)" : "hsl(45 80% 50% / 0.15)", color: "hsl(45 80% 60%)" }}>
              ⚙️ Darstellung
            </button>
          )}
        </div>
      </div>

      {/* Gallery Display Settings */}
      {showGallerySettings && onUpdateGalleryConfig && (
        <div className="rounded-lg p-3 space-y-3" style={{ background: "hsl(45 60% 50% / 0.06)", border: "1px solid hsl(45 60% 50% / 0.15)" }}>
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(45 60% 60%)" }}>⚙️ Galerie-Darstellung</div>
          
          {/* View Mode */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Ansicht</label>
            <div className="flex gap-1.5">
              {([
                { value: "grid", label: "Grid", icon: "▦" },
                ...(!isVideo ? [{ value: "masonry" as const, label: "Masonry", icon: "▥" }] : []),
                { value: "slideshow", label: "Diashow", icon: "▶" },
              ]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateGalleryConfig({ ...galleryConfig, view_mode: opt.value as "grid" | "masonry" | "slideshow" })}
                  className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background: (galleryConfig?.view_mode || "grid") === opt.value ? "hsl(217 91% 60% / 0.25)" : "hsl(0 0% 100% / 0.05)",
                    color: (galleryConfig?.view_mode || "grid") === opt.value ? "hsl(217 91% 70%)" : "hsl(0 0% 100% / 0.4)",
                    border: `1px solid ${(galleryConfig?.view_mode || "grid") === opt.value ? "hsl(217 91% 60% / 0.3)" : "transparent"}`,
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Columns */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Spalten</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => onUpdateGalleryConfig({ ...galleryConfig, grid_cols: n })}
                  className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background: (galleryConfig?.grid_cols || 3) === n ? "hsl(217 91% 60% / 0.25)" : "hsl(0 0% 100% / 0.05)",
                    color: (galleryConfig?.grid_cols || 3) === n ? "hsl(217 91% 70%)" : "hsl(0 0% 100% / 0.4)",
                    border: `1px solid ${(galleryConfig?.grid_cols || 3) === n ? "hsl(217 91% 60% / 0.3)" : "transparent"}`,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Seitenverhältnis</label>
            <div className="flex gap-1.5">
              {([
                { value: "square", label: "1:1" },
                { value: "4:3", label: "4:3" },
                { value: "16:9", label: "16:9" },
                { value: "3:4", label: "3:4" },
                { value: "9:16", label: "9:16" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateGalleryConfig({ ...galleryConfig, aspect_ratio: opt.value })}
                  className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                  style={{
                    background: (galleryConfig?.aspect_ratio || "square") === opt.value ? "hsl(217 91% 60% / 0.25)" : "hsl(0 0% 100% / 0.05)",
                    color: (galleryConfig?.aspect_ratio || "square") === opt.value ? "hsl(217 91% 70%)" : "hsl(0 0% 100% / 0.4)",
                    border: `1px solid ${(galleryConfig?.aspect_ratio || "square") === opt.value ? "hsl(217 91% 60% / 0.3)" : "transparent"}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Slideshow Speed & Transition (only for slideshow) */}
          {(galleryConfig?.view_mode === "slideshow") && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  Geschwindigkeit: {((galleryConfig?.slideshow_speed || 3000) / 1000).toFixed(1)}s
                </label>
                <input
                  type="range"
                  min={1000}
                  max={8000}
                  step={500}
                  value={galleryConfig?.slideshow_speed || 3000}
                  onChange={e => onUpdateGalleryConfig({ ...galleryConfig, slideshow_speed: Number(e.target.value) })}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  Bildwechsel
                </label>
                <div className="flex gap-2">
                  {([
                    { value: "simultaneous", label: "⚡ Gleichzeitig" },
                    { value: "staggered", label: "🌊 Versetzt" },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => onUpdateGalleryConfig({ ...galleryConfig, slideshow_transition: opt.value })}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={{
                        background: (galleryConfig?.slideshow_transition || "simultaneous") === opt.value ? "hsl(217 91% 60% / 0.25)" : "hsl(0 0% 100% / 0.05)",
                        color: (galleryConfig?.slideshow_transition || "simultaneous") === opt.value ? "hsl(217 91% 70%)" : "hsl(0 0% 100% / 0.4)",
                        border: `1px solid ${(galleryConfig?.slideshow_transition || "simultaneous") === opt.value ? "hsl(217 91% 60% / 0.3)" : "transparent"}`,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Slideshow Order (only for slideshow) */}
          {(galleryConfig?.view_mode === "slideshow") && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                Reihenfolge
              </label>
              <div className="flex gap-2">
                {([
                  { value: "sequential", label: "📋 Reihenfolge" },
                  { value: "random", label: "🎲 Zufällig" },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onUpdateGalleryConfig({ ...galleryConfig, slideshow_order: opt.value })}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: (galleryConfig?.slideshow_order || "sequential") === opt.value ? "hsl(217 91% 60% / 0.25)" : "hsl(0 0% 100% / 0.05)",
                      color: (galleryConfig?.slideshow_order || "sequential") === opt.value ? "hsl(217 91% 70%)" : "hsl(0 0% 100% / 0.4)",
                      border: `1px solid ${(galleryConfig?.slideshow_order || "sequential") === opt.value ? "hsl(217 91% 60% / 0.3)" : "transparent"}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="flex gap-2 flex-wrap">
            {([
              { key: "hover_effect", label: "Hover-Effekt", default: true },
              { key: "lightbox_enabled", label: "Lightbox", default: true },
              { key: "show_captions", label: "Bildtitel", default: false },
            ] as const).map(toggle => (
              <button
                key={toggle.key}
                onClick={() => onUpdateGalleryConfig({ ...galleryConfig, [toggle.key]: !(galleryConfig?.[toggle.key] ?? toggle.default) })}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  background: (galleryConfig?.[toggle.key] ?? toggle.default) ? "hsl(142 60% 40% / 0.2)" : "hsl(0 0% 100% / 0.05)",
                  color: (galleryConfig?.[toggle.key] ?? toggle.default) ? "hsl(142 60% 60%)" : "hsl(0 0% 100% / 0.4)",
                }}
              >
                {(galleryConfig?.[toggle.key] ?? toggle.default) ? "✓" : "✗"} {toggle.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showLinkInput && (
        <div className="flex gap-2">
          <input
            value={linkInput}
            onChange={e => setLinkInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addLink()}
            placeholder="https://example.com/bild.jpg"
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
          />
          <button onClick={addLink} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(200 60% 50% / 0.3)", color: "hsl(200 60% 70%)" }}>
            Hinzufügen
          </button>
        </div>
      )}

      {showScrapeInput && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={scrapeUrl}
              onChange={e => setScrapeUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && scrapePage()}
              placeholder="https://gimmegimmeparty.de/media"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(150 60% 40% / 0.2)" }}
            />
            <button onClick={scrapePage} disabled={scraping} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(150 60% 40% / 0.3)", color: "hsl(150 60% 65%)" }}>
              {scraping ? "Scannt..." : "Scannen"}
            </button>
          </div>
          {/* Album Selection UI */}
          {detectedAlbums.length > 0 && scrapeResults.length === 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold" style={{ color: "hsl(270 60% 70%)" }}>
                  📂 {detectedAlbums.length} Alben erkannt
                </span>
                <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  – Wähle die Alben aus, die du importieren möchtest
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {detectedAlbums.map(album => (
                  <div
                    key={album.index}
                    onClick={() => toggleAlbumSelection(album.index)}
                    className="relative cursor-pointer rounded-lg overflow-hidden transition-all"
                    style={{
                      border: selectedAlbums.has(album.index) ? "2px solid hsl(270 60% 55%)" : "2px solid hsl(0 0% 100% / 0.1)",
                      opacity: selectedAlbums.has(album.index) ? 1 : 0.5,
                    }}
                  >
                    <div className="aspect-video bg-muted">
                      {album.coverImage ? (
                        <img src={album.coverImage} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                      )}
                    </div>
                    <div className="p-2" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
                      <div className="text-xs font-bold truncate" style={{ color: "hsl(0 0% 100% / 0.9)" }}>{album.title}</div>
                      {album.date && <div className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{album.date}</div>}
                    </div>
                    {selectedAlbums.has(album.index) && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "hsl(270 60% 55%)", color: "white" }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAlbums(selectedAlbums.size === detectedAlbums.length ? new Set() : new Set(detectedAlbums.map(a => a.index)))}
                    className="px-2 py-1 rounded text-[10px] font-bold"
                    style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)" }}
                  >
                    {selectedAlbums.size === detectedAlbums.length ? "Keine auswählen" : "Alle auswählen"}
                  </button>
                </div>
                <button
                  onClick={scrapeSelectedAlbums}
                  disabled={selectedAlbums.size === 0 || scraping}
                  className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: selectedAlbums.size > 0 ? "hsl(270 60% 55% / 0.3)" : "hsl(0 0% 100% / 0.06)",
                    color: selectedAlbums.size > 0 ? "hsl(270 60% 70%)" : "hsl(0 0% 100% / 0.3)",
                  }}
                >
                  {scraping ? "Scannt Alben..." : `📥 ${selectedAlbums.size} Alben scannen`}
                </button>
              </div>
            </div>
          )}
          {scrapeResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: "hsl(150 60% 65%)" }}>
                  {selectedScrapeResults.size} / {scrapeResults.length} ausgewählt
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedScrapeResults(selectedScrapeResults.size === scrapeResults.length ? new Set() : new Set(scrapeResults))} className="px-2 py-1 rounded text-[10px] font-bold" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)" }}>
                    {selectedScrapeResults.size === scrapeResults.length ? "Keine" : "Alle"}
                  </button>
                  <button onClick={importSelectedScrapeResults} disabled={selectedScrapeResults.size === 0} className="px-3 py-1 rounded text-[10px] font-bold" style={{ background: selectedScrapeResults.size > 0 ? "hsl(150 60% 40% / 0.3)" : "hsl(0 0% 100% / 0.06)", color: selectedScrapeResults.size > 0 ? "hsl(150 60% 65%)" : "hsl(0 0% 100% / 0.3)" }}>
                    ✓ {selectedScrapeResults.size} importieren
                  </button>
                </div>
              </div>
              <div className={`grid ${isVideo ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5"} gap-2 max-h-64 overflow-y-auto rounded-lg p-2`} style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(150 60% 40% / 0.15)" }}>
                {scrapeResults.map((url, i) => (
                  <div key={i} onClick={() => toggleScrapeResult(url)} className="relative cursor-pointer aspect-square rounded-lg overflow-hidden transition-all" style={{ border: selectedScrapeResults.has(url) ? "2px solid hsl(150 60% 50%)" : "2px solid transparent", opacity: selectedScrapeResults.has(url) ? 1 : 0.5 }}>
                    {isVideo ? (
                      <video src={url + "#t=0.5"} className="w-full h-full object-cover" muted preload="metadata" playsInline />
                    ) : (
                      <img src={url} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    )}
                    {selectedScrapeResults.has(url) && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: "hsl(150 60% 40%)", color: "white" }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-center py-2" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Laden...</p>
      ) : totalCount > 0 ? (
        <div className={`grid ${isVideo ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-3 sm:grid-cols-4"} gap-2`}>
          {storageFiles.map((url, i) => (
            <div key={`s-${i}`} className="relative group aspect-square rounded-lg overflow-hidden" style={{ border: "1px solid hsl(0 0% 100% / 0.1)" }}>
              {isVideo ? (
                <video src={url + "#t=0.5"} className="w-full h-full object-cover" muted preload="metadata" playsInline />
              ) : (
                <img src={url} className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => deleteStorageFile(url)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "hsl(0 70% 50% / 0.9)", color: "white" }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {externalUrls.map((url, i) => (
            <div key={`e-${i}`} className="relative group aspect-square rounded-lg overflow-hidden" style={{ border: "1px solid hsl(200 60% 50% / 0.2)" }}>
              {isVideo ? (
                <video src={url + "#t=0.5"} className="w-full h-full object-cover" muted preload="metadata" playsInline />
              ) : (
                <img src={url} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              )}
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "hsl(200 60% 50% / 0.8)", color: "white" }}>🔗</div>
              <button
                onClick={() => removeLink(url)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "hsl(0 70% 50% / 0.9)", color: "white" }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-center py-2" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Noch keine {itemLabel}. Lade welche hoch oder füge Links hinzu.</p>
      )}
    </div>
  );
};

/* ─── Image Upload ─── */
const ImageUpload = ({ imageUrl, onChange }: { imageUrl: string | null; onChange: (url: string) => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file);
    if (error) { toast.error("Upload fehlgeschlagen: " + error.message); setUploading(false); return; }
    const url = `${SUPABASE_URL}/storage/v1/object/public/event-images/${path}`;
    onChange(url);
    setUploading(false);
    toast.success("Bild hochgeladen");
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {imageUrl ? (
        <div className="relative group">
          <img src={imageUrl} alt="Titelbild" className="w-full aspect-[16/9] rounded-xl object-cover" />
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "hsl(0 0% 0% / 0.7)", color: "hsl(0 0% 100%)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-[16/9] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-white/20"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "2px dashed hsl(0 0% 100% / 0.12)" }}
        >
          {uploading ? (
            <span className="text-xs font-medium" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Hochladen...</span>
          ) : (
            <>
              <Upload className="w-8 h-8" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
              <span className="text-xs font-bold" style={{ color: "hsl(330 80% 55%)" }}>Eigene Datei hochladen</span>
              <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>PNG oder JPEG (1200 x 640px)</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

/* ─── Block Template Picker ─── */
const BlockTemplatePicker = ({ onSelect }: { onSelect: (template: BlockTemplate) => void }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-2.5 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
        style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)", border: "1px dashed hsl(0 0% 100% / 0.15)" }}
      >
        <Plus className="w-3.5 h-3.5" /> Neuen Block hinzufügen
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-2 rounded-xl overflow-hidden"
            style={{ background: "hsl(220 50% 10%)", border: "1px solid hsl(0 0% 100% / 0.12)", boxShadow: "0 12px 40px hsl(0 0% 0% / 0.5)" }}
          >
            <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Block-Vorlage wählen</span>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/5">
                <X className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              </button>
            </div>
            <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
              {TEMPLATE_CATEGORIES.map((cat) => (
                <div key={cat}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1" style={{ color: "hsl(330 80% 55% / 0.8)" }}>{cat}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BLOCK_TEMPLATES.filter((t) => t.category === cat).map((tmpl) => {
                      const Icon = tmpl.icon;
                      return (
                        <button
                          key={tmpl.id}
                          onClick={() => { onSelect(tmpl); setOpen(false); }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all hover:scale-[1.02]"
                          style={{ background: "hsl(0 0% 100% / 0.04)", color: "hsl(0 0% 100% / 0.75)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(330 80% 55%)" }} />
                          {tmpl.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Event Edit View ─── */
const EventEditView = ({
  editing, setEditing, seriesOptions, tickets, onSave, onDelete, onBack, onReloadTickets, onSeriesCreated, onBulkEdit,
}: {
  editing: Partial<EventRow>;
  setEditing: (e: Partial<EventRow>) => void;
  seriesOptions: SeriesOption[];
  tickets: TicketRow[];
  onSave: () => void;
  onDelete?: () => void;
  onBack: () => void;
  onReloadTickets: () => void;
  onSeriesCreated: () => void;
  onBulkEdit?: () => void;
}) => {
  const [newSeriesName, setNewSeriesName] = useState("");
  const [creatingSeries, setCreatingSeries] = useState(false);

  // Auto-detect city and suggest series
  const cityValue = editing.city?.trim() || "";
  const matchingSeries = seriesOptions.find(
    (s) => s.city?.toLowerCase() === cityValue.toLowerCase() || s.title.toLowerCase() === cityValue.toLowerCase()
  );

  const createSeriesFromCity = async () => {
    const name = newSeriesName.trim() || cityValue;
    if (!name) { toast.error("Bitte Stadt oder Serienname eingeben"); return; }
    setCreatingSeries(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9äöü]/g, "-").replace(/-+/g, "-");
    const { data, error } = await supabase
      .from("event_series")
      .insert({ title: name, slug, city: cityValue || name, status: "published", sort_order: 0 })
      .select("id")
      .single();
    if (error) { toast.error(error.message); setCreatingSeries(false); return; }
    toast.success(`Serie "${name}" erstellt`);
    setEditing({ ...editing, series_id: data.id });
    setNewSeriesName("");
    setCreatingSeries(false);
    onSeriesCreated();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg sm:text-xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            {editing.id ? "Event bearbeiten" : "Neues Event"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {editing.id && onBulkEdit && (
            <button onClick={onBulkEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(270 60% 55% / 0.15)", color: "hsl(270 60% 55%)", border: "1px solid hsl(270 60% 55% / 0.3)" }}>
              <Send className="w-3.5 h-3.5" /> Bulk Edit
            </button>
          )}
          {editing.id && onDelete && (
            <button onClick={onDelete} className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(0 70% 50% / 0.1)", color: "hsl(0 70% 55%)", border: "1px solid hsl(0 70% 50% / 0.2)" }}>
              Event löschen
            </button>
          )}
          <button onClick={onSave} className="px-6 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
            Speichern
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Eventbeschreibung" icon={Pencil}>
            <Field label="Titel *" value={editing.title} onChange={(v: string) => setEditing({ ...editing, title: v })} />
            <Field label="Untertitel" value={editing.subtitle} onChange={(v: string) => setEditing({ ...editing, subtitle: v })} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Event Kategorie</label>
                <select
                  value={editing.tag || "Konzert"}
                  onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}
                >
                  <option value="Konzert" style={{ background: "#1a1a1a", color: "#fff" }}>Konzert</option>
                  <option value="Party" style={{ background: "#1a1a1a", color: "#fff" }}>Party</option>
                  <option value="Open Air" style={{ background: "#1a1a1a", color: "#fff" }}>Open Air</option>
                  <option value="Festival" style={{ background: "#1a1a1a", color: "#fff" }}>Festival</option>
                  <option value="Club" style={{ background: "#1a1a1a", color: "#fff" }}>Club</option>
                </select>
              </div>
              <Field label="Slug *" value={editing.slug} onChange={(v: string) => setEditing({ ...editing, slug: v })} placeholder="z.b. hannover-10-04" />
            </div>
          </Section>

          <Section title="Zeit & Ort" icon={MapPin}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Event-Start (Datum)" value={editing.date} onChange={(v: string) => setEditing({ ...editing, date: v })} type="date" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Startzeit" value={editing.time} onChange={(v: string) => setEditing({ ...editing, time: v })} placeholder="20:00" />
                <Field label="Endzeit" value={editing.end_time} onChange={(v: string) => setEditing({ ...editing, end_time: v })} placeholder="23:00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Stadt" value={editing.city} onChange={(v: string) => setEditing({ ...editing, city: v })} placeholder="z.B. Hannover" />
              <Field label="Location" value={editing.location_name} onChange={(v: string) => setEditing({ ...editing, location_name: v })} placeholder="z.B. Baggi / Osho" />
            </div>
            <Field label="Location (Komplette Adresse)" value={editing.location_address} onChange={(v: string) => setEditing({ ...editing, location_address: v })} placeholder="Raschpl. 7L, 30161 Hannover" />
          </Section>

          <Section title="Tickets" icon={Ticket}>
            {editing.id ? (
              <TicketEditor eventId={editing.id} tickets={tickets} onReload={onReloadTickets} />
            ) : (
              <p className="text-xs py-4 text-center" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                Speichere das Event zuerst, um Ticket-Varianten hinzuzufügen.
              </p>
            )}
          </Section>

          <Section title="Info-Blöcke (Akkordeons)" icon={Layers}>
            <p className="text-[10px] mb-2" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Diese Blöcke erscheinen als aufklappbare Akkordeons auf der Eventseite.
            </p>
            <div className="space-y-3">
              {(editing.info_sections || []).map((block, idx) => {
                const isWidget = ["whatsapp", "weitere-staedte", "gallery", "gallery-photos", "gallery-videos", "spotify", "countdown", "divider", "spacer", "auto-eventinfo"].includes(block.content);
                const widgetLabel = block.content === "whatsapp" ? "🟢 WhatsApp Community Widget" 
                  : block.content === "weitere-staedte" ? "🗺️ Weitere Städte Widget"
                  : block.content === "gallery" ? "🖼️ Mediengalerie Widget"
                  : block.content === "gallery-photos" ? "🖼️ Mediengalerie – Fotos"
                  : block.content === "gallery-videos" ? "🎬 Mediengalerie – Videos"
                  : block.content === "spotify" ? "🎵 Spotify Playlist Widget"
                  : block.content === "countdown" ? "⏱️ Countdown Widget"
                  : block.content === "divider" ? "── Visueller Trenner ──"
                  : block.content === "spacer" ? "↕️ Abstand"
                  : block.content === "auto-eventinfo" ? "📅 Automatisch generiert (Datum, Uhrzeit, Location, Adresse)"
                  : null;
                return (
                <div key={block.id} className="rounded-xl p-4 space-y-2" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={block.title}
                      onChange={(e) => {
                        const updated = [...(editing.info_sections || [])];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setEditing({ ...editing, info_sections: updated });
                      }}
                      placeholder="Block-Titel (z.B. Eventinformationen)"
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-bold outline-none"
                      style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                    />
                    <div className="flex items-center gap-1">
                      {idx > 0 && (
                        <button
                          onClick={() => {
                            const updated = [...(editing.info_sections || [])];
                            [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                            setEditing({ ...editing, info_sections: updated });
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/5"
                          style={{ color: "hsl(0 0% 100% / 0.4)" }}
                          title="Nach oben"
                        >
                          <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      )}
                      {idx < (editing.info_sections || []).length - 1 && (
                        <button
                          onClick={() => {
                            const updated = [...(editing.info_sections || [])];
                            [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                            setEditing({ ...editing, info_sections: updated });
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/5"
                          style={{ color: "hsl(0 0% 100% / 0.4)" }}
                          title="Nach unten"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const updated = (editing.info_sections || []).filter((_, i) => i !== idx);
                          setEditing({ ...editing, info_sections: updated });
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/5"
                        style={{ color: "hsl(0 70% 55%)" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {isWidget ? (
                    (block.content === "gallery-photos" || block.content === "gallery-videos" || block.content === "gallery") && editing.id ? (
                      <MediaEditor eventId={editing.id} type={block.content === "gallery-videos" ? "videos" : "photos"} showTitle={block.show_title !== false} onToggleTitle={(val) => {
                        const updated = [...(editing.info_sections || [])];
                        updated[idx] = { ...updated[idx], show_title: val };
                        setEditing({ ...editing, info_sections: updated });
                      }} externalUrls={block.external_urls || []} onUpdateExternalUrls={(urls) => {
                        const updated = [...(editing.info_sections || [])];
                        updated[idx] = { ...updated[idx], external_urls: urls };
                        setEditing({ ...editing, info_sections: updated });
                      }} galleryConfig={block.gallery_config} onUpdateGalleryConfig={(config) => {
                        const updated = [...(editing.info_sections || [])];
                        updated[idx] = { ...updated[idx], gallery_config: config };
                        setEditing({ ...editing, info_sections: updated });
                      }} />
                    ) : (
                    <div className="px-3 py-3 rounded-lg text-sm font-medium flex items-center gap-2" style={{ background: "hsl(270 60% 55% / 0.08)", color: "hsl(270 60% 70%)", border: "1px dashed hsl(270 60% 55% / 0.2)" }}>
                      {widgetLabel}
                    </div>
                    )
                  ) : (
                    <textarea
                      value={block.content}
                      onChange={(e) => {
                        const updated = [...(editing.info_sections || [])];
                        updated[idx] = { ...updated[idx], content: e.target.value };
                        setEditing({ ...editing, info_sections: updated });
                      }}
                      rows={5}
                      placeholder="Inhalt des Blocks..."
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
                      style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", minHeight: "80px" }}
                    />
                  )}
                </div>
                );
              })}
            </div>
            {/* Block Template Picker */}
            <BlockTemplatePicker onSelect={(template) => {
              const newBlock: InfoBlock = { id: `block-${Date.now()}`, title: template.block.title, content: template.block.content };
              setEditing({ ...editing, info_sections: [...(editing.info_sections || []), newBlock] });
            }} />
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Section title="Titelbild" icon={ImageIcon}>
            <ImageUpload imageUrl={editing.image_url || null} onChange={(url) => setEditing({ ...editing, image_url: url })} />
          </Section>

          <Section title="Event-Serie" icon={Layers}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Serie zuweisen</label>
              <select
                value={editing.series_id || ""}
                onChange={(e) => setEditing({ ...editing, series_id: e.target.value || null })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}
              >
                <option value="" style={{ background: "#1a1a1a", color: "#fff" }}>Keine Serie</option>
                {seriesOptions.map((s) => (
                  <option key={s.id} value={s.id} style={{ background: "#1a1a1a", color: "#fff" }}>{s.title}</option>
                ))}
              </select>
            </div>

            {/* Auto-detect or create new series */}
            {!editing.series_id && cityValue && matchingSeries && (
              <button
                onClick={() => setEditing({ ...editing, series_id: matchingSeries.id })}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all hover:scale-[1.01]"
                style={{ background: "hsl(270 60% 55% / 0.1)", color: "hsl(270 60% 55%)", border: "1px solid hsl(270 60% 55% / 0.2)" }}
              >
                💡 Serie „{matchingSeries.title}" erkannt – Klicke zum Zuweisen
              </button>
            )}

            {!editing.series_id && !matchingSeries && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                  Oder neue Serie erstellen
                </span>
                <div className="flex gap-2">
                  <input
                    value={newSeriesName}
                    onChange={(e) => setNewSeriesName(e.target.value)}
                    placeholder={cityValue || "Serienname"}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                  />
                  <button
                    onClick={createSeriesFromCity}
                    disabled={creatingSeries}
                    className="px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                    style={{ background: "hsl(270 60% 55%)", color: "hsl(0 0% 100%)" }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </Section>

          <Section title="Einstellungen" icon={Clock}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Status</label>
              <select
                value={editing.status || "draft"}
                onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}
              >
                <option value="draft" style={{ background: "#1a1a1a", color: "#fff" }}>Entwurf</option>
                <option value="published" style={{ background: "#1a1a1a", color: "#fff" }}>Veröffentlicht</option>
              </select>
            </div>
            <Field label="Sortierung" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: parseInt(v) || 0 })} type="number" />
            <label className="flex items-center gap-3 text-sm cursor-pointer pt-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
              <input type="checkbox" checked={editing.highlight || false} onChange={(e) => setEditing({ ...editing, highlight: e.target.checked })} className="rounded w-4 h-4" />
              Highlight-Event
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer pt-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
              <input type="checkbox" checked={editing.open_air || false} onChange={(e) => setEditing({ ...editing, open_air: e.target.checked })} className="rounded w-4 h-4" />
              🌞 Open Air
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer pt-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
              <input type="checkbox" checked={editing.sold_out || false} onChange={(e) => setEditing({ ...editing, sold_out: e.target.checked })} className="rounded w-4 h-4" />
              🚫 Ausverkauft
            </label>
          </Section>

          <Section title="Servicegebühr" icon={Ticket}>
            <label className="flex items-center gap-3 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
              <div
                className="relative w-10 h-5 rounded-full cursor-pointer transition-colors"
                style={{ background: editing.service_fee_enabled ? "hsl(142 70% 45%)" : "hsl(0 0% 100% / 0.15)" }}
                onClick={() => setEditing({ ...editing, service_fee_enabled: !editing.service_fee_enabled })}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    background: "hsl(0 0% 100%)",
                    left: editing.service_fee_enabled ? "calc(100% - 18px)" : "2px",
                  }}
                />
              </div>
              Servicegebühr aktivieren
            </label>

            {editing.service_fee_enabled && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Gebührenart</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing({ ...editing, service_fee_type: "absolute" })}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                      style={{
                        background: editing.service_fee_type === "absolute" ? "hsl(330 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.06)",
                        color: editing.service_fee_type === "absolute" ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
                        border: `1px solid ${editing.service_fee_type === "absolute" ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.1)"}`,
                      }}
                    >
                      Absolut (€)
                    </button>
                    <button
                      onClick={() => setEditing({ ...editing, service_fee_type: "percent" })}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                      style={{
                        background: editing.service_fee_type === "percent" ? "hsl(330 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.06)",
                        color: editing.service_fee_type === "percent" ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
                        border: `1px solid ${editing.service_fee_type === "percent" ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.1)"}`,
                      }}
                    >
                      Prozentual (%)
                    </button>
                  </div>
                </div>
                <Field
                  label={editing.service_fee_type === "percent" ? "Gebühr (%)" : "Gebühr (€)"}
                  value={editing.service_fee_value}
                  onChange={(v: string) => setEditing({ ...editing, service_fee_value: parseFloat(v) || 0 })}
                  type="number"
                  placeholder={editing.service_fee_type === "percent" ? "z.B. 10" : "z.B. 2.50"}
                />
              </div>
            )}
          </Section>

          <Section title="MwSt." icon={Ticket}>
            <Field
              label="MwSt.-Satz (%)"
              value={editing.service_fee_vat}
              onChange={(v: string) => setEditing({ ...editing, service_fee_vat: parseFloat(v) || 0 })}
              type="number"
              placeholder="z.B. 19"
            />
          </Section>
        </div>
      </div>
    </div>
  );
};

/* ─── Bulk Add Dialog ─── */
const BulkAddDialog = ({ events, onClose, onComplete }: { events: EventRow[]; onClose: () => void; onComplete: () => void }) => {
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<BlockTemplate | null>(null);
  const [position, setPosition] = useState<"end" | "start">("end");
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const allSelected = selectedEvents.size === events.length;
  const toggleAll = () => {
    if (allSelected) setSelectedEvents(new Set());
    else setSelectedEvents(new Set(events.map((e) => e.id)));
  };

  const apply = async () => {
    if (!selectedTemplate || selectedEvents.size === 0) return;
    setSaving(true);
    const targetEvents = events.filter((e) => selectedEvents.has(e.id));
    let successCount = 0;
    for (const ev of targetEvents) {
      const existing = Array.isArray(ev.info_sections) ? ev.info_sections : [];
      const newBlock: InfoBlock = { id: `block-${Date.now()}-${Math.random().toString(36).slice(2)}`, title: selectedTemplate.block.title, content: selectedTemplate.block.content };
      const updated = position === "start" ? [newBlock, ...existing] : [...existing, newBlock];
      const { error } = await supabase.from("events").update({ info_sections: updated as any }).eq("id", ev.id);
      if (!error) successCount++;
    }
    toast.success(`Block bei ${successCount} Events hinzugefügt`);
    setSaving(false);
    onComplete();
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "hsl(0 0% 0% / 0.7)" }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: "hsl(220 50% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)", boxShadow: "0 20px 60px hsl(0 0% 0% / 0.6)" }}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
          <h2 className="text-base font-black uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            Bulk Add – Block hinzufügen
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.4)" }} /></button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
          {step === 1 ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(330 80% 55%)" }}>Schritt 1: Block-Vorlage wählen</p>
              <div className="space-y-3">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <div key={cat}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{cat}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {BLOCK_TEMPLATES.filter((t) => t.category === cat).map((tmpl) => {
                        const Icon = tmpl.icon;
                        const isSelected = selectedTemplate?.id === tmpl.id;
                        return (
                          <button
                            key={tmpl.id}
                            onClick={() => setSelectedTemplate(tmpl)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-xs font-medium transition-all hover:scale-[1.02]"
                            style={{
                              background: isSelected ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)",
                              color: isSelected ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.7)",
                              border: `1px solid ${isSelected ? "hsl(330 80% 55% / 0.4)" : "hsl(0 0% 100% / 0.06)"}`,
                            }}
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            {tmpl.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {/* Position */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Position</p>
                <div className="flex gap-2">
                  {(["end", "start"] as const).map((p) => (
                    <button key={p} onClick={() => setPosition(p)} className="px-3 py-2 rounded-lg text-xs font-bold" style={{
                      background: position === p ? "hsl(270 60% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)",
                      color: position === p ? "hsl(270 60% 55%)" : "hsl(0 0% 100% / 0.5)",
                      border: `1px solid ${position === p ? "hsl(270 60% 55% / 0.3)" : "hsl(0 0% 100% / 0.08)"}`,
                    }}>
                      {p === "end" ? "Am Ende anfügen" : "Am Anfang einfügen"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => { if (selectedTemplate) setStep(2); else toast.error("Bitte wähle zuerst eine Vorlage"); }} className="px-5 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
                  Weiter → Events wählen
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(330 80% 55%)" }}>
                Schritt 2: Events auswählen ({selectedEvents.size} / {events.length})
              </p>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={toggleAll} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                  {allSelected ? "Keine auswählen" : "Alle auswählen"}
                </button>
                <button onClick={() => setStep(1)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)" }}>
                  ← Zurück
                </button>
              </div>
              <div className="space-y-1 max-h-[40vh] overflow-y-auto rounded-xl p-2" style={{ background: "hsl(0 0% 100% / 0.02)" }}>
                {events.map((ev) => (
                  <label key={ev.id} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 text-sm" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
                    <input type="checkbox" checked={selectedEvents.has(ev.id)} onChange={() => {
                      const next = new Set(selectedEvents);
                      next.has(ev.id) ? next.delete(ev.id) : next.add(ev.id);
                      setSelectedEvents(next);
                    }} className="rounded w-4 h-4" />
                    <span className="font-bold">{ev.title}</span>
                    {ev.city && <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>({ev.city})</span>}
                    {ev.date && <span className="text-xs ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{ev.date}</span>}
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  Block: <strong style={{ color: "hsl(270 60% 70%)" }}>{selectedTemplate?.label}</strong> → {position === "end" ? "am Ende" : "am Anfang"}
                </span>
                <button onClick={apply} disabled={saving || selectedEvents.size === 0} className="px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
                  {saving ? "Wird angewendet..." : `Bei ${selectedEvents.size} Events hinzufügen`}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Ticket.io Sync Dialog ─── */
interface TioEvent {
  title: string;
  city: string;
  date: string;
  time: string;
  location: string;
  ticketLink: string;
  soldOut: boolean;
  price: string;
}

interface TioCompareResult {
  onlyTio: TioEvent[];
  notOnTio: EventRow[];
  dateMismatch: { ours: EventRow; tio: TioEvent }[];
  matched: number;
}

const normCity = (c: string) => c.toUpperCase().replace(/[.\s-]/g, "").replace(/Ü/g, "UE").replace(/Ö/g, "OE").replace(/Ä/g, "AE").replace(/ß/g, "SS");

const TioSyncDialog = ({ events, onClose, onReload }: { events: EventRow[]; onClose: () => void; onReload: () => void }) => {
  const [phase, setPhase] = useState<"scanning" | "results">("scanning");
  const [tioEvents, setTioEvents] = useState<TioEvent[]>([]);
  const [result, setResult] = useState<TioCompareResult | null>(null);
  const [activeTab, setActiveTab] = useState<"missing" | "extra" | "date">("missing");
  const [importing, setImporting] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runSync();
  }, []);

  const runSync = async () => {
    setPhase("scanning");
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("sync-ticketio", {
        body: { url: "https://mammamia-partymotto.ticket.io/?view=table" },
      });
      if (fnErr) throw fnErr;
      if (!data?.success) throw new Error(data?.error || "Scan fehlgeschlagen");

      const tio = data.events as TioEvent[];
      setTioEvents(tio);

      // Compare with our events - match by city + date
      const onlyTio: TioEvent[] = [];
      const dateMismatch: { ours: EventRow; tio: TioEvent }[] = [];
      const matchedOurIds = new Set<string>();

      for (const te of tio) {
        const tioCity = normCity(te.city);
        // Find our events matching city
        const cityMatches = events.filter(e => {
          const ourCity = normCity(e.city || "");
          return ourCity === tioCity || ourCity.includes(tioCity) || tioCity.includes(ourCity);
        });

        if (cityMatches.length === 0) {
          onlyTio.push(te);
        } else {
          // Check if any match by date too
          const dateMatch = cityMatches.find(e => e.date === te.date);
          if (dateMatch) {
            matchedOurIds.add(dateMatch.id);
          } else {
            // City matches but no date match
            // Check if there's a city match with a different date
            const closestCityMatch = cityMatches[0];
            if (!matchedOurIds.has(closestCityMatch.id)) {
              dateMismatch.push({ ours: closestCityMatch, tio: te });
              matchedOurIds.add(closestCityMatch.id);
            } else {
              onlyTio.push(te);
            }
          }
        }
      }

      // Events in our system but not on ticket.io
      const notOnTio = events.filter(e => {
        if (e.status !== "published") return false;
        if (!e.date || e.date < new Date().toISOString().split("T")[0]) return false;
        return !matchedOurIds.has(e.id);
      });

      setResult({
        onlyTio,
        notOnTio,
        dateMismatch,
        matched: matchedOurIds.size,
      });
      setPhase("results");
    } catch (err: any) {
      setError(err.message || "Unbekannter Fehler");
      setPhase("results");
    }
  };

  const importEvent = async (te: TioEvent, idx: number) => {
    setImporting(prev => new Set(prev).add(idx));
    const slug = `event-${te.city.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${te.date}`;
    const { error } = await supabase.from("events").insert({
      title: te.title || "Event",
      subtitle: te.city,
      slug,
      city: te.city,
      date: te.date,
      time: te.time,
      location_name: te.location,
      ticket_link: te.ticketLink,
      sold_out: te.soldOut,
      status: "draft",
      tag: "Konzert",
      info_sections: [
        { id: "eventinfo", title: "Eventinformationen", content: "auto-eventinfo" },
        { id: "einlass", title: "Einlassinformationen", content: "Einlass ab 20:00 Uhr.\nDer Eintritt ist nur mit einem gültigen Ticket möglich.\nBitte halte deinen QR-Code bereit.\n\nMindestalter: 16 Jahre (mit Muttizettel ab 14 Jahre)." },
        { id: "whatsapp", title: "Freikarten & mehr", content: "whatsapp" },
        { id: "weitere-staedte", title: "Weitere Städte", content: "weitere-staedte" },
      ],
    } as any);
    if (error) {
      toast.error("Import fehlgeschlagen: " + error.message);
    } else {
      toast.success(`${te.city} importiert (als Entwurf)`);
      onReload();
    }
    setImporting(prev => { const n = new Set(prev); n.delete(idx); return n; });
  };

  const updateEventDate = async (eventId: string, newDate: string) => {
    const { error } = await supabase.from("events").update({ date: newDate }).eq("id", eventId);
    if (error) {
      toast.error("Datum-Update fehlgeschlagen");
    } else {
      toast.success("Datum aktualisiert");
      onReload();
    }
  };

  const tabs = [
    { key: "missing" as const, label: "Nur bei Ticket.io", count: result?.onlyTio.length || 0, color: "hsl(200 80% 55%)" },
    { key: "extra" as const, label: "Nicht bei Ticket.io", count: result?.notOnTio.length || 0, color: "hsl(45 90% 55%)" },
    { key: "date" as const, label: "Falsches Datum", count: result?.dateMismatch.length || 0, color: "hsl(0 70% 55%)" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "hsl(0 0% 0% / 0.7)" }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col" style={{ background: "hsl(220 50% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)", boxShadow: "0 20px 60px hsl(0 0% 0% / 0.6)" }}>
        {/* Header */}
        <div className="p-5 flex items-center justify-between flex-shrink-0" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(200 80% 55% / 0.15)" }}>
              <RefreshCw className="w-4 h-4" style={{ color: "hsl(200 80% 55%)" }} />
            </div>
            <h2 className="text-base font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)" }}>Ticket.io Sync</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.4)" }} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {phase === "scanning" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <RefreshCw className="w-10 h-10" style={{ color: "hsl(200 80% 55%)" }} />
              </motion.div>
              <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Scanne Ticket.io...</p>
              <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Events werden abgeglichen</p>
            </div>
          )}

          {phase === "results" && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <AlertTriangle className="w-10 h-10" style={{ color: "hsl(0 70% 55%)" }} />
              <p className="text-sm font-bold" style={{ color: "hsl(0 70% 55%)" }}>Fehler beim Scan</p>
              <p className="text-xs text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{error}</p>
              <button onClick={runSync} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(200 80% 55% / 0.15)", color: "hsl(200 80% 55%)" }}>
                Erneut versuchen
              </button>
            </div>
          )}

          {phase === "results" && result && !error && (
            <>
              {/* Summary */}
              <div className="rounded-xl p-4 mb-5 flex items-center gap-4 flex-wrap" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" style={{ color: "hsl(142 70% 55%)" }} />
                  <span className="text-sm" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                    <strong style={{ color: "hsl(0 0% 100%)" }}>{tioEvents.length}</strong> Events gescannt
                  </span>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 55%)" }}>
                  ✅ {result.matched} übereinstimmend
                </span>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "hsl(200 80% 55% / 0.15)", color: "hsl(200 80% 55%)" }}>
                  📥 {result.onlyTio.length} nur bei TIO
                </span>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "hsl(45 90% 50% / 0.15)", color: "hsl(45 90% 55%)" }}>
                  ⚠️ {result.notOnTio.length} nicht bei TIO
                </span>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>
                  📅 {result.dateMismatch.length} Datum-Abweichung
                </span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 rounded-xl p-1" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                    style={{
                      background: activeTab === tab.key ? `${tab.color.replace(")", " / 0.15)")}` : "transparent",
                      color: activeTab === tab.key ? tab.color : "hsl(0 0% 100% / 0.4)",
                      border: activeTab === tab.key ? `1px solid ${tab.color.replace(")", " / 0.3)")}` : "1px solid transparent",
                    }}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Tab: Only on Ticket.io */}
              {activeTab === "missing" && (
                <div className="space-y-2">
                  {result.onlyTio.length === 0 ? (
                    <p className="text-sm py-8 text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Alle Ticket.io Events sind bei uns angelegt ✅</p>
                  ) : result.onlyTio.map((te, i) => (
                    <div key={i} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{te.city}</span>
                          <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{te.date} · {te.time}</span>
                          {te.soldOut && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>Ausverkauft</span>}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{te.location}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {te.ticketLink && (
                          <a href={te.ticketLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => importEvent(te, i)}
                          disabled={importing.has(i)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                          style={{ background: "hsl(200 80% 55% / 0.15)", color: "hsl(200 80% 55%)", border: "1px solid hsl(200 80% 55% / 0.3)" }}
                        >
                          <Import className="w-3.5 h-3.5" />
                          {importing.has(i) ? "..." : "Importieren"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Not on Ticket.io */}
              {activeTab === "extra" && (
                <div className="space-y-2">
                  {result.notOnTio.length === 0 ? (
                    <p className="text-sm py-8 text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Alle unsere Events sind bei Ticket.io gelistet ✅</p>
                  ) : result.notOnTio.map((ev) => (
                    <div key={ev.id} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(45 90% 50% / 0.15)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{ev.city || "?"}</span>
                          <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{ev.date} · {ev.time}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(45 90% 50% / 0.15)", color: "hsl(45 90% 55%)" }}>
                            Nicht bei TIO
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{ev.title} · {ev.location_name}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => { onClose(); setTimeout(() => document.dispatchEvent(new CustomEvent("edit-event", { detail: ev })), 100); }} className="p-2 rounded-lg hover:bg-white/5" title="Event bearbeiten" style={{ color: "hsl(45 90% 55%)" }}>
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Date mismatch */}
              {activeTab === "date" && (
                <div className="space-y-2">
                  {result.dateMismatch.length === 0 ? (
                    <p className="text-sm py-8 text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Datum-Abweichungen gefunden ✅</p>
                  ) : result.dateMismatch.map(({ ours, tio }, i) => (
                    <div key={i} className="rounded-xl p-4" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 70% 50% / 0.15)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{tio.city}</span>
                        <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{ours.location_name || tio.location}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" style={{ color: "hsl(0 70% 55%)" }} />
                          <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Bei uns:</span>
                          <span className="text-xs font-bold" style={{ color: "hsl(0 70% 55%)" }}>{ours.date}</span>
                        </div>
                        <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.2)" }}>→</span>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" style={{ color: "hsl(200 80% 55%)" }} />
                          <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Bei TIO:</span>
                          <span className="text-xs font-bold" style={{ color: "hsl(200 80% 55%)" }}>{tio.date}</span>
                        </div>
                        <button
                          onClick={() => updateEventDate(ours.id, tio.date)}
                          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{ background: "hsl(200 80% 55% / 0.15)", color: "hsl(200 80% 55%)", border: "1px solid hsl(200 80% 55% / 0.3)" }}
                        >
                          <Check className="w-3.5 h-3.5" /> Auf TIO-Datum setzen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const COLLAPSE_STORAGE_KEY = "admin_events_collapsed";

const loadCollapsedState = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
};

const saveCollapsedState = (state: Record<string, boolean>) => {
  try { localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(state)); } catch {}
};

const EventsAdmin = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [seriesMap, setSeriesMap] = useState<Record<string, string>>({});
  const [seriesCityMap, setSeriesCityMap] = useState<Record<string, string | null>>({});
  const [editing, setEditing] = useState<Partial<EventRow> | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsedState());
  const [search, setSearch] = useState("");
  const [eventStats, setEventStats] = useState<Record<string, { ticketsSold: number; revenue: number }>>({});
  const [activeTab, setActiveTab] = useState<"published" | "draft" | "past">("published");
  const [filterOpenAir, setFilterOpenAir] = useState(false);
  const [filterSoldOut, setFilterSoldOut] = useState<"all" | "hide" | "only">("all");
  const [bulkEditSource, setBulkEditSource] = useState<EventRow | null>(null);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [showTioSync, setShowTioSync] = useState(false);

  const loadEventStats = async (eventIds: string[]) => {
    if (!eventIds.length) return;
    const [ticketsRes, ordersRes] = await Promise.all([
      supabase.from("tickets").select("event_id").in("event_id", eventIds),
      supabase.from("orders").select("event_id, total_amount, status").in("event_id", eventIds).eq("status", "paid"),
    ]);
    const stats: Record<string, { ticketsSold: number; revenue: number }> = {};
    eventIds.forEach(id => { stats[id] = { ticketsSold: 0, revenue: 0 }; });
    (ticketsRes.data || []).forEach(t => {
      if (stats[t.event_id]) stats[t.event_id].ticketsSold++;
    });
    (ordersRes.data || []).forEach(o => {
      if (o.event_id && stats[o.event_id]) stats[o.event_id].revenue += Number(o.total_amount);
    });
    setEventStats(stats);
  };

  const load = async () => {
    const [eventsRes, seriesRes] = await Promise.all([
      supabase.from("events").select("*").order("sort_order"),
      supabase.from("event_series").select("id, title, city").order("title"),
    ]);
    const loadedEvents = (eventsRes.data as unknown as EventRow[]) || [];
    setEvents(loadedEvents);
    const options = (seriesRes.data as SeriesOption[]) || [];
    setSeriesOptions(options);
    const map: Record<string, string> = {};
    const cityMap: Record<string, string | null> = {};
    options.forEach((s) => { map[s.id] = s.title; cityMap[s.id] = (s as any).city || null; });
    setSeriesMap(map);
    setSeriesCityMap(cityMap);
    setLoading(false);
    loadEventStats(loadedEvents.map(e => e.id));
  };

  const loadTickets = () => {
    if (editing?.id) {
      supabase.from("ticket_categories").select("*").eq("event_id", editing.id).order("sort_order")
        .then(({ data }) => setTickets((data as TicketRow[]) || []));
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadTickets(); setTickets([]); }, [editing?.id]);

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing as EventRow;
    if (!rest.title || !rest.slug) { toast.error("Titel und Slug sind Pflichtfelder"); return; }
    if (id) {
      const { error } = await supabase.from("events").update(rest as any).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Event aktualisiert");
    } else {
      const { data, error } = await supabase.from("events").insert(rest as any).select().single();
      if (error) { toast.error(error.message); return; }
      toast.success("Event erstellt");
      // Stay in edit mode with the new ID so tickets can be added
      setEditing(data as unknown as EventRow);
      load();
      return;
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Event wirklich löschen?")) return;
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event gelöscht");
    setEditing(null);
    load();
  };

  const toggleStatus = async (event: EventRow) => {
    const newStatus = event.status === "published" ? "draft" : "published";
    await supabase.from("events").update({ status: newStatus }).eq("id", event.id);
    toast.success(newStatus === "published" ? "Veröffentlicht" : "Auf Entwurf gesetzt");
    load();
  };

  const duplicateEvent = async (event: EventRow) => {
    // 1. Duplicate event as draft
    const { id, ...rest } = event;
    const dupEvent = {
      ...rest,
      title: `${rest.title} (Kopie)`,
      slug: `${rest.slug}-kopie-${Date.now()}`,
      status: "draft",
    };
    const { data: newEvent, error } = await supabase.from("events").insert(dupEvent as any).select().single();
    if (error || !newEvent) { toast.error("Duplizieren fehlgeschlagen: " + (error?.message || "")); return; }

    // 2. Duplicate ticket categories with proportional sale dates
    const { data: ticketCats } = await supabase.from("ticket_categories").select("*").eq("event_id", id);
    if (ticketCats && ticketCats.length > 0) {
      const oldEventDate = event.date ? new Date(event.date).getTime() : null;
      const newEventDate = dupEvent.date ? new Date(dupEvent.date).getTime() : null;
      const dateShift = oldEventDate && newEventDate ? newEventDate - oldEventDate : 0;

      const newTickets = ticketCats.map((tc: any) => {
        const { id: _tid, created_at, updated_at, ...ticketRest } = tc;
        let { sale_start, sale_end } = ticketRest;
        if (dateShift !== 0) {
          if (sale_start) sale_start = new Date(new Date(sale_start).getTime() + dateShift).toISOString();
          if (sale_end) sale_end = new Date(new Date(sale_end).getTime() + dateShift).toISOString();
        }
        return { ...ticketRest, event_id: (newEvent as any).id, sale_start, sale_end };
      });
      await supabase.from("ticket_categories").insert(newTickets);
    }

    toast.success("Event dupliziert – öffne Entwurf");
    await load();
    setEditing(newEvent as unknown as EventRow);
  };

  if (editing) {
    return (
      <>
        <EventEditView
          editing={editing}
          setEditing={(e) => setEditing(e)}
          seriesOptions={seriesOptions}
          tickets={tickets}
          onSave={save}
          onDelete={editing.id ? () => remove(editing.id!) : undefined}
          onBack={() => setEditing(null)}
          onReloadTickets={loadTickets}
          onSeriesCreated={load}
          onBulkEdit={editing.id ? () => setBulkEditSource(editing as EventRow) : undefined}
        />
        <AnimatePresence>
          {bulkEditSource && (
            <BulkEditDialog
              sourceEvent={bulkEditSource}
              allEvents={events}
              seriesOptions={seriesOptions}
              seriesMap={seriesMap}
              onClose={() => setBulkEditSource(null)}
              onComplete={load}
            />
          )}
        </AnimatePresence>
      </>
    );
  }
  const today = new Date().toISOString().split("T")[0];
  const isSearching = !!search.trim();

  // Tab filter
  const tabFiltered = events.filter((e) => {
    if (activeTab === "published") return e.status === "published" && (!e.date || e.date >= today);
    if (activeTab === "draft") return e.status === "draft";
    if (activeTab === "past") return e.status === "published" && e.date && e.date < today;
    return true;
  });

  const tabCounts = {
    published: events.filter((e) => e.status === "published" && (!e.date || e.date >= today)).length,
    draft: events.filter((e) => e.status === "draft").length,
    past: events.filter((e) => e.status === "published" && e.date && e.date < today).length,
  };

  // Apply extra filters
  const extraFiltered = tabFiltered.filter((e) => {
    if (filterOpenAir && !e.open_air) return false;
    if (filterSoldOut === "hide" && e.sold_out) return false;
    if (filterSoldOut === "only" && !e.sold_out) return false;
    return true;
  });

  const filteredEvents = isSearching
    ? extraFiltered.filter((e) => {
        const q = search.toLowerCase();
        const city = e.series_id ? seriesCityMap[e.series_id] : e.city;
        const country = getCountry(city || null);
        return (
          e.title.toLowerCase().includes(q) ||
          (e.city || "").toLowerCase().includes(q) ||
          (e.tag || "").toLowerCase().includes(q) ||
          (e.slug || "").toLowerCase().includes(q) ||
          country.toLowerCase().includes(q) ||
          (e.series_id && (seriesMap[e.series_id] || "").toLowerCase().includes(q))
        );
      })
    : extraFiltered;

  // Build hierarchy: Country → City → Series → Events
  interface HSeriesGroup { seriesId: string | null; seriesTitle: string; events: EventRow[] }
  interface HCityGroup { city: string; seriesGroups: HSeriesGroup[] }
  interface HCountryGroup { country: string; cityGroups: HCityGroup[] }

  const countryAcc: Record<string, Record<string, Record<string, HSeriesGroup>>> = {};

  for (const event of filteredEvents) {
    const city = event.series_id ? (seriesCityMap[event.series_id] || event.city || "Unbekannt") : (event.city || "Unbekannt");
    const country = getCountry(city);
    const seriesKey = event.series_id || "__none__";
    const seriesTitle = event.series_id ? (seriesMap[event.series_id] || "Unbekannte Serie") : "Ohne Serie";

    if (!countryAcc[country]) countryAcc[country] = {};
    if (!countryAcc[country][city]) countryAcc[country][city] = {};
    if (!countryAcc[country][city][seriesKey]) countryAcc[country][city][seriesKey] = { seriesId: event.series_id, seriesTitle, events: [] };
    countryAcc[country][city][seriesKey].events.push(event);
  }

  const hierarchyData: HCountryGroup[] = Object.entries(countryAcc).map(([country, cities]) => ({
    country,
    cityGroups: Object.entries(cities).map(([city, seriesObj]) => ({
      city,
      seriesGroups: Object.values(seriesObj).sort((a, b) => a.seriesTitle.localeCompare(b.seriesTitle, "de")),
    })).sort((a, b) => a.city.localeCompare(b.city, "de")),
  }));

  hierarchyData.sort((a, b) => {
    if (a.country === "Deutschland") return -1;
    if (b.country === "Deutschland") return 1;
    return a.country.localeCompare(b.country, "de");
  });

  // When searching, override collapse: everything is expanded
  const isCollapsed = (key: string) => isSearching ? false : collapsed[key] !== false;

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !isCollapsed(key) };
      saveCollapsedState(next);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>Events</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowTioSync(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(200 80% 55% / 0.15)", color: "hsl(200 80% 55%)", border: "1px solid hsl(200 80% 55% / 0.3)" }}>
            <RefreshCw className="w-4 h-4" /> Ticket.io Sync
          </button>
          <button onClick={() => setShowBulkAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(270 60% 55% / 0.15)", color: "hsl(270 60% 55%)", border: "1px solid hsl(270 60% 55% / 0.3)" }}>
            <LayoutGrid className="w-4 h-4" /> Bulk Add
          </button>
          <button onClick={() => setEditing({ ...emptyEvent })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
            <Plus className="w-4 h-4" /> Neues Event
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Event, Stadt oder Serie suchen..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1"
          style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", caretColor: "hsl(330 80% 55%)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10">
            <X className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
        <button
          onClick={() => setFilterOpenAir(!filterOpenAir)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          style={{
            background: filterOpenAir ? "hsl(45 90% 50% / 0.15)" : "hsl(0 0% 100% / 0.06)",
            color: filterOpenAir ? "hsl(45 90% 55%)" : "hsl(0 0% 100% / 0.4)",
            border: `1px solid ${filterOpenAir ? "hsl(45 90% 50% / 0.3)" : "hsl(0 0% 100% / 0.1)"}`,
          }}
        >
          <Sun className="w-3 h-3" /> Nur Open Air
        </button>
        <button
          onClick={() => setFilterSoldOut(filterSoldOut === "hide" ? "all" : "hide")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          style={{
            background: filterSoldOut === "hide" ? "hsl(0 70% 50% / 0.15)" : "hsl(0 0% 100% / 0.06)",
            color: filterSoldOut === "hide" ? "hsl(0 70% 55%)" : "hsl(0 0% 100% / 0.4)",
            border: `1px solid ${filterSoldOut === "hide" ? "hsl(0 70% 50% / 0.3)" : "hsl(0 0% 100% / 0.1)"}`,
          }}
        >
          <XCircle className="w-3 h-3" /> Ausverkaufte ausblenden
        </button>
        <button
          onClick={() => setFilterSoldOut(filterSoldOut === "only" ? "all" : "only")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          style={{
            background: filterSoldOut === "only" ? "hsl(0 70% 50% / 0.15)" : "hsl(0 0% 100% / 0.06)",
            color: filterSoldOut === "only" ? "hsl(0 70% 55%)" : "hsl(0 0% 100% / 0.4)",
            border: `1px solid ${filterSoldOut === "only" ? "hsl(0 70% 50% / 0.3)" : "hsl(0 0% 100% / 0.1)"}`,
          }}
        >
          <XCircle className="w-3 h-3" /> Nur Ausverkaufte
        </button>
        {(filterOpenAir || filterSoldOut !== "all") && (
          <button
            onClick={() => { setFilterOpenAir(false); setFilterSoldOut("all"); }}
            className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg transition-all hover:bg-white/10"
            style={{ color: "hsl(330 80% 55%)" }}
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 rounded-xl p-1" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
        {([
          { key: "published" as const, label: "Veröffentlicht", count: tabCounts.published },
          { key: "draft" as const, label: "Entwurf", count: tabCounts.draft },
          { key: "past" as const, label: "Vergangen", count: tabCounts.past },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              background: activeTab === tab.key ? "hsl(330 80% 50% / 0.15)" : "transparent",
              color: activeTab === tab.key ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)",
              border: activeTab === tab.key ? "1px solid hsl(330 80% 50% / 0.3)" : "1px solid transparent",
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</p>
      ) : events.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <p className="text-sm mb-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Noch keine Events vorhanden</p>
          <button onClick={() => setEditing({ ...emptyEvent })} className="text-sm font-bold" style={{ color: "hsl(330 80% 55%)" }}>Jetzt erstes Event erstellen</button>
        </div>
      ) : filteredEvents.length === 0 && isSearching ? (
        <p className="text-sm py-8 text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Events gefunden</p>
      ) : (
        <div className="space-y-8">
          {sortedCountries.map((country) => {
            const countryKey = `country__${country}`;
            const countryEventCount = countryGroups[country].reduce((sum, g) => sum + g.events.length, 0);
            return (
              <div key={country}>
                <button onClick={() => toggleCollapse(countryKey)} className="flex items-center gap-2 mb-4 w-full text-left">
                  <Globe className="w-4 h-4" style={{ color: "hsl(200 70% 55%)" }} />
                  <span className="text-sm font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{country} ({countryEventCount})</span>
                  {isCollapsed(countryKey) ? <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }} /> : <ChevronDown className="w-4 h-4 ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }} />}
                </button>
                <AnimatePresence initial={false}>
                  {!isCollapsed(countryKey) && (
                    <motion.div className="space-y-4 pl-4 overflow-hidden" style={{ borderLeft: "2px solid hsl(200 70% 55% / 0.2)" }} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      {countryGroups[country].map((group) => (
                        <div key={group.seriesId || "none"}>
                          <button onClick={() => toggleCollapse(group.seriesId || "__none__")} className="flex items-center gap-2 mb-3 w-full text-left group">
                            {group.seriesId && <Layers className="w-4 h-4" style={{ color: "hsl(270 60% 55%)" }} />}
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{group.seriesTitle} ({group.events.length})</span>
                            {isCollapsed(group.seriesId || "__none__") ? <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }} /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }} />}
                          </button>
                          <AnimatePresence initial={false}>
                            {!isCollapsed(group.seriesId || "__none__") && (
                              <motion.div className="space-y-2 overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                {group.events.map((event) => (
                                  <div key={event.id} className="rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:border-white/15" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }} onClick={() => setEditing(event)}>
                                    {event.image_url && <img src={event.image_url} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>
                                          {event.date || "Kein Datum"}{event.location_name ? ` · ${event.location_name}` : ""}{event.city ? `, ${event.city}` : ""}
                                        </span>
                                        {event.highlight && <Star className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(45 80% 55%)" }} />}
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: event.status === "published" ? "hsl(142 70% 45% / 0.15)" : "hsl(0 0% 100% / 0.08)", color: event.status === "published" ? "hsl(142 70% 55%)" : "hsl(0 0% 100% / 0.4)" }}>
                                          {event.status}
                                        </span>
                                        {event.open_air && (
                                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "hsl(45 90% 50% / 0.15)", color: "hsl(45 90% 55%)" }}>
                                            ☀️ Open Air
                                          </span>
                                        )}
                                        {event.sold_out && (
                                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>
                                            Ausverkauft
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                        <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{event.title}{event.tag ? ` · ${event.tag}` : ""}</span>
                                        {eventStats[event.id] && (
                                          <>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(200 80% 55% / 0.12)", color: "hsl(200 80% 60%)" }}>
                                              🎟 {eventStats[event.id].ticketsSold}
                                            </span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(142 70% 45% / 0.12)", color: "hsl(142 70% 55%)" }}>
                                              💰 {eventStats[event.id].revenue.toFixed(2)} €
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <button onClick={() => setBulkEditSource(event)} className="p-2 rounded-lg hover:bg-white/5" title="Bulk Edit" style={{ color: "hsl(270 60% 55%)" }}>
                                        <Send className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => duplicateEvent(event)} className="p-2 rounded-lg hover:bg-white/5" title="Event duplizieren" style={{ color: "hsl(200 80% 60%)" }}>
                                        <Copy className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => toggleStatus(event)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                                        {event.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                      <button onClick={() => remove(event.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {bulkEditSource && !editing && (
          <BulkEditDialog
            sourceEvent={bulkEditSource}
            allEvents={events}
            seriesOptions={seriesOptions}
            seriesMap={seriesMap}
            onClose={() => setBulkEditSource(null)}
            onComplete={load}
          />
        )}
      </AnimatePresence>

      {/* Bulk Add Dialog */}
      <AnimatePresence>
        {showBulkAdd && (
          <BulkAddDialog events={events} onClose={() => setShowBulkAdd(false)} onComplete={load} />
        )}
      </AnimatePresence>

      {/* Ticket.io Sync Dialog */}
      <AnimatePresence>
        {showTioSync && (
          <TioSyncDialog events={events} onClose={() => setShowTioSync(false)} onReload={load} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventsAdmin;
