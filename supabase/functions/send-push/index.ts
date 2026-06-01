// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// Firebase Admin: get access token via JWT (Service Account)
// ============================================
async function getFcmAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKeyRaw = Deno.env.get("FIREBASE_PRIVATE_KEY");
  if (!clientEmail || !privateKeyRaw) throw new Error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY");
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const header = { alg: "RS256", typ: "JWT" };

  const b64 = (obj: any) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsigned = `${b64(header)}.${b64(claim)}`;

  // Import key
  const pem = privateKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const jwt = `${unsigned}.${sigB64}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
  const { access_token } = await tokenRes.json();
  return access_token;
}

async function sendFcmMessage(accessToken: string, projectId: string, message: any) {
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });
  return { ok: res.ok, status: res.status, body: await res.text() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    const {
      title,
      body,
      image_url,
      deep_link,
      target_filter = {},
      user_ids,
      tokens: explicitTokens,
      save_campaign,
      preference_key,
    } = payload;

    if (!title || !body) {
      return new Response(JSON.stringify({ error: "title and body required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Collect tokens
    let tokens: string[] = [];
    if (Array.isArray(explicitTokens) && explicitTokens.length) {
      tokens = explicitTokens;
    } else {
      let q = supabase.from("push_tokens").select("token, preferences, preferred_cities, user_id").eq("active", true);
      if (user_ids?.length) q = q.in("user_id", user_ids);
      const { data: rows, error } = await q;
      if (error) throw error;

      const filtered = (rows || []).filter((r: any) => {
        if (preference_key && r.preferences?.[preference_key] === false) return false;
        if (target_filter.city) {
          const cities: string[] = r.preferred_cities || [];
          if (cities.length && !cities.includes(target_filter.city)) return false;
        }
        return true;
      });
      tokens = filtered.map((r: any) => r.token);
    }

    const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
    let sent = 0, failed = 0;

    if (tokens.length && projectId) {
      const accessToken = await getFcmAccessToken();
      // Send sequentially (small volumes); for larger use batch send
      for (const tok of tokens) {
        const msg: any = {
          token: tok,
          notification: { title, body, ...(image_url ? { image: image_url } : {}) },
          data: { ...(deep_link ? { deep_link } : {}) },
          android: { priority: "HIGH" },
          apns: { payload: { aps: { sound: "default" } } },
        };
        const r = await sendFcmMessage(accessToken, projectId, msg);
        if (r.ok) sent++;
        else {
          failed++;
          // Mark invalid tokens inactive
          if (r.status === 404 || r.status === 400) {
            await supabase.from("push_tokens").update({ active: false }).eq("token", tok);
          }
        }
      }
    }

    if (save_campaign) {
      await supabase.from("push_campaigns").insert({
        title, body,
        image_url: image_url || null,
        deep_link: deep_link || null,
        target_filter,
        status: "sent",
        sent_count: sent,
        failed_count: failed,
        sent_at: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ ok: true, sent_count: sent, failed_count: failed, total_tokens: tokens.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-push error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
