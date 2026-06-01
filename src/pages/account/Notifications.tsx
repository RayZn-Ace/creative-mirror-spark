import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, X } from "lucide-react";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const PREFS = [
  { key: "new_events", label: "Neue Events in meinen Städten", desc: "Push wenn ein Event released wird" },
  { key: "reminders", label: "Ticket-Erinnerungen", desc: "Erinnerung 24h vor deinem Event" },
  { key: "sales", label: "Last-Minute & Sale Aktionen", desc: "Krasse Deals & Frühbucher" },
  { key: "waitlist", label: "Warteliste Verfügbarkeit", desc: "Wenn Tickets wieder frei werden" },
];

export default function Notifications() {
  const { user } = useAuth();
  const { permission, requestPermission, isNative } = usePushNotifications();
  const [profile, setProfile] = useState<any>(null);
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("customer_profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data || { preferred_cities: [], push_preferences: { new_events: true, reminders: true, sales: true, waitlist: true } });
    });
  }, [user]);

  const save = async (patch: any) => {
    if (!user) return;
    setSaving(true);
    const next = { ...profile, ...patch };
    setProfile(next);
    await supabase.from("customer_profiles").upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    setSaving(false);
  };

  const togglePref = (key: string) => {
    save({ push_preferences: { ...profile.push_preferences, [key]: !profile.push_preferences[key] } });
  };

  const addCity = () => {
    const c = city.trim();
    if (!c) return;
    if ((profile.preferred_cities || []).includes(c)) return;
    save({ preferred_cities: [...(profile.preferred_cities || []), c] });
    setCity("");
  };

  const removeCity = (c: string) => {
    save({ preferred_cities: (profile.preferred_cities || []).filter((x: string) => x !== c) });
  };

  if (!profile) return <div>Lade...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Benachrichtigungen</h1>

      {/* Permission Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              {permission === "granted" ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
              Push Notifications
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {!isNative && "Verfügbar nur in der App (iOS / Android)."}
              {isNative && permission === "granted" && "Aktiviert. Du bekommst Push-Nachrichten auf dieses Gerät."}
              {isNative && permission === "denied" && "Blockiert. Aktiviere in den System-Einstellungen."}
              {isNative && permission === "prompt" && "Tippe auf Aktivieren um Push-Nachrichten zu erhalten."}
            </p>
          </div>
          {isNative && permission !== "granted" && permission !== "denied" && (
            <Button onClick={async () => { const ok = await requestPermission(); if (ok) toast.success("Push aktiviert 🔔"); }}>
              Aktivieren
            </Button>
          )}
        </div>
      </Card>

      {/* Preferences */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Was möchtest du erhalten?</h2>
        {PREFS.map((p) => (
          <div key={p.key} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
            <div>
              <Label className="font-medium">{p.label}</Label>
              <p className="text-xs text-muted-foreground">{p.desc}</p>
            </div>
            <Switch
              checked={!!profile.push_preferences?.[p.key]}
              onCheckedChange={() => togglePref(p.key)}
              disabled={saving}
            />
          </div>
        ))}
      </Card>

      {/* Cities */}
      <Card className="p-6">
        <h2 className="font-semibold mb-2">Meine Städte</h2>
        <p className="text-sm text-muted-foreground mb-4">Bekomme Push bei neuen Events in diesen Städten.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(profile.preferred_cities || []).map((c: string) => (
            <Badge key={c} variant="secondary" className="text-sm gap-1 pl-3 pr-1 py-1">
              {c}
              <button onClick={() => removeCity(c)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Stadt hinzufügen..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCity()}
          />
          <Button onClick={addCity}>Hinzufügen</Button>
        </div>
      </Card>
    </div>
  );
}
