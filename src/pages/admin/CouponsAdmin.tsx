import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tag, Plus, Pencil, Trash2, X, Loader2, ToggleLeft, ToggleRight } from "lucide-react";

interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_order_amount: number | null;
  valid_from: string | null;
  valid_until: string | null;
  event_id: string | null;
  active: boolean;
}

interface EventOption { id: string; title: string; date: string | null; }

const emptyCoupon = {
  code: "", description: "", discount_type: "percentage", discount_value: 0,
  max_uses: null as number | null, used_count: 0, min_order_amount: 0,
  valid_from: null as string | null, valid_until: null as string | null,
  event_id: null as string | null, active: true,
};

const inputStyle = {
  background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)",
  color: "hsl(0 0% 100%)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px",
  width: "100%", outline: "none",
};
const labelStyle = { color: "hsl(0 0% 100% / 0.5)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.5px", marginBottom: "4px", display: "block" };

const CouponsAdmin = () => {
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [editing, setEditing] = useState<Partial<CouponRow> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [cRes, eRes] = await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("id, title, date").order("date", { ascending: false }),
    ]);
    setCoupons((cRes.data as CouponRow[]) || []);
    setEvents((eRes.data as EventOption[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing as any;
    if (!rest.code?.trim()) { toast.error("Code ist Pflicht"); return; }
    rest.code = rest.code.toUpperCase().trim();
    if (id) {
      const { error } = await supabase.from("coupons").update(rest).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Coupon aktualisiert");
    } else {
      const { error } = await supabase.from("coupons").insert(rest);
      if (error) { toast.error(error.message); return; }
      toast.success("Coupon erstellt");
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Coupon wirklich löschen?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Coupon gelöscht");
    load();
  };

  const toggleActive = async (c: CouponRow) => {
    await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id);
    load();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(0 0% 100% / 0.3)" }} /></div>;

  if (editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setEditing(null)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}>
            <X className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            {editing.id ? "Coupon bearbeiten" : "Neuer Coupon"}
          </h1>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Code *</label>
              <input value={editing.code || ""} onChange={e => setEditing({ ...editing, code: e.target.value })} placeholder="SOMMER25" style={{ ...inputStyle, textTransform: "uppercase", fontFamily: "monospace", fontWeight: 700 }} />
            </div>
            <div>
              <label style={labelStyle}>Beschreibung</label>
              <input value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Sommerrabatt" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Rabattart</label>
              <select value={editing.discount_type || "percentage"} onChange={e => setEditing({ ...editing, discount_type: e.target.value })} style={{ ...inputStyle, colorScheme: "dark" }}>
                <option value="percentage">Prozent (%)</option>
                <option value="absolute">Festbetrag (€)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Rabattwert</label>
              <input type="number" value={editing.discount_value || 0} onChange={e => setEditing({ ...editing, discount_value: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Mindestbestellwert (€)</label>
              <input type="number" value={editing.min_order_amount || 0} onChange={e => setEditing({ ...editing, min_order_amount: parseFloat(e.target.value) || 0 })} style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Max. Einlösungen (leer = unbegrenzt)</label>
              <input type="number" value={editing.max_uses ?? ""} onChange={e => setEditing({ ...editing, max_uses: e.target.value ? parseInt(e.target.value) : null })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nur für Event (optional)</label>
              <select value={editing.event_id || ""} onChange={e => setEditing({ ...editing, event_id: e.target.value || null })} style={{ ...inputStyle, colorScheme: "dark" }}>
                <option value="">Alle Events</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title} {ev.date ? `(${ev.date})` : ""}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Gültig ab (optional)</label>
              <input type="datetime-local" value={editing.valid_from || ""} onChange={e => setEditing({ ...editing, valid_from: e.target.value || null })} style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
            <div>
              <label style={labelStyle}>Gültig bis (optional)</label>
              <input type="datetime-local" value={editing.valid_until || ""} onChange={e => setEditing({ ...editing, valid_until: e.target.value || null })} style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
              <input type="checkbox" checked={editing.active ?? true} onChange={e => setEditing({ ...editing, active: e.target.checked })} className="rounded w-4 h-4" />
              Aktiv
            </label>
          </div>

          <div className="flex gap-2 pt-3">
            <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>Abbrechen</button>
            <button onClick={save} className="px-6 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(270 70% 55%)", color: "hsl(0 0% 100%)" }}>Speichern</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tag className="w-5 h-5" style={{ color: "hsl(270 70% 55%)" }} />
          <h1 className="text-xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>Coupons & Rabattcodes</h1>
        </div>
        <button onClick={() => setEditing({ ...emptyCoupon })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(270 70% 55%)", color: "hsl(0 0% 100%)" }}>
          <Plus className="w-4 h-4" /> Neuer Coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <Tag className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
          <p className="text-sm mb-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Noch keine Coupons vorhanden</p>
          <button onClick={() => setEditing({ ...emptyCoupon })} className="text-sm font-bold" style={{ color: "hsl(230 80% 56%)" }}>Jetzt ersten Coupon erstellen</button>
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map(c => {
            const eventName = c.event_id ? events.find(e => e.id === c.event_id)?.title : null;
            const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
            const isExhausted = c.max_uses && c.used_count >= c.max_uses;
            return (
              <div key={c.id} className="rounded-xl p-4 flex items-center gap-4" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)", opacity: !c.active || isExpired || isExhausted ? 0.5 : 1 }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold font-mono" style={{ color: "hsl(0 0% 100%)" }}>{c.code}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: c.discount_type === "percentage" ? "hsl(270 60% 55% / 0.15)" : "hsl(142 70% 45% / 0.15)", color: c.discount_type === "percentage" ? "hsl(270 60% 55%)" : "hsl(142 70% 55%)" }}>
                      {c.discount_type === "percentage" ? `${c.discount_value}%` : `${c.discount_value.toFixed(2)} €`}
                    </span>
                    {c.max_uses && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(200 80% 55% / 0.12)", color: "hsl(200 80% 60%)" }}>
                        {c.used_count}/{c.max_uses} genutzt
                      </span>
                    )}
                    {!c.active && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>Inaktiv</span>}
                    {isExpired && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(45 80% 55% / 0.15)", color: "hsl(45 80% 55%)" }}>Abgelaufen</span>}
                    {eventName && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(230 80% 56% / 0.12)", color: "hsl(230 80% 56%)" }}>📅 {eventName}</span>}
                  </div>
                  {c.description && <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{c.description}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleActive(c)} className="p-2 rounded-lg hover:bg-white/5" title={c.active ? "Deaktivieren" : "Aktivieren"} style={{ color: c.active ? "hsl(142 70% 55%)" : "hsl(0 0% 100% / 0.3)" }}>
                    {c.active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditing(c)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(c.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CouponsAdmin;
