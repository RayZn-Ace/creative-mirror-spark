import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Handshake, Plus, Trash2, Loader2, KeyRound, Power, Layers } from "lucide-react";
import { PARTNER_PERMISSIONS } from "@/lib/partnerPermissions";

interface Partner {
  id: string;
  user_id: string | null;
  email: string;
  name: string;
  company: string | null;
  notes: string | null;
  permissions: string[];
  series_ids: string[];
  active: boolean;
  created_at: string;
}

interface SeriesRow {
  id: string;
  title: string;
}

const emptyForm = {
  name: "",
  email: "",
  company: "",
  notes: "",
  password: "",
  permissions: [] as string[],
  series_ids: [] as string[],
};

const PURPLE = "hsl(270 70% 55%)";

const inputStyle: React.CSSProperties = {
  background: "hsl(0 0% 100% / 0.06)",
  border: "1px solid hsl(0 0% 100% / 0.1)",
  color: "hsl(0 0% 100%)",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "13px",
  width: "100%",
  outline: "none",
};

const cardStyle: React.CSSProperties = {
  background: "hsl(0 0% 100% / 0.03)",
  border: "1px solid hsl(0 0% 100% / 0.06)",
};

const Tile = ({
  active,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left rounded-xl p-3 transition-all"
    style={{
      background: active ? "hsl(270 70% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)",
      border: `1px solid ${active ? PURPLE : "hsl(0 0% 100% / 0.08)"}`,
    }}
  >
    <span className="block text-xs font-bold" style={{ color: active ? PURPLE : "hsl(0 0% 100% / 0.85)" }}>
      {title}
    </span>
    {subtitle && (
      <span className="block text-[10px] mt-0.5 leading-snug" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
        {subtitle}
      </span>
    )}
  </button>
);

const PartnerAdmin = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [pwEdit, setPwEdit] = useState<{ id: string; value: string } | null>(null);

  const call = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("manage-partners", { body });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as any;
  }, []);

  const load = useCallback(async () => {
    try {
      const [data, { data: s }] = await Promise.all([
        call({ action: "list" }),
        supabase.from("event_series").select("id, title").order("title"),
      ]);
      setPartners(data.partners ?? []);
      setSeries((s ?? []) as SeriesRow[]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (partner: Partner, updates: Partial<Partner>) => {
    setPartners((prev) => prev.map((p) => (p.id === partner.id ? { ...p, ...updates } : p)));
    try {
      await call({ action: "update", id: partner.id, ...updates });
    } catch (e) {
      toast.error((e as Error).message);
      load();
    }
  };

  const togglePermission = (partner: Partner, key: string) => {
    const cur = partner.permissions ?? [];
    patch(partner, { permissions: cur.includes(key) ? cur.filter((p) => p !== key) : [...cur, key] });
  };

  const toggleSeries = (partner: Partner, id: string) => {
    const cur = partner.series_ids ?? [];
    patch(partner, { series_ids: cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id] });
  };

  const toggleActive = async (partner: Partner) => {
    try {
      await call({ action: "update", id: partner.id, active: !partner.active });
      toast.success(partner.active ? "Zugang deaktiviert" : "Zugang aktiviert");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const remove = async (partner: Partner) => {
    if (!confirm(`Partner "${partner.name}" wirklich löschen?`)) return;
    try {
      await call({ action: "delete", id: partner.id, delete_account: true });
      toast.success("Partner gelöscht");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const savePassword = async () => {
    if (!pwEdit) return;
    if (pwEdit.value.trim().length < 8) {
      toast.error("Passwort muss mindestens 8 Zeichen haben");
      return;
    }
    try {
      await call({ action: "update", id: pwEdit.id, password: pwEdit.value.trim() });
      toast.success("Passwort aktualisiert");
      setPwEdit(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const create = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name und E-Mail sind Pflichtfelder");
      return;
    }
    if (form.password.trim().length < 8) {
      toast.error("Passwort muss mindestens 8 Zeichen haben");
      return;
    }
    setSaving(true);
    try {
      await call({
        action: "create",
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
      });
      toast.success("Partner angelegt");
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black" style={{ color: "hsl(0 0% 100%)" }}>
            <Handshake className="w-6 h-6" style={{ color: PURPLE }} /> Partner-Portal
          </h1>
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
            Partner anlegen, Kacheln freischalten und Eventreihen zuweisen. Login unter{" "}
            <code style={{ color: PURPLE }}>/partnerbereich</code>
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: PURPLE, color: "hsl(0 0% 100%)" }}
        >
          <Plus className="w-4 h-4" /> Neuer Partner
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-5 space-y-4" style={cardStyle}>
          <div className="grid gap-3 sm:grid-cols-2">
            <input style={inputStyle} placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input style={inputStyle} placeholder="E-Mail *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input style={inputStyle} placeholder="Firma" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <input style={inputStyle} placeholder="Passwort (min. 8 Zeichen) *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Notizen" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Sichtbare Kacheln
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {PARTNER_PERMISSIONS.map((p) => (
                <Tile
                  key={p.key}
                  active={form.permissions.includes(p.key)}
                  title={p.label}
                  subtitle={p.description}
                  onClick={() =>
                    setForm({
                      ...form,
                      permissions: form.permissions.includes(p.key)
                        ? form.permissions.filter((k) => k !== p.key)
                        : [...form.permissions, p.key],
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              <Layers className="w-3 h-3" /> Eventreihen (keine Auswahl = alle)
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {series.map((s) => (
                <Tile
                  key={s.id}
                  active={form.series_ids.includes(s.id)}
                  title={s.title}
                  onClick={() =>
                    setForm({
                      ...form,
                      series_ids: form.series_ids.includes(s.id)
                        ? form.series_ids.filter((k) => k !== s.id)
                        : [...form.series_ids, s.id],
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: PURPLE, color: "hsl(0 0% 100%)" }}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Partner anlegen
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{ border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.5)" }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</div>
      ) : partners.length === 0 ? (
        <div className="rounded-2xl p-10 text-center text-sm" style={{ ...cardStyle, borderStyle: "dashed", color: "hsl(0 0% 100% / 0.4)" }}>
          Noch keine Partner angelegt.
        </div>
      ) : (
        <div className="space-y-4">
          {partners.map((partner) => (
            <div key={partner.id} className="rounded-2xl p-5" style={cardStyle}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-black flex items-center gap-2" style={{ color: "hsl(0 0% 100%)" }}>
                    {partner.name}
                    {!partner.active && (
                      <span className="rounded px-2 py-0.5 text-[10px] uppercase" style={{ background: "hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.5)" }}>
                        inaktiv
                      </span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                    {partner.email}
                    {partner.company ? ` · ${partner.company}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPwEdit({ id: partner.id, value: "" })} className="p-2 rounded-lg" style={{ border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.5)" }} title="Passwort ändern">
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(partner)} className="p-2 rounded-lg" style={{ border: "1px solid hsl(0 0% 100% / 0.1)", color: partner.active ? PURPLE : "hsl(0 0% 100% / 0.4)" }} title="Aktiv/Inaktiv">
                    <Power className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(partner)} className="p-2 rounded-lg" style={{ border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 60% 55%)" }} title="Löschen">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {pwEdit?.id === partner.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <input style={{ ...inputStyle, maxWidth: 260 }} placeholder="Neues Passwort" type="password" value={pwEdit.value} onChange={(e) => setPwEdit({ ...pwEdit, value: e.target.value })} />
                  <button onClick={savePassword} className="px-3 py-2 rounded-xl text-sm font-bold" style={{ background: PURPLE, color: "hsl(0 0% 100%)" }}>
                    Speichern
                  </button>
                  <button onClick={() => setPwEdit(null)} className="px-3 py-2 rounded-xl text-sm" style={{ border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.5)" }}>
                    Abbrechen
                  </button>
                </div>
              )}

              <p className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                Sichtbare Kacheln
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {PARTNER_PERMISSIONS.map((p) => (
                  <Tile
                    key={p.key}
                    active={!!partner.permissions?.includes(p.key)}
                    title={p.label}
                    onClick={() => togglePermission(partner, p.key)}
                  />
                ))}
              </div>

              <p className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                <Layers className="w-3 h-3" />
                Eventreihen {partner.series_ids?.length ? "" : "(alle)"}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {series.map((s) => (
                  <Tile
                    key={s.id}
                    active={!!partner.series_ids?.includes(s.id)}
                    title={s.title}
                    onClick={() => toggleSeries(partner, s.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerAdmin;
