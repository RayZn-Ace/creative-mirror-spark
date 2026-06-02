// Spotify OAuth callback: exchanges auth code for tokens and stores them
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { code, redirect_uri } = await req.json();
    if (!code || !redirect_uri) {
      return json({ error: "missing_params" }, 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);
    const userId = userData.user.id;

    const clientId = Deno.env.get("SPOTIFY_CLIENT_ID")!;
    const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;

    const basic = btoa(`${clientId}:${clientSecret}`);
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Spotify token exchange failed:", errText);
      return json({ error: "token_exchange_failed", details: errText }, 400);
    }

    const tokens = await tokenRes.json();
    // { access_token, token_type, scope, expires_in, refresh_token }

    // Fetch user profile from Spotify
    const profileRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = profileRes.ok ? await profileRes.json() : {};

    // Store using service-role to bypass RLS but with explicit user_id
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const expiresAt = new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString();
    const { error: upErr } = await admin
      .from("user_music_connections")
      .upsert({
        user_id: userId,
        provider: "spotify",
        provider_user_id: profile.id ?? null,
        display_name: profile.display_name ?? null,
        avatar_url: profile.images?.[0]?.url ?? null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
        scope: tokens.scope ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,provider" });

    if (upErr) {
      console.error("upsert failed", upErr);
      return json({ error: "store_failed", details: upErr.message }, 500);
    }

    return json({
      ok: true,
      display_name: profile.display_name,
      avatar_url: profile.images?.[0]?.url ?? null,
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
