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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) throw new Error("Nicht autorisiert");

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) throw new Error("E-Mail fehlt");
    if (email === (user.email || "").toLowerCase()) {
      throw new Error("Du kannst dich nicht selbst einladen 😅");
    }

    // Look up if user exists
    let foundId: string | null = null;
    let page = 1;
    while (page <= 10 && !foundId) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const hit = data.users.find((u) => (u.email || "").toLowerCase() === email);
      if (hit) foundId = hit.id;
      if (!data.users.length || data.users.length < 200) break;
      page++;
    }

    if (foundId) {
      const { error: insErr } = await admin.from("friendships").insert({
        requester_id: user.id,
        addressee_id: foundId,
        status: "pending",
      });
      if (insErr && insErr.code !== "23505") throw new Error(insErr.message);
      return new Response(
        JSON.stringify({ status: "friend_request_sent" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get inviter info + referral code
    const { data: inviterProfile } = await admin
      .from("customer_profiles")
      .select("display_name, first_name, referral_code")
      .eq("user_id", user.id)
      .maybeSingle();

    const inviterName =
      inviterProfile?.display_name ||
      inviterProfile?.first_name ||
      (user.email || "Ein Freund").split("@")[0];
    const refCode = inviterProfile?.referral_code || "";

    const origin =
      req.headers.get("origin") ||
      req.headers.get("referer")?.replace(/\/[^/]*$/, "") ||
      "https://nightlifeticket.app";
    const inviteLink = `${origin}/auth/register${refCode ? `?ref=${encodeURIComponent(refCode)}` : ""}`;

    if (!resendApiKey) throw new Error("E-Mail-Versand nicht konfiguriert");

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#fff;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:28px;">
      <h1 style="font-size:22px;color:#fff;margin:0;letter-spacing:1px;">NIGHTLIFE GENERATION</h1>
    </div>
    <div style="background:linear-gradient(135deg,#d9338a,#7c3aed);border-radius:16px;padding:32px;text-align:center;">
      <h2 style="font-size:26px;margin:0 0 12px;color:#fff;">${inviterName} will mit dir feiern 🎉</h2>
      <p style="font-size:16px;line-height:1.6;margin:0 0 24px;color:rgba(255,255,255,0.92);">
        ${inviterName} hat dich zu Nightlife Generation eingeladen. Erstelle deinen Account und seht gemeinsam, auf welche Partys ihr geht – komplett kostenlos.
      </p>
      <a href="${inviteLink}" style="display:inline-block;background:#fff;color:#d9338a;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 32px;border-radius:999px;">
        Jetzt einsteigen
      </a>
    </div>
    <p style="font-size:13px;color:#888;text-align:center;margin-top:24px;">
      Link funktioniert nicht? <a href="${inviteLink}" style="color:#d9338a;">${inviteLink}</a>
    </p>
    <p style="font-size:11px;color:#555;text-align:center;margin-top:24px;">
      © Nightlife Generation • Wenn du diese Mail nicht erwartet hast, ignoriere sie einfach.
    </p>
  </div>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Nightlife Generation <onboarding@nightlifeticket.app>",
        to: [email],
        subject: `${inviterName} hat dich zu Nightlife Generation eingeladen 🎉`,
        html,
      }),
    });
    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      throw new Error("E-Mail konnte nicht gesendet werden");
    }

    return new Response(
      JSON.stringify({ status: "invite_email_sent" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("invite-friend error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
