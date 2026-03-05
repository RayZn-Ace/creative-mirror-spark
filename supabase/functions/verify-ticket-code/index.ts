import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ error: "E-Mail und Code erforderlich" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find valid code
    const { data, error } = await supabase
      .from("ticket_verification_codes")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .eq("code", code.trim())
      .eq("verified", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Ungültiger oder abgelaufener Code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as verified
    await supabase
      .from("ticket_verification_codes")
      .update({ verified: true })
      .eq("id", data.id);

    // Fetch orders with tickets
    const { data: ordersData } = await supabase
      .from("orders")
      .select("*, events(title, date, city)")
      .eq("email", email.toLowerCase().trim())
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    if (!ordersData || ordersData.length === 0) {
      return new Response(JSON.stringify({ verified: true, orders: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderIds = ordersData.map((o: any) => o.id);
    const { data: ticketsData } = await supabase
      .from("tickets")
      .select("*")
      .in("order_id", orderIds);

    const orders = ordersData.map((o: any) => ({
      id: o.id,
      status: o.status,
      email: o.email,
      name: o.name,
      total_amount: o.total_amount,
      created_at: o.created_at,
      paid_at: o.paid_at,
      items: o.items,
      event_title: o.events?.title,
      event_date: o.events?.date,
      event_city: o.events?.city,
      tickets: (ticketsData || [])
        .filter((t: any) => t.order_id === o.id)
        .map((t: any) => ({
          id: t.id,
          qr_code: t.qr_code,
          status: t.status,
          holder_name: t.holder_name,
        })),
    }));

    return new Response(JSON.stringify({ verified: true, orders }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Interner Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
