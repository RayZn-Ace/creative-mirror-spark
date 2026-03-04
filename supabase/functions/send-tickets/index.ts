import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ─── QR Code ─── */
async function fetchQRCode(data: string): Promise<Uint8Array> {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&format=png`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("QR code generation failed");
  return new Uint8Array(await res.arrayBuffer());
}

/* ─── Helpers ─── */
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

function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatCurrency(amount: number): string {
  return amount.toFixed(2).replace(".", ",") + " €";
}

/* ─── Ticket PDF (unchanged design) ─── */
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

    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.08, 0.08, 0.12) });
    page.drawRectangle({ x: 0, y: height - 6, width, height: 6, color: rgb(0.85, 0.2, 0.55) });

    page.drawText("TICKET", { x: 30, y: height - 50, size: 28, font: fontBold, color: rgb(1, 1, 1) });

    const titleLines = wrapText(ticket.event_title.toUpperCase(), fontBold, 14, width - 60);
    let yPos = height - 85;
    for (const line of titleLines) {
      page.drawText(line, { x: 30, y: yPos, size: 14, font: fontBold, color: rgb(0.85, 0.2, 0.55) });
      yPos -= 20;
    }

    yPos -= 5;
    page.drawRectangle({ x: 30, y: yPos, width: width - 60, height: 1, color: rgb(1, 1, 1, 0.15) });
    yPos -= 25;

    const details = [
      { label: "DATUM", value: ticket.event_date ? formatDate(ticket.event_date) : "TBA" },
      { label: "UHRZEIT", value: ticket.event_time || "TBA" },
      { label: "ORT", value: ticket.location_name || "TBA" },
      ...(ticket.location_address ? [{ label: "ADRESSE", value: ticket.location_address }] : []),
      { label: "KATEGORIE", value: `${ticket.category_group ? ticket.category_group + " – " : ""}${ticket.category_name}` },
      ...(ticket.holder_name ? [{ label: "NAME", value: ticket.holder_name }] : []),
    ];

    for (const d of details) {
      page.drawText(d.label, { x: 30, y: yPos, size: 8, font: fontRegular, color: rgb(1, 1, 1, 0.5) });
      yPos -= 14;
      page.drawText(d.value, { x: 30, y: yPos, size: 11, font: fontBold, color: rgb(1, 1, 1) });
      yPos -= 22;
    }

    try {
      const qrBytes = await fetchQRCode(ticket.qr_code);
      const qrImage = await pdfDoc.embedPng(qrBytes);
      const qrSize = 140;
      const qrX = (width - qrSize) / 2;
      const qrY = 60;
      page.drawRectangle({ x: qrX - 10, y: qrY - 10, width: qrSize + 20, height: qrSize + 20, color: rgb(1, 1, 1) });
      page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
      const codeWidth = fontRegular.widthOfTextAtSize(ticket.qr_code, 9);
      page.drawText(ticket.qr_code, { x: (width - codeWidth) / 2, y: qrY - 22, size: 9, font: fontRegular, color: rgb(1, 1, 1, 0.6) });
    } catch (e) {
      console.error("QR embed failed:", e);
      page.drawText(ticket.qr_code, { x: 30, y: 100, size: 16, font: fontBold, color: rgb(1, 1, 1) });
    }
  }

  return await pdfDoc.save();
}

/* ─── Invoice PDF ─── */
interface CompanyData {
  name: string; address: string; zip: string; city: string; country: string;
  vat_id: string; managing_director: string; email: string; phone: string;
  bank_name: string; iban: string; bic: string;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

async function generateInvoicePDF(opts: {
  invoiceNumber: string;
  invoiceDate: string;
  company: CompanyData;
  customerName: string;
  customerEmail: string;
  items: InvoiceItem[];
  serviceFee: number;
  totalAmount: number;
  vatRate: number;
  currency: string;
}): Promise<Uint8Array> {
  const { invoiceNumber, invoiceDate, company, customerName, customerEmail, items, serviceFee, totalAmount, vatRate } = opts;
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width } = page.getSize();
  const marginL = 50;
  const marginR = width - 50;
  const contentWidth = marginR - marginL;
  let y = 780;

  const darkColor = rgb(0.1, 0.1, 0.15);
  const grayColor = rgb(0.4, 0.4, 0.45);
  const accentColor = rgb(0.85, 0.2, 0.55);
  const lightBg = rgb(0.96, 0.96, 0.97);

  // ─── Header: Company name ───
  if (company.name) {
    page.drawText(company.name.toUpperCase(), { x: marginL, y, size: 18, font: fontBold, color: darkColor });
    y -= 22;
  }

  // Company address line
  const addressParts = [company.address, `${company.zip} ${company.city}`.trim(), company.country].filter(Boolean);
  if (addressParts.length) {
    page.drawText(addressParts.join(" · "), { x: marginL, y, size: 8, font: fontRegular, color: grayColor });
    y -= 14;
  }
  const contactParts = [company.email, company.phone].filter(Boolean);
  if (contactParts.length) {
    page.drawText(contactParts.join(" · "), { x: marginL, y, size: 8, font: fontRegular, color: grayColor });
    y -= 14;
  }
  if (company.vat_id) {
    page.drawText(`USt-IdNr.: ${company.vat_id}`, { x: marginL, y, size: 8, font: fontRegular, color: grayColor });
    y -= 14;
  }

  // ─── Divider ───
  y -= 10;
  page.drawRectangle({ x: marginL, y, width: contentWidth, height: 2, color: accentColor });
  y -= 30;

  // ─── Invoice title + meta ───
  page.drawText("RECHNUNG", { x: marginL, y, size: 22, font: fontBold, color: darkColor });

  // Right-aligned meta
  const metaLines = [
    { label: "Rechnungsnr.:", value: invoiceNumber },
    { label: "Datum:", value: invoiceDate },
  ];
  let metaY = y + 4;
  for (const m of metaLines) {
    const valW = fontRegular.widthOfTextAtSize(m.value, 9);
    const labelW = fontRegular.widthOfTextAtSize(m.label, 9);
    page.drawText(m.label, { x: marginR - valW - labelW - 8, y: metaY, size: 9, font: fontRegular, color: grayColor });
    page.drawText(m.value, { x: marginR - valW, y: metaY, size: 9, font: fontBold, color: darkColor });
    metaY -= 16;
  }

  y -= 40;

  // ─── Customer ───
  page.drawText("Rechnungsempfänger", { x: marginL, y, size: 8, font: fontRegular, color: grayColor });
  y -= 16;
  if (customerName) {
    page.drawText(customerName, { x: marginL, y, size: 11, font: fontBold, color: darkColor });
    y -= 16;
  }
  page.drawText(customerEmail, { x: marginL, y, size: 10, font: fontRegular, color: darkColor });
  y -= 35;

  // ─── Table header ───
  page.drawRectangle({ x: marginL, y: y - 4, width: contentWidth, height: 22, color: lightBg });
  page.drawText("Bezeichnung", { x: marginL + 8, y: y, size: 8, font: fontBold, color: grayColor });
  page.drawText("Anz.", { x: marginR - 180, y: y, size: 8, font: fontBold, color: grayColor });
  page.drawText("Einzelpreis", { x: marginR - 130, y: y, size: 8, font: fontBold, color: grayColor });
  const gesamtLabel = "Gesamt";
  const gesamtW = fontBold.widthOfTextAtSize(gesamtLabel, 8);
  page.drawText(gesamtLabel, { x: marginR - 8 - gesamtW, y: y, size: 8, font: fontBold, color: grayColor });
  y -= 28;

  // ─── Table rows ───
  for (const item of items) {
    const nameLines = wrapText(item.name, fontRegular, 10, 280);
    for (let li = 0; li < nameLines.length; li++) {
      page.drawText(nameLines[li], { x: marginL + 8, y, size: 10, font: fontRegular, color: darkColor });
      if (li === 0) {
        page.drawText(String(item.quantity), { x: marginR - 175, y, size: 10, font: fontRegular, color: darkColor });
        page.drawText(formatCurrency(item.unitPrice), { x: marginR - 130, y, size: 10, font: fontRegular, color: darkColor });
        const totalStr = formatCurrency(item.total);
        const totalW = fontBold.widthOfTextAtSize(totalStr, 10);
        page.drawText(totalStr, { x: marginR - 8 - totalW, y, size: 10, font: fontBold, color: darkColor });
      }
      y -= 18;
    }
    // Row divider
    page.drawRectangle({ x: marginL, y: y + 6, width: contentWidth, height: 0.5, color: rgb(0.9, 0.9, 0.9) });
    y -= 6;
  }

  // Service fee row
  if (serviceFee > 0) {
    page.drawText("Servicegebühr", { x: marginL + 8, y, size: 10, font: fontRegular, color: grayColor });
    const feeStr = formatCurrency(serviceFee);
    const feeW = fontBold.widthOfTextAtSize(feeStr, 10);
    page.drawText(feeStr, { x: marginR - 8 - feeW, y, size: 10, font: fontBold, color: darkColor });
    y -= 18;
    page.drawRectangle({ x: marginL, y: y + 6, width: contentWidth, height: 0.5, color: rgb(0.9, 0.9, 0.9) });
    y -= 6;
  }

  y -= 10;

  // ─── Totals ───
  const netAmount = totalAmount / (1 + vatRate / 100);
  const vatAmount = totalAmount - netAmount;

  const totals = [
    { label: "Nettobetrag", value: formatCurrency(netAmount), bold: false },
    { label: `MwSt. (${vatRate}%)`, value: formatCurrency(vatAmount), bold: false },
    { label: "Gesamtbetrag", value: formatCurrency(totalAmount), bold: true },
  ];

  for (const t of totals) {
    const font = t.bold ? fontBold : fontRegular;
    const size = t.bold ? 13 : 10;
    const labelW = font.widthOfTextAtSize(t.label, size);
    const valW = font.widthOfTextAtSize(t.value, size);
    
    if (t.bold) {
      page.drawRectangle({ x: marginR - 200, y: y - 5, width: 200, height: 24, color: lightBg });
    }
    page.drawText(t.label, { x: marginR - 8 - valW - 20 - labelW, y, size, font, color: t.bold ? darkColor : grayColor });
    page.drawText(t.value, { x: marginR - 8 - valW, y, size, font, color: darkColor });
    y -= t.bold ? 30 : 18;
  }

  // ─── Footer ───
  y = 80;
  page.drawRectangle({ x: marginL, y: y + 10, width: contentWidth, height: 0.5, color: rgb(0.85, 0.85, 0.85) });

  const footerLines: string[] = [];
  if (company.name) footerLines.push(company.name);
  if (company.managing_director) footerLines.push(`Geschäftsführer: ${company.managing_director}`);
  if (company.bank_name || company.iban) {
    const bankParts = [company.bank_name, company.iban ? `IBAN: ${company.iban}` : "", company.bic ? `BIC: ${company.bic}` : ""].filter(Boolean);
    footerLines.push(bankParts.join(" · "));
  }

  for (const line of footerLines) {
    page.drawText(line, { x: marginL, y, size: 7, font: fontRegular, color: grayColor });
    y -= 12;
  }

  return await pdfDoc.save();
}

/* ─── Text-only Email HTML ─── */
function buildEmailHTML(opts: {
  recipientName: string;
  eventTitle: string;
  eventDate: string | null;
  eventTime: string | null;
  locationName: string | null;
  locationAddress: string | null;
  ticketCount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalAmount: number;
  serviceFee: number;
  invoiceNumber: string;
  currency: string;
}): string {
  const { recipientName, eventTitle, eventDate, eventTime, locationName, locationAddress, ticketCount, items, totalAmount, serviceFee, invoiceNumber } = opts;
  const firstName = recipientName?.split(" ")[0] || "";
  const greeting = firstName ? `Hallo ${firstName}` : "Hallo";
  const dateStr = eventDate ? formatDateShort(eventDate) : "TBA";

  const itemRows = items.map(i =>
    `<tr>
      <td style="padding:8px 0;color:#333;font-size:14px;border-bottom:1px solid #f0f0f0;">${i.quantity}x ${i.name}</td>
      <td style="padding:8px 0;color:#333;font-size:14px;text-align:right;border-bottom:1px solid #f0f0f0;">${formatCurrency(i.price * i.quantity)}</td>
    </tr>`
  ).join("");

  const serviceFeeRow = serviceFee > 0 ? `<tr>
    <td style="padding:8px 0;color:#999;font-size:13px;">Servicegebühr</td>
    <td style="padding:8px 0;color:#999;font-size:13px;text-align:right;">${formatCurrency(serviceFee)}</td>
  </tr>` : "";

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333;">
  <div style="max-width:580px;margin:0 auto;padding:40px 24px;">

    <!-- Greeting -->
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">
      ${greeting},<br><br>
      vielen Dank für deine Bestellung! Dein${ticketCount === 1 ? " Ticket ist" : "e Tickets sind"} im Anhang als PDF mit QR-Code${ticketCount === 1 ? "" : "s"} beigefügt.
    </p>

    <!-- Event Details -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f9f9f9;border-radius:8px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;font-weight:600;">Event</p>
          <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1a1a1a;">${eventTitle}</p>
          <table style="border-collapse:collapse;">
            <tr>
              <td style="padding:2px 16px 2px 0;font-size:13px;color:#666;">Datum</td>
              <td style="padding:2px 0;font-size:13px;color:#1a1a1a;font-weight:600;">${dateStr}</td>
            </tr>
            ${eventTime ? `<tr><td style="padding:2px 16px 2px 0;font-size:13px;color:#666;">Uhrzeit</td><td style="padding:2px 0;font-size:13px;color:#1a1a1a;font-weight:600;">${eventTime} Uhr</td></tr>` : ""}
            ${locationName ? `<tr><td style="padding:2px 16px 2px 0;font-size:13px;color:#666;">Location</td><td style="padding:2px 0;font-size:13px;color:#1a1a1a;font-weight:600;">${locationName}</td></tr>` : ""}
            ${locationAddress ? `<tr><td style="padding:2px 16px 2px 0;font-size:13px;color:#666;">Adresse</td><td style="padding:2px 0;font-size:13px;color:#1a1a1a;font-weight:600;">${locationAddress}</td></tr>` : ""}
          </table>
        </td>
      </tr>
    </table>

    <!-- Order Summary -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
      ${itemRows}
      ${serviceFeeRow}
    </table>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#1a1a1a;">Gesamt</td>
        <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#1a1a1a;text-align:right;">${formatCurrency(totalAmount)}</td>
      </tr>
    </table>

    <!-- Info -->
    <p style="font-size:13px;line-height:1.6;color:#666;margin:0 0 8px;">
      📎 Im Anhang findest du dein${ticketCount === 1 ? "" : "e"} Ticket${ticketCount === 1 ? "" : "s"} (PDF) sowie die Rechnung ${invoiceNumber}.
    </p>
    <p style="font-size:13px;line-height:1.6;color:#666;margin:0 0 24px;">
      Zeige den QR-Code am Einlass auf deinem Handy oder drucke das PDF aus.
    </p>

    <!-- Footer -->
    <div style="border-top:1px solid #eee;padding-top:20px;margin-top:20px;">
      <p style="font-size:12px;color:#999;margin:0;">
        Bei Fragen antworte einfach auf diese E-Mail.<br>
        Wir freuen uns auf dich! 🎉
      </p>
    </div>
  </div>
</body>
</html>`;
}

/* ─── Main Handler ─── */
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
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Fetch data in parallel ───
    const [ticketsRes, orderRes, settingsRes] = await Promise.all([
      supabase.from("tickets").select(`
        qr_code, holder_name, holder_email,
        events:event_id (title, date, time, location_name, location_address),
        ticket_categories:ticket_category_id (name, category_group)
      `).eq("order_id", order_id),
      supabase.from("orders").select("*").eq("id", order_id).single(),
      supabase.from("settings").select("key, value").in("key", ["company", "invoice", "email"]),
    ]);

    if (ticketsRes.error || !ticketsRes.data?.length) {
      console.error("No tickets found:", ticketsRes.error);
      return new Response(JSON.stringify({ error: "No tickets found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!orderRes.data) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tickets = ticketsRes.data;
    const order = orderRes.data;

    // Parse settings
    const settingsMap: Record<string, any> = {};
    for (const row of settingsRes.data || []) {
      settingsMap[row.key] = row.value;
    }
    const company: CompanyData = settingsMap.company || {};
    const invoiceSettings = settingsMap.invoice || { prefix: "RE", next_number: 1 };
    const emailSettings = settingsMap.email || {};

    // ─── Generate invoice number ───
    const year = new Date().getFullYear();
    const invoiceNumber = `${invoiceSettings.prefix}-${year}-${String(invoiceSettings.next_number).padStart(4, "0")}`;

    // Increment next_number atomically
    await supabase
      .from("settings")
      .update({
        value: { ...invoiceSettings, next_number: invoiceSettings.next_number + 1 },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "invoice");

    // ─── Build ticket data ───
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

    const orderItems = (order.items as any[]) || [];
    const eventTitle = ticketData[0]?.event_title || "Event";

    // ─── Generate PDFs ───
    const [ticketPdfBytes, invoicePdfBytes] = await Promise.all([
      generateTicketPDF(ticketData),
      generateInvoicePDF({
        invoiceNumber,
        invoiceDate: formatDateShort(new Date().toISOString().split("T")[0]),
        company,
        customerName: order.name || "",
        customerEmail: order.email,
        items: orderItems.map((i: any) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.priceEur,
          total: i.priceEur * i.quantity,
        })),
        serviceFee: order.service_fee || 0,
        totalAmount: order.total_amount,
        vatRate: 19,
        currency: order.currency || "EUR",
      }),
    ]);

    const ticketPdfBase64 = btoa(String.fromCharCode(...ticketPdfBytes));
    const invoicePdfBase64 = btoa(String.fromCharCode(...invoicePdfBytes));

    // ─── Build email ───
    const htmlEmail = buildEmailHTML({
      recipientName: order.name || "",
      eventTitle,
      eventDate: ticketData[0]?.event_date,
      eventTime: ticketData[0]?.event_time,
      locationName: ticketData[0]?.location_name,
      locationAddress: ticketData[0]?.location_address,
      ticketCount: tickets.length,
      items: orderItems.map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.priceEur })),
      totalAmount: order.total_amount,
      serviceFee: order.service_fee || 0,
      invoiceNumber,
      currency: order.currency || "EUR",
    });

    // ─── Determine sender ───
    const senderName = emailSettings.sender_name || "Tickets";
    const senderDomain = emailSettings.sender_domain || "resend.dev";
    const senderEmail = `${senderName.toLowerCase().replace(/\s+/g, "")}@${senderDomain}`;
    const replyTo = emailSettings.reply_to || undefined;

    // ─── Send via Resend ───
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${senderName} <${senderEmail}>`,
        to: [order.email],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: `Deine Tickets für ${eventTitle}`,
        html: htmlEmail,
        attachments: [
          {
            filename: `tickets-${order_id.slice(0, 8)}.pdf`,
            content: ticketPdfBase64,
            type: "application/pdf",
          },
          {
            filename: `rechnung-${invoiceNumber}.pdf`,
            content: invoicePdfBase64,
            type: "application/pdf",
          },
        ],
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error("Resend error:", JSON.stringify(resendData));
      return new Response(JSON.stringify({ error: "Email sending failed", details: resendData }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Tickets + invoice email sent to ${order.email} for order ${order_id} (${invoiceNumber})`);

    return new Response(JSON.stringify({ success: true, email_id: resendData.id, invoice_number: invoiceNumber }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Send tickets error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
