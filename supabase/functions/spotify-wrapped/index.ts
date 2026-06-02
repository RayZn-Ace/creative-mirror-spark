// Fetch Spotify wrapped data for current user (with token refresh)
// Also supports action=disconnect to remove the connection.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action ?? "wrapped";

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (action === "disconnect") {
      await admin.from("user_music_connections")
        .delete().eq("user_id", userId).eq("provider", "spotify");
      return json({ ok: true });
    }

    const { data: conn } = await admin
      .from("user_music_connections")
      .select("*").eq("user_id", userId).eq("provider", "spotify").maybeSingle();

    if (!conn) return json({ connected: false });

    let accessToken = conn.access_token;
    const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0;

    if (Date.now() >= expiresAt && conn.refresh_token) {
      const clientId = Deno.env.get("SPOTIFY_CLIENT_ID")!;
      const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;
      const basic = btoa(`${clientId}:${clientSecret}`);
      const refreshRes = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: conn.refresh_token }),
      });
      if (refreshRes.ok) {
        const r = await refreshRes.json();
        accessToken = r.access_token;
        const newExp = new Date(Date.now() + (r.expires_in - 60) * 1000).toISOString();
        await admin.from("user_music_connections").update({
          access_token: accessToken,
          token_expires_at: newExp,
          refresh_token: r.refresh_token ?? conn.refresh_token,
          updated_at: new Date().toISOString(),
        }).eq("id", conn.id);
      } else {
        return json({ connected: false, error: "refresh_failed" });
      }
    }

    const headers = { Authorization: `Bearer ${accessToken}` };

    // year top track + artist (long_term ≈ years), and short_term (≈ last 4 weeks)
    const [topTracksLong, topArtistsLong, topTracksShort, topTracksMedium] = await Promise.all([
      fetch("https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=long_term", { headers }).then(r => r.ok ? r.json() : null),
      fetch("https://api.spotify.com/v1/me/top/artists?limit=5&time_range=long_term", { headers }).then(r => r.ok ? r.json() : null),
      fetch("https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=short_term", { headers }).then(r => r.ok ? r.json() : null),
      fetch("https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=medium_term", { headers }).then(r => r.ok ? r.json() : null),
    ]);

    const pickTrack = (t: any) => t ? {
      name: t.name,
      artist: t.artists?.map((a: any) => a.name).join(", "),
      image: t.album?.images?.[0]?.url ?? null,
      url: t.external_urls?.spotify ?? null,
      preview: t.preview_url ?? null,
    } : null;

    const pickArtist = (a: any) => a ? {
      name: a.name,
      image: a.images?.[0]?.url ?? null,
      url: a.external_urls?.spotify ?? null,
      genre: a.genres?.[0] ?? null,
    } : null;

    return json({
      connected: true,
      provider: "spotify",
      profile: { display_name: conn.display_name, avatar_url: conn.avatar_url },
      yearTopTrack: pickTrack(topTracksLong?.items?.[0]),
      yearTopArtist: pickArtist(topArtistsLong?.items?.[0]),
      recentTopTrack: pickTrack(topTracksShort?.items?.[0]),
      midTermTopTrack: pickTrack(topTracksMedium?.items?.[0]),
      yearTopTracks: (topTracksLong?.items ?? []).slice(0, 5).map(pickTrack),
    });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
