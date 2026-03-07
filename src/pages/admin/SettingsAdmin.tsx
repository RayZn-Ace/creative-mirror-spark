import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Settings, Building2, FileText, Mail, Save, Loader2, User, Users, Shield, Trash2, Plus, Lock, Check, X, Palette, Edit3 } from "lucide-react";

interface CompanyData {
  name: string; address: string; zip: string; city: string; country: string;
  vat_id: string; managing_director: string; email: string; phone: string;
  bank_name: string; iban: string; bic: string;
}
interface InvoiceData { prefix: string; next_number: number; }
interface EmailData { sender_name: string; sender_domain: string; reply_to: string; }
interface ProfileData { display_name: string; avatar_url: string; }
interface UserRoleRow { id: string; user_id: string; role: string; created_at: string; email?: string; display_name?: string; }
interface EditingUser { userId: string; currentRole: string; newRole: string; }
interface PermissionRow { id: string; role: string; permission: string; granted: boolean; }
interface CustomRole { id: string; name: string; display_name: string; color: string; is_system: boolean; }

const emptyCompany: CompanyData = { name: "", address: "", zip: "", city: "", country: "Deutschland", vat_id: "", managing_director: "", email: "", phone: "", bank_name: "", iban: "", bic: "" };
const emptyInvoice: InvoiceData = { prefix: "RE", next_number: 1 };
const emptyEmail: EmailData = { sender_name: "Tickets", sender_domain: "", reply_to: "" };

const inputStyle = { background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", width: "100%", outline: "none", transition: "border-color 0.2s" };
const labelStyle = { color: "hsl(0 0% 100% / 0.5)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: "4px", display: "block" };

const Field = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} className="focus:border-blue-500" />
  </div>
);

const SectionCard = ({ icon: Icon, title, description, children, onSave, saving }: { icon: any; title: string; description: string; children: React.ReactNode; onSave?: () => void; saving?: boolean }) => (
  <div className="rounded-2xl p-6" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
    <div className="flex items-center gap-3 mb-1">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(230 80% 56% / 0.15)" }}>
        <Icon className="w-4 h-4" style={{ color: "hsl(230 80% 56%)" }} />
      </div>
      <h3 className="text-base font-bold" style={{ color: "hsl(0 0% 100%)" }}>{title}</h3>
    </div>
    <p className="text-xs mb-5 ml-11" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{description}</p>
    <div className="space-y-4">{children}</div>
    {onSave && (
      <div className="mt-5 flex justify-end">
        <button onClick={onSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50" style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Speichern
        </button>
      </div>
    )}
  </div>
);

// Permission categories
const PERMISSION_GROUPS: { label: string; icon: string; permissions: { key: string; label: string }[] }[] = [
  { label: "Dashboard", icon: "📊", permissions: [
    { key: "dashboard.view", label: "Dashboard anzeigen" },
    { key: "dashboard.customize", label: "Dashboard anpassen" },
  ]},
  { label: "Events", icon: "📅", permissions: [
    { key: "events.view", label: "Events anzeigen" },
    { key: "events.create", label: "Events erstellen" },
    { key: "events.edit", label: "Events bearbeiten" },
    { key: "events.delete", label: "Events löschen" },
    { key: "events.publish", label: "Events veröffentlichen" },
  ]},
  { label: "Event-Serien", icon: "📂", permissions: [
    { key: "series.view", label: "Serien anzeigen" },
    { key: "series.create", label: "Serien erstellen" },
    { key: "series.edit", label: "Serien bearbeiten" },
    { key: "series.delete", label: "Serien löschen" },
  ]},
  { label: "Tickets", icon: "🎫", permissions: [
    { key: "tickets.view", label: "Tickets anzeigen" },
    { key: "tickets.create", label: "Tickets erstellen" },
    { key: "tickets.edit", label: "Tickets bearbeiten" },
    { key: "tickets.delete", label: "Tickets löschen" },
    { key: "tickets.issue_free", label: "Gratis-Tickets ausstellen" },
  ]},
  { label: "Bestellungen", icon: "🛒", permissions: [
    { key: "orders.view", label: "Bestellungen anzeigen" },
    { key: "orders.refund", label: "Erstattungen durchführen" },
    { key: "orders.export", label: "Bestellungen exportieren" },
  ]},
  { label: "Kunden", icon: "👥", permissions: [
    { key: "customers.view", label: "Kunden anzeigen" },
    { key: "customers.edit", label: "Kunden bearbeiten" },
    { key: "customers.export", label: "Kunden exportieren" },
    { key: "customers.delete", label: "Kunden löschen" },
  ]},
  { label: "Newsletter", icon: "📧", permissions: [
    { key: "newsletter.view", label: "Newsletter anzeigen" },
    { key: "newsletter.send", label: "Newsletter senden" },
    { key: "newsletter.manage_lists", label: "Listen verwalten" },
    { key: "newsletter.manage_subscribers", label: "Abonnenten verwalten" },
    { key: "newsletter.export", label: "Abonnenten exportieren" },
  ]},
  { label: "Scanner", icon: "📱", permissions: [
    { key: "scanner.view", label: "Scanner anzeigen" },
    { key: "scanner.checkin", label: "Check-in durchführen" },
    { key: "scanner.manage_links", label: "Scanner-Links verwalten" },
  ]},
  { label: "Coupons", icon: "🏷️", permissions: [
    { key: "coupons.view", label: "Coupons anzeigen" },
    { key: "coupons.create", label: "Coupons erstellen" },
    { key: "coupons.edit", label: "Coupons bearbeiten" },
    { key: "coupons.delete", label: "Coupons löschen" },
  ]},
  { label: "Analyse & Umsatz", icon: "📈", permissions: [
    { key: "analytics.view", label: "Analysen anzeigen" },
    { key: "analytics.export", label: "Daten exportieren" },
  ]},
  { label: "Support", icon: "🎧", permissions: [
    { key: "support.view", label: "Tickets anzeigen" },
    { key: "support.respond", label: "Tickets beantworten" },
    { key: "support.manage", label: "Tickets verwalten" },
    { key: "support.delete", label: "Tickets löschen" },
  ]},
  { label: "Werbemanager", icon: "📢", permissions: [
    { key: "ads.view", label: "Werbung anzeigen" },
    { key: "ads.create", label: "Werbung erstellen" },
    { key: "ads.edit", label: "Werbung bearbeiten" },
    { key: "ads.delete", label: "Werbung löschen" },
  ]},
  { label: "Seiten-Inhalte", icon: "📄", permissions: [
    { key: "pages.view", label: "Seiten anzeigen" },
    { key: "pages.edit", label: "Seiten bearbeiten" },
  ]},
  { label: "Tracking & Pixel", icon: "🎯", permissions: [
    { key: "tracking.view", label: "Tracking anzeigen" },
    { key: "tracking.manage", label: "Tracking verwalten" },
  ]},
  { label: "Vorlagen", icon: "🎨", permissions: [
    { key: "templates.view", label: "Vorlagen anzeigen" },
    { key: "templates.edit", label: "Vorlagen bearbeiten" },
  ]},
  { label: "Einstellungen", icon: "⚙️", permissions: [
    { key: "settings.view", label: "Einstellungen anzeigen" },
    { key: "settings.edit", label: "Einstellungen bearbeiten" },
    { key: "settings.manage_users", label: "Benutzer verwalten" },
    { key: "settings.manage_permissions", label: "Rechte verwalten" },
  ]},
];

const PRESET_COLORS = ["#e6457a", "#8b5cf6", "#38bdf8", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#6366f1", "#14b8a6", "#f97316"];

const tabs = [
  { key: "general", label: "Allgemein", icon: Settings },
  { key: "profile", label: "Mein Profil", icon: User },
  { key: "users", label: "Benutzer", icon: Users },
  { key: "permissions", label: "Rechte", icon: Lock },
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
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [savingRole, setSavingRole] = useState(false);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  // Permissions state
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [togglingPerm, setTogglingPerm] = useState<string | null>(null);
  const [selectedPermRole, setSelectedPermRole] = useState<string>("moderator");
  // Custom roles
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [showNewRole, setShowNewRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDisplayName, setNewRoleDisplayName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState("#8b5cf6");
  const [creatingRole, setCreatingRole] = useState(false);

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
      if (user) {
        const { data: profileData } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).single();
        if (profileData) setProfile({ display_name: profileData.display_name || "", avatar_url: profileData.avatar_url || "" });
      }
      setLoading(false);
    };
    load();
    loadUserRoles();
  }, []);

  useEffect(() => {
    if (activeTab === "permissions") {
      loadPermissions();
      loadCustomRoles();
    }
  }, [activeTab]);

  const loadUserRoles = async () => {
    const { data: roles } = await supabase.from("user_roles").select("*");
    if (!roles) { setUserRoles([]); return; }
    const userIds = [...new Set(roles.map(r => r.user_id))];
    // Fetch profiles
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
    const profileMap: Record<string, string> = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p.display_name || ""; });
    // Fetch emails from auth via edge function
    let emailMap: Record<string, { email: string; display_name: string | null }> = {};
    try {
      const { data } = await supabase.functions.invoke("list-users", { body: { userIds } });
      if (data?.users) emailMap = data.users;
    } catch {}
    setUserRoles(roles.map(r => ({
      ...r,
      display_name: profileMap[r.user_id] || emailMap[r.user_id]?.display_name || "",
      email: emailMap[r.user_id]?.email || r.user_id,
    })));
  };

  const loadPermissions = async () => {
    setPermissionsLoading(true);
    const { data, error } = await supabase.from("role_permissions").select("*");
    if (error) { toast.error("Fehler beim Laden der Rechte"); console.error(error); }
    else setPermissions(data || []);
    setPermissionsLoading(false);
  };

  const loadCustomRoles = async () => {
    const { data } = await supabase.from("custom_roles").select("*").order("is_system", { ascending: false }).order("created_at");
    if (data) setCustomRoles(data as CustomRole[]);
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

  const deleteUserCompletely = async (userId: string) => {
    if (!confirm("Diesen Benutzer wirklich komplett löschen? Das kann nicht rückgängig gemacht werden!")) return;
    setDeletingUser(userId);
    try {
      // Delete user roles first
      await supabase.from("user_roles").delete().eq("user_id", userId);
      // Delete profile
      await supabase.from("profiles").delete().eq("user_id", userId);
      // Delete auth user via edge function
      const { data, error } = await supabase.functions.invoke("delete-users", {
        body: { userIds: [userId] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Benutzer komplett gelöscht");
      loadUserRoles();
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Löschen");
    }
    setDeletingUser(null);
  };

  const changeUserRole = async () => {
    if (!editingUser) return;
    setSavingRole(true);
    try {
      // Delete old role
      const { error: delError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", editingUser.userId)
        .eq("role", editingUser.currentRole as any);
      if (delError) throw delError;
      // Insert new role
      const { error: insError } = await supabase
        .from("user_roles")
        .insert({ user_id: editingUser.userId, role: editingUser.newRole as any });
      if (insError) throw insError;
      toast.success("Rolle geändert");
      setEditingUser(null);
      loadUserRoles();
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Ändern");
    }
    setSavingRole(false);
  };

  const togglePermission = useCallback(async (role: string, permission: string, currentGranted: boolean) => {
    const key = `${role}:${permission}`;
    setTogglingPerm(key);
    
    const existing = permissions.find(p => p.role === role && p.permission === permission);
    
    if (existing) {
      const { error } = await supabase
        .from("role_permissions")
        .update({ granted: !currentGranted, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) { toast.error("Fehler"); setTogglingPerm(null); return; }
    } else {
      const { error } = await supabase
        .from("role_permissions")
        .insert({ role: role as any, permission, granted: true });
      if (error) { toast.error("Fehler"); setTogglingPerm(null); return; }
    }
    
    setPermissions(prev => {
      if (existing) {
        return prev.map(p => p.id === existing.id ? { ...p, granted: !currentGranted } : p);
      }
      return [...prev, { id: crypto.randomUUID(), role, permission, granted: true }];
    });
    setTogglingPerm(null);
  }, [permissions]);

  const isGranted = useCallback((role: string, permission: string) => {
    const p = permissions.find(pr => pr.role === role && pr.permission === permission);
    return p?.granted ?? false;
  }, [permissions]);

  const grantAllForRole = async (role: string) => {
    const allPerms = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));
    for (const permission of allPerms) {
      await supabase
        .from("role_permissions")
        .upsert({ role: role as any, permission, granted: true, updated_at: new Date().toISOString() }, { onConflict: "role,permission" });
    }
    toast.success(`Alle Rechte für ${role} aktiviert`);
    loadPermissions();
  };

  const revokeAllForRole = async (role: string) => {
    if (!confirm(`Wirklich alle Rechte für "${role}" entziehen?`)) return;
    const { error } = await supabase
      .from("role_permissions")
      .update({ granted: false, updated_at: new Date().toISOString() })
      .eq("role", role as any);
    if (error) toast.error("Fehler");
    else { toast.success(`Alle Rechte für ${role} deaktiviert`); loadPermissions(); }
  };

  const createRole = async () => {
    if (!newRoleDisplayName.trim()) return;
    setCreatingRole(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-roles", {
        body: {
          action: "create",
          name: newRoleName.trim() || newRoleDisplayName.trim().toLowerCase().replace(/[^a-z0-9äöüß]/gi, "_").replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss"),
          display_name: newRoleDisplayName.trim(),
          color: newRoleColor,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Rolle erstellt");
      setNewRoleName("");
      setNewRoleDisplayName("");
      setNewRoleColor("#8b5cf6");
      setShowNewRole(false);
      loadCustomRoles();
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Erstellen");
    }
    setCreatingRole(false);
  };

  const deleteRole = async (roleName: string) => {
    if (!confirm(`Rolle "${roleName}" wirklich löschen? Alle zugehörigen Rechte werden entfernt.`)) return;
    try {
      const { data, error } = await supabase.functions.invoke("manage-roles", {
        body: { action: "delete", name: roleName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Rolle gelöscht");
      loadCustomRoles();
      loadPermissions();
      if (selectedPermRole === roleName) setSelectedPermRole("admin");
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Löschen");
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;

  const setC = (field: keyof CompanyData) => (v: string) => setCompany((p) => ({ ...p, [field]: v }));

  const grantedCount = (role: string) => permissions.filter(p => p.role === role && p.granted).length;
  const totalPerms = PERMISSION_GROUPS.reduce((acc, g) => acc + g.permissions.length, 0);

  const getRoleColor = (roleName: string) => {
    const cr = customRoles.find(r => r.name === roleName);
    return cr?.color || "#888888";
  };
  const getRoleDisplay = (roleName: string) => {
    const cr = customRoles.find(r => r.name === roleName);
    return cr?.display_name || roleName;
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="w-5 h-5" style={{ color: "hsl(230 80% 56%)" }} />
        <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100%)" }}>Einstellungen</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl overflow-x-auto" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center whitespace-nowrap"
            style={{
              background: activeTab === t.key ? "hsl(230 80% 56% / 0.15)" : "transparent",
              color: activeTab === t.key ? "hsl(230 80% 56%)" : "hsl(0 0% 100% / 0.5)",
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
          <div className="space-y-2">
            {userRoles.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Rollen gefunden</p>
            ) : (
              userRoles.map(r => {
                const color = getRoleColor(r.role);
                const isEditing = editingUser?.userId === r.user_id && editingUser?.currentRole === r.role;
                const isDeleting = deletingUser === r.user_id;
                return (
                  <div key={r.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold uppercase" style={{ background: `${color}22`, color }}>
                      {r.role[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "hsl(0 0% 100%)" }}>{r.display_name || r.email || "Unbekannt"}</p>
                      <p className="text-[11px] truncate" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{r.email && r.email !== r.user_id ? r.email : ""}</p>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingUser.newRole}
                          onChange={e => setEditingUser({ ...editingUser, newRole: e.target.value })}
                          style={{ ...inputStyle, fontSize: "11px", padding: "4px 8px", width: "auto", minWidth: "100px", colorScheme: "dark", backgroundColor: "hsl(220 50% 10%)" }}
                        >
                          {customRoles.length > 0 ? customRoles.map(cr => (
                            <option key={cr.name} value={cr.name}>{cr.display_name}</option>
                          )) : (
                            <>
                              <option value="admin">Admin</option>
                              <option value="moderator">Moderator</option>
                              <option value="user">User</option>
                              <option value="scanner">Scanner</option>
                            </>
                          )}
                        </select>
                        <button onClick={changeUserRole} disabled={savingRole} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: "hsl(140 60% 50%)" }}>
                          {savingRole ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>
                          {getRoleDisplay(r.role)}
                        </span>
                        <button onClick={() => setEditingUser({ userId: r.user_id, currentRole: r.role, newRole: r.role })} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }} title="Rolle ändern">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteUserCompletely(r.user_id)} disabled={isDeleting} className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-50" style={{ color: "hsl(0 70% 55%)" }} title="Benutzer komplett löschen">
                          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                );
              })
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
                  {customRoles.map(r => (
                    <option key={r.name} value={r.name} style={{ background: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>
                      {r.display_name}
                    </option>
                  ))}
                  {customRoles.length === 0 && (
                    <>
                      <option value="user" style={{ background: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>User</option>
                      <option value="admin" style={{ background: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>Admin</option>
                      <option value="moderator" style={{ background: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>Moderator</option>
                      <option value="scanner" style={{ background: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>Scanner</option>
                    </>
                  )}
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
                  style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}
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

      {/* Permissions Tab */}
      {activeTab === "permissions" && (
        <div className="space-y-6">
          {/* Roles management card */}
          <SectionCard icon={Palette} title="Rollen verwalten" description="Erstelle und verwalte benutzerdefinierte Rollen.">
            <div className="flex flex-wrap gap-2">
              {customRoles.map(role => (
                <div
                  key={role.name}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                  style={{ background: `${role.color}15`, border: `1px solid ${role.color}40` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: role.color }} />
                  <span className="font-bold" style={{ color: role.color }}>{role.display_name}</span>
                  {role.is_system && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.3)" }}>System</span>
                  )}
                  {!role.is_system && (
                    <button
                      onClick={() => deleteRole(role.name)}
                      className="p-0.5 rounded hover:bg-white/10 transition-all"
                      style={{ color: "hsl(0 70% 55%)" }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {!showNewRole ? (
                <button
                  onClick={() => setShowNewRole(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/5"
                  style={{ border: "1px dashed hsl(0 0% 100% / 0.15)", color: "hsl(0 0% 100% / 0.4)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Neue Rolle
                </button>
              ) : (
                <div className="w-full rounded-xl p-4 mt-2" style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Neue Rolle erstellen</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label style={{ ...labelStyle, fontSize: "10px" }}>Anzeigename</label>
                      <input
                        value={newRoleDisplayName}
                        onChange={e => setNewRoleDisplayName(e.target.value)}
                        placeholder="z.B. Promoter, Kassenpersonal..."
                        style={{ ...inputStyle, fontSize: "12px" }}
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "10px" }}>Interner Name (optional)</label>
                      <input
                        value={newRoleName}
                        onChange={e => setNewRoleName(e.target.value)}
                        placeholder="Wird auto-generiert"
                        style={{ ...inputStyle, fontSize: "12px" }}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label style={{ ...labelStyle, fontSize: "10px" }}>Farbe</label>
                    <div className="flex gap-2 mt-1">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setNewRoleColor(c)}
                          className="w-7 h-7 rounded-full transition-all"
                          style={{
                            background: c,
                            outline: newRoleColor === c ? `2px solid ${c}` : "2px solid transparent",
                            outlineOffset: "2px",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={createRole}
                      disabled={creatingRole || !newRoleDisplayName.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                      style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
                    >
                      {creatingRole ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Erstellen
                    </button>
                    <button
                      onClick={() => { setShowNewRole(false); setNewRoleDisplayName(""); setNewRoleName(""); }}
                      className="px-4 py-2 rounded-xl text-sm"
                      style={{ color: "hsl(0 0% 100% / 0.5)" }}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Permissions matrix */}
          <SectionCard icon={Lock} title="Rechteverwaltung" description="Verwalte granulare Berechtigungen für jede Rolle. Wähle eine Rolle und passe die Rechte an.">
            {permissionsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
              </div>
            ) : (
              <>
                {/* Role selector */}
                <div className="flex gap-2 flex-wrap">
                  {customRoles.map(role => (
                    <button
                      key={role.name}
                      onClick={() => setSelectedPermRole(role.name)}
                      className="px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
                      style={{
                        background: selectedPermRole === role.name ? `${role.color}22` : "hsl(0 0% 100% / 0.04)",
                        color: selectedPermRole === role.name ? role.color : "hsl(0 0% 100% / 0.4)",
                        border: selectedPermRole === role.name ? `1px solid ${role.color}` : "1px solid hsl(0 0% 100% / 0.08)",
                      }}
                    >
                      {role.display_name}
                    </button>
                  ))}
                </div>

                {/* Stats bar */}
                <div className="flex items-center justify-between rounded-xl p-3 flex-wrap gap-2" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: getRoleColor(selectedPermRole) }} />
                    <span className="text-sm font-bold uppercase" style={{ color: getRoleColor(selectedPermRole) }}>
                      {getRoleDisplay(selectedPermRole)}
                    </span>
                    <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                      — {grantedCount(selectedPermRole)} / {totalPerms} Rechte aktiv
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => grantAllForRole(selectedPermRole)}
                      className="text-[10px] font-bold uppercase px-3 py-1 rounded-lg transition-all hover:opacity-80"
                      style={{ background: "hsl(140 60% 40% / 0.15)", color: "hsl(140 60% 50%)" }}
                    >
                      Alle aktivieren
                    </button>
                    <button
                      onClick={() => revokeAllForRole(selectedPermRole)}
                      className="text-[10px] font-bold uppercase px-3 py-1 rounded-lg transition-all hover:opacity-80"
                      style={{ background: "hsl(0 60% 40% / 0.15)", color: "hsl(0 60% 50%)" }}
                    >
                      Alle deaktivieren
                    </button>
                  </div>
                </div>

                {/* Permission groups */}
                <div className="space-y-3">
                  {PERMISSION_GROUPS.map(group => {
                    const groupGranted = group.permissions.filter(p => isGranted(selectedPermRole, p.key)).length;
                    const allGranted = groupGranted === group.permissions.length;
                    const someGranted = groupGranted > 0 && !allGranted;

                    return (
                      <div key={group.label} className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                        <div className="flex items-center justify-between px-4 py-3" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
                          <div className="flex items-center gap-3">
                            <span className="text-base">{group.icon}</span>
                            <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{group.label}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                              background: allGranted ? "hsl(140 60% 40% / 0.15)" : someGranted ? "hsl(45 90% 50% / 0.15)" : "hsl(0 0% 100% / 0.06)",
                              color: allGranted ? "hsl(140 60% 50%)" : someGranted ? "hsl(45 90% 50%)" : "hsl(0 0% 100% / 0.4)",
                            }}>
                              {groupGranted}/{group.permissions.length}
                            </span>
                          </div>
                        </div>
                        <div className="divide-y" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
                          {group.permissions.map(perm => {
                            const granted = isGranted(selectedPermRole, perm.key);
                            const toggling = togglingPerm === `${selectedPermRole}:${perm.key}`;
                            return (
                              <div
                                key={perm.key}
                                className="flex items-center justify-between px-4 py-2.5 transition-all hover:bg-white/[0.02]"
                                style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{
                                    background: granted ? "hsl(140 60% 40% / 0.2)" : "hsl(0 0% 100% / 0.06)",
                                  }}>
                                    {granted ? (
                                      <Check className="w-3 h-3" style={{ color: "hsl(140 60% 50%)" }} />
                                    ) : (
                                      <X className="w-3 h-3" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
                                    )}
                                  </div>
                                  <span className="text-xs" style={{ color: granted ? "hsl(0 0% 100% / 0.9)" : "hsl(0 0% 100% / 0.4)" }}>
                                    {perm.label}
                                  </span>
                                </div>
                                <button
                                  onClick={() => togglePermission(selectedPermRole, perm.key, granted)}
                                  disabled={toggling}
                                  className="relative w-10 h-5 rounded-full transition-all duration-200"
                                  style={{
                                    background: granted ? "hsl(140 60% 40%)" : "hsl(0 0% 100% / 0.1)",
                                  }}
                                >
                                  {toggling && (
                                    <Loader2 className="w-3 h-3 animate-spin absolute inset-0 m-auto" style={{ color: "hsl(0 0% 100%)" }} />
                                  )}
                                  <div
                                    className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
                                    style={{
                                      background: "hsl(0 0% 100%)",
                                      left: granted ? "calc(100% - 18px)" : "2px",
                                      opacity: toggling ? 0.3 : 1,
                                    }}
                                  />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
};

export default SettingsAdmin;
