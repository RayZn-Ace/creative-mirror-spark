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
    const MOLLIE_API_KEY = Deno.env.get("MOLLIE_API_KEY");
    if (!MOLLIE_API_KEY) throw new Error("MOLLIE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const formData = await req.formData();
    const paymentId = formData.get("id") as string;

    if (!paymentId) {
      return new Response("Missing payment ID", { status: 400, headers: corsHeaders });
    }

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

    // ─── Generate tickets when payment is confirmed ───
    if (status === "paid") {
      try {
        // Fetch the order to get items and event info
        const { data: order } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (order) {
          const items = order.items as Array<{
            ticketId: string;
            name: string;
            quantity: number;
            priceEur: number;
          }>;

          // Check if tickets already exist for this order (idempotency)
          const { data: existingTickets } = await supabase
            .from("tickets")
            .select("id")
            .eq("order_id", orderId)
            .limit(1);

          if (!existingTickets || existingTickets.length === 0) {
            const ticketRows = [];

            for (const item of items) {
              for (let i = 0; i < item.quantity; i++) {
                ticketRows.push({
                  order_id: orderId,
                  event_id: order.event_id,
                  ticket_category_id: item.ticketId,
                  holder_name: order.name || null,
                  holder_email: order.email,
                  qr_code: generateQRCode(),
                  status: "valid",
                });
              }
            }

            if (ticketRows.length > 0) {
              const { error: ticketError } = await supabase
                .from("tickets")
                .insert(ticketRows);

              if (ticketError) {
                console.error("Ticket generation failed:", ticketError);
              } else {
                console.log(`Generated ${ticketRows.length} tickets for order ${orderId}`);
              }
            }
          } else {
            console.log(`Tickets already exist for order ${orderId}, skipping generation`);
          }
        }
      } catch (ticketErr) {
        // Don't fail the webhook if ticket generation fails
        console.error("Ticket generation error:", ticketErr);
      }
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
