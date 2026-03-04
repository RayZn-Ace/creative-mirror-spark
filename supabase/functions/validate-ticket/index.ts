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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { qr_code, event_id, scanner_token, action } = body;
    // action: "validate" (just check) or "checkin" (mark as checked in)

    if (!qr_code) {
      return new Response(JSON.stringify({ error: "Missing QR code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If using scanner token, validate it
    if (scanner_token) {
      const { data: link } = await supabase
        .from("scanner_links")
        .select("*")
        .eq("token", scanner_token)
        .eq("active", true)
        .single();

      if (!link) {
        return new Response(JSON.stringify({ error: "Invalid or expired scanner link" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Scanner link expired" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Use the event_id from the scanner link
      if (link.event_id) {
        body.event_id_from_link = link.event_id;
      }
    }

    // Fetch ticket by QR code
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        events:event_id (title, date, location_name, city),
        ticket_categories:ticket_category_id (name, category_group)
      `)
      .eq("qr_code", qr_code)
      .single();

    if (ticketError || !ticket) {
      return new Response(JSON.stringify({
        valid: false,
        error: "Ticket nicht gefunden",
        status: "not_found",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check event match if provided
    const checkEventId = event_id || body.event_id_from_link;
    if (checkEventId && ticket.event_id !== checkEventId) {
      return new Response(JSON.stringify({
        valid: false,
        error: "Ticket gehört zu einem anderen Event",
        status: "wrong_event",
        ticket: {
          holder_name: ticket.holder_name,
          category: ticket.ticket_categories?.name,
          event: ticket.events?.title,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check ticket status
    if (ticket.status === "checked_in") {
      return new Response(JSON.stringify({
        valid: false,
        error: "Ticket bereits eingecheckt",
        status: "already_checked_in",
        checked_in_at: ticket.checked_in_at,
        ticket: {
          holder_name: ticket.holder_name,
          category: ticket.ticket_categories?.name,
          group: ticket.ticket_categories?.category_group,
          event: ticket.events?.title,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ticket.status === "cancelled") {
      return new Response(JSON.stringify({
        valid: false,
        error: "Ticket wurde storniert",
        status: "cancelled",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If just validating
    if (action !== "checkin") {
      return new Response(JSON.stringify({
        valid: true,
        status: "valid",
        ticket: {
          id: ticket.id,
          holder_name: ticket.holder_name,
          holder_email: ticket.holder_email,
          category: ticket.ticket_categories?.name,
          group: ticket.ticket_categories?.category_group,
          event: ticket.events?.title,
          event_date: ticket.events?.date,
          location: ticket.events?.location_name,
          city: ticket.events?.city,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check in the ticket
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        status: "checked_in",
        checked_in_at: new Date().toISOString(),
      })
      .eq("id", ticket.id);

    if (updateError) {
      console.error("Check-in update failed:", updateError);
      return new Response(JSON.stringify({
        valid: false,
        error: "Check-in fehlgeschlagen",
        status: "error",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      valid: true,
      status: "checked_in",
      ticket: {
        id: ticket.id,
        holder_name: ticket.holder_name,
        holder_email: ticket.holder_email,
        category: ticket.ticket_categories?.name,
        group: ticket.ticket_categories?.category_group,
        event: ticket.events?.title,
        event_date: ticket.events?.date,
        city: ticket.events?.city,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Validate ticket error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
