import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Layers, Mail, Loader2, Trash2 } from "lucide-react";

interface SeriesRow { id: string; title: string }
interface AssignmentRow { id: string; user_id: string; series_id: string; email?: string }

const inputStyle = { background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px", width: "100%", outline: "none" };
const labelStyle = { color: "hsl(0 0% 100% / 0.5)", fontSize: "10px", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: "4px", display: "block" };

const SeriesManagersSection = () => {
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [email, setEmail] = useState("");
  const [seriesId, setSeriesId] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data: s } = await supabase.from("event_series").select("id, title").order("title");
    setSeries((s ?? []) as SeriesRow[]);
    setSeriesId((prev) => prev || (s?.[0]?.id ?? ""));

    const { data: assignments } = await supabase.from("series_managers").select("id, user_id, series_id");
    const list = (assignments ?? []) as AssignmentRow[];
    const userIds = [...new Set(list.map((r) => r.user_id))];
    if (userIds.length) {
      const { data } = await supabase.functions.invoke("list-users", { body: { userIds } });
      const users: any[] = data?.users ?? [];
      list.forEach((r) => { r.email = users.find((u) => u.id === r.user_id)?.email; });
    }
    setRows(list);
  }, []);

  useEffect(() => { load(); }, [load]);

  const invite = async () => {
    if (!email.trim() || !seriesId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email: email.trim(), role: "user", series_ids: [seriesId] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data?.message || "Einladung gesendet");
      setEmail("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Einladen");
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Zugriff wirklich entfernen?")) return;
    const { error } = await supabase.from("series_managers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Zugriff entfernt"); load(); }
  };

  return (
    <div className="rounded-2xl p-6" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(270 70% 55% / 0.15)" }}>
          <Layers className="w-4 h-4" style={{ color: "hsl(270 70% 55%)" }} />
        </div>
        <h3 className="text-base font-bold" style={{ color: "hsl(0 0% 100%)" }}>Serien-Mitarbeiter</h3>
      </div>
      <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
        Diese Mitarbeiter sehen ausschließlich den Ticket-Stand ihrer zugewiesenen Eventreihe – keine anderen Reihen, keine Umsätze.
      </p>

      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-sm py-3 text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Noch keine Serien-Mitarbeiter</p>
        )}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{r.email || r.user_id}</p>
              <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                {series.find((s) => s.id === r.series_id)?.title || "Unbekannte Reihe"}
              </p>
            </div>
            <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 60% 55%)" }} title="Zugriff entfernen">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 mt-4" style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Mitarbeiter für eine Reihe einladen</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label style={labelStyle}>E-Mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="name@beispiel.de" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Eventreihe</label>
            <select value={seriesId} onChange={(e) => setSeriesId(e.target.value)} style={{ ...inputStyle, colorScheme: "dark", backgroundColor: "hsl(220 50% 10%)" }}>
              {series.map((s) => (
                <option key={s.id} value={s.id} style={{ background: "hsl(220 50% 10%)", color: "hsl(0 0% 100%)" }}>{s.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              disabled={saving || !email.trim() || !seriesId}
              onClick={invite}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold w-full justify-center disabled:opacity-50"
              style={{ background: "hsl(270 70% 55%)", color: "hsl(0 0% 100%)" }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Einladen
            </button>
          </div>
        </div>
        <p className="text-[10px] mt-2" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
          Existiert der Benutzer bereits, wird die Reihe sofort freigeschaltet – sonst nach der Registrierung über den Einladungslink.
        </p>
      </div>
    </div>
  );
};

export default SeriesManagersSection;
