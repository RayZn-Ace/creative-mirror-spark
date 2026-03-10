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

    const body = await req.json();
    const { email, name, birthDate, phone, eventId, items, currency, discountCode, redirectBase, country, insuranceAccepted } = body;

    // Country-based payment method mapping for Mollie
    const COUNTRY_METHODS: Record<string, string[]> = {
      DE: ["applepay", "bancontact", "creditcard", "eps", "giropay", "ideal", "klarna", "paypal", "sofort", "przelewy24"],
      AT: ["applepay", "creditcard", "eps", "klarna", "paypal", "sofort"],
      CH: ["applepay", "creditcard", "paypal", "twint"],
      NL: ["applepay", "creditcard", "ideal", "klarna", "paypal"],
      BE: ["applepay", "bancontact", "creditcard", "klarna", "paypal"],
      FR: ["applepay", "creditcard", "klarna", "paypal"],
      PL: ["applepay", "creditcard", "paypal", "przelewy24", "blik"],
      CZ: ["applepay", "creditcard", "paypal"],
      DK: ["applepay", "creditcard", "paypal"],
      SE: ["applepay", "creditcard", "klarna", "paypal"],
      NO: ["applepay", "creditcard", "klarna", "paypal"],
      IT: ["applepay", "creditcard", "klarna", "paypal", "mybank"],
      ES: ["applepay", "creditcard", "klarna", "paypal"],
      PT: ["applepay", "creditcard", "paypal", "multibanco"],
      GB: ["applepay", "creditcard", "klarna", "paypal"],
      HU: ["applepay", "creditcard", "paypal"],
      RO: ["applepay", "creditcard", "paypal"],
      BG: ["applepay", "creditcard", "paypal"],
      LU: ["applepay", "creditcard", "ideal", "paypal"],
      FI: ["applepay", "creditcard", "klarna", "paypal"],
    };

    const paymentMethods = country && COUNTRY_METHODS[country.toUpperCase()]
      ? COUNTRY_METHODS[country.toUpperCase()]
      : undefined; // Let Mollie decide if country unknown

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

    // Validate and apply discount code
    let discountAmount = 0;
    let appliedCouponId: string | null = null;
    if (discountCode && typeof discountCode === "string" && discountCode.trim().length > 0) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", discountCode.trim().toUpperCase())
        .eq("active", true)
        .maybeSingle();

      if (coupon) {
        // Check if coupon is for this event or global
        const isValidForEvent = !coupon.event_id || coupon.event_id === eventId;
        // Check max uses
        const isUnderLimit = !coupon.max_uses || coupon.used_count < coupon.max_uses;
        // Check validity dates
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
        const isInDateRange = (!validFrom || now >= validFrom) && (!validUntil || now <= validUntil);
        // Check min order amount
        const meetsMinimum = !coupon.min_order_amount || totalEur >= coupon.min_order_amount;

        if (isValidForEvent && isUnderLimit && isInDateRange && meetsMinimum) {
          if (coupon.discount_type === "percentage") {
            discountAmount = totalEur * (coupon.discount_value / 100);
          } else {
            discountAmount = Math.min(coupon.discount_value, totalEur);
          }
          appliedCouponId = coupon.id;
          console.log(`Coupon ${coupon.code} applied: -${discountAmount.toFixed(2)} EUR`);
        } else {
          console.log(`Coupon ${discountCode} invalid: event=${isValidForEvent}, limit=${isUnderLimit}, date=${isInDateRange}, min=${meetsMinimum}`);
        }
      } else {
        console.log(`Coupon code "${discountCode}" not found`);
      }
    }

    totalEur = Math.max(0, totalEur - discountAmount);

    // Fetch event service fee config + insurance config
    const { data: eventData } = await supabase
      .from("events")
      .select("service_fee_enabled, service_fee_type, service_fee_value, service_fee_vat, insurance_enabled, insurance_amount")
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
      const totalTickets = items.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
      insuranceFeeEur = Number(eventData.insurance_amount) * totalTickets;
    }

    const grandTotalEur = totalEur + serviceFeeEur + insuranceFeeEur;

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

    // Build redirect URL
    const redirectUrl = `${redirectBase || "https://nightlifeticket.app"}/bestellung/${order.id}`;

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
        ...(paymentMethods ? { method: paymentMethods } : {}),
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

    // Increment coupon used_count
    if (appliedCouponId) {
      const { data: couponData } = await supabase.from("coupons").select("used_count").eq("id", appliedCouponId).single();
      if (couponData) {
        await supabase.from("coupons").update({ used_count: couponData.used_count + 1 }).eq("id", appliedCouponId);
      }
    }

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
