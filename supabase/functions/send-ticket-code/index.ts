import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Ungültige E-Mail" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store code
    const { error: insertError } = await supabase
      .from("ticket_verification_codes")
      .insert({ email: email.toLowerCase().trim(), code });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Fehler beim Speichern" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GIMME <verification@gimmegimmeparty.com>",
        to: [email],
        subject: "Dein Verifizierungscode – GIMME Tickets",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #ffffff; border-radius: 16px;">
            <h1 style="font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">GIMME</h1>
            <p style="color: #aaa; font-size: 14px; margin-bottom: 32px;">Dein Verifizierungscode für „Meine Tickets"</p>
            <div style="background: #1a1a2e; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #e91e8c;">${code}</span>
            </div>
            <p style="color: #888; font-size: 13px; text-align: center;">Der Code ist 10 Minuten gültig.</p>
            <p style="color: #555; font-size: 11px; text-align: center; margin-top: 24px;">Falls du diesen Code nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: "E-Mail konnte nicht gesendet werden" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Interner Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
