import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Palette, Mail, FileText, Paperclip, Save, Loader2, Upload, X, Plus, Eye,
} from "lucide-react";

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

/* ─── Email Template Types ─── */
interface EmailTemplate {
  subject: string;
  greeting: string;
  intro_text: string;
  footer_text: string;
  accent_color: string;
  logo_url: string;
  show_order_summary: boolean;
  show_event_details: boolean;
}

const defaultEmailTemplate: EmailTemplate = {
  subject: "Deine Tickets für {{event_title}}",
  greeting: "Hallo {{first_name}}",
  intro_text: "vielen Dank für deine Bestellung! Dein(e) Ticket(s) sind im Anhang als PDF mit QR-Code(s) beigefügt.",
  footer_text: "Bei Fragen antworte einfach auf diese E-Mail.\nWir freuen uns auf dich! 🎉",
  accent_color: "#d9338a",
  logo_url: "",
  show_order_summary: true,
  show_event_details: true,
};

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
        <Palette className="w-5 h-5" style={{ color: "hsl(330 80% 55%)" }} />
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
                background: active ? "hsl(330 80% 55% / 0.15)" : "transparent",
                color: active ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
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

/* ─── Email Tab ─── */
const EmailTab = () => {
  const [tpl, setTpl] = useState<EmailTemplate>(defaultEmailTemplate);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "email_template").maybeSingle();
      if (data?.value) setTpl({ ...defaultEmailTemplate, ...(data.value as any) });
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    // upsert
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;

  const placeholders = ["{{first_name}}", "{{name}}", "{{event_title}}", "{{date}}", "{{time}}", "{{location}}", "{{ticket_count}}", "{{invoice_number}}"];

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
          {/* Subject */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Betreffzeile</h3>
            <input
              type="text" value={tpl.subject}
              onChange={(e) => setTpl(p => ({ ...p, subject: e.target.value }))}
              className="w-full text-sm px-3 py-2.5 rounded-lg" style={inputStyle}
            />
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
            <input type="text" value={tpl.greeting}
              onChange={(e) => setTpl(p => ({ ...p, greeting: e.target.value }))}
              className="w-full text-sm px-3 py-2.5 rounded-lg mb-3" style={inputStyle}
            />
            <label style={labelStyle}>Einleitungstext</label>
            <textarea value={tpl.intro_text}
              onChange={(e) => setTpl(p => ({ ...p, intro_text: e.target.value }))}
              rows={3} className="w-full text-sm px-3 py-2.5 rounded-lg resize-none" style={inputStyle}
            />
          </div>

          {/* Footer */}
          <div style={sectionStyle}>
            <h3 className="text-sm font-bold mb-3" style={{ color: "hsl(0 0% 100%)" }}>Footer-Text</h3>
            <textarea value={tpl.footer_text}
              onChange={(e) => setTpl(p => ({ ...p, footer_text: e.target.value }))}
              rows={3} className="w-full text-sm px-3 py-2.5 rounded-lg resize-none" style={inputStyle}
            />
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
            <div className="rounded-xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
              {/* Accent bar */}
              <div style={{ height: "4px", background: tpl.accent_color }} />
              <div style={{ padding: "24px", fontFamily: "-apple-system, sans-serif" }}>
                {tpl.logo_url && <img src={tpl.logo_url} alt="" style={{ height: "32px", marginBottom: "16px", objectFit: "contain" }} />}
                <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.6, margin: "0 0 16px" }}>
                  {tpl.greeting.replace("{{first_name}}", "Max").replace("{{name}}", "Max Mustermann")},<br /><br />
                  {tpl.intro_text}
                </p>
                {tpl.show_event_details && (
                  <div style={{ background: "#f9f9f9", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "1px", color: "#999", fontWeight: 600, marginBottom: "4px" }}>Event</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", marginBottom: "8px" }}>Mamma Mia Party</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>15.03.2026 · 22:00 Uhr · Baggi / Osho</div>
                  </div>
                )}
                {tpl.show_order_summary && (
                  <div style={{ borderTop: "1px solid #eee", paddingTop: "12px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "12px", color: "#666", display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>2x Early Bird</span><span>19,98 €</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", display: "flex", justifyContent: "space-between" }}>
                      <span>Gesamt</span><span>19,98 €</span>
                    </div>
                  </div>
                )}
                <div style={{ borderTop: "1px solid #eee", paddingTop: "16px" }}>
                  <p style={{ fontSize: "11px", color: "#999", margin: 0, whiteSpace: "pre-line" }}>{tpl.footer_text}</p>
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
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#1a1a1a", display: "flex", justifyContent: "space-between", padding: "8px 8px 0" }}>
                  <span>Gesamt</span><span>19,98 €</span>
                </div>

                {tpl.payment_terms && <div style={{ fontSize: "7px", color: "#666", marginTop: "12px", whiteSpace: "pre-line" }}>{tpl.payment_terms}</div>}
                {tpl.additional_text && <div style={{ fontSize: "7px", color: "#666", marginTop: "8px", whiteSpace: "pre-line" }}>{tpl.additional_text}</div>}

                <div style={{ marginTop: "auto", borderTop: "1px solid #eee", paddingTop: "8px" }}>
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
