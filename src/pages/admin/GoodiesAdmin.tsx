import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gift, Send, Loader2, Sparkles, Beer, Ticket, Percent, Star, Crown } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const NEON = "hsl(270 70% 55%)";

const PRESETS = [
  { key: "drink", title: "Freigetränk an der Bar", desc: "1x Longdrink oder Softdrink kostenlos", icon: "Beer", color: "hsl(190 80% 50%)", type: "freebie", value: 0 },
  { key: "discount10", title: "10% auf dein nächstes Ticket", desc: "Gilt für die nächste Bestellung", icon: "Percent", color: "hsl(330 80% 55%)", type: "voucher", value: 10, value_type: "percent" },
  { key: "vip", title: "VIP-Upgrade", desc: "Kostenloses Upgrade auf VIP für das nächste Event", icon: "Crown", color: "hsl(45 100% 55%)", type: "upgrade", value: 0 },
  { key: "merch", title: "Gratis Goodie-Bag", desc: "An der Garderobe einlösen", icon: "Gift", color: "hsl(270 70% 55%)", type: "freebie", value: 0 },
];

const ICONS: Record<string, any> = { Gift, Beer, Ticket, Percent, Star, Crown, Sparkles };

export default function GoodiesAdmin() {
  const [events, setEvents] = useState<any[]>([]);
  const [goodies, setGoodies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "voucher",
    code: "",
    value: 0,
    value_type: "fixed" as "fixed" | "percent",
    icon: "Gift",
    color: NEON,
    event_id: "",
    expires_at: "",
  });

  const [target, setTarget] = useState<"list" | "all_customers" | "level">("list");
  const [level, setLevel] = useState("gold");
  const [emails, setEmails] = useState("");

  const load = async () => {
    setLoading(true);
    const [ev, gd] = await Promise.all([
      supabase.from("events").select("id, title, date, city").order("date", { ascending: false }).limit(200),
      supabase.from("member_goodies").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setEvents(ev.data || []);
    setGoodies(gd.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const applyPreset = (p: any) => {
    setForm(f => ({
      ...f,
      title: p.title, description: p.desc, type: p.type,
      icon: p.icon, color: p.color, value: p.value || 0,
      value_type: p.value_type || "fixed",
    }));
  };

  const send = async () => {
    if (!form.title.trim()) { toast.error("Titel fehlt"); return; }
    const recipients = target === "list"
      ? emails.split(/[\n,;]/).map(e => e.trim()).filter(Boolean).map(email => ({ email }))
      : [];
    if (target === "list" && recipients.length === 0) { toast.error("Keine E-Mails angegeben"); return; }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("issue-goodies", {
        body: {
          target,
          level: target === "level" ? level : undefined,
          recipients,
          goodie: {
            ...form,
            event_id: form.event_id || null,
            expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          },
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`${(data as any)?.count || 0} Goodies versendet 🎁`);
      setEmails("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Fehler beim Senden");
    } finally {
      setSending(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("Goodie widerrufen?")) return;
    await supabase.from("member_goodies").update({ status: "revoked" } as any).eq("id", id);
    load();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-7 h-7" style={{ color: NEON }} /> Member-Goodies
        </h1>
        <p className="text-sm text-white/60 mt-1">Versende exklusive Goodies an deine Member – Freigetränke, Rabatte oder VIP-Upgrades.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <Card className="p-6 space-y-5" style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(270 70% 55% / 0.2)" }}>
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider">Schnellauswahl</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {PRESETS.map(p => {
                const Icon = ICONS[p.icon] || Gift;
                return (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p)}
                    className="p-3 rounded-lg text-left transition hover:scale-[1.02]"
                    style={{ background: `${p.color}15`, border: `1px solid ${p.color}40` }}
                  >
                    <Icon className="w-5 h-5 mb-1" style={{ color: p.color }} />
                    <div className="text-xs font-semibold text-white">{p.title}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-white/80">Titel</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="z.B. Freigetränk an der Bar" className="bg-black/30 border-white/10 text-white" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-white/80">Beschreibung</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-black/30 border-white/10 text-white" rows={2} />
            </div>
            <div>
              <Label className="text-white/80">Typ</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="voucher">Rabatt-Gutschein</SelectItem>
                  <SelectItem value="freebie">Freigetränk / Goodie</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                  <SelectItem value="access">Zugang / Backstage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80">Code (optional)</Label>
              <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VIP2026" className="bg-black/30 border-white/10 text-white font-mono" />
            </div>
            <div>
              <Label className="text-white/80">Wert</Label>
              <div className="flex gap-2">
                <Input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="bg-black/30 border-white/10 text-white" />
                <Select value={form.value_type} onValueChange={v => setForm({ ...form, value_type: v as any })}>
                  <SelectTrigger className="w-24 bg-black/30 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">€</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-white/80">Gültig bis (optional)</Label>
              <Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} className="bg-black/30 border-white/10 text-white" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-white/80">An Event binden (optional)</Label>
              <Select value={form.event_id || "none"} onValueChange={v => setForm({ ...form, event_id: v === "none" ? "" : v })}>
                <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue placeholder="Kein Event" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Kein Event</SelectItem>
                  {events.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.title} {e.date ? `· ${new Date(e.date).toLocaleDateString("de-DE")}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4 h-fit" style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(270 70% 55% / 0.2)" }}>
          <div>
            <Label className="text-white/80 text-xs uppercase tracking-wider">Empfänger</Label>
            <Select value={target} onValueChange={v => setTarget(v as any)}>
              <SelectTrigger className="bg-black/30 border-white/10 text-white mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="list">Bestimmte E-Mails</SelectItem>
                <SelectItem value="level">Nach Loyalty-Level</SelectItem>
                <SelectItem value="all_customers">Alle Kunden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {target === "list" && (
            <div>
              <Label className="text-white/80">E-Mails (kommagetrennt oder pro Zeile)</Label>
              <Textarea value={emails} onChange={e => setEmails(e.target.value)} rows={6} placeholder="user1@mail.de&#10;user2@mail.de" className="bg-black/30 border-white/10 text-white font-mono text-xs" />
            </div>
          )}

          {target === "level" && (
            <div>
              <Label className="text-white/80">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="bg-black/30 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">🥉 Bronze (0–99)</SelectItem>
                  <SelectItem value="silver">🥈 Silber (100–299)</SelectItem>
                  <SelectItem value="gold">🥇 Gold (300–699)</SelectItem>
                  <SelectItem value="platinum">💎 Platin (700–1499)</SelectItem>
                  <SelectItem value="legend">👑 Legend (1500+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {target === "all_customers" && (
            <div className="text-xs text-white/60 p-3 rounded" style={{ background: "hsl(45 80% 50% / 0.1)", border: "1px solid hsl(45 80% 50% / 0.3)" }}>
              ⚠️ Sendet an alle registrierten Member.
            </div>
          )}

          <Button onClick={send} disabled={sending} className="w-full" style={{ background: NEON }}>
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Goodies versenden
          </Button>
        </Card>
      </div>

      <Card className="p-6" style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(270 70% 55% / 0.2)" }}>
        <h2 className="text-lg font-bold text-white mb-4">Zuletzt versendete Goodies</h2>
        {loading ? <Loader2 className="w-5 h-5 animate-spin text-white/50" /> : goodies.length === 0 ? (
          <div className="text-sm text-white/50">Noch keine Goodies versendet.</div>
        ) : (
          <div className="space-y-2">
            {goodies.map(g => {
              const Icon = ICONS[g.icon] || Gift;
              return (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                >
                  <div className="p-2 rounded" style={{ background: g.color || NEON }}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{g.title}</div>
                    <div className="text-xs text-white/50">
                      User {g.user_id.slice(0, 8)}… · {new Date(g.created_at).toLocaleString("de-DE")}
                      {g.expires_at && ` · gültig bis ${new Date(g.expires_at).toLocaleDateString("de-DE")}`}
                    </div>
                  </div>
                  <span
                    className="text-[10px] px-2 py-1 rounded-full uppercase font-bold"
                    style={{
                      background: g.status === "active" ? "hsl(140 70% 50% / 0.2)" : g.status === "redeemed" ? "hsl(200 80% 50% / 0.2)" : "hsl(0 70% 50% / 0.2)",
                      color: g.status === "active" ? "hsl(140 70% 60%)" : g.status === "redeemed" ? "hsl(200 80% 70%)" : "hsl(0 70% 70%)",
                    }}
                  >
                    {g.status}
                  </span>
                  {g.status === "active" && (
                    <Button size="sm" variant="ghost" onClick={() => revoke(g.id)} className="text-white/60 hover:text-white text-xs">
                      Widerrufen
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
