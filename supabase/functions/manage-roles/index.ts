import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Nicht autorisiert");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Nicht autorisiert");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Keine Admin-Berechtigung");

    const { action, name, display_name, color } = await req.json();

    if (action === "create") {
      if (!name || !display_name) throw new Error("Name und Anzeigename sind erforderlich");

      const safeName = name.toLowerCase().replace(/[^a-z0-9_]/g, "_");

      // Add to app_role enum
      try {
        await adminClient.rpc("exec_sql", { sql: `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS '${safeName}'` });
      } catch {
        // Try direct SQL via service role
        const dbUrl = Deno.env.get("SUPABASE_DB_URL");
        if (dbUrl) {
          // Use pg to add enum value - fallback: just insert into custom_roles
        }
      }

      // Insert into custom_roles
      const { error: insertError } = await adminClient
        .from("custom_roles")
        .insert({ name: safeName, display_name, color: color || "#888888", is_system: false });
      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true, name: safeName }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      if (!name) throw new Error("Name ist erforderlich");

      // Check if system role
      const { data: roleCheck } = await adminClient
        .from("custom_roles")
        .select("is_system")
        .eq("name", name)
        .single();
      if (roleCheck?.is_system) throw new Error("System-Rollen können nicht gelöscht werden");

      // Delete permissions for this role
      await adminClient.from("role_permissions").delete().eq("role", name);

      // Delete role
      const { error } = await adminClient.from("custom_roles").delete().eq("name", name);
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      if (!name) throw new Error("Name ist erforderlich");
      const updates: Record<string, any> = {};
      if (display_name) updates.display_name = display_name;
      if (color) updates.color = color;

      const { error } = await adminClient
        .from("custom_roles")
        .update(updates)
        .eq("name", name);
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Unbekannte Aktion");
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
