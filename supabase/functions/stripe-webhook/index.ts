import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateQRCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments: string[] = [];
  for (let s = 0; s < 2; s++) {
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
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.text();
    let event: any;

    // Parse the Stripe event (without signature verification for simplicity)
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
    }

    if (event.type !== "checkout.session.completed") {
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    const session = event.data.object;
    const orderId = session.metadata?.order_id;

    if (!orderId) {
      console.error("No order_id in session metadata");
      return new Response("No order ID", { status: 400, headers: corsHeaders });
    }

    // Update order to paid
    const { error } = await supabase
      .from("orders")
      .update({
        status: "paid",
        stripe_payment_id: session.id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      console.error("Order update failed:", error);
      return new Response("DB update failed", { status: 500, headers: corsHeaders });
    }

    console.log(`Order ${orderId} updated to paid via Stripe`);

    // ─── Generate tickets ───
    try {
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

        const { data: existingTickets } = await supabase
          .from("tickets")
          .select("id")
          .eq("order_id", orderId)
          .limit(1);

        if (!existingTickets || existingTickets.length === 0) {
          const ticketRows = [];

          const categoryIds = items.map((i: any) => i.ticketId).filter(Boolean);
          const { data: categories } = categoryIds.length > 0
            ? await supabase.from("ticket_categories").select("id, group_size").in("id", categoryIds)
            : { data: [] };
          const groupSizeMap: Record<string, number> = {};
          for (const cat of categories || []) {
            groupSizeMap[cat.id] = cat.group_size || 1;
          }

          for (const item of items) {
            const groupSize = item.ticketId ? (groupSizeMap[item.ticketId] || 1) : 1;
            for (let i = 0; i < item.quantity; i++) {
              for (let g = 0; g < groupSize; g++) {
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
          }

          if (ticketRows.length > 0) {
            const { error: ticketError } = await supabase
              .from("tickets")
              .insert(ticketRows);

            if (ticketError) {
              console.error("Ticket generation failed:", ticketError);
            } else {
              console.log(`Generated ${ticketRows.length} tickets for order ${orderId}`);

              try {
                await fetch(`${SUPABASE_URL}/functions/v1/send-tickets`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ order_id: orderId }),
                });
                console.log(`Ticket email triggered for order ${orderId}`);
              } catch (emailErr) {
                console.error("Ticket email trigger failed:", emailErr);
              }
            }
          }
        } else {
          console.log(`Tickets already exist for order ${orderId}, skipping`);
        }
      }
    } catch (ticketErr) {
      console.error("Ticket generation error:", ticketErr);
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
