import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email") || (req.method === "POST" ? (await req.json()).email : null);

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Update newsletter_subscribers: set unsubscribed = true
    const { error } = await adminClient
      .from("newsletter_subscribers")
      .update({ unsubscribed: true })
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Unsubscribe error:", error);
    }

    // Return a styled HTML page confirming unsubscription
    const safeEmail = email.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Newsletter abgemeldet</title>
<style>
  body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background: #0a0a0f; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: #111118; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 48px 40px; max-width: 440px; text-align: center; }
  h1 { font-size: 24px; margin: 0 0 12px 0; }
  p { color: #999; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
  .icon { font-size: 48px; margin-bottom: 16px; }
  .email { color: #8b5cf6; font-weight: 600; }
  a { color: #8b5cf6; text-decoration: none; font-size: 13px; }
</style>
</head><body>
<div class="card">
  <div class="icon">&#128236;</div>
  <h1>Abmeldung erfolgreich</h1>
  <p>Die E-Mail-Adresse <span class="email">${safeEmail}</span> wurde vom Newsletter abgemeldet. Du wirst keine weiteren Newsletter von uns erhalten.</p>
  <a href="https://nightlifeticket.app">&larr; Zur&uuml;ck zur Website</a>
</div>
</body></html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err) {
    console.error("newsletter-unsubscribe error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
