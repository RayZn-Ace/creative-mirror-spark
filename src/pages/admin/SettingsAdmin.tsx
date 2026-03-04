import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Settings, Building2, FileText, Mail, Save, Loader2, User, Users, Shield, Trash2, Plus } from "lucide-react";

interface CompanyData {
  name: string; address: string; zip: string; city: string; country: string;
  vat_id: string; managing_director: string; email: string; phone: string;
  bank_name: string; iban: string; bic: string;
}
interface InvoiceData { prefix: string; next_number: number; }
interface EmailData { sender_name: string; sender_domain: string; reply_to: string; }
interface ProfileData { display_name: string; avatar_url: string; }
interface UserRoleRow { id: string; user_id: string; role: string; created_at: string; email?: string; display_name?: string; }

const emptyCompany: CompanyData = { name: "", address: "", zip: "", city: "", country: "Deutschland", vat_id: "", managing_director: "", email: "", phone: "", bank_name: "", iban: "", bic: "" };
const emptyInvoice: InvoiceData = { prefix: "RE", next_number: 1 };
const emptyEmail: EmailData = { sender_name: "Tickets", sender_domain: "", reply_to: "" };

const inputStyle = { background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", width: "100%", outline: "none", transition: "border-color 0.2s" };
const labelStyle = { color: "hsl(0 0% 100% / 0.5)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: "4px", display: "block" };

const Field = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} className="focus:border-pink-500" />
  </div>
);

const SectionCard = ({ icon: Icon, title, description, children, onSave, saving }: { icon: any; title: string; description: string; children: React.ReactNode; onSave?: () => void; saving?: boolean }) => (
  <div className="rounded-2xl p-6" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
    <div className="flex items-center gap-3 mb-1">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(330 80% 55% / 0.15)" }}>
        <Icon className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
      </div>
      <h3 className="text-base font-bold" style={{ color: "hsl(0 0% 100%)" }}>{title}</h3>
    </div>
    <p className="text-xs mb-5 ml-11" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{description}</p>
    <div className="space-y-4">{children}</div>
    {onSave && (
      <div className="mt-5 flex justify-end">
        <button onClick={onSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(330 80% 55%)", color: "hsl(0 0% 100%)" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>
    )}
  </div>
);

const tabs = [
  { key: "general", label: "Allgemein", icon: Settings },
  { key: "profile", label: "Mein Profil", icon: User },
  { key: "users", label: "Benutzerverwaltung", icon: Users },
];

const SettingsAdmin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [company, setCompany] = useState<CompanyData>(emptyCompany);
  const [invoice, setInvoice] = useState<InvoiceData>(emptyInvoice);
  const [emailSettings, setEmailSettings] = useState<EmailData>(emptyEmail);
  const [profile, setProfile] = useState<ProfileData>({ display_name: "", avatar_url: "" });
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("user");
  const [addingUser, setAddingUser] = useState(false);

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
      // Load profile
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).single();
        if (profileData) setProfile({ display_name: profileData.display_name || "", avatar_url: profileData.avatar_url || "" });
      }
      setLoading(false);
    };
    load();
    loadUserRoles();
  }, []);

  const loadUserRoles = async () => {
    const { data: roles } = await supabase.from("user_roles").select("*");
    if (!roles) { setUserRoles([]); return; }
    // Fetch profiles for display names
    const userIds = [...new Set(roles.map(r => r.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
    const profileMap: Record<string, string> = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p.display_name || ""; });
    setUserRoles(roles.map(r => ({ ...r, display_name: profileMap[r.user_id] || "", email: profileMap[r.user_id] || r.user_id })));
  };

  const save = async (key: string, value: any, setSaving: (v: boolean) => void) => {
    setSaving(true);
    const { error } = await supabase.from("settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    setSaving(false);
    if (error) toast.error("Fehler beim Speichern");
    else toast.success("Einstellungen gespeichert");
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ display_name: profile.display_name, avatar_url: profile.avatar_url, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    setSavingProfile(false);
    if (error) toast.error("Fehler beim Speichern");
    else toast.success("Profil aktualisiert");
  };

  const removeRole = async (roleId: string) => {
    if (!confirm("Rolle wirklich entfernen?")) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) toast.error(error.message);
    else { toast.success("Rolle entfernt"); loadUserRoles(); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;

  const setC = (field: keyof CompanyData) => (v: string) => setCompany((p) => ({ ...p, [field]: v }));

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="w-5 h-5" style={{ color: "hsl(330 80% 55%)" }} />
        <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)" }}>Einstellungen</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center"
            style={{
              background: activeTab === t.key ? "hsl(330 80% 55% / 0.15)" : "transparent",
              color: activeTab === t.key ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
            }}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === "general" && (
        <>
          <SectionCard icon={Building2} title="Firmendaten" description="Diese Daten werden auf Rechnungen und in E-Mails verwendet." onSave={() => save("company", company, setSavingCompany)} saving={savingCompany}>
            <Field label="Firmenname" value={company.name} onChange={setC("name")} placeholder="SMEA GmbH" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Straße & Hausnr." value={company.address} onChange={setC("address")} placeholder="Musterstraße 1" />
              <div className="grid grid-cols-3 gap-3">
                <Field label="PLZ" value={company.zip} onChange={setC("zip")} placeholder="12345" />
                <div className="col-span-2"><Field label="Stadt" value={company.city} onChange={setC("city")} placeholder="Berlin" /></div>
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

          <SectionCard icon={Mail} title="E-Mail Versand" description="Konfiguration für den Ticketversand per E-Mail." onSave={() => save("email", emailSettings, setSavingEmail)} saving={savingEmail}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Absender-Name" value={emailSettings.sender_name} onChange={(v) => setEmailSettings((p) => ({ ...p, sender_name: v }))} placeholder="Tickets" />
              <Field label="Absender-Domain" value={emailSettings.sender_domain} onChange={(v) => setEmailSettings((p) => ({ ...p, sender_domain: v }))} placeholder="gimmegimmeparty.com" />
            </div>
            <Field label="Antwort-Adresse (Reply-To)" value={emailSettings.reply_to} onChange={(v) => setEmailSettings((p) => ({ ...p, reply_to: v }))} placeholder="info@gimmegimmeparty.com" type="email" />
          </SectionCard>
        </>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <SectionCard icon={User} title="Mein Profil" description="Dein persönliches Admin-Profil." onSave={saveProfile} saving={savingProfile}>
          <Field label="Anzeigename" value={profile.display_name} onChange={(v) => setProfile(p => ({ ...p, display_name: v }))} placeholder="Max Mustermann" />
          <Field label="Avatar URL (optional)" value={profile.avatar_url} onChange={(v) => setProfile(p => ({ ...p, avatar_url: v }))} placeholder="https://..." />
          {profile.avatar_url && (
            <div className="flex items-center gap-3">
              <img src={profile.avatar_url} alt="Avatar" className="w-12 h-12 rounded-full object-cover" style={{ border: "2px solid hsl(0 0% 100% / 0.1)" }} />
              <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Vorschau</span>
            </div>
          )}
          <div className="rounded-xl p-4" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
            <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              <strong style={{ color: "hsl(0 0% 100% / 0.6)" }}>E-Mail:</strong> {user?.email}
            </p>
            <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              <strong style={{ color: "hsl(0 0% 100% / 0.6)" }}>User-ID:</strong> <span className="font-mono text-[10px]">{user?.id}</span>
            </p>
          </div>
        </SectionCard>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <SectionCard icon={Shield} title="Benutzerverwaltung" description="Verwalte Benutzerrollen und Zugriffsrechte.">
          {/* Existing roles */}
          <div className="space-y-2">
            {userRoles.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Rollen gefunden</p>
            ) : (
              userRoles.map(r => (
                <div key={r.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase" style={{ background: r.role === "admin" ? "hsl(330 80% 55% / 0.2)" : r.role === "scanner" ? "hsl(200 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.08)", color: r.role === "admin" ? "hsl(330 80% 55%)" : r.role === "scanner" ? "hsl(200 80% 55%)" : "hsl(0 0% 100% / 0.5)" }}>
                    {r.role[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "hsl(0 0% 100%)" }}>{r.display_name || r.user_id}</p>
                    <p className="text-[10px] font-mono" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{r.user_id}</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{
                    background: r.role === "admin" ? "hsl(330 80% 55% / 0.15)" : r.role === "scanner" ? "hsl(200 80% 55% / 0.15)" : r.role === "moderator" ? "hsl(270 60% 55% / 0.15)" : "hsl(0 0% 100% / 0.08)",
                    color: r.role === "admin" ? "hsl(330 80% 55%)" : r.role === "scanner" ? "hsl(200 80% 55%)" : r.role === "moderator" ? "hsl(270 60% 55%)" : "hsl(0 0% 100% / 0.5)",
                  }}>
                    {r.role}
                  </span>
                  <button onClick={() => removeRole(r.id)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Invite by email */}
          <div className="rounded-xl p-4 mt-4" style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Per E-Mail einladen</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label style={{ ...labelStyle, fontSize: "10px" }}>E-Mail</label>
                <input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="name@beispiel.de" type="email" style={{ ...inputStyle, fontSize: "12px" }} />
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: "10px" }}>Rolle</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ ...inputStyle, fontSize: "12px", colorScheme: "dark", backgroundColor: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>
                  <option value="user" style={{ background: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>User</option>
                  <option value="admin" style={{ background: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>Admin</option>
                  <option value="moderator" style={{ background: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>Moderator</option>
                  <option value="scanner" style={{ background: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>Scanner</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  disabled={addingUser || !newUserEmail.trim()}
                  onClick={async () => {
                    setAddingUser(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("invite-user", {
                        body: { email: newUserEmail.trim(), role: newUserRole },
                      });
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      toast.success(data?.message || "Einladung gesendet");
                      setNewUserEmail("");
                      loadUserRoles();
                    } catch (err: any) {
                      toast.error(err.message || "Fehler beim Einladen");
                    }
                    setAddingUser(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold w-full justify-center disabled:opacity-50"
                  style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
                >
                  {addingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Einladen
                </button>
              </div>
            </div>
            <p className="text-[10px] mt-2" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
              Der Benutzer erhält eine E-Mail mit einem Registrierungslink und bekommt die Rolle automatisch zugewiesen.
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
};

export default SettingsAdmin;
