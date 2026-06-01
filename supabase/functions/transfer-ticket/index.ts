import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Nicht autorisiert");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Nicht autorisiert");

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json();
    const { ticket_id, to_email, to_name, message } = body;

    if (!ticket_id || !to_email) throw new Error("ticket_id und to_email erforderlich");
    const normalizedTo = String(to_email).trim().toLowerCase();
    if (normalizedTo === (user.email || "").toLowerCase()) {
      throw new Error("Du kannst Tickets nicht an dich selbst senden");
    }

    // Validate ownership: ticket must belong to an order with the user's email
    const { data: ticket } = await admin
      .from("tickets")
      .select("*, orders!inner(email, status), events(date, title)")
      .eq("id", ticket_id)
      .maybeSingle();

    if (!ticket) throw new Error("Ticket nicht gefunden");
    if ((ticket.orders.email || "").toLowerCase() !== (user.email || "").toLowerCase()) {
      throw new Error("Dieses Ticket gehört nicht dir");
    }
    if (ticket.status !== "valid") throw new Error("Dieses Ticket kann nicht mehr transferiert werden");
    if (ticket.events?.date && new Date(ticket.events.date) < new Date()) {
      throw new Error("Das Event ist bereits vorbei");
    }

    // Insert transfer log
    const { error: insErr } = await admin.from("ticket_transfers").insert({
      ticket_id,
      from_user_id: user.id,
      from_email: user.email,
      to_email: normalizedTo,
      to_name: to_name ?? null,
      message: message ?? null,
      status: "accepted",
      completed_at: new Date().toISOString(),
    });
    if (insErr) throw insErr;

    // Update ticket holder info
    const { error: updErr } = await admin
      .from("tickets")
      .update({
        holder_email: normalizedTo,
        holder_name: to_name ?? null,
      })
      .eq("id", ticket_id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
