import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Ticket, Plus, X, Upload, Eye } from "lucide-react";

interface TicketTemplate {
  format: "din_lang" | "a4";
  background_color: string;
  accent_color: string;
  text_color: string;
  show_event_title: boolean;
  show_date: boolean;
  show_time: boolean;
  show_location: boolean;
  show_address: boolean;
  show_category: boolean;
  show_holder_name: boolean;
  show_qr_code: boolean;
  logo_url: string;
  sponsors: Array<{ type: "image" | "text"; value: string }>;
}

const defaultTemplate: TicketTemplate = {
  format: "din_lang",
  background_color: "#14141e",
  accent_color: "#d9338a",
  text_color: "#ffffff",
  show_event_title: true,
  show_date: true,
  show_time: true,
  show_location: true,
  show_address: true,
  show_category: true,
  show_holder_name: true,
  show_qr_code: true,
  logo_url: "",
  sponsors: [],
};

const PRESETS: Array<{ name: string; template: Partial<TicketTemplate> }> = [
  { name: "Dunkel (Standard)", template: { background_color: "#14141e", accent_color: "#d9338a", text_color: "#ffffff" } },
  { name: "Neon Pink", template: { background_color: "#1a0a1e", accent_color: "#ff2d95", text_color: "#ffffff" } },
  { name: "Ocean Blue", template: { background_color: "#0a1628", accent_color: "#3b82f6", text_color: "#ffffff" } },
  { name: "Gold Premium", template: { background_color: "#1a1610", accent_color: "#d4a030", text_color: "#f5f0e0" } },
  { name: "Minimalist Hell", template: { background_color: "#f5f5f5", accent_color: "#1a1a1a", text_color: "#1a1a1a" } },
  { name: "Neon Grün", template: { background_color: "#0a1a0a", accent_color: "#22c55e", text_color: "#ffffff" } },
];

const FORMATS = [
  { id: "din_lang" as const, label: "DIN Lang (Hartticket)", desc: "210 × 99 mm – klassisches Konzertticket" },
  { id: "a4" as const, label: "A4 (Druckbar)", desc: "210 × 297 mm – zum Ausdrucken" },
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

/* ─── Ticket Preview ─── */
const TicketPreview = ({ tpl }: { tpl: TicketTemplate }) => {
  const isDinLang = tpl.format === "din_lang";
  const aspectStyle = isDinLang
    ? { width: "100%", maxWidth: "480px", aspectRatio: "210/99" }
    : { width: "100%", maxWidth: "320px", aspectRatio: "210/297" };

  const hexToContrast = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? "#000" : "#fff";
  };
  const textCol = tpl.text_color || hexToContrast(tpl.background_color);

  return (
    <div style={{ ...aspectStyle, background: tpl.background_color, borderRadius: "12px", overflow: "hidden", position: "relative", boxShadow: "0 8px 32px hsl(0 0% 0% / 0.4)" }}>
      {/* Accent bar */}
      <div style={{ height: isDinLang ? "4px" : "6px", background: tpl.accent_color }} />

      <div style={{ padding: isDinLang ? "12px 16px" : "24px 28px", display: "flex", flexDirection: isDinLang ? "row" : "column", gap: isDinLang ? "12px" : "16px", height: isDinLang ? "calc(100% - 4px)" : "auto" }}>
        {/* Left / Top section */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
          {tpl.logo_url && (
            <div style={{ marginBottom: "6px" }}>
              <div style={{ width: isDinLang ? "32px" : "48px", height: isDinLang ? "32px" : "48px", borderRadius: "6px", background: `${tpl.accent_color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: tpl.accent_color, fontWeight: 700 }}>LOGO</div>
            </div>
          )}
          <div style={{ fontSize: isDinLang ? "7px" : "9px", fontWeight: 800, letterSpacing: "2px", color: tpl.accent_color, textTransform: "uppercase", marginBottom: "2px" }}>TICKET</div>
          {tpl.show_event_title && <div style={{ fontSize: isDinLang ? "10px" : "14px", fontWeight: 800, color: tpl.accent_color, textTransform: "uppercase", lineHeight: 1.1, marginBottom: "6px" }}>MAMMA MIA PARTY</div>}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {tpl.show_date && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>DATUM</span> 15.03.2026</div>}
            {tpl.show_time && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>UHRZEIT</span> 22:00 Uhr</div>}
            {tpl.show_location && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>ORT</span> Baggi / Osho</div>}
            {tpl.show_address && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>ADRESSE</span> Musterstr. 1, Hannover</div>}
            {tpl.show_category && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>KATEGORIE</span> Early Bird</div>}
            {tpl.show_holder_name && <div style={{ fontSize: isDinLang ? "7px" : "9px", color: textCol, opacity: 0.8 }}><span style={{ opacity: 0.5, marginRight: "4px" }}>NAME</span> Max Mustermann</div>}
          </div>
          {/* Sponsors */}
          {tpl.sponsors.length > 0 && (
            <div style={{ marginTop: "auto", paddingTop: "6px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              {tpl.sponsors.map((s, i) => (
                <span key={i} style={{ fontSize: "6px", color: textCol, opacity: 0.4, textTransform: "uppercase" }}>{s.type === "text" ? s.value : "📷 Sponsor"}</span>
              ))}
            </div>
          )}
        </div>

        {/* QR section */}
        {tpl.show_qr_code && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...(isDinLang ? { borderLeft: `1px dashed ${textCol}33`, paddingLeft: "12px" } : {}) }}>
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

/* ─── Main Component ─── */
const TicketTemplateAdmin = () => {
  const [tpl, setTpl] = useState<TicketTemplate>(defaultTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSponsorText, setNewSponsorText] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "ticket_template").maybeSingle();
      if (data?.value) setTpl({ ...defaultTemplate, ...(data.value as any) });
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
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

  const removeSponsor = (idx: number) => {
    update("sponsors", tpl.sponsors.filter((_, i) => i !== idx));
  };

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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="w-5 h-5" style={{ color: "hsl(330 80% 55%)" }} />
          <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)" }}>Ticket-Vorlage</h1>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(330 80% 55%)", color: "hsl(0 0% 100%)" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Editor - Left */}
        <div className="lg:col-span-3 space-y-5">

          {/* Format */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Format</h3>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map((f) => (
                <button key={f.id} onClick={() => update("format", f.id)} className="text-left p-3 rounded-xl transition-all" style={{ background: tpl.format === f.id ? `${tpl.accent_color}22` : "hsl(0 0% 100% / 0.04)", border: `2px solid ${tpl.format === f.id ? tpl.accent_color : "hsl(0 0% 100% / 0.08)"}` }}>
                  <div className="text-sm font-bold" style={{ color: tpl.format === f.id ? tpl.accent_color : "hsl(0 0% 100%)" }}>{f.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Farben</h3>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESETS.map((p) => (
                <button key={p.name} onClick={() => setTpl((prev) => ({ ...prev, ...p.template }))} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.7)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                  <span className="w-3 h-3 rounded-full" style={{ background: p.template.accent_color }} />
                  {p.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "background_color" as const, label: "Hintergrund" },
                { key: "accent_color" as const, label: "Akzent" },
                { key: "text_color" as const, label: "Text" },
              ].map((c) => (
                <div key={c.key}>
                  <label style={labelStyle}>{c.label}</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={tpl[c.key]} onChange={(e) => update(c.key, e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border-0" style={{ background: "transparent" }} />
                    <input type="text" value={tpl[c.key]} onChange={(e) => update(c.key, e.target.value)} className="flex-1 text-xs font-mono px-2 py-1.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", outline: "none" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Text Blocks */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Textblöcke</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEXT_BLOCKS.map((b) => {
                const active = tpl[b.key];
                return (
                  <button key={b.key} onClick={() => update(b.key, !active)} className="px-3 py-2 rounded-xl text-xs font-semibold transition-all" style={{ background: active ? `${tpl.accent_color}22` : "hsl(0 0% 100% / 0.04)", border: `1.5px solid ${active ? tpl.accent_color : "hsl(0 0% 100% / 0.08)"}`, color: active ? tpl.accent_color : "hsl(0 0% 100% / 0.4)" }}>
                    {b.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Logo */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Logo</h3>
            <div className="flex items-center gap-4">
              {tpl.logo_url ? (
                <div className="relative">
                  <img src={tpl.logo_url} alt="Logo" className="w-16 h-16 rounded-lg object-contain" style={{ background: "hsl(0 0% 100% / 0.06)" }} />
                  <button onClick={() => update("logo_url", "")} className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "hsl(0 70% 50%)", color: "#fff" }}>
                    <X className="w-3 h-3" />
                  </button>
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

          {/* Sponsors */}
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
              <input type="text" placeholder="Sponsor-Text hinzufügen..." value={newSponsorText} onChange={(e) => setNewSponsorText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { addSponsor("text", newSponsorText); } }} className="flex-1 text-sm px-3 py-2 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", outline: "none" }} />
              <button onClick={() => addSponsor("text", newSponsorText)} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>
                <Plus className="w-4 h-4" />
              </button>
              <label className="px-3 py-2 rounded-lg text-xs font-bold cursor-pointer" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleSponsorLogoUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Preview - Right */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              <h3 className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.6)" }}>Vorschau</h3>
            </div>
            <div className="flex justify-center p-6 rounded-2xl" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
              <TicketPreview tpl={tpl} />
            </div>
            <p className="text-center text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
              {tpl.format === "din_lang" ? "DIN Lang – 210 × 99 mm" : "A4 – 210 × 297 mm"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketTemplateAdmin;
