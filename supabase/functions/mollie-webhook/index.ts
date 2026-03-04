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

    // Mollie sends payment ID as form data
    const formData = await req.formData();
    const paymentId = formData.get("id") as string;

    if (!paymentId) {
      return new Response("Missing payment ID", { status: 400, headers: corsHeaders });
    }

    // Fetch payment status from Mollie
    const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MOLLIE_API_KEY}` },
    });

    const payment = await mollieRes.json();

    if (!mollieRes.ok) {
      console.error("Mollie fetch error:", JSON.stringify(payment));
      return new Response("Failed to fetch payment", { status: 500, headers: corsHeaders });
    }

    const orderId = payment.metadata?.order_id;
    if (!orderId) {
      console.error("No order_id in payment metadata");
      return new Response("No order ID", { status: 400, headers: corsHeaders });
    }

    // Map Mollie status to our status
    let status = "pending";
    let paidAt = null;

    switch (payment.status) {
      case "paid":
        status = "paid";
        paidAt = payment.paidAt || new Date().toISOString();
        break;
      case "canceled":
      case "expired":
        status = "cancelled";
        break;
      case "failed":
        status = "failed";
        break;
      case "open":
      case "pending":
        status = "pending";
        break;
    }

    // Update order
    const updateData: Record<string, unknown> = {
      status,
      mollie_payment_id: paymentId,
    };
    if (paidAt) updateData.paid_at = paidAt;

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      console.error("Order update failed:", error);
      return new Response("DB update failed", { status: 500, headers: corsHeaders });
    }

    console.log(`Order ${orderId} updated to status: ${status}`);

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
