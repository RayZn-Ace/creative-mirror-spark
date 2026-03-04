import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Keine Admin-Berechtigung");

    const { email, role } = await req.json();
    if (!email || !role) throw new Error("E-Mail und Rolle sind erforderlich");

    // Map role to app_role enum value for pending_invitations
    const validAppRoles = ["admin", "moderator", "user", "scanner"];
    const appRole = validAppRoles.includes(role) ? role : "user";

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      // User exists – assign role directly via service role (bypasses RLS)
      const { error: roleError } = await adminClient
        .from("user_roles")
        .upsert({ user_id: existingUser.id, role: appRole }, { onConflict: "user_id,role" });
      if (roleError) throw roleError;

      return new Response(
        JSON.stringify({ success: true, message: "Rolle direkt zugewiesen (Benutzer existiert bereits)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store pending invitation
    const { error: invError } = await adminClient
      .from("pending_invitations")
      .insert({ email: email.toLowerCase(), role: appRole, invited_by: user.id });
    if (invError) {
      console.error("Invitation insert error:", invError);
      throw new Error(`Einladung konnte nicht gespeichert werden: ${invError.message}`);
    }

    // Build redirect URL from referer or origin
    const origin = req.headers.get("referer")?.replace(/\/$/, "") 
      || req.headers.get("origin") 
      || "https://gimmetestooo.lovable.app";
    const redirectTo = `${origin}/admin/login`;

    console.log("Sending invite to:", email, "with redirect:", redirectTo);

    // Send invite email via Supabase Auth
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });
    
    if (inviteError) {
      console.error("Invite error:", inviteError);
      throw new Error(`Einladungs-E-Mail konnte nicht gesendet werden: ${inviteError.message}`);
    }

    console.log("Invite sent successfully:", inviteData);

    return new Response(
      JSON.stringify({ success: true, message: `Einladung an ${email} gesendet` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("invite-user error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
