import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Strip non-WinAnsi characters (emojis, special Unicode) to prevent encoding errors
const sanitize = (text: string): string =>
  text.replace(/[^\x00-\xFF\u0100-\u017F]/g, "").trim();

async function generatePdf(form: any): Promise<Uint8Array> {
  // Sanitize all string fields
  for (const key of Object.keys(form)) {
    if (typeof form[key] === "string") {
      form[key] = sanitize(form[key]);
    }
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const accent = rgb(0.55, 0.15, 0.85);
  const white = rgb(1, 1, 1);

  page.drawRectangle({ x: 0, y: 0, width, height, color: white });

  // Header
  page.drawRectangle({ x: 0, y: height - 90, width, height: 90, color: rgb(0.08, 0.08, 0.12) });
  page.drawText("NIGHTLIFE GENERATION", { x: 40, y: height - 40, size: 22, font: fontBold, color: white });
  page.drawText("CLUBZETTEL / MUTTIZETTEL", { x: 40, y: height - 65, size: 12, font: fontRegular, color: rgb(0.7, 0.7, 0.7) });

  let y = height - 120;

  page.drawText("VERANSTALTUNG", { x: 40, y, size: 9, font: fontBold, color: accent });
  y -= 18;
  page.drawText(form.event_title || "-", { x: 40, y, size: 14, font: fontBold, color: black });
  y -= 16;

  if (form.event_date) {
    const dateStr = new Date(form.event_date).toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    page.drawText(dateStr, { x: 40, y, size: 10, font: fontRegular, color: gray });
    y -= 14;
  }

  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });

  const drawSection = (title: string, fields: { label: string; value: string }[]) => {
    y -= 25;
    page.drawText(title, { x: 40, y, size: 10, font: fontBold, color: accent });
    y -= 5;
    for (const field of fields) {
      if (!field.value) continue;
      y -= 16;
      page.drawText(field.label + ":", { x: 40, y, size: 9, font: fontRegular, color: gray });
      page.drawText(field.value, { x: 180, y, size: 10, font: fontBold, color: black, maxWidth: width - 220 });
    }
  };

  const embedSignature = async (dataUrl: string, xPos: number, yPos: number, maxW: number, maxH: number) => {
    try {
      const base64Data = dataUrl.split(",")[1];
      if (!base64Data) return;
      const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
      const pngImage = await pdfDoc.embedPng(imageBytes);
      const dims = pngImage.scaleToFit(maxW, maxH);
      page.drawImage(pngImage, { x: xPos, y: yPos, width: dims.width, height: dims.height });
    } catch (err) {
      console.error("Failed to embed signature:", err);
      page.drawText("[Unterschrift nicht lesbar]", { x: xPos, y: yPos + 2, size: 8, font: fontRegular, color: accent });
    }
  };

  drawSection("SORGEBERECHTIGTE PERSON", [
    { label: "Name", value: form.parent_name },
    { label: "Anschrift", value: form.parent_address },
    { label: "PLZ / Ort", value: [form.parent_zip, form.parent_city].filter(Boolean).join(" ") },
    { label: "Land", value: form.parent_country },
    { label: "Telefon", value: form.parent_phone },
    { label: "Geburtsdatum", value: form.parent_birthday ? new Date(form.parent_birthday).toLocaleDateString("de-DE") : "" },
  ]);

  drawSection("MINDERJAEHRIGE PERSON", [
    { label: "Name", value: form.minor_name },
    { label: "Anschrift", value: form.minor_address },
    { label: "PLZ / Ort", value: [form.minor_zip, form.minor_city].filter(Boolean).join(" ") },
    { label: "Land", value: form.minor_country },
    { label: "Telefon", value: form.minor_phone },
    { label: "Geburtsdatum", value: form.minor_birthday ? new Date(form.minor_birthday).toLocaleDateString("de-DE") : "" },
  ]);

  if (form.supervisor_name) {
    drawSection("AUFSICHTSPERSON (18+)", [
      { label: "Name", value: form.supervisor_name },
      { label: "Anschrift", value: form.supervisor_address || "" },
      { label: "PLZ / Ort", value: [form.supervisor_zip, form.supervisor_city].filter(Boolean).join(" ") },
      { label: "Land", value: form.supervisor_country || "" },
      { label: "E-Mail", value: form.supervisor_email || "" },
      { label: "Telefon", value: form.supervisor_phone || "" },
      { label: "Geburtsdatum", value: form.supervisor_birthday ? new Date(form.supervisor_birthday).toLocaleDateString("de-DE") : "" },
    ]);
  } else {
    y -= 25;
    page.drawText("AUFSICHTSPERSON (18+)", { x: 40, y, size: 10, font: fontBold, color: accent });
    y -= 18;
    page.drawText("Bitte hier handschriftlich eintragen:", { x: 40, y, size: 9, font: fontRegular, color: gray });
    for (const label of ["Name", "Anschrift", "Telefon", "Geburtsdatum"]) {
      y -= 22;
      page.drawText(label + ":", { x: 40, y, size: 9, font: fontRegular, color: gray });
      page.drawLine({ start: { x: 180, y: y - 2 }, end: { x: width - 40, y: y - 2 }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
    }
  }

  y -= 35;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) });

  y -= 25;
  page.drawText("ERKLAERUNG", { x: 40, y, size: 10, font: fontBold, color: accent });
  y -= 16;

  const declaration = "Hiermit erklaere ich mich als sorgeberechtigte Person einverstanden, dass die oben genannte minderjaehrige Person die Veranstaltung besucht. Die Aufsichtspflicht uebertrage ich an die oben genannte Aufsichtsperson.";
  const words = declaration.split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (fontRegular.widthOfTextAtSize(test, 9) > width - 80) {
      page.drawText(line, { x: 40, y, size: 9, font: fontRegular, color: black });
      y -= 14;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x: 40, y, size: 9, font: fontRegular, color: black });
    y -= 14;
  }

  y -= 30;
  page.drawText("Ort, Datum", { x: 40, y: y + 12, size: 8, font: fontRegular, color: gray });
  page.drawLine({ start: { x: 40, y }, end: { x: 250, y }, thickness: 0.5, color: black });

  page.drawText("Unterschrift Sorgeberechtigte/r", { x: 300, y: y + 12, size: 8, font: fontRegular, color: gray });
  page.drawLine({ start: { x: 300, y }, end: { x: width - 40, y }, thickness: 0.5, color: black });

  if (form.parent_signature) {
    await embedSignature(form.parent_signature, 305, y + 2, 240, 40);
  } else if (form.has_signature) {
    page.drawText("[Elektronisch unterschrieben]", { x: 310, y: y + 2, size: 8, font: fontRegular, color: accent });
  }

  y -= 50;
  page.drawText("Unterschrift Aufsichtsperson (18+)", { x: 40, y: y + 12, size: 8, font: fontRegular, color: gray });
  page.drawLine({ start: { x: 40, y }, end: { x: 300, y }, thickness: 0.5, color: black });

  if (form.supervisor_signature) {
    await embedSignature(form.supervisor_signature, 45, y + 2, 250, 40);
  } else if (form.has_supervisor_signature) {
    page.drawText("[Elektronisch unterschrieben]", { x: 50, y: y + 2, size: 8, font: fontRegular, color: accent });
  }

  page.drawText("Nightlife Generation | nightlifeticket.app", { x: 40, y: 30, size: 7, font: fontRegular, color: gray });
  page.drawText(`Erstellt am: ${new Date().toLocaleDateString("de-DE")}`, { x: 40, y: 20, size: 7, font: fontRegular, color: gray });

  return await pdfDoc.save();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { form_id } = await req.json();
    if (!form_id) {
      return new Response(JSON.stringify({ error: "form_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: form, error: formErr } = await adminClient
      .from("u18_forms")
      .select("*")
      .eq("id", form_id)
      .single();

    if (formErr || !form) {
      return new Response(JSON.stringify({ error: "Form not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate PDF
    const pdfBytes = await generatePdf(form);

    // Send email via Resend
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured, skipping email");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    const eventTitle = sanitize(form.event_title || "Veranstaltung");
    const minorName = sanitize(form.minor_name || "");

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#111118;border-radius:12px;padding:30px;text-align:center;margin-bottom:24px;">
      <h1 style="color:#ffffff;font-size:22px;margin:0 0 4px 0;letter-spacing:2px;">NIGHTLIFE GENERATION</h1>
      <p style="color:#999;font-size:12px;margin:0;">CLUBZETTEL</p>
    </div>
    <div style="background:#f8f8fa;border-radius:12px;padding:30px;border:1px solid #e8e8ee;">
      <h2 style="color:#1a1a2e;font-size:18px;margin:0 0 12px 0;">Hallo ${minorName || ""}! 🎉</h2>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
        Dein Clubzettel fuer <strong>${eventTitle}</strong> wurde erfolgreich erstellt und ist als PDF im Anhang beigefuegt.
      </p>
      <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
        Bitte drucke den Clubzettel aus und bringe ihn zur Veranstaltung mit. Ohne den unterschriebenen Clubzettel ist kein Einlass moeglich.
      </p>
      <div style="background:#fff;border:1px solid #e0e0e8;border-radius:8px;padding:16px;margin-top:16px;">
        <p style="color:#888;font-size:12px;margin:0 0 4px 0;">CHECKLISTE</p>
        <p style="color:#333;font-size:13px;margin:2px 0;">&#9745; Clubzettel ausdrucken</p>
        <p style="color:#333;font-size:13px;margin:2px 0;">&#9745; Von Erziehungsberechtigtem unterschreiben lassen</p>
        <p style="color:#333;font-size:13px;margin:2px 0;">&#9745; Personalausweis mitbringen</p>
        <p style="color:#333;font-size:13px;margin:2px 0;">&#9745; Clubzettel am Einlass vorzeigen</p>
      </div>
    </div>
    <p style="color:#999;font-size:11px;text-align:center;margin-top:24px;">
      Nightlife Generation &middot; nightlifeticket.app<br>
      Diese E-Mail wurde automatisch generiert.
    </p>
  </div>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Nightlife Generation <noreply@nightlifeticket.app>",
        to: [form.email],
        subject: `Dein Clubzettel fuer ${eventTitle}`,
        html: htmlBody,
        attachments: [
          {
            filename: `clubzettel-${form_id.slice(0, 8)}.pdf`,
            content: pdfBase64,
            content_type: "application/pdf",
          },
        ],
      }),
    });

    const resendBody = await resendRes.text();

    if (!resendRes.ok) {
      console.error("Resend error:", resendBody);
      return new Response(JSON.stringify({ error: "Email sending failed", details: resendBody }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Clubzettel email sent to:", form.email);

    return new Response(JSON.stringify({ success: true, email: form.email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-u18-email error:", err);
    return new Response(JSON.stringify({ error: "Failed to send email", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
