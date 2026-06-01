import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Body: { action: "lookup_by_email", email } => { user_id }
 * Body: { action: "friends_at_event", event_id } => { friend_user_ids: string[] }
 */
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
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "lookup_by_email") {
      const email = String(body.email || "").trim().toLowerCase();
      if (!email) throw new Error("E-Mail fehlt");
      // page through users (limit to first 1000 for now)
      let foundId: string | null = null;
      let page = 1;
      while (page <= 10 && !foundId) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) break;
        const hit = data.users.find((u) => (u.email || "").toLowerCase() === email);
        if (hit) foundId = hit.id;
        if (data.users.length < 200) break;
        page++;
      }
      return new Response(JSON.stringify({ user_id: foundId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "friends_at_event") {
      const eventId = String(body.event_id || "");
      if (!eventId) throw new Error("event_id fehlt");

      // Accepted friendships involving the caller
      const { data: friendships } = await admin
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      const friendIds = (friendships ?? []).map((f: any) =>
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );
      if (friendIds.length === 0) {
        return new Response(JSON.stringify({ friend_user_ids: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Friends with visibility on
      const { data: profs } = await admin
        .from("customer_profiles")
        .select("user_id")
        .in("user_id", friendIds)
        .eq("show_attendance", true);
      const visible = new Set((profs ?? []).map((p: any) => p.user_id));
      if (visible.size === 0) {
        return new Response(JSON.stringify({ friend_user_ids: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get emails of visible friends
      const emailToId = new Map<string, string>();
      for (const uid of visible) {
        const { data: { user: u } } = await admin.auth.admin.getUserById(uid);
        if (u?.email) emailToId.set(u.email.toLowerCase(), uid);
      }

      if (emailToId.size === 0) {
        return new Response(JSON.stringify({ friend_user_ids: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find paid orders for event with matching emails
      const { data: orders } = await admin
        .from("orders")
        .select("email")
        .eq("event_id", eventId)
        .eq("status", "paid");

      const goingIds = new Set<string>();
      (orders ?? []).forEach((o: any) => {
        const id = emailToId.get(String(o.email || "").toLowerCase());
        if (id) goingIds.add(id);
      });

      return new Response(JSON.stringify({ friend_user_ids: Array.from(goingIds) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unbekannte Aktion");
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
