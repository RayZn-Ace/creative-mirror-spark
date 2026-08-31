import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const strArray = (v: unknown) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];

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
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Keine Admin-Berechtigung");

    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "list") {
      const { data, error } = await admin
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ partners: data ?? [] });
    }

    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const name = String(body.name ?? "").trim();
      const password = String(body.password ?? "");
      if (!email || !name) throw new Error("Name und E-Mail sind erforderlich");
      if (password.length < 8) throw new Error("Passwort muss mindestens 8 Zeichen haben");

      const { data: existing } = await admin.auth.admin.listUsers();
      let userId = existing?.users?.find((u) => u.email?.toLowerCase() === email)?.id ?? null;

      if (!userId) {
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { display_name: name, partner: true },
        });
        if (createErr) throw createErr;
        userId = created.user!.id;
      } else {
        const { error: pwErr } = await admin.auth.admin.updateUserById(userId, { password });
        if (pwErr) throw pwErr;
      }

      const { data, error } = await admin
        .from("partners")
        .upsert(
          {
            user_id: userId,
            email,
            name,
            company: body.company ?? null,
            notes: body.notes ?? null,
            permissions: strArray(body.permissions),
            series_ids: strArray(body.series_ids),
            active: true,
            created_by: user.id,
          },
          { onConflict: "user_id" },
        )
        .select()
        .single();
      if (error) throw error;
      return json({ partner: data });
    }

    if (action === "update") {
      const id = String(body.id ?? "");
      if (!id) throw new Error("ID fehlt");
      const updates: Record<string, unknown> = {};
      if (body.name !== undefined) updates.name = String(body.name);
      if (body.company !== undefined) updates.company = body.company;
      if (body.notes !== undefined) updates.notes = body.notes;
      if (body.permissions !== undefined) updates.permissions = strArray(body.permissions);
      if (body.series_ids !== undefined) updates.series_ids = strArray(body.series_ids);
      if (body.active !== undefined) updates.active = !!body.active;

      const { data, error } = await admin.from("partners").update(updates).eq("id", id).select().single();
      if (error) throw error;

      if (body.password) {
        if (String(body.password).length < 8) throw new Error("Passwort muss mindestens 8 Zeichen haben");
        if (data.user_id) {
          const { error: pwErr } = await admin.auth.admin.updateUserById(data.user_id, { password: String(body.password) });
          if (pwErr) throw pwErr;
        }
      }
      return json({ partner: data });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      if (!id) throw new Error("ID fehlt");
      const { data: partner } = await admin.from("partners").select("user_id").eq("id", id).maybeSingle();
      const { error } = await admin.from("partners").delete().eq("id", id);
      if (error) throw error;
      if (partner?.user_id && body.delete_account) {
        await admin.auth.admin.deleteUser(partner.user_id);
      }
      return json({ success: true });
    }

    throw new Error("Unbekannte Aktion");
  } catch (error) {
    console.error("manage-partners error:", error);
    return json({ error: (error as Error).message }, 400);
  }
});
