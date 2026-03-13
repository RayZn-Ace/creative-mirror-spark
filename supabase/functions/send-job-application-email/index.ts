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
    const { name, alter, instagram, stadt, email, telefon, bereich, kommentar } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rows = [
      { label: "Name", value: name },
      { label: "Bereich", value: bereich },
      { label: "Alter", value: alter },
      { label: "E-Mail", value: email },
      { label: "Telefon", value: telefon },
      { label: "Instagram", value: instagram },
      { label: "Stadt", value: stadt },
      { label: "Kommentar", value: kommentar },
    ].filter((r) => r.value);

    const tableRows = rows
      .map(
        (r) =>
          `<tr><td style="padding:8px 12px;font-size:13px;color:#888;border-bottom:1px solid #f0f0f5;white-space:nowrap;">${r.label}</td><td style="padding:8px 12px;font-size:14px;color:#1a1a2e;font-weight:600;border-bottom:1px solid #f0f0f5;">${r.value}</td></tr>`
      )
      .join("");

    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#111118;border-radius:12px;padding:30px;text-align:center;margin-bottom:24px;">
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 4px 0;letter-spacing:2px;">NIGHTLIFE GENERATION</h1>
      <p style="color:#999;font-size:12px;margin:0;">NEUE BEWERBUNG</p>
    </div>
    <div style="background:#f8f8fa;border-radius:12px;padding:30px;border:1px solid #e8e8ee;">
      <h2 style="color:#1a1a2e;font-size:18px;margin:0 0 6px 0;">Bewerbung: ${bereich || "Unbekannt"}</h2>
      <p style="color:#555;font-size:14px;margin:0 0 20px 0;">Von <strong>${name || "Unbekannt"}</strong></p>
      <table style="width:100%;border-collapse:collapse;">
        ${tableRows}
      </table>
    </div>
    <p style="color:#999;font-size:11px;text-align:center;margin-top:24px;">
      Nightlife Generation &middot; nightlifeticket.app<br>
      Eingegangen am ${new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
    </p>
  </div>
</body></html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Nightlife Generation <noreply@nightlifeticket.app>",
        to: ["support@swayeagency.de"],
        subject: `Neue Bewerbung – ${name || "Unbekannt"} (${bereich || "?"})`,
        html: htmlBody,
        reply_to: email || undefined,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("Resend error:", errText);
      return new Response(JSON.stringify({ error: "Email failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Job application email sent for:", name);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-job-application-email error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
