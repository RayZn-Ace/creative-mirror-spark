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
    const { data: roleData } = await admin
      .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleData) throw new Error("Keine Admin-Berechtigung");

    const body = await req.json();
    const {
      recipients = [], // array of {email?, user_id?}
      target = "list", // "list" | "all_customers" | "level"
      level, // optional 'bronze'|'silver'|...
      goodie,
    } = body;

    if (!goodie?.title) throw new Error("Titel fehlt");

    // Resolve user_ids
    const userIds = new Set<string>();

    if (target === "list") {
      for (const r of recipients) {
        if (r.user_id) { userIds.add(r.user_id); continue; }
        if (r.email) {
          const email = String(r.email).trim().toLowerCase();
          // Try customer_profiles via auth user lookup
          const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
          const match = list?.users?.find((u: any) => (u.email || "").toLowerCase() === email);
          if (match) userIds.add(match.id);
        }
      }
    } else if (target === "all_customers") {
      // every customer profile (page in chunks)
      let from = 0;
      const size = 1000;
      while (true) {
        const { data, error } = await admin.from("customer_profiles").select("user_id").range(from, from + size - 1);
        if (error) throw error;
        (data || []).forEach((r: any) => userIds.add(r.user_id));
        if (!data || data.length < size) break;
        from += size;
      }
    } else if (target === "level") {
      // aggregate loyalty_points server-side
      let from = 0;
      const size = 1000;
      const sums = new Map<string, number>();
      while (true) {
        const { data, error } = await admin.from("loyalty_points").select("user_id, points").range(from, from + size - 1);
        if (error) throw error;
        (data || []).forEach((r: any) => sums.set(r.user_id, (sums.get(r.user_id) || 0) + (r.points || 0)));
        if (!data || data.length < size) break;
        from += size;
      }
      const ranges: Record<string, [number, number]> = {
        bronze: [0, 99], silver: [100, 299], gold: [300, 699], platinum: [700, 1499], legend: [1500, Number.MAX_SAFE_INTEGER],
      };
      const [lo, hi] = ranges[level] || [0, Number.MAX_SAFE_INTEGER];
      for (const [uid, pts] of sums.entries()) if (pts >= lo && pts <= hi) userIds.add(uid);
    }

    if (userIds.size === 0) {
      return new Response(JSON.stringify({ ok: false, error: "Keine Empfänger gefunden" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = Array.from(userIds).map((uid) => ({
      user_id: uid,
      type: goodie.type || "voucher",
      title: goodie.title,
      description: goodie.description || null,
      code: goodie.code || null,
      value: goodie.value ?? 0,
      value_type: goodie.value_type || "fixed",
      event_id: goodie.event_id || null,
      icon: goodie.icon || "Gift",
      color: goodie.color || "hsl(270 70% 55%)",
      expires_at: goodie.expires_at || null,
      created_by: user.id,
      metadata: goodie.metadata || {},
    }));

    const { error: insErr } = await admin.from("member_goodies").insert(rows);
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, count: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
