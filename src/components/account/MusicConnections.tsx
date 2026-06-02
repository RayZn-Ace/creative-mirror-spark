import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Link2Off, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SPOTIFY_CLIENT_ID = "8d9db586b58d448394bbe192071233ba";
const SPOTIFY_SCOPES = "user-top-read user-read-recently-played user-read-email";

export default function MusicConnections() {
  const { user } = useAuth();
  const [conn, setConn] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_music_connections")
      .select("display_name, avatar_url")
      .eq("user_id", user.id)
      .eq("provider", "spotify")
      .maybeSingle();
    setConn(data ?? null);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const connect = () => {
    const isNative =
      window.location.protocol === "capacitor:" ||
      window.location.hostname === "localhost" && /(iPhone|iPad|Android)/i.test(navigator.userAgent);
    const redirect_uri = isNative
      ? "app.nightlife.app://music-callback"
      : `${window.location.origin}/account/music/callback`;
    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.set("client_id", SPOTIFY_CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirect_uri);
    url.searchParams.set("scope", SPOTIFY_SCOPES);
    url.searchParams.set("show_dialog", "false");
    window.location.href = url.toString();
  };

  const disconnect = async () => {
    setDisconnecting(true);
    const { error } = await supabase.functions.invoke("spotify-wrapped", {
      body: { action: "disconnect" },
    });
    setDisconnecting(false);
    if (error) return toast.error(error.message);
    setConn(null);
    toast.success("Spotify getrennt");
  };

  if (loading) return null;

  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-center gap-3 mb-4">
        <Music className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Musik-Streaming</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Verbinde Spotify und sieh deinen Party-Soundtrack in deinem Year in Review 🎧
      </p>

      <div className="flex items-center justify-between rounded-xl border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#1DB954] flex items-center justify-center text-white font-bold">
            ♪
          </div>
          <div>
            <div className="font-semibold flex items-center gap-2">
              Spotify
              {conn && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
            <div className="text-xs text-muted-foreground">
              {conn ? `Verbunden als ${conn.display_name || "Spotify-User"}` : "Nicht verbunden"}
            </div>
          </div>
        </div>
        {conn ? (
          <Button variant="outline" size="sm" onClick={disconnect} disabled={disconnecting}>
            <Link2Off className="h-4 w-4 mr-2" /> Trennen
          </Button>
        ) : (
          <Button size="sm" onClick={connect} className="bg-[#1DB954] hover:bg-[#1aa34a] text-white">
            Verbinden
          </Button>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border p-4 opacity-60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-white font-bold">
            
          </div>
          <div>
            <div className="font-semibold">Apple Music</div>
            <div className="text-xs text-muted-foreground">Coming soon</div>
          </div>
        </div>
        <Button size="sm" variant="ghost" disabled>Bald</Button>
      </div>
    </Card>
  );
}
