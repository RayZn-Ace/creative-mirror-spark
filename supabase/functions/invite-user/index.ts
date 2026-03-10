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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

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

    const validAppRoles = ["admin", "moderator", "user", "scanner"];
    const appRole = validAppRoles.includes(role) ? role : "user";

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
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

    // Build redirect URL
    const origin = req.headers.get("origin") 
      || req.headers.get("referer")?.replace(/\/[^/]*$/, "")
      || "https://nightlifeticket.app";
    const redirectTo = `${origin}/admin/register`;

    // Generate invite link (does NOT send email when using generateLink)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: { redirectTo },
    });

    if (linkError) {
      console.error("Generate link error:", linkError);
      throw new Error(`Einladungslink konnte nicht erstellt werden: ${linkError.message}`);
    }

    const inviteLink = linkData?.properties?.action_link;
    if (!inviteLink) {
      throw new Error("Kein Einladungslink generiert");
    }

    console.log("Generated invite link for:", email);

    // Send invite email via Resend
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY nicht konfiguriert");
    }

    const roleLabels: Record<string, string> = {
      admin: "Administrator",
      moderator: "Moderator",
      scanner: "Scanner",
      user: "Benutzer",
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;color:#1a1a1a;margin:0;">NIGHTLIFE GENERATION</h1>
    </div>
    <div style="background:#f9f9f9;border-radius:12px;padding:32px;">
      <h2 style="font-size:20px;color:#1a1a1a;margin:0 0 16px;">Du wurdest eingeladen! 🎉</h2>
      <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 16px;">
        Du wurdest als <strong>${roleLabels[appRole] || appRole}</strong> zum Admin-Bereich von Nightlife Generation eingeladen.
      </p>
      <p style="font-size:15px;color:#555;line-height:1.6;margin:0 0 24px;">
        Klicke auf den Button, um dein Konto zu aktivieren und ein Passwort festzulegen.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${inviteLink}" style="display:inline-block;background:#d9338a;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:8px;">
          Einladung annehmen
        </a>
      </div>
      <p style="font-size:13px;color:#999;line-height:1.5;margin:24px 0 0;">
        Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
        <a href="${inviteLink}" style="color:#d9338a;word-break:break-all;">${inviteLink}</a>
      </p>
    </div>
    <p style="font-size:12px;color:#999;text-align:center;margin-top:24px;">
      © Nightlife Generation • mail@nightlifeticket.app
    </p>
  </div>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nightlife Generation <onboarding@nightlifeticket.app>",
        to: [email],
        subject: "Du wurdest eingeladen – Nightlife Generation Admin 🎉",
        html: htmlContent,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      throw new Error(`E-Mail konnte nicht gesendet werden: ${JSON.stringify(resendData)}`);
    }

    console.log("Invite email sent via Resend:", resendData);

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
