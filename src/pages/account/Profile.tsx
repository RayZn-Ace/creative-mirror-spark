import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import MusicConnections from "@/components/account/MusicConnections";

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    phone: "",
    birth_date: "",
    address: "",
    city: "",
    zip: "",
    country: "Deutschland",
    avatar_url: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfile({
          display_name: data.display_name || "",
          phone: data.phone || "",
          birth_date: data.birth_date || "",
          address: data.address || "",
          city: data.city || "",
          zip: data.zip || "",
          country: data.country || "Deutschland",
          avatar_url: data.avatar_url || "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("customer_profiles")
      .upsert({ user_id: user.id, ...profile }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profil gespeichert ✨");
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("customer-avatars")
      .upload(path, file, { upsert: true });
    if (upErr) return toast.error(upErr.message);
    const { data } = supabase.storage.from("customer-avatars").getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    setProfile({ ...profile, avatar_url: url });
    await supabase
      .from("customer_profiles")
      .upsert({ user_id: user.id, avatar_url: url }, { onConflict: "user_id" });
    toast.success("Avatar aktualisiert");
  };

  if (loading) return <div>Lade...</div>;

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8">
        <h1 className="text-2xl font-bold mb-6">Mein Profil</h1>

        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>{(profile.display_name || user?.email || "?")[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <label>
            <Button type="button" variant="outline" asChild>
              <span className="cursor-pointer"><Upload className="h-4 w-4 mr-2" />Foto ändern</span>
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
            />
          </label>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name" value={profile.display_name} onChange={(v) => setProfile({ ...profile, display_name: v })} />
          <Field label="Telefon" value={profile.phone} onChange={(v) => setProfile({ ...profile, phone: v })} />
          <Field label="Geburtstag" type="date" value={profile.birth_date} onChange={(v) => setProfile({ ...profile, birth_date: v })} />
          <Field label="E-Mail" value={user?.email || ""} onChange={() => {}} disabled />
          <Field label="Straße & Nr." value={profile.address} onChange={(v) => setProfile({ ...profile, address: v })} />
          <Field label="PLZ" value={profile.zip} onChange={(v) => setProfile({ ...profile, zip: v })} />
          <Field label="Stadt" value={profile.city} onChange={(v) => setProfile({ ...profile, city: v })} />
          <Field label="Land" value={profile.country} onChange={(v) => setProfile({ ...profile, country: v })} />
        </div>

        <Button onClick={save} disabled={saving} className="mt-6">
          {saving ? "Speichere..." : "Speichern"}
        </Button>
      </Card>

      <MusicConnections />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }: any) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  );
}
