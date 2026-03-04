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
    const MOLLIE_API_KEY = Deno.env.get("MOLLIE_API_KEY");
    if (!MOLLIE_API_KEY) throw new Error("MOLLIE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { email, name, birthDate, phone, eventId, items, currency, discountCode, redirectBase } = body;

    // items: [{ ticketId, name, quantity, priceEur }]
    if (!email || !eventId || !items || items.length === 0) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate total in EUR (base)
    let totalEur = 0;
    for (const item of items) {
      totalEur += item.priceEur * item.quantity;
    }

    // Fetch event service fee config
    const { data: eventData } = await supabase
      .from("events")
      .select("service_fee_enabled, service_fee_type, service_fee_value, service_fee_vat")
      .eq("id", eventId)
      .single();

    let serviceFeeEur = 0;
    if (eventData?.service_fee_enabled && eventData.service_fee_value) {
      if (eventData.service_fee_type === "percentage") {
        serviceFeeEur = totalEur * (eventData.service_fee_value / 100);
      } else {
        serviceFeeEur = eventData.service_fee_value;
      }
    }

    const grandTotalEur = totalEur + serviceFeeEur;

    // Convert to target currency for Mollie
    const EUR_RATES: Record<string, number> = {
      EUR: 1, USD: 1.08, GBP: 0.86, CHF: 0.94, PLN: 4.32, CZK: 25.2, HUF: 395,
      RON: 4.97, BGN: 1.96, DKK: 7.46, NOK: 11.5, SEK: 11.2, TRY: 35.5,
      JPY: 163, KRW: 1450, CNY: 7.85, THB: 37.5, BRL: 5.45, CAD: 1.48, AUD: 1.66,
    };

    const targetCurrency = currency || "EUR";
    const rate = EUR_RATES[targetCurrency] || 1;
    const convertedTotal = grandTotalEur * rate;

    // Mollie requires specific formatting
    const isZeroDecimal = ["JPY", "KRW"].includes(targetCurrency);
    const mollieAmount = isZeroDecimal
      ? Math.round(convertedTotal).toString() + ".00"
      : convertedTotal.toFixed(2);

    // Mollie only supports certain currencies
    const MOLLIE_SUPPORTED = ["EUR", "USD", "GBP", "CHF", "PLN", "CZK", "HUF", "RON", "BGN", "DKK", "NOK", "SEK", "ISK", "HRK"];
    const mollieCurrency = MOLLIE_SUPPORTED.includes(targetCurrency) ? targetCurrency : "EUR";
    const finalAmount = mollieCurrency === targetCurrency ? mollieAmount : grandTotalEur.toFixed(2);

    // Create order in DB
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        email,
        name: name || null,
        birth_date: birthDate || null,
        phone: phone || null,
        event_id: eventId,
        items,
        total_amount: grandTotalEur,
        currency: mollieCurrency,
        service_fee: serviceFeeEur,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order creation failed:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build redirect URL
    const redirectUrl = `${redirectBase || "https://gimmetestooo.lovable.app"}/bestellung/${order.id}`;

    // Get webhook URL
    const webhookUrl = `${SUPABASE_URL}/functions/v1/mollie-webhook`;

    // Create Mollie payment
    const mollieRes = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MOLLIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: {
          currency: mollieCurrency,
          value: finalAmount,
        },
        description: `Tickets – Order ${order.id.slice(0, 8)}`,
        redirectUrl,
        webhookUrl,
        metadata: {
          order_id: order.id,
          discount_code: discountCode || null,
        },
      }),
    });

    const mollieData = await mollieRes.json();

    if (!mollieRes.ok) {
      console.error("Mollie error:", JSON.stringify(mollieData));
      // Clean up order
      await supabase.from("orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({ error: "Payment creation failed", details: mollieData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order with Mollie payment ID
    await supabase
      .from("orders")
      .update({
        mollie_payment_id: mollieData.id,
        redirect_url: redirectUrl,
      })
      .eq("id", order.id);

    // Return checkout URL
    const checkoutUrl = mollieData._links?.checkout?.href;

    return new Response(
      JSON.stringify({ checkoutUrl, orderId: order.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
