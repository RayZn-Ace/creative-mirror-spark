import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Ticket, Plus, X, Upload, Eye, Type, Image, ListChecks, GripVertical, ChevronUp, ChevronDown, Sparkles } from "lucide-react";

/* ─── Types ─── */
interface ContentBlock {
  id: string;
  type: "text" | "image" | "info_list";
  enabled: boolean;
  // text block
  text?: string;
  font_size?: "sm" | "md" | "lg";
  bold?: boolean;
  // image block
  image_url?: string;
  image_width?: number; // percentage 10-100
  // info list
  items?: string[];
  list_title?: string;
}

interface GradientConfig {
  enabled: boolean;
  type: "linear" | "radial";
  angle: number; // 0-360 for linear
  color_from: string;
  color_to: string;
}

interface CategoryOverride {
  accent_color: string;
  gradient: GradientConfig;
  background_color?: string;
  text_color?: string;
}

interface CategoryDesign {
  key: string;
  label: string;
  emoji: string;
  override: CategoryOverride;
}

interface TicketTemplate {
  format: "din_lang" | "a4";
  background_color: string;
  accent_color: string;
  text_color: string;
  gradient: GradientConfig;
  show_event_title: boolean;
  show_date: boolean;
  show_time: boolean;
  show_location: boolean;
  show_address: boolean;
  show_category: boolean;
  show_holder_name: boolean;
  show_qr_code: boolean;
  logo_url: string;
  magic_ticket_enabled: boolean;
  magic_ticket_blur: number;
  magic_ticket_opacity: number;
  background_image_opacity: number;
  sponsors: Array<{ type: "image" | "text"; value: string }>;
  content_blocks: ContentBlock[];
  category_overrides?: Record<string, CategoryOverride>;
  category_designs?: CategoryDesign[];
}

const DEFAULT_CATEGORY_DESIGNS: CategoryDesign[] = [
  { key: "REGULAR", label: "Regular", emoji: "🟢", override: { accent_color: "#22c55e", gradient: { enabled: true, type: "linear", angle: 150, color_from: "#020d02", color_to: "#052e16" }, background_color: "#020d02", text_color: "#dcfce7" } },
  { key: "DELUXE", label: "Deluxe", emoji: "🔵", override: { accent_color: "#38bdf8", gradient: { enabled: true, type: "linear", angle: 160, color_from: "#0a1628", color_to: "#164e63" }, background_color: "#0a1628", text_color: "#e0f2fe" } },
  { key: "PREMIUM", label: "Premium", emoji: "👑", override: { accent_color: "#d4a030", gradient: { enabled: true, type: "radial", angle: 0, color_from: "#1a1610", color_to: "#2a2010" }, background_color: "#1a1610", text_color: "#f5f0e0" } },
  { key: "FAN", label: "Fan", emoji: "💖", override: { accent_color: "#d9338a", gradient: { enabled: true, type: "linear", angle: 135, color_from: "#14041a", color_to: "#2a0a20" }, background_color: "#14041a", text_color: "#fce7f3" } },
];

const defaultGradient: GradientConfig = { enabled: false, type: "linear", angle: 135, color_from: "#14141e", color_to: "#2a1a3e" };

const defaultTemplate: TicketTemplate = {
  format: "din_lang",
  background_color: "#14141e",
  accent_color: "#d9338a",
  text_color: "#ffffff",
  gradient: { ...defaultGradient },
  show_event_title: true,
  show_date: true,
  show_time: true,
  show_location: true,
  show_address: true,
  show_category: true,
  show_holder_name: true,
  show_qr_code: true,
  logo_url: "",
  magic_ticket_enabled: false,
  magic_ticket_blur: 20,
  magic_ticket_opacity: 40,
  background_image_opacity: 40,
  sponsors: [],
  content_blocks: [],
  category_overrides: {},
  category_designs: [...DEFAULT_CATEGORY_DESIGNS],
};

const uid = () => Math.random().toString(36).slice(2, 9);

/* ─── 8 Presets ─── */
const PRESETS: Array<{ name: string; template: Partial<TicketTemplate> }> = [
  { name: "Dunkel Classic", template: { background_color: "#14141e", accent_color: "#d9338a", text_color: "#ffffff", gradient: { enabled: false, type: "linear", angle: 135, color_from: "#14141e", color_to: "#14141e" } } },
  { name: "Neon Glow", template: { background_color: "#0a0014", accent_color: "#ff2d95", text_color: "#ffffff", gradient: { enabled: true, type: "linear", angle: 160, color_from: "#0a0014", color_to: "#1a0a3a" } } },
  { name: "Ocean Fade", template: { background_color: "#0a1628", accent_color: "#38bdf8", text_color: "#e0f2fe", gradient: { enabled: true, type: "linear", angle: 180, color_from: "#0c1a30", color_to: "#164e63" } } },
  { name: "Sunset Vibes", template: { background_color: "#1a0a0e", accent_color: "#f97316", text_color: "#fff7ed", gradient: { enabled: true, type: "linear", angle: 135, color_from: "#1a0a0e", color_to: "#451a03" } } },
  { name: "Gold Premium", template: { background_color: "#1a1610", accent_color: "#d4a030", text_color: "#f5f0e0", gradient: { enabled: true, type: "radial", angle: 0, color_from: "#1a1610", color_to: "#2a2010" } } },
  { name: "Minimalist Hell", template: { background_color: "#f5f5f5", accent_color: "#1a1a1a", text_color: "#1a1a1a", gradient: { enabled: false, type: "linear", angle: 135, color_from: "#f5f5f5", color_to: "#f5f5f5" } } },
  { name: "Neon Grün", template: { background_color: "#020d02", accent_color: "#22c55e", text_color: "#dcfce7", gradient: { enabled: true, type: "linear", angle: 150, color_from: "#020d02", color_to: "#052e16" } } },
  { name: "Purple Haze", template: { background_color: "#0f0020", accent_color: "#a855f7", text_color: "#f3e8ff", gradient: { enabled: true, type: "linear", angle: 135, color_from: "#0f0020", color_to: "#1e1040" } } },
];


const FORMATS = [
  { id: "din_lang" as const, label: "DIN Lang (Hartticket)", desc: "210 × 99 mm" },
  { id: "a4" as const, label: "A4 (Druckbar)", desc: "210 × 297 mm" },
];

const TEXT_BLOCKS = [
  { key: "show_event_title" as const, label: "Event-Titel" },
  { key: "show_date" as const, label: "Datum" },
  { key: "show_time" as const, label: "Uhrzeit" },
  { key: "show_location" as const, label: "Location" },
  { key: "show_address" as const, label: "Adresse" },
  { key: "show_category" as const, label: "Kategorie" },
  { key: "show_holder_name" as const, label: "Teilnehmername" },
  { key: "show_qr_code" as const, label: "QR-Code" },
];

const sectionStyle = {
  background: "hsl(0 0% 100% / 0.03)",
  border: "1px solid hsl(0 0% 100% / 0.06)",
  borderRadius: "16px",
  padding: "24px",
};
const labelStyle = { color: "hsl(0 0% 100% / 0.5)", fontSize: "12px", fontWeight: 600 as const, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: "6px", display: "block" };

/* ─── Gradient CSS helper ─── */
const gradientCSS = (g: GradientConfig, fallback: string) => {
  if (!g.enabled) return fallback;
  if (g.type === "radial") return `radial-gradient(circle at center, ${g.color_from}, ${g.color_to})`;
  return `linear-gradient(${g.angle}deg, ${g.color_from}, ${g.color_to})`;
};

const DEMO_EVENT_IMAGE = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80";

const normalizeSeriesText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const resolveSeriesPreviewImage = (
  seriesId: string,
  eventSeries: Array<{ id: string; title: string; image_url: string | null }>,
  eventsMap: Record<string, { image_url: string | null; title: string; series_id: string | null }>
): string | null => {
  const series = eventSeries.find((s) => s.id === seriesId);

  if (series?.image_url) return series.image_url;

  const bySeriesLink = Object.values(eventsMap).find(
    (e) => e.series_id === seriesId && !!e.image_url
  )?.image_url;
  if (bySeriesLink) return bySeriesLink;

  if (series?.title) {
    const normalizedTitle = normalizeSeriesText(series.title);
    const bySeriesTitle = Object.values(eventsMap).find(
      (e) => !!e.image_url && normalizeSeriesText(e.title).includes(normalizedTitle)
    )?.image_url;
    if (bySeriesTitle) return bySeriesTitle;
  }

  return null;
};

/* ─── Ticket Preview ─── */
const TicketPreview = ({ tpl, previewImageUrl, previewCategoryName }: { tpl: TicketTemplate; previewImageUrl?: string; previewCategoryName?: string }) => {
  const isDinLang = tpl.format === "din_lang";
  const aspectStyle = isDinLang
    ? { width: "100%", maxWidth: "480px", aspectRatio: "210/99" }
    : { width: "100%", maxWidth: "320px", aspectRatio: "210/297" };

  const textCol = tpl.text_color || "#ffffff";
  const bg = tpl.gradient.enabled ? gradientCSS(tpl.gradient, tpl.background_color) : tpl.background_color;

  return (
    <div style={{ ...aspectStyle, borderRadius: "12px", overflow: "hidden", position: "relative", boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)", display: "flex", flexDirection: "column" }}>
      {/* Accent bar – full width across both sides */}
      <div style={{ height: isDinLang ? "4px" : "6px", background: tpl.accent_color, position: "relative", zIndex: 2, flexShrink: 0 }} />

      {/* Body: info + qr */}
      <div style={{ flex: 1, display: "flex", flexDirection: isDinLang ? "row" : "column", minHeight: 0 }}>
        {/* Left / Info side */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: bg, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Blurred background image (Magic Ticket) – only on info side */}
          {tpl.magic_ticket_enabled && previewImageUrl && (
            <div
              key={`magic-bg-${tpl.magic_ticket_blur}-${tpl.magic_ticket_opacity}`}
              style={{
                position: "absolute", inset: 0, zIndex: 0,
                backgroundImage: `url(${previewImageUrl})`,
                backgroundSize: "cover", backgroundPosition: "center",
                filter: `blur(${tpl.magic_ticket_blur ?? 20}px)`,
                opacity: (tpl.magic_ticket_opacity ?? 40) / 100,
                transform: "scale(1.15)",
              }}
            />
          )}
          <div style={{ padding: isDinLang ? "12px 16px" : "24px 28px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1, minWidth: 0 }}>
            {tpl.logo_url && (
              <div style={{ marginBottom: "6px" }}>
                <div style={{ width: isDinLang ? "32px" : "48px", height: isDinLang ? "32px" : "48px", borderRadius: "6px", background: `${tpl.accent_color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: tpl.accent_color, fontWeight: 700 }}>LOGO</div>
              </div>
            )}
            <div style={{ fontSize: isDinLang ? "7px" : "9px", fontWeight: 800, letterSpacing: "2px", color: tpl.accent_color, textTransform: "uppercase", marginBottom: "2px" }}>TICKET</div>
            {tpl.show_event_title && <div style={{ fontSize: isDinLang ? "10px" : "14px", fontWeight: 800, color: tpl.accent_color, textTransform: "uppercase", lineHeight: 1.1, marginBottom: "6px" }}>EXAMPLE EVENT</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {tpl.show_date && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>DATUM</span> 15.03.2026</div>}
              {tpl.show_time && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>UHRZEIT</span> 22:00 Uhr</div>}
              {tpl.show_location && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>ORT</span> Baggi / Osho</div>}
              {tpl.show_address && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>ADRESSE</span> Musterstr. 1</div>}
              {tpl.show_category && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>KATEGORIE</span> {previewCategoryName || "Early Bird"}</div>}
              {tpl.show_holder_name && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>NAME</span> Max Mustermann</div>}
            </div>

            {/* Content Blocks Preview */}
            {tpl.content_blocks.filter(b => b.enabled).map((block) => (
              <div key={block.id} style={{ marginTop: "4px" }}>
                {block.type === "text" && (
                  <div style={{ fontSize: block.font_size === "lg" ? (isDinLang ? "8px" : "11px") : block.font_size === "md" ? (isDinLang ? "7px" : "9px") : (isDinLang ? "6px" : "8px"), fontWeight: block.bold ? 700 : 400, color: textCol, opacity: 0.85, lineHeight: 1.3 }}>
                    {block.text || "Text…"}
                  </div>
                )}
                {block.type === "image" && (
                  <div style={{ width: `${block.image_width || 60}%`, maxWidth: isDinLang ? "60px" : "100px", height: isDinLang ? "16px" : "28px", borderRadius: "3px", background: `${tpl.accent_color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "5px", color: tpl.accent_color, fontWeight: 700, textTransform: "uppercase" }}>Bild</span>
                  </div>
                )}
                {block.type === "info_list" && (
                  <div style={{ borderLeft: `2px solid ${tpl.accent_color}55`, paddingLeft: "4px" }}>
                    {block.list_title && <div style={{ fontSize: isDinLang ? "5px" : "7px", fontWeight: 700, color: tpl.accent_color, textTransform: "uppercase", marginBottom: "1px" }}>{block.list_title}</div>}
                    {(block.items || []).slice(0, 3).map((item, i) => (
                      <div key={i} style={{ fontSize: isDinLang ? "5px" : "7px", color: textCol, opacity: 0.7 }}>• {item}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Sponsors */}
            {tpl.sponsors.length > 0 && (
              <div style={{ marginTop: "auto", paddingTop: "6px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                {tpl.sponsors.map((s, i) => (
                  <span key={i} style={{ fontSize: "6px", color: textCol, opacity: 0.4, textTransform: "uppercase" }}>{s.type === "text" ? s.value : "📷 Sponsor"}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* QR section – solid background, no blur */}
        {tpl.show_qr_code && (
          <div style={{
            background: bg,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: isDinLang ? "12px 16px" : "20px 24px",
            ...(isDinLang ? { borderLeft: `1px dashed ${textCol}33` } : { borderTop: `1px dashed ${textCol}33` }),
          }}>
            {tpl.show_category && (
              <div style={{ fontSize: isDinLang ? "6px" : "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: tpl.accent_color, marginBottom: isDinLang ? "4px" : "6px", textAlign: "center", lineHeight: 1.2 }}>{previewCategoryName || "Last Chance"}<br />Ticket</div>
            )}
            <div style={{ width: isDinLang ? "56px" : "100px", height: isDinLang ? "56px" : "100px", background: "#fff", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: isDinLang ? "46px" : "84px", height: isDinLang ? "46px" : "84px", background: `repeating-conic-gradient(#333 0% 25%, #fff 0% 50%) 50% / ${isDinLang ? "6px 6px" : "10px 10px"}`, borderRadius: "2px" }} />
            </div>
            <div style={{ fontSize: "6px", color: textCol, opacity: 0.4, marginTop: "3px", fontFamily: "monospace", letterSpacing: "1px" }}>ABCD-EFGH-IJKL</div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Content Block Editor Item ─── */
const BlockEditor = ({ block, onUpdate, onRemove, onMove, accentColor }: {
  block: ContentBlock;
  onUpdate: (b: ContentBlock) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  accentColor: string;
}) => {
  const iconMap = { text: <Type className="w-3.5 h-3.5" />, image: <Image className="w-3.5 h-3.5" />, info_list: <ListChecks className="w-3.5 h-3.5" /> };
  const labelMap = { text: "Textfeld", image: "Bild", info_list: "Info-Liste" };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `ticket-template/block-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload fehlgeschlagen"); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
    onUpdate({ ...block, image_url: urlData.publicUrl });
    toast.success("Bild hochgeladen");
  };

  return (
    <div style={{ background: block.enabled ? `${accentColor}0a` : "hsl(0 0% 100% / 0.02)", border: `1px solid ${block.enabled ? `${accentColor}33` : "hsl(0 0% 100% / 0.06)"}`, borderRadius: "12px", padding: "12px" }}>
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="w-3.5 h-3.5 cursor-grab" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
        <span style={{ color: block.enabled ? accentColor : "hsl(0 0% 100% / 0.4)" }}>{iconMap[block.type]}</span>
        <span className="text-xs font-bold flex-1" style={{ color: block.enabled ? "hsl(0 0% 100%)" : "hsl(0 0% 100% / 0.4)" }}>{labelMap[block.type]}</span>
        <div className="flex gap-1">
          <button onClick={() => onMove(-1)} className="p-0.5 rounded" style={{ color: "hsl(0 0% 100% / 0.3)" }}><ChevronUp className="w-3 h-3" /></button>
          <button onClick={() => onMove(1)} className="p-0.5 rounded" style={{ color: "hsl(0 0% 100% / 0.3)" }}><ChevronDown className="w-3 h-3" /></button>
        </div>
        <button onClick={() => onUpdate({ ...block, enabled: !block.enabled })} className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: block.enabled ? `${accentColor}22` : "hsl(0 0% 100% / 0.06)", color: block.enabled ? accentColor : "hsl(0 0% 100% / 0.3)" }}>
          {block.enabled ? "AN" : "AUS"}
        </button>
        <button onClick={onRemove}><X className="w-3.5 h-3.5" style={{ color: "hsl(0 70% 50%)" }} /></button>
      </div>

      {block.enabled && (
        <div className="space-y-2 mt-2">
          {block.type === "text" && (
            <>
              <textarea value={block.text || ""} onChange={(e) => onUpdate({ ...block, text: e.target.value })} placeholder="Text eingeben…" rows={2} className="w-full text-xs px-2.5 py-1.5 rounded-lg resize-none" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", outline: "none" }} />
              <div className="flex gap-2">
                {(["sm", "md", "lg"] as const).map(s => (
                  <button key={s} onClick={() => onUpdate({ ...block, font_size: s })} className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: block.font_size === s ? `${accentColor}22` : "hsl(0 0% 100% / 0.04)", color: block.font_size === s ? accentColor : "hsl(0 0% 100% / 0.4)" }}>
                    {s === "sm" ? "Klein" : s === "md" ? "Mittel" : "Groß"}
                  </button>
                ))}
                <button onClick={() => onUpdate({ ...block, bold: !block.bold })} className="px-2 py-0.5 rounded text-[10px] font-black" style={{ background: block.bold ? `${accentColor}22` : "hsl(0 0% 100% / 0.04)", color: block.bold ? accentColor : "hsl(0 0% 100% / 0.4)" }}>B</button>
              </div>
            </>
          )}

          {block.type === "image" && (
            <div className="space-y-2">
              {block.image_url ? (
                <div className="flex items-center gap-2">
                  <img src={block.image_url} alt="" className="h-10 rounded object-contain" style={{ background: "hsl(0 0% 100% / 0.06)" }} />
                  <button onClick={() => onUpdate({ ...block, image_url: "" })} className="text-[10px]" style={{ color: "hsl(0 70% 50%)" }}>Entfernen</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)", border: "1px dashed hsl(0 0% 100% / 0.15)" }}>
                  <Upload className="w-3.5 h-3.5" /> Bild hochladen
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
              <div>
                <label style={{ ...labelStyle, marginBottom: "2px" }}>Breite: {block.image_width || 60}%</label>
                <input type="range" min="10" max="100" value={block.image_width || 60} onChange={(e) => onUpdate({ ...block, image_width: Number(e.target.value) })} className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ background: "hsl(0 0% 100% / 0.1)" }} />
              </div>
            </div>
          )}

          {block.type === "info_list" && (
            <div className="space-y-2">
              <input type="text" value={block.list_title || ""} onChange={(e) => onUpdate({ ...block, list_title: e.target.value })} placeholder="Titel (z.B. Weitere Termine)" className="w-full text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", outline: "none" }} />
              {(block.items || []).map((item, i) => (
                <div key={i} className="flex gap-1">
                  <input type="text" value={item} onChange={(e) => { const items = [...(block.items || [])]; items[i] = e.target.value; onUpdate({ ...block, items }); }} className="flex-1 text-xs px-2 py-1 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", outline: "none" }} />
                  <button onClick={() => { const items = (block.items || []).filter((_, j) => j !== i); onUpdate({ ...block, items }); }}><X className="w-3 h-3" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></button>
                </div>
              ))}
              <button onClick={() => onUpdate({ ...block, items: [...(block.items || []), ""] })} className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg" style={{ color: accentColor, background: `${accentColor}11` }}>
                <Plus className="w-3 h-3" /> Eintrag
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const TicketTemplateAdmin = () => {
  const [tpl, setTpl] = useState<TicketTemplate>(defaultTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSponsorText, setNewSponsorText] = useState("");
  const [uploading, setUploading] = useState(false);

  // Preview selectors
  const [previewCategoryId, setPreviewCategoryId] = useState<string | null>(null);
  const [previewSeriesId, setPreviewSeriesId] = useState<string | null>(null);
  const [ticketCategories, setTicketCategories] = useState<Array<{ id: string; name: string; category_group: string | null; event_id: string }>>([]);
  const [eventSeries, setEventSeries] = useState<Array<{ id: string; title: string; image_url: string | null }>>([]);
  const [eventsMap, setEventsMap] = useState<Record<string, { image_url: string | null; title: string; series_id: string | null }>>({});
  const [cleanedImages, setCleanedImages] = useState<Record<string, string>>({});
  const [cleaningImage, setCleaningImage] = useState(false);
  const [renamingDesignKey, setRenamingDesignKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    const load = async () => {
      // Load template, categories, series, and events in parallel
      const [tplRes, catRes, seriesRes, eventsRes] = await Promise.all([
        supabase.from("settings").select("value").eq("key", "ticket_template").maybeSingle(),
        supabase.from("ticket_categories").select("id, name, category_group, event_id"),
        supabase.from("event_series").select("id, title, image_url").eq("status", "published"),
        supabase.from("events").select("id, image_url, title, series_id").eq("status", "published"),
      ]);

      if (tplRes.data?.value) {
        const raw = tplRes.data.value as any;
        setTpl({
          ...defaultTemplate,
          ...raw,
          gradient: { ...defaultGradient, ...(raw.gradient || {}) },
          content_blocks: raw.content_blocks || [],
          category_designs: raw.category_designs || [...DEFAULT_CATEGORY_DESIGNS],
        });
      }

      if (catRes.data) {
        // Only show categories from published events
        const publishedEventIds = new Set((eventsRes.data || []).map(e => e.id));
        setTicketCategories(catRes.data.filter(c => publishedEventIds.has(c.event_id)));
      }
      if (seriesRes.data) setEventSeries(seriesRes.data);
      if (eventsRes.data) {
        const map: Record<string, { image_url: string | null; title: string; series_id: string | null }> = {};
        eventsRes.data.forEach(e => { map[e.id] = { image_url: e.image_url, title: e.title, series_id: e.series_id }; });
        setEventsMap(map);
      }

      setLoading(false);
    };
    load();
  }, []);

  // Clean image via AI when series changes
  useEffect(() => {
    if (!previewSeriesId) return;

    // Resolve source image URL
    const srcUrl = resolveSeriesPreviewImage(previewSeriesId, eventSeries, eventsMap);
    if (!srcUrl) return;

    // Already cleaned? (but ignore stale fallback entries that just point to the original URL)
    const cached = cleanedImages[srcUrl];
    if (cached && cached !== srcUrl) return;

    if (cached === srcUrl) {
      setCleanedImages(prev => {
        const next = { ...prev };
        delete next[srcUrl!];
        return next;
      });
    }

    let cancelled = false;
    const clean = async () => {
      setCleaningImage(true);
      try {
        const { data, error } = await supabase.functions.invoke("clean-image", {
          body: { image_url: srcUrl },
        });
        if (cancelled) return;

        if (error) {
          console.error("clean-image error:", error);
          return;
        }

        if (data?.cleaned_image_url) {
          setCleanedImages(prev => ({ ...prev, [srcUrl!]: data.cleaned_image_url }));
        }
      } catch (e) {
        console.error("clean-image failed:", e);
      } finally {
        if (!cancelled) setCleaningImage(false);
      }
    };
    clean();
    return () => { cancelled = true; };
  }, [previewSeriesId, eventSeries, eventsMap]);


    const save = async () => {
    const { error } = await supabase.from("settings").update({ value: tpl as any, updated_at: new Date().toISOString() }).eq("key", "ticket_template");
    setSaving(false);
    if (error) { toast.error("Fehler beim Speichern"); console.error(error); }
    else toast.success("Ticket-Vorlage gespeichert");
  };

  const update = <K extends keyof TicketTemplate>(key: K, val: TicketTemplate[K]) => setTpl((p) => ({ ...p, [key]: val }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `ticket-template/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload fehlgeschlagen"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
    update("logo_url", urlData.publicUrl);
    setUploading(false);
    toast.success("Logo hochgeladen");
  };

  const addSponsor = (type: "text" | "image", value: string) => {
    if (!value.trim()) return;
    update("sponsors", [...tpl.sponsors, { type, value: value.trim() }]);
    setNewSponsorText("");
  };
  const removeSponsor = (idx: number) => update("sponsors", tpl.sponsors.filter((_, i) => i !== idx));

  const handleSponsorLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `ticket-template/sponsor-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload fehlgeschlagen"); return; }
    const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
    addSponsor("image", urlData.publicUrl);
  };

  // Content block helpers
  const addBlock = (type: ContentBlock["type"]) => {
    const base: ContentBlock = { id: uid(), type, enabled: true };
    if (type === "text") Object.assign(base, { text: "", font_size: "md", bold: false });
    if (type === "image") Object.assign(base, { image_url: "", image_width: 60 });
    if (type === "info_list") Object.assign(base, { list_title: "", items: [""] });
    update("content_blocks", [...tpl.content_blocks, base]);
  };

  const updateBlock = (id: string, updated: ContentBlock) => update("content_blocks", tpl.content_blocks.map(b => b.id === id ? updated : b));
  const removeBlock = (id: string) => update("content_blocks", tpl.content_blocks.filter(b => b.id !== id));
  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = tpl.content_blocks.findIndex(b => b.id === id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= tpl.content_blocks.length) return;
    const arr = [...tpl.content_blocks];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    update("content_blocks", arr);
  };

  const updateGradient = <K extends keyof GradientConfig>(key: K, val: GradientConfig[K]) =>
    update("gradient", { ...tpl.gradient, [key]: val });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Editor */}
        <div className="lg:col-span-3 space-y-5">

          {/* Format */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Format</h3>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map((f) => (
                <button key={f.id} onClick={() => update("format", f.id)} className="text-left p-3 rounded-xl transition-all" style={{ background: tpl.format === f.id ? "hsl(230 80% 56% / 0.12)" : "hsl(0 0% 100% / 0.04)", border: `2px solid ${tpl.format === f.id ? "hsl(230 80% 56%)" : "hsl(0 0% 100% / 0.08)"}` }}>
                  <div className="text-sm font-bold" style={{ color: tpl.format === f.id ? "hsl(230 80% 56%)" : "hsl(0 0% 100%)" }}>{f.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Design Presets */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Design-Vorlagen</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button key={p.name} onClick={() => setTpl((prev) => ({ ...prev, ...p.template }))} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-[10px] font-semibold transition-all hover:scale-105" style={{ background: "hsl(0 0% 100% / 0.04)", color: "hsl(0 0% 100% / 0.7)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                  <div className="w-full h-5 rounded-md" style={{ background: p.template.gradient?.enabled ? `linear-gradient(135deg, ${p.template.gradient.color_from}, ${p.template.gradient.color_to})` : p.template.background_color }} />
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.template.accent_color }} />
                    {p.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Colors + Gradient */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Farben & Verlauf</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {([
                { key: "background_color" as const, label: "Hintergrund" },
                { key: "accent_color" as const, label: "Akzent" },
                { key: "text_color" as const, label: "Text" },
              ]).map((c) => (
                <div key={c.key}>
                  <label style={labelStyle}>{c.label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={tpl[c.key]} onChange={(e) => update(c.key, e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0" style={{ background: "transparent" }} />
                    <input type="text" value={tpl[c.key]} onChange={(e) => update(c.key, e.target.value)} className="flex-1 text-xs font-mono px-2 py-1.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", outline: "none" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Gradient toggle */}
            <div className="pt-3" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>Farbverlauf</label>
                <button onClick={() => updateGradient("enabled", !tpl.gradient.enabled)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold" style={{ background: tpl.gradient.enabled ? `${tpl.accent_color}22` : "hsl(0 0% 100% / 0.06)", color: tpl.gradient.enabled ? tpl.accent_color : "hsl(0 0% 100% / 0.3)" }}>
                  {tpl.gradient.enabled ? "AN" : "AUS"}
                </button>
              </div>
              {tpl.gradient.enabled && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(["linear", "radial"] as const).map(t => (
                      <button key={t} onClick={() => updateGradient("type", t)} className="px-3 py-1 rounded-lg text-[10px] font-bold" style={{ background: tpl.gradient.type === t ? `${tpl.accent_color}22` : "hsl(0 0% 100% / 0.04)", color: tpl.gradient.type === t ? tpl.accent_color : "hsl(0 0% 100% / 0.4)" }}>
                        {t === "linear" ? "Linear" : "Radial"}
                      </button>
                    ))}
                  </div>
                  {tpl.gradient.type === "linear" && (
                    <div>
                      <label style={{ ...labelStyle, marginBottom: "2px" }}>Winkel: {tpl.gradient.angle}°</label>
                      <input type="range" min="0" max="360" value={tpl.gradient.angle} onChange={(e) => updateGradient("angle", Number(e.target.value))} className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ background: "hsl(0 0% 100% / 0.1)" }} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={labelStyle}>Von</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={tpl.gradient.color_from} onChange={(e) => updateGradient("color_from", e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" style={{ background: "transparent" }} />
                        <input type="text" value={tpl.gradient.color_from} onChange={(e) => updateGradient("color_from", e.target.value)} className="flex-1 text-[10px] font-mono px-2 py-1 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", outline: "none" }} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Nach</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={tpl.gradient.color_to} onChange={(e) => updateGradient("color_to", e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0" style={{ background: "transparent" }} />
                        <input type="text" value={tpl.gradient.color_to} onChange={(e) => updateGradient("color_to", e.target.value)} className="flex-1 text-[10px] font-mono px-2 py-1 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", outline: "none" }} />
                      </div>
                    </div>
                  </div>
                  {/* Preview bar */}
                  <div className="w-full h-6 rounded-lg" style={{ background: gradientCSS(tpl.gradient, tpl.background_color) }} />
                </div>
              )}
            </div>
          </div>

          {/* Text Blocks */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Standard-Felder</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEXT_BLOCKS.map((b) => {
                const active = tpl[b.key];
                return (
                  <button key={b.key} onClick={() => update(b.key, !active)} className="px-3 py-2 rounded-xl text-xs font-semibold transition-all" style={{ background: active ? "hsl(230 80% 56% / 0.12)" : "hsl(0 0% 100% / 0.04)", border: `1.5px solid ${active ? "hsl(230 80% 56%)" : "hsl(0 0% 100% / 0.08)"}`, color: active ? "hsl(230 80% 56%)" : "hsl(0 0% 100% / 0.4)" }}>
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Blocks */}
          <div style={sectionStyle}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>Inhaltsblöcke</h3>
              <div className="flex gap-1.5">
                {([
                  { type: "text" as const, icon: <Type className="w-3.5 h-3.5" />, label: "Text" },
                  { type: "image" as const, icon: <Image className="w-3.5 h-3.5" />, label: "Bild" },
                  { type: "info_list" as const, icon: <ListChecks className="w-3.5 h-3.5" />, label: "Info" },
                ]).map(b => (
                  <button key={b.type} onClick={() => addBlock(b.type)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105" style={{ background: "hsl(230 80% 56% / 0.12)", color: "hsl(230 80% 56%)", border: "1px solid hsl(230 80% 56% / 0.25)" }}>
                    {b.icon} {b.label}
                  </button>
                ))}
              </div>
            </div>

            {tpl.content_blocks.length === 0 ? (
              <div className="text-center py-6 rounded-xl" style={{ background: "hsl(0 0% 100% / 0.02)", border: "1px dashed hsl(0 0% 100% / 0.08)" }}>
                <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Noch keine Blöcke – füge Texte, Bilder oder Info-Listen hinzu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tpl.content_blocks.map((block) => (
                  <BlockEditor key={block.id} block={block} accentColor={tpl.accent_color} onUpdate={(b) => updateBlock(block.id, b)} onRemove={() => removeBlock(block.id)} onMove={(d) => moveBlock(block.id, d)} />
                ))}
              </div>
            )}
          </div>

          {/* Logo */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Logo</h3>
            <div className="flex items-center gap-4">
              {tpl.logo_url ? (
                <div className="relative">
                  <img src={tpl.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-contain" style={{ background: "hsl(0 0% 100% / 0.06)" }} />
                  <button onClick={() => update("logo_url", "")} className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "hsl(0 70% 50%)", color: "#fff" }}><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all hover:opacity-80" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)", border: "1px dashed hsl(0 0% 100% / 0.15)" }}>
                  <Upload className="w-4 h-4" />
                  {uploading ? "Lädt..." : "Logo hochladen"}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          {/* ✨ Magic Ticket – Event-Titelbild als Hintergrund */}
          <div style={{ ...sectionStyle, border: tpl.magic_ticket_enabled ? "1px solid hsl(270 80% 60% / 0.3)" : sectionStyle.border, background: tpl.magic_ticket_enabled ? "hsl(270 80% 60% / 0.04)" : sectionStyle.background }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: "hsl(270 80% 60%)" }} />
                <h3 className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>Magic Ticket</h3>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(270 80% 60% / 0.15)", color: "hsl(270 80% 60%)" }}>NEU</span>
              </div>
              <button
                onClick={() => update("magic_ticket_enabled", !tpl.magic_ticket_enabled)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                style={{ background: tpl.magic_ticket_enabled ? "hsl(270 80% 60% / 0.22)" : "hsl(0 0% 100% / 0.06)", color: tpl.magic_ticket_enabled ? "hsl(270 80% 60%)" : "hsl(0 0% 100% / 0.3)" }}
              >
                {tpl.magic_ticket_enabled ? "AN" : "AUS"}
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Das Titelbild des Events wird automatisch als unscharfer Hintergrund auf dem Ticket verwendet.
            </p>

            {tpl.magic_ticket_enabled && (
              <div className="space-y-4">
                {/* Info */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "hsl(270 80% 60% / 0.08)", border: "1px solid hsl(270 80% 60% / 0.15)" }}>
                  <Image className="w-4 h-4 shrink-0" style={{ color: "hsl(270 80% 60% / 0.6)" }} />
                  <span className="text-[11px]" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                    Das <strong style={{ color: "hsl(270 80% 60%)" }}>Event-Titelbild</strong> wird automatisch pro Event übernommen
                  </span>
                </div>

                {/* Blur slider */}
                <div>
                  <label style={{ ...labelStyle, marginBottom: "4px" }}>Unschärfe: {tpl.magic_ticket_blur}px</label>
                  <input
                    type="range" min="0" max="50" value={tpl.magic_ticket_blur}
                    onChange={(e) => update("magic_ticket_blur", Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{ background: "hsl(0 0% 100% / 0.1)" }}
                  />
                </div>

                {/* Opacity slider */}
                <div>
                  <label style={{ ...labelStyle, marginBottom: "4px" }}>Deckkraft: {tpl.magic_ticket_opacity}%</label>
                  <input
                    type="range" min="5" max="100" value={tpl.magic_ticket_opacity}
                    onChange={(e) => update("magic_ticket_opacity", Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{ background: "hsl(0 0% 100% / 0.1)" }}
                  />
                </div>
              </div>
            )}
          </div>


          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Sponsoren & Partner</h3>
            {tpl.sponsors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tpl.sponsors.map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.7)" }}>
                    {s.type === "image" ? "📷" : "📝"} {s.type === "text" ? s.value : "Logo"}
                    <button onClick={() => removeSponsor(i)}><X className="w-3 h-3" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Sponsor-Text…" value={newSponsorText} onChange={(e) => setNewSponsorText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addSponsor("text", newSponsorText); }} className="flex-1 text-sm px-3 py-2 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", outline: "none" }} />
              <button onClick={() => addSponsor("text", newSponsorText)} className="px-3 py-2 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}><Plus className="w-4 h-4" /></button>
              <label className="px-3 py-2 rounded-lg cursor-pointer" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleSponsorLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Category Designs (dynamic) */}
          <div style={sectionStyle}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>Kategorie-Designs</h3>
              <button
                onClick={() => {
                  const designs = [...(tpl.category_designs || [])];
                  const newKey = `CUSTOM_${Date.now()}`;
                  designs.push({
                    key: newKey,
                    label: "Neue Kategorie",
                    emoji: "🎨",
                    override: {
                      accent_color: tpl.accent_color,
                      gradient: { ...tpl.gradient },
                      background_color: tpl.background_color,
                      text_color: tpl.text_color,
                    },
                  });
                  update("category_designs" as any, designs);
                  // Also enable it immediately
                  const overrides = { ...(tpl.category_overrides || {}) };
                  overrides[newKey] = {
                    accent_color: tpl.accent_color,
                    gradient: { ...tpl.gradient },
                    background_color: tpl.background_color,
                    text_color: tpl.text_color,
                  };
                  update("category_overrides" as any, overrides);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                style={{ background: "hsl(230 80% 56% / 0.12)", color: "hsl(230 80% 56%)", border: "1px solid hsl(230 80% 56% / 0.25)" }}
              >
                <Plus className="w-3 h-3" /> Neues Design
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Jede Ticket-Kategorie bekommt ihr eigenes Farbdesign. Deaktiviert = globales Design wird verwendet.</p>
            
            <div className="space-y-3">
              {(tpl.category_designs || DEFAULT_CATEGORY_DESIGNS).map((design, designIdx) => {
                const key = design.key;
                const override = tpl.category_overrides?.[key];
                const isEnabled = !!override;
                const currentOverride = override || design.override;
                const isRenaming = renamingDesignKey === key;
                
                return (
                  <div key={key} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isEnabled ? currentOverride.accent_color + "44" : "hsl(0 0% 100% / 0.06)"}` }}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2.5" style={{ background: isEnabled ? `${currentOverride.accent_color}11` : "hsl(0 0% 100% / 0.02)" }}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm">{design.emoji}</span>
                        {isRenaming ? (
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => {
                              if (renameValue.trim()) {
                                const designs = [...(tpl.category_designs || DEFAULT_CATEGORY_DESIGNS)];
                                const newKey = renameValue.trim().toUpperCase().replace(/\s+/g, "_");
                                // Move override to new key if key changed
                                if (newKey !== key && tpl.category_overrides?.[key]) {
                                  const overrides = { ...(tpl.category_overrides || {}) };
                                  overrides[newKey] = overrides[key];
                                  delete overrides[key];
                                  update("category_overrides" as any, overrides);
                                }
                                designs[designIdx] = { ...designs[designIdx], label: renameValue.trim(), key: newKey };
                                update("category_designs" as any, designs);
                              }
                              setRenamingDesignKey(null);
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            autoFocus
                            className="text-xs font-bold px-2 py-0.5 rounded-lg flex-1"
                            style={{ background: "hsl(0 0% 100% / 0.1)", border: "1px solid hsl(230 80% 56% / 0.4)", color: "hsl(0 0% 100%)", outline: "none" }}
                          />
                        ) : (
                          <span
                            className="text-xs font-bold cursor-pointer hover:underline"
                            style={{ color: isEnabled ? currentOverride.accent_color : "hsl(0 0% 100% / 0.5)" }}
                            onClick={() => { setRenameValue(design.label); setRenamingDesignKey(key); }}
                            title="Klicken zum Umbenennen"
                          >
                            {design.label}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isEnabled && (
                          <button
                            onClick={() => {
                              const overrides = { ...(tpl.category_overrides || {}) };
                              overrides[key] = design.override;
                              update("category_overrides" as any, overrides);
                            }}
                            className="px-2 py-0.5 rounded text-[9px] font-bold"
                            style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.4)" }}
                          >
                            Reset
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const overrides = { ...(tpl.category_overrides || {}) };
                            if (isEnabled) {
                              delete overrides[key];
                            } else {
                              overrides[key] = { ...design.override };
                            }
                            update("category_overrides" as any, overrides);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold"
                          style={{
                            background: isEnabled ? `${currentOverride.accent_color}22` : "hsl(0 0% 100% / 0.06)",
                            color: isEnabled ? currentOverride.accent_color : "hsl(0 0% 100% / 0.3)",
                          }}
                        >
                          {isEnabled ? "AN" : "AUS"}
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm(`"${design.label}" wirklich löschen?`)) return;
                            const designs = [...(tpl.category_designs || DEFAULT_CATEGORY_DESIGNS)].filter((_, i) => i !== designIdx);
                            update("category_designs" as any, designs);
                            const overrides = { ...(tpl.category_overrides || {}) };
                            delete overrides[key];
                            update("category_overrides" as any, overrides);
                          }}
                          className="p-1 rounded-lg hover:bg-white/5"
                          title="Löschen"
                        >
                          <X className="w-3 h-3" style={{ color: "hsl(0 70% 55%)" }} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Color editors when enabled */}
                    {isEnabled && (
                      <div className="px-3 py-3 space-y-3" style={{ background: "hsl(0 0% 0% / 0.15)" }}>
                        <div className="grid grid-cols-2 gap-3">
                          {([
                            { key: "accent_color", label: "Akzent" },
                            { key: "background_color", label: "Hintergrund" },
                          ] as const).map(c => (
                            <div key={c.key}>
                              <label style={{ ...labelStyle, fontSize: "10px" }}>{c.label}</label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="color"
                                  value={(currentOverride as any)[c.key] || tpl[c.key === "accent_color" ? "accent_color" : "background_color"]}
                                  onChange={e => {
                                    const overrides = { ...(tpl.category_overrides || {}) };
                                    overrides[key] = { ...overrides[key], [c.key]: e.target.value };
                                    update("category_overrides" as any, overrides);
                                  }}
                                  className="w-6 h-6 rounded cursor-pointer border-0"
                                  style={{ background: "transparent" }}
                                />
                                <input
                                  type="text"
                                  value={(currentOverride as any)[c.key] || ""}
                                  onChange={e => {
                                    const overrides = { ...(tpl.category_overrides || {}) };
                                    overrides[key] = { ...overrides[key], [c.key]: e.target.value };
                                    update("category_overrides" as any, overrides);
                                  }}
                                  className="flex-1 text-[10px] font-mono px-2 py-1 rounded-lg"
                                  style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", outline: "none" }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Gradient from/to */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label style={{ ...labelStyle, fontSize: "10px" }}>Verlauf Von</label>
                            <div className="flex items-center gap-1.5">
                              <input type="color" value={currentOverride.gradient.color_from} onChange={e => {
                                const overrides = { ...(tpl.category_overrides || {}) };
                                overrides[key] = { ...overrides[key], gradient: { ...overrides[key].gradient, color_from: e.target.value, enabled: true } };
                                update("category_overrides" as any, overrides);
                              }} className="w-6 h-6 rounded cursor-pointer border-0" style={{ background: "transparent" }} />
                              <input type="text" value={currentOverride.gradient.color_from} onChange={e => {
                                const overrides = { ...(tpl.category_overrides || {}) };
                                overrides[key] = { ...overrides[key], gradient: { ...overrides[key].gradient, color_from: e.target.value, enabled: true } };
                                update("category_overrides" as any, overrides);
                              }} className="flex-1 text-[10px] font-mono px-2 py-1 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", outline: "none" }} />
                            </div>
                          </div>
                          <div>
                            <label style={{ ...labelStyle, fontSize: "10px" }}>Verlauf Nach</label>
                            <div className="flex items-center gap-1.5">
                              <input type="color" value={currentOverride.gradient.color_to} onChange={e => {
                                const overrides = { ...(tpl.category_overrides || {}) };
                                overrides[key] = { ...overrides[key], gradient: { ...overrides[key].gradient, color_to: e.target.value, enabled: true } };
                                update("category_overrides" as any, overrides);
                              }} className="w-6 h-6 rounded cursor-pointer border-0" style={{ background: "transparent" }} />
                              <input type="text" value={currentOverride.gradient.color_to} onChange={e => {
                                const overrides = { ...(tpl.category_overrides || {}) };
                                overrides[key] = { ...overrides[key], gradient: { ...overrides[key].gradient, color_to: e.target.value, enabled: true } };
                                update("category_overrides" as any, overrides);
                              }} className="flex-1 text-[10px] font-mono px-2 py-1 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", outline: "none" }} />
                            </div>
                          </div>
                        </div>
                        
                        {/* Mini Preview Bar */}
                        <div className="w-full h-8 rounded-lg overflow-hidden relative" style={{
                          background: currentOverride.gradient.enabled
                            ? gradientCSS(currentOverride.gradient, currentOverride.background_color || tpl.background_color)
                            : currentOverride.background_color || tpl.background_color,
                        }}>
                          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: currentOverride.accent_color }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: currentOverride.accent_color }}>
                              {design.label} TICKET
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              <h3 className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Vorschau</h3>
            </div>

            {/* Preview mode selectors */}
            <div className="space-y-3">
              {/* Event Series selector */}
              {eventSeries.length > 0 && (
                <div>
                  <label style={{ ...labelStyle, marginBottom: "6px" }}>Eventreihe</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setPreviewSeriesId(null)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={{
                        background: !previewSeriesId ? "hsl(230 80% 56% / 0.15)" : "hsl(0 0% 100% / 0.04)",
                        color: !previewSeriesId ? "hsl(230 80% 56%)" : "hsl(0 0% 100% / 0.4)",
                        border: `1px solid ${!previewSeriesId ? "hsl(230 80% 56% / 0.3)" : "hsl(0 0% 100% / 0.08)"}`,
                      }}
                    >
                      Demo
                    </button>
                    {eventSeries.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setPreviewSeriesId(s.id)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                        style={{
                          background: previewSeriesId === s.id ? "hsl(230 80% 56% / 0.15)" : "hsl(0 0% 100% / 0.04)",
                          color: previewSeriesId === s.id ? "hsl(230 80% 56%)" : "hsl(0 0% 100% / 0.4)",
                          border: `1px solid ${previewSeriesId === s.id ? "hsl(230 80% 56% / 0.3)" : "hsl(0 0% 100% / 0.08)"}`,
                        }}
                      >
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Design selector (from template designs, not individual ticket names) */}
              {(() => {
                const designs = tpl.category_designs || DEFAULT_CATEGORY_DESIGNS;
                if (designs.length === 0) return null;
                return (
                  <div>
                    <label style={{ ...labelStyle, marginBottom: "6px" }}>Kategorie-Design</label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setPreviewCategoryId(null)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                        style={{
                          background: !previewCategoryId ? "hsl(270 80% 56% / 0.15)" : "hsl(0 0% 100% / 0.04)",
                          color: !previewCategoryId ? "hsl(270 80% 56%)" : "hsl(0 0% 100% / 0.4)",
                          border: `1px solid ${!previewCategoryId ? "hsl(270 80% 56% / 0.3)" : "hsl(0 0% 100% / 0.08)"}`,
                        }}
                      >
                        Standard
                      </button>
                      {designs.map(d => {
                        const override = tpl.category_overrides?.[d.key];
                        const accentCol = override?.accent_color || d.override.accent_color;
                        const isActive = previewCategoryId === d.key;
                        return (
                          <button
                            key={d.key}
                            onClick={() => setPreviewCategoryId(d.key)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                            style={{
                              background: isActive ? `${accentCol}22` : "hsl(0 0% 100% / 0.04)",
                              color: isActive ? accentCol : "hsl(0 0% 100% / 0.4)",
                              border: `1px solid ${isActive ? `${accentCol}44` : "hsl(0 0% 100% / 0.08)"}`,
                            }}
                          >
                            {d.emoji} {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Computed preview */}
            {(() => {
              // Determine preview image from selected series
              let rawImg = DEMO_EVENT_IMAGE;
              if (previewSeriesId) {
                const resolvedSeriesImage = resolveSeriesPreviewImage(previewSeriesId, eventSeries, eventsMap);
                if (resolvedSeriesImage) rawImg = resolvedSeriesImage;
              }
              // Use AI-cleaned version if available
              const previewImg = cleanedImages[rawImg] || rawImg;

              // Apply category override to tpl
              let displayTpl = tpl;
              let categoryName: string | undefined;
              if (previewCategoryId) {
                const overrideKey = previewCategoryId.toUpperCase();
                const override = tpl.category_overrides?.[overrideKey];
                const designs = tpl.category_designs || DEFAULT_CATEGORY_DESIGNS;
                const design = designs.find(d => d.key === previewCategoryId);
                categoryName = design?.label || previewCategoryId;
                // Use the design's default override if no custom override saved
                const effectiveOverride = override || design?.override;
                if (override) {
                  displayTpl = {
                    ...tpl,
                    accent_color: override.accent_color,
                    background_color: override.background_color || tpl.background_color,
                    text_color: override.text_color || tpl.text_color,
                    gradient: override.gradient,
                  };
                }
              }

              // If a series is selected, force magic ticket enabled for preview
              const previewTpl = previewSeriesId ? { ...displayTpl, magic_ticket_enabled: true } : displayTpl;

              return (
                <>
                  <div className="flex justify-center p-6 rounded-2xl relative" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                    <TicketPreview tpl={previewTpl} previewImageUrl={previewImg} previewCategoryName={categoryName} />
                    {cleaningImage && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: "hsl(0 0% 0% / 0.5)", zIndex: 10 }}>
                        <div className="flex items-center gap-2 text-white text-xs font-medium"><Loader2 className="w-4 h-4 animate-spin" /> Bild wird bereinigt…</div>
                      </div>
                    )}
                  </div>
                  <p className="text-center text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                    {tpl.format === "din_lang" ? "DIN Lang – 210 × 99 mm" : "A4 – 210 × 297 mm"}
                    {previewSeriesId && (() => {
                      const s = eventSeries.find(x => x.id === previewSeriesId);
                      return s ? ` · ${s.title}` : "";
                    })()}
                    {previewCategoryId ? ` · ${previewCategoryId}` : ""}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketTemplateAdmin;
