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
    const queryEmail = url.searchParams.get("email");

    // Edge gateways deliberately serve returned HTML as plain text. Redirect old
    // newsletter links to the branded app page, which then submits the request.
    if (req.method === "GET" && queryEmail) {
      const destination = new URL("/newsletter-abmelden", "https://nightlifeticket.app");
      destination.searchParams.set("email", queryEmail);
      return Response.redirect(destination.toString(), 302);
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const email = typeof body.email === "string" ? body.email : null;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing backend configuration");
    }
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Update newsletter_subscribers: set unsubscribed = true
    const { error } = await adminClient
      .from("newsletter_subscribers")
      .update({ unsubscribed: true })
      .eq("email", email.toLowerCase().trim());

    if (error) {
      console.error("Unsubscribe error:", error);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
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
