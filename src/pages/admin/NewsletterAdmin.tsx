import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Send, Users, CheckCircle, AlertCircle, Loader2, Filter, Eye,
  Plus, Trash2, GripVertical, Type, Heading1, Image, MousePointerClick, Minus,
  ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight, Bold, Italic,
} from "lucide-react";
import { toast } from "sonner";

// ─── Block Types ───────────────────────────────────────────────
type BlockType = "heading" | "text" | "image" | "button" | "divider" | "spacer";

interface BaseBlock { id: string; type: BlockType }
interface HeadingBlock extends BaseBlock { type: "heading"; text: string; level: 1 | 2 | 3; align: "left" | "center" | "right"; color: string }
interface TextBlock extends BaseBlock { type: "text"; text: string; align: "left" | "center" | "right"; bold: boolean; italic: boolean; color: string }
interface ImageBlock extends BaseBlock { type: "image"; src: string; alt: string; width: number }
interface ButtonBlock extends BaseBlock { type: "button"; text: string; url: string; bgColor: string; textColor: string; align: "left" | "center" | "right"; borderRadius: number }
interface DividerBlock extends BaseBlock { type: "divider"; color: string; style: "solid" | "dashed" | "dotted" }
interface SpacerBlock extends BaseBlock { type: "spacer"; height: number }

type Block = HeadingBlock | TextBlock | ImageBlock | ButtonBlock | DividerBlock | SpacerBlock;

const uid = () => Math.random().toString(36).slice(2, 10);

const BLOCK_TYPES: { type: BlockType; label: string; icon: any }[] = [
  { type: "heading", label: "Überschrift", icon: Heading1 },
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Bild", icon: Image },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "divider", label: "Trennlinie", icon: Minus },
  { type: "spacer", label: "Abstand", icon: ChevronDown },
];

const createBlock = (type: BlockType): Block => {
  const id = uid();
  switch (type) {
    case "heading": return { id, type, text: "Überschrift", level: 1, align: "center", color: "#ffffff" };
    case "text": return { id, type, text: "Dein Text hier...", align: "left", bold: false, italic: false, color: "#333333" };
    case "image": return { id, type, src: "", alt: "Bild", width: 100 };
    case "button": return { id, type, text: "Jetzt Tickets sichern", url: "https://", bgColor: "#e91e8c", textColor: "#ffffff", align: "center", borderRadius: 8 };
    case "divider": return { id, type, color: "#eeeeee", style: "solid" };
    case "spacer": return { id, type, height: 24 };
  }
};

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
  }
};

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

  // ─── Build HTML ────────────────────────────────────────────
  const buildHtml = useCallback(() => {
    const bodyContent = blocks.map(blockToHtml).join("");
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#e91e8c,#ff6b35);padding:32px 40px;">
<h1 style="margin:0;color:#fff;font-size:24px;font-weight:800;">${subject || "Newsletter"}</h1>
</td></tr>
<tr><td style="padding:32px 40px;">
${bodyContent}
</td></tr>
<tr><td style="padding:24px 40px;background:#fafafa;border-top:1px solid #eee;">
<p style="margin:0;font-size:12px;color:#999;">Du erhältst diese E-Mail, weil du bei uns ein Ticket gekauft hast.</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
  }, [blocks, subject]);

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("Bitte Betreff ausfüllen"); return; }
    if (blocks.length === 0) { toast.error("Bitte mindestens einen Block hinzufügen"); return; }
    if (recipients.length === 0) { toast.error("Keine Empfänger gefunden"); return; }

    setSending(true);
    setSent(null);

    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter", {
        body: {
          subject: subject.trim(),
          html: buildHtml(),
          recipients: recipients.map((r) => r.email),
          fromName: fromName.trim(),
          fromEmail: fromEmail.trim(),
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Editor */}
        <div className="lg:col-span-2 space-y-4">
          {/* From */}
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

          {/* Toggle Editor/Preview */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              style={{ background: !preview ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)", color: !preview ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.4)" }}
            >
              <Type className="w-3.5 h-3.5" /> Editor
            </button>
            <button
              onClick={() => setPreview(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              style={{ background: preview ? "hsl(215 90% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)", color: preview ? "hsl(215 90% 55%)" : "hsl(0 0% 100% / 0.4)" }}
            >
              <Eye className="w-3.5 h-3.5" /> Vorschau
            </button>
          </div>

          {/* Content area */}
          {preview ? (
            <div className="rounded-2xl overflow-hidden" style={{ background: "#f4f4f4", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
              <div dangerouslySetInnerHTML={{ __html: buildHtml() }} />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Blocks */}
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
                    {/* Block header */}
                    <div
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/[0.02] transition-all"
                      onClick={() => setSelectedBlock(isSelected ? null : block.id)}
                    >
                      <GripVertical className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(330 80% 55% / 0.6)" }} />
                      <span className="text-xs font-bold flex-1" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                        {meta.label}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} disabled={idx === 0} className="p-1 rounded hover:bg-white/[0.05] disabled:opacity-20" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} disabled={idx === blocks.length - 1} className="p-1 rounded hover:bg-white/[0.05] disabled:opacity-20" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-1 rounded hover:bg-red-500/10" style={{ color: "hsl(0 70% 55% / 0.5)" }}>
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Block editor */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 pt-1" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
                            <BlockEditor block={block} onChange={(b) => updateBlock(block.id, b)} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Add block button */}
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
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute z-10 top-full mt-1 left-0 right-0 rounded-xl overflow-hidden shadow-xl"
                      style={{ background: "hsl(220 50% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                    >
                      <div className="grid grid-cols-3 gap-1 p-2">
                        {BLOCK_TYPES.map(({ type, label, icon: I }) => (
                          <button
                            key={type}
                            onClick={() => addBlock(type)}
                            className="flex flex-col items-center gap-1.5 py-3 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-white/[0.06] transition-all"
                            style={{ color: "hsl(0 0% 100% / 0.6)" }}
                          >
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
          )}

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

        {/* Right: Recipients sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Empfänger</span>
            </div>
            <div className="text-center py-4 rounded-xl" style={{ background: "hsl(330 80% 55% / 0.08)" }}>
              <span className="text-3xl font-black" style={{ color: "hsl(330 80% 55%)" }}>{recipients.length}</span>
              <span className="text-xs block mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>eindeutige E-Mails</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Filter</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={onlyPaid} onChange={(e) => setOnlyPaid(e.target.checked)} className="rounded" />
                <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Nur bezahlte Kunden</span>
              </label>
              <div>
                <label className={labelCls} style={labelStyle}>Stadt</label>
                <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg text-xs" style={inputStyle}>
                  <option value="all" style={{ background: "hsl(220 50% 10%)" }}>Alle Städte</option>
                  {allCities.map((c) => <option key={c} value={c} style={{ background: "hsl(220 50% 10%)" }}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Recipient preview */}
          <div className="rounded-2xl p-5 space-y-3" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
              Empfänger-Vorschau ({Math.min(recipients.length, 20)}/{recipients.length})
            </span>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
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
        </div>
      </div>
    </div>
  );
};

export default NewsletterAdmin;
