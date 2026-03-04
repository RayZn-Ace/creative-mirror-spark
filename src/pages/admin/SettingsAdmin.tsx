import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Building2, FileText, Mail, Save, Loader2 } from "lucide-react";

interface CompanyData {
  name: string;
  address: string;
  zip: string;
  city: string;
  country: string;
  vat_id: string;
  managing_director: string;
  email: string;
  phone: string;
  bank_name: string;
  iban: string;
  bic: string;
}

interface InvoiceData {
  prefix: string;
  next_number: number;
}

interface EmailData {
  sender_name: string;
  sender_domain: string;
  reply_to: string;
}

const emptyCompany: CompanyData = { name: "", address: "", zip: "", city: "", country: "Deutschland", vat_id: "", managing_director: "", email: "", phone: "", bank_name: "", iban: "", bic: "" };
const emptyInvoice: InvoiceData = { prefix: "RE", next_number: 1 };
const emptyEmail: EmailData = { sender_name: "Tickets", sender_domain: "", reply_to: "" };

const inputStyle = {
  background: "hsl(0 0% 100% / 0.06)",
  border: "1px solid hsl(0 0% 100% / 0.1)",
  color: "hsl(0 0% 100%)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle = { color: "hsl(0 0% 100% / 0.5)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: "4px", display: "block" };

const Field = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} className="focus:border-pink-500" />
  </div>
);

const SectionCard = ({ icon: Icon, title, description, children, onSave, saving }: { icon: any; title: string; description: string; children: React.ReactNode; onSave: () => void; saving: boolean }) => (
  <div className="rounded-2xl p-6" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
    <div className="flex items-center gap-3 mb-1">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(330 80% 55% / 0.15)" }}>
        <Icon className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
      </div>
      <h3 className="text-base font-bold" style={{ color: "hsl(0 0% 100%)" }}>{title}</h3>
    </div>
    <p className="text-xs mb-5 ml-11" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{description}</p>
    <div className="space-y-4">
      {children}
    </div>
    <div className="mt-5 flex justify-end">
      <button onClick={onSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(330 80% 55%)", color: "hsl(0 0% 100%)" }}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Speichern
      </button>
    </div>
  </div>
);

const SettingsAdmin = () => {
  const [company, setCompany] = useState<CompanyData>(emptyCompany);
  const [invoice, setInvoice] = useState<InvoiceData>(emptyInvoice);
  const [emailSettings, setEmailSettings] = useState<EmailData>(emptyEmail);
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("settings").select("key, value");
      if (data) {
        for (const row of data) {
          const val = row.value as any;
          if (row.key === "company") setCompany({ ...emptyCompany, ...val });
          if (row.key === "invoice") setInvoice({ ...emptyInvoice, ...val });
          if (row.key === "email") setEmailSettings({ ...emptyEmail, ...val });
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async (key: string, value: any, setSaving: (v: boolean) => void) => {
    setSaving(true);
    const { error } = await supabase.from("settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    setSaving(false);
    if (error) {
      toast.error("Fehler beim Speichern");
      console.error(error);
    } else {
      toast.success("Einstellungen gespeichert");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;
  }

  const setC = (field: keyof CompanyData) => (v: string) => setCompany((p) => ({ ...p, [field]: v }));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="w-5 h-5" style={{ color: "hsl(330 80% 55%)" }} />
        <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)" }}>Einstellungen</h1>
      </div>

      {/* Company */}
      <SectionCard icon={Building2} title="Firmendaten" description="Diese Daten werden auf Rechnungen und in E-Mails verwendet." onSave={() => save("company", company, setSavingCompany)} saving={savingCompany}>
        <Field label="Firmenname" value={company.name} onChange={setC("name")} placeholder="SMEA GmbH" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Straße & Hausnr." value={company.address} onChange={setC("address")} placeholder="Musterstraße 1" />
          <div className="grid grid-cols-3 gap-3">
            <Field label="PLZ" value={company.zip} onChange={setC("zip")} placeholder="12345" />
            <div className="col-span-2">
              <Field label="Stadt" value={company.city} onChange={setC("city")} placeholder="Berlin" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Land" value={company.country} onChange={setC("country")} placeholder="Deutschland" />
          <Field label="USt-IdNr." value={company.vat_id} onChange={setC("vat_id")} placeholder="DE123456789" />
        </div>
        <Field label="Geschäftsführer" value={company.managing_director} onChange={setC("managing_director")} placeholder="Max Mustermann" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="E-Mail" value={company.email} onChange={setC("email")} placeholder="info@firma.de" type="email" />
          <Field label="Telefon" value={company.phone} onChange={setC("phone")} placeholder="+49 123 456789" />
        </div>
        <div className="pt-2">
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Bankverbindung (optional)</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Bank" value={company.bank_name} onChange={setC("bank_name")} placeholder="Sparkasse" />
            <Field label="IBAN" value={company.iban} onChange={setC("iban")} placeholder="DE89..." />
            <Field label="BIC" value={company.bic} onChange={setC("bic")} placeholder="SPKADE..." />
          </div>
        </div>
      </SectionCard>

      {/* Invoice */}
      <SectionCard icon={FileText} title="Rechnungen" description="Einstellungen für die automatische Rechnungserstellung." onSave={() => save("invoice", invoice, setSavingInvoice)} saving={savingInvoice}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Präfix" value={invoice.prefix} onChange={(v) => setInvoice((p) => ({ ...p, prefix: v }))} placeholder="RE" />
          <div>
            <label style={labelStyle}>Nächste Nummer</label>
            <input type="number" value={invoice.next_number} onChange={(e) => setInvoice((p) => ({ ...p, next_number: parseInt(e.target.value) || 1 }))} style={inputStyle} min={1} />
          </div>
        </div>
        <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
          Vorschau: <span className="font-mono" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{invoice.prefix}-{new Date().getFullYear()}-{String(invoice.next_number).padStart(4, "0")}</span>
        </p>
      </SectionCard>

      {/* Email */}
      <SectionCard icon={Mail} title="E-Mail Versand" description="Konfiguration für den Ticketversand per E-Mail." onSave={() => save("email", emailSettings, setSavingEmail)} saving={savingEmail}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Absender-Name" value={emailSettings.sender_name} onChange={(v) => setEmailSettings((p) => ({ ...p, sender_name: v }))} placeholder="Tickets" />
          <Field label="Absender-Domain" value={emailSettings.sender_domain} onChange={(v) => setEmailSettings((p) => ({ ...p, sender_domain: v }))} placeholder="gimmegimmeparty.com" />
        </div>
        <Field label="Antwort-Adresse (Reply-To)" value={emailSettings.reply_to} onChange={(v) => setEmailSettings((p) => ({ ...p, reply_to: v }))} placeholder="info@gimmegimmeparty.com" type="email" />
      </SectionCard>
    </div>
  );
};

export default SettingsAdmin;
