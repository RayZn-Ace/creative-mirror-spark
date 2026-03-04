import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate QR code PNG bytes via public API
async function fetchQRCode(data: string): Promise<Uint8Array> {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&format=png`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("QR code generation failed");
  return new Uint8Array(await res.arrayBuffer());
}

async function generateTicketPDF(tickets: Array<{
  qr_code: string;
  holder_name: string | null;
  category_name: string;
  category_group: string | null;
  event_title: string;
  event_date: string | null;
  event_time: string | null;
  location_name: string | null;
  location_address: string | null;
}>): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const ticket of tickets) {
    const page = pdfDoc.addPage([420, 600]);
    const { width, height } = page.getSize();

    // Background
    page.drawRectangle({
      x: 0, y: 0, width, height,
      color: rgb(0.08, 0.08, 0.12),
    });

    // Top accent bar
    page.drawRectangle({
      x: 0, y: height - 6, width, height: 6,
      color: rgb(0.85, 0.2, 0.55),
    });

    // "TICKET" header
    page.drawText("TICKET", {
      x: 30, y: height - 50,
      size: 28, font: fontBold,
      color: rgb(1, 1, 1),
    });

    // Event title
    const titleLines = wrapText(ticket.event_title.toUpperCase(), fontBold, 14, width - 60);
    let yPos = height - 85;
    for (const line of titleLines) {
      page.drawText(line, {
        x: 30, y: yPos,
        size: 14, font: fontBold,
        color: rgb(0.85, 0.2, 0.55),
      });
      yPos -= 20;
    }

    // Divider
    yPos -= 5;
    page.drawRectangle({
      x: 30, y: yPos, width: width - 60, height: 1,
      color: rgb(1, 1, 1, 0.15),
    });
    yPos -= 25;

    // Details
    const details = [
      { label: "DATUM", value: ticket.event_date ? formatDate(ticket.event_date) : "TBA" },
      { label: "UHRZEIT", value: ticket.event_time || "TBA" },
      { label: "ORT", value: ticket.location_name || "TBA" },
      ...(ticket.location_address ? [{ label: "ADRESSE", value: ticket.location_address }] : []),
      { label: "KATEGORIE", value: `${ticket.category_group ? ticket.category_group + " – " : ""}${ticket.category_name}` },
      ...(ticket.holder_name ? [{ label: "NAME", value: ticket.holder_name }] : []),
    ];

    for (const d of details) {
      page.drawText(d.label, {
        x: 30, y: yPos,
        size: 8, font: fontRegular,
        color: rgb(1, 1, 1, 0.5),
      });
      yPos -= 14;
      page.drawText(d.value, {
        x: 30, y: yPos,
        size: 11, font: fontBold,
        color: rgb(1, 1, 1),
      });
      yPos -= 22;
    }

    // QR Code
    try {
      const qrBytes = await fetchQRCode(ticket.qr_code);
      const qrImage = await pdfDoc.embedPng(qrBytes);
      const qrSize = 140;
      const qrX = (width - qrSize) / 2;
      const qrY = 60;

      // White background for QR
      page.drawRectangle({
        x: qrX - 10, y: qrY - 10,
        width: qrSize + 20, height: qrSize + 20,
        color: rgb(1, 1, 1),
        borderColor: rgb(1, 1, 1, 0.2),
        borderWidth: 1,
      });

      page.drawImage(qrImage, {
        x: qrX, y: qrY,
        width: qrSize, height: qrSize,
      });

      // QR code text below
      const codeWidth = fontRegular.widthOfTextAtSize(ticket.qr_code, 9);
      page.drawText(ticket.qr_code, {
        x: (width - codeWidth) / 2, y: qrY - 22,
        size: 9, font: fontRegular,
        color: rgb(1, 1, 1, 0.6),
      });
    } catch (e) {
      console.error("QR embed failed:", e);
      // Fallback: just print the code
      page.drawText(ticket.qr_code, {
        x: 30, y: 100,
        size: 16, font: fontBold,
        color: rgb(1, 1, 1),
      });
    }
  }

  return await pdfDoc.save();
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch tickets with event and category info
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(`
        qr_code, holder_name, holder_email,
        events:event_id (title, date, time, location_name, location_address),
        ticket_categories:ticket_category_id (name, category_group)
      `)
      .eq("order_id", order_id);

    if (ticketsError || !tickets || tickets.length === 0) {
      console.error("No tickets found:", ticketsError);
      return new Response(JSON.stringify({ error: "No tickets found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order for email
    const { data: order } = await supabase
      .from("orders")
      .select("email, name")
      .eq("id", order_id)
      .single();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build ticket data for PDF
    const ticketData = tickets.map((t: any) => ({
      qr_code: t.qr_code,
      holder_name: t.holder_name,
      category_name: t.ticket_categories?.name || "Ticket",
      category_group: t.ticket_categories?.category_group || null,
      event_title: t.events?.title || "Event",
      event_date: t.events?.date || null,
      event_time: t.events?.time || null,
      location_name: t.events?.location_name || null,
      location_address: t.events?.location_address || null,
    }));

    // Generate PDF
    const pdfBytes = await generateTicketPDF(ticketData);
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    const eventTitle = ticketData[0]?.event_title || "Event";
    const ticketCount = tickets.length;
    const recipientName = order.name || "dort";

    // Build HTML email
    const htmlEmail = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:linear-gradient(135deg,#d9338a,#e84393);padding:12px 32px;border-radius:12px;">
        <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">DEINE TICKETS</span>
      </div>
    </div>
    
    <p style="color:#333;font-size:16px;line-height:1.6;margin-bottom:24px;">
      Hey ${recipientName.split(" ")[0] || ""}! 🎉<br><br>
      Deine ${ticketCount === 1 ? "Karte" : `${ticketCount} Karten`} für <strong>${eventTitle}</strong> ${ticketCount === 1 ? "ist" : "sind"} da!
      Im Anhang findest du dein${ticketCount === 1 ? "" : "e"} Ticket${ticketCount === 1 ? "" : "s"} als PDF mit QR-Code${ticketCount === 1 ? "" : "s"}.
    </p>

    <div style="background:#f8f9fa;border-radius:16px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;color:#1a1a2e;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Event-Details</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#666;font-size:13px;width:100px;">Event</td>
          <td style="padding:8px 0;color:#1a1a2e;font-size:14px;font-weight:600;">${eventTitle}</td>
        </tr>
        ${ticketData[0].event_date ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;">Datum</td><td style="padding:8px 0;color:#1a1a2e;font-size:14px;font-weight:600;">${formatDate(ticketData[0].event_date)}</td></tr>` : ""}
        ${ticketData[0].event_time ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;">Uhrzeit</td><td style="padding:8px 0;color:#1a1a2e;font-size:14px;font-weight:600;">${ticketData[0].event_time} Uhr</td></tr>` : ""}
        ${ticketData[0].location_name ? `<tr><td style="padding:8px 0;color:#666;font-size:13px;">Location</td><td style="padding:8px 0;color:#1a1a2e;font-size:14px;font-weight:600;">${ticketData[0].location_name}</td></tr>` : ""}
      </table>
    </div>

    ${ticketData.map((t: any, i: number) => `
    <div style="background:#1a1a2e;border-radius:16px;padding:24px;margin-bottom:12px;text-align:center;">
      <div style="color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:2px;opacity:0.6;margin-bottom:4px;">Ticket ${ticketCount > 1 ? `${i + 1}/${ticketCount}` : ""}</div>
      <div style="color:#e84393;font-size:13px;font-weight:700;text-transform:uppercase;margin-bottom:16px;">${t.category_group ? t.category_group + " – " : ""}${t.category_name}</div>
      <div style="display:inline-block;background:#fff;padding:12px;border-radius:12px;margin-bottom:12px;">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(t.qr_code)}" alt="QR Code" width="160" height="160" style="display:block;" />
      </div>
      <div style="color:#fff;font-size:13px;font-family:monospace;letter-spacing:2px;opacity:0.7;">${t.qr_code}</div>
    </div>
    `).join("")}

    <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #eee;">
      <p style="color:#999;font-size:12px;margin:0;">
        Zeige den QR-Code am Einlass auf deinem Handy oder drucke das PDF aus.<br>
        Bei Fragen antworte einfach auf diese E-Mail.
      </p>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Tickets <tickets@resend.dev>",
        to: [order.email],
        subject: `🎫 Deine Tickets für ${eventTitle}`,
        html: htmlEmail,
        attachments: [
          {
            filename: `tickets-${order_id.slice(0, 8)}.pdf`,
            content: pdfBase64,
            type: "application/pdf",
          },
        ],
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", JSON.stringify(resendData));
      return new Response(JSON.stringify({ error: "Email sending failed", details: resendData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Tickets email sent to ${order.email} for order ${order_id}`);

    return new Response(JSON.stringify({ success: true, email_id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Send tickets error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
