import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Send, History, Users } from "lucide-react";

export default function PushAdmin() {
  const [form, setForm] = useState({ title: "", body: "", image_url: "", deep_link: "", target_city: "" });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [tokenCount, setTokenCount] = useState(0);
  const [sending, setSending] = useState(false);

  const load = async () => {
    const [c, t] = await Promise.all([
      supabase.from("push_campaigns").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("push_tokens").select("id", { count: "exact", head: true }).eq("active", true),
    ]);
    setCampaigns(c.data || []);
    setTokenCount(t.count || 0);
  };

  useEffect(() => { load(); }, []);

  const send = async () => {
    if (!form.title || !form.body) return toast.error("Titel & Text erforderlich");
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        title: form.title,
        body: form.body,
        image_url: form.image_url || undefined,
        deep_link: form.deep_link || undefined,
        target_filter: form.target_city ? { city: form.target_city } : {},
        save_campaign: true,
      },
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success(`Gesendet an ${data?.sent_count || 0} Geräte 🚀`);
    setForm({ title: "", body: "", image_url: "", deep_link: "", target_city: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Push Notifications</h1>
        <p className="text-muted-foreground flex items-center gap-2 mt-1">
          <Users className="h-4 w-4" /> {tokenCount} aktive Geräte
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Send className="h-4 w-4" /> Neue Push senden</h2>
        <div>
          <Label>Titel *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="🔥 Letzte Tickets!" maxLength={60} />
        </div>
        <div>
          <Label>Nachricht *</Label>
          <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Sichere dir jetzt dein Ticket für..." maxLength={180} rows={3} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Bild URL (optional)</Label>
            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
          </div>
          <div>
            <Label>Deep Link (optional)</Label>
            <Input value={form.deep_link} onChange={(e) => setForm({ ...form, deep_link: e.target.value })} placeholder="/event-slug" />
          </div>
        </div>
        <div>
          <Label>Zielgruppe – Stadt (leer = alle)</Label>
          <Input value={form.target_city} onChange={(e) => setForm({ ...form, target_city: e.target.value })} placeholder="z.B. Paderborn" />
        </div>
        <Button onClick={send} disabled={sending} size="lg" className="w-full">
          {sending ? "Sende..." : "🚀 Jetzt senden"}
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><History className="h-4 w-4" /> Versand-Historie</h2>
        {campaigns.length === 0 ? (
          <p className="text-muted-foreground text-sm">Noch keine Kampagnen.</p>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <div key={c.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{c.title}</div>
                    <div className="text-sm text-muted-foreground">{c.body}</div>
                  </div>
                  <Badge>{c.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(c.created_at).toLocaleString("de-DE")} · {c.sent_count} gesendet · {c.failed_count} fehlgeschlagen
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
