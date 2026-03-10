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
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { email, name, birthDate, phone, eventId, items, currency, discountCode, redirectBase, insuranceAccepted } = body;

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

    // Fetch event service fee config + insurance config
    const { data: eventData } = await supabase
      .from("events")
      .select("service_fee_enabled, service_fee_type, service_fee_value, service_fee_vat, title, insurance_enabled, insurance_amount")
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

    let insuranceFeeEur = 0;
    if (insuranceAccepted && eventData?.insurance_enabled && eventData.insurance_amount > 0) {
      insuranceFeeEur = Number(eventData.insurance_amount);
    }

    const grandTotalEur = totalEur + serviceFeeEur + insuranceFeeEur;

    // Convert EUR to target currency
    const EUR_RATES: Record<string, number> = {
      EUR: 1, USD: 1.08, GBP: 0.86, CHF: 0.94, PLN: 4.32, CZK: 25.2, HUF: 395,
      RON: 4.97, BGN: 1.96, DKK: 7.46, NOK: 11.5, SEK: 11.2, TRY: 35.5,
      JPY: 163, KRW: 1450, CNY: 7.85, THB: 37.5, BRL: 5.45, CAD: 1.48, AUD: 1.66,
      AED: 3.97,
    };

    const targetCurrency = currency || "EUR";
    const rate = EUR_RATES[targetCurrency] || 1;
    const convertedTotal = grandTotalEur * rate;

    // Stripe uses smallest currency unit (cents, etc.)
    const ZERO_DECIMAL_CURRENCIES = ["JPY", "KRW", "BIF", "CLP", "GNF", "KMF", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"];
    const stripeAmount = ZERO_DECIMAL_CURRENCIES.includes(targetCurrency)
      ? Math.round(convertedTotal)
      : Math.round(convertedTotal * 100);

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
        currency: targetCurrency,
        service_fee: serviceFeeEur,
        insurance_fee: insuranceFeeEur,
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

    const redirectUrl = `${redirectBase || "https://nightlifeticket.app"}/bestellung/${order.id}`;
    const webhookUrl = `${SUPABASE_URL}/functions/v1/stripe-webhook`;

    // Build line items for Stripe Checkout
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: targetCurrency.toLowerCase(),
        product_data: {
          name: item.name,
        },
        unit_amount: ZERO_DECIMAL_CURRENCIES.includes(targetCurrency)
          ? Math.round(item.priceEur * rate)
          : Math.round(item.priceEur * rate * 100),
      },
      quantity: item.quantity,
    }));

    // Add service fee as separate line item if applicable
    if (serviceFeeEur > 0) {
      lineItems.push({
        price_data: {
          currency: targetCurrency.toLowerCase(),
          product_data: {
            name: "Servicegebühr",
          },
          unit_amount: ZERO_DECIMAL_CURRENCIES.includes(targetCurrency)
            ? Math.round(serviceFeeEur * rate)
            : Math.round(serviceFeeEur * rate * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", redirectUrl);
    params.append("cancel_url", redirectUrl);
    params.append("customer_email", email);
    params.append("metadata[order_id]", order.id);
    if (discountCode) params.append("metadata[discount_code]", discountCode);

    lineItems.forEach((li: any, i: number) => {
      params.append(`line_items[${i}][price_data][currency]`, li.price_data.currency);
      params.append(`line_items[${i}][price_data][product_data][name]`, li.price_data.product_data.name);
      params.append(`line_items[${i}][price_data][unit_amount]`, String(li.price_data.unit_amount));
      params.append(`line_items[${i}][quantity]`, String(li.quantity));
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error("Stripe error:", JSON.stringify(session));
      await supabase.from("orders").delete().eq("id", order.id);
      return new Response(JSON.stringify({ error: "Payment creation failed", details: session }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order with Stripe session ID
    await supabase
      .from("orders")
      .update({
        stripe_payment_id: session.id,
        redirect_url: redirectUrl,
      })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ checkoutUrl: session.url, orderId: order.id }),
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
