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

    // ── Capacity check: ensure no category is oversold ──
    const ticketIds = items.map((i: any) => i.ticketId).filter(Boolean);
    if (ticketIds.length > 0) {
      const { data: categories } = await supabase
        .from("ticket_categories")
        .select("id, name, max_capacity, sold_out")
        .in("id", ticketIds);

      if (categories) {
        const { data: soldTickets } = await supabase
          .from("tickets")
          .select("ticket_category_id")
          .eq("event_id", eventId)
          .in("ticket_category_id", ticketIds)
          .in("status", ["valid", "checked_in"]);

        const soldMap = new Map<string, number>();
        (soldTickets || []).forEach((t: any) => {
          if (t.ticket_category_id) {
            soldMap.set(t.ticket_category_id, (soldMap.get(t.ticket_category_id) || 0) + 1);
          }
        });

        for (const item of items) {
          if (!item.ticketId) continue;
          const cat = categories.find((c: any) => c.id === item.ticketId);
          if (!cat) continue;
          if (cat.sold_out) {
            return new Response(JSON.stringify({ error: `"${cat.name}" ist ausverkauft.` }), {
              status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (cat.max_capacity != null && cat.max_capacity > 0) {
            const sold = soldMap.get(cat.id) || 0;
            const remaining = cat.max_capacity - sold;
            if (item.quantity > remaining) {
              return new Response(JSON.stringify({ error: `"${cat.name}": nur noch ${remaining} Tickets verfügbar.` }), {
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        }
      }
    }

    // Calculate total in EUR (base)
    let totalEur = 0;
    for (const item of items) {
      totalEur += item.priceEur * item.quantity;
    }

    // Fetch event service fee config + insurance config
    const { data: eventData } = await supabase
      .from("events")
      .select("service_fee_enabled, service_fee_type, service_fee_value, service_fee_vat, service_fee_mode, title, insurance_enabled, insurance_amount")
      .eq("id", eventId)
      .single();

    let serviceFeeEur = 0;
    if (eventData?.service_fee_enabled && eventData.service_fee_value) {
      const totalTickets = items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
      const feeMode = eventData.service_fee_mode || "per_order";
      if (eventData.service_fee_type === "percentage") {
        serviceFeeEur = totalEur * (eventData.service_fee_value / 100);
      } else {
        serviceFeeEur = feeMode === "per_ticket"
          ? eventData.service_fee_value * totalTickets
          : eventData.service_fee_value;
      }
    }

    let insuranceFeeEur = 0;
    if (insuranceAccepted && eventData?.insurance_enabled && eventData.insurance_amount > 0) {
      const totalTickets = items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
      insuranceFeeEur = Number(eventData.insurance_amount) * totalTickets;
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

    // Add insurance fee as separate line item if applicable
    if (insuranceFeeEur > 0) {
      const totalTickets = items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
      const perTicketInsurance = Number(eventData.insurance_amount);
      lineItems.push({
        price_data: {
          currency: targetCurrency.toLowerCase(),
          product_data: {
            name: "Ticketversicherung",
          },
          unit_amount: ZERO_DECIMAL_CURRENCIES.includes(targetCurrency)
            ? Math.round(perTicketInsurance * rate)
            : Math.round(perTicketInsurance * rate * 100),
        },
        quantity: totalTickets,
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
