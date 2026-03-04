import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateQRCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments: string[] = [];
  for (let s = 0; s < 4; s++) {
    let seg = "";
    for (let i = 0; i < 4; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(seg);
  }
  return segments.join("-");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { event_id, recipients, category_type } = body;
    // recipients: [{ name, email }]
    // category_type: "freiticket" | "fan_freiticket"

    if (!event_id || !recipients || recipients.length === 0) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const categoryLabel = category_type === "fan_freiticket" ? "Fan Freiticket" : "Freiticket";

    const results = [];

    for (const recipient of recipients) {
      // Create a free order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          email: recipient.email,
          name: recipient.name || null,
          event_id,
          items: [{ ticketId: null, name: categoryLabel, quantity: 1, priceEur: 0 }],
          total_amount: 0,
          service_fee: 0,
          currency: "EUR",
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (orderError || !order) {
        console.error("Free order creation failed:", orderError);
        results.push({ email: recipient.email, success: false, error: orderError?.message });
        continue;
      }

      // Create ticket
      const qrCode = generateQRCode();
      const { error: ticketError } = await supabase
        .from("tickets")
        .insert({
          order_id: order.id,
          event_id,
          ticket_category_id: null,
          holder_name: recipient.name || null,
          holder_email: recipient.email,
          qr_code: qrCode,
          status: "valid",
        });

      if (ticketError) {
        console.error("Free ticket creation failed:", ticketError);
        results.push({ email: recipient.email, success: false, error: ticketError.message });
        continue;
      }

      // Trigger email sending
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/send-tickets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: order.id }),
        });
      } catch (e) {
        console.error("Email trigger failed for", recipient.email, e);
      }

      results.push({ email: recipient.email, success: true, qr_code: qrCode });
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Issue free tickets error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
