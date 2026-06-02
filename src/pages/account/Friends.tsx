import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, Check, X, Trash2, MapPin } from "lucide-react";
import { useFriends, type FriendWithProfile } from "@/hooks/useFriends";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Friends() {
  const { user } = useAuth();
  const { accepted, incoming, outgoing, loading, respond, remove, reload } = useFriends();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [showAttendance, setShowAttendance] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("customer_profiles")
      .select("show_attendance")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setShowAttendance(data.show_attendance ?? true);
      });
  }, [user]);

  const toggleAttendance = async (v: boolean) => {
    setShowAttendance(v);
    if (!user) return;
    await supabase.from("customer_profiles").update({ show_attendance: v }).eq("user_id", user.id);
    toast.success(v ? "Sichtbar für Freunde" : "Versteckt");
  };

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { data, error } = await supabase.functions.invoke("invite-friend", {
      body: { email: email.trim().toLowerCase() },
    });
    setSending(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "Fehler");
      return;
    }
    const status = (data as any)?.status;
    if (status === "friend_request_sent") {
      toast.success("Freundschaftsanfrage gesendet 🚀");
      reload();
    } else if (status === "invite_email_sent") {
      toast.success("Einladung per E-Mail geschickt ✉️");
    } else {
      toast.success("Erledigt");
    }
    setEmail("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-7 w-7 text-primary" /> Dein Squad
        </h1>
        <p className="text-muted-foreground mt-1">Adde deine Freunde und seht gemeinsam, wer auf welche Party geht.</p>
      </div>

      <Card className="p-6">
        <form onSubmit={onSend} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="freund@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" disabled={sending}>
            <UserPlus className="h-4 w-4 mr-2" /> Einladen
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Hat dein Freund schon einen Account, schicken wir direkt eine Anfrage. Sonst kriegt er eine Einladung per Mail 💌
        </p>
      </Card>

      <Card className="p-6 flex items-center justify-between">
        <div>
          <Label htmlFor="show-att" className="text-base font-semibold">Für Freunde sichtbar</Label>
          <p className="text-sm text-muted-foreground">Zeigt deinen Freunden, auf welche Events du gehst.</p>
        </div>
        <Switch id="show-att" checked={showAttendance} onCheckedChange={toggleAttendance} />
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Lade...</p>
      ) : (
        <>
          {incoming.length > 0 && (
            <Section title="Anfragen" badge={incoming.length}>
              {incoming.map((f) => (
                <FriendRow
                  key={f.id}
                  friend={f}
                  actions={
                    <>
                      <Button size="sm" onClick={() => respond(f.id, "accepted")}>
                        <Check className="h-4 w-4 mr-1" /> Annehmen
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => respond(f.id, "declined")}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  }
                />
              ))}
            </Section>
          )}

          {outgoing.length > 0 && (
            <Section title="Gesendet" badge={outgoing.length}>
              {outgoing.map((f) => (
                <FriendRow
                  key={f.id}
                  friend={f}
                  meta={<Badge variant="secondary">Wartet</Badge>}
                  actions={
                    <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              ))}
            </Section>
          )}

          <Section title="Squad" badge={accepted.length}>
            {accepted.length === 0 ? (
              <p className="text-muted-foreground text-sm">Noch keine Freunde – schick die erste Anfrage 👆</p>
            ) : (
              accepted.map((f) => (
                <FriendRow
                  key={f.id}
                  friend={f}
                  actions={
                    <Button size="sm" variant="ghost" onClick={() => remove(f.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              ))
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, badge, children }: { title: string; badge?: number; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        {title}
        {badge !== undefined && badge > 0 && <Badge>{badge}</Badge>}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FriendRow({ friend, actions, meta }: { friend: FriendWithProfile; actions?: React.ReactNode; meta?: React.ReactNode }) {
  const name = friend.friend?.display_name || "Unbekannt";
  return (
    <Card className="p-4 flex items-center gap-3">
      <Avatar>
        <AvatarImage src={friend.friend?.avatar_url ?? undefined} />
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{name}</div>
        {friend.friend?.city && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {friend.friend.city}
          </div>
        )}
      </div>
      {meta}
      <div className="flex gap-2">{actions}</div>
    </Card>
  );
}
