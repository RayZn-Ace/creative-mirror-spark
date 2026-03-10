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

/* ─── Strip non-WinAnsi characters (emojis etc.) ─── */
function stripEmojis(text: string): string {
  // Remove characters outside the basic Latin/Latin-1 range that WinAnsi can't encode
  return text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu, "").replace(/\s{2,}/g, " ").trim();
}

/* ─── Helpers ─── */
function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const safeText = stripEmojis(text);
  const words = safeText.split(" ");
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

/* ─── Hex to RGB ─── */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
}

/* ─── Template interface ─── */
interface ContentBlock {
  id: string;
  type: "text" | "image" | "info_list";
  enabled: boolean;
  text?: string;
  font_size?: "sm" | "md" | "lg";
  bold?: boolean;
  image_url?: string;
  image_width?: number;
  items?: string[];
  list_title?: string;
}

interface GradientConfig {
  enabled: boolean;
  type: "linear" | "radial";
  angle: number;
  color_from: string;
  color_to: string;
}

interface CategoryOverride {
  accent_color: string;
  gradient: GradientConfig;
  background_color?: string;
  text_color?: string;
}

interface TicketTemplate {
  format: "din_lang" | "a4";
  background_color: string;
  accent_color: string;
  text_color: string;
  gradient?: GradientConfig;
  show_event_title: boolean;
  show_date: boolean;
  show_time: boolean;
  show_location: boolean;
  show_address: boolean;
  show_category: boolean;
  show_holder_name: boolean;
  show_qr_code: boolean;
  logo_url: string;
  magic_ticket_enabled?: boolean;
  magic_ticket_blur?: number;
  magic_ticket_opacity?: number;
  sponsors: Array<{ type: "image" | "text"; value: string }>;
  content_blocks?: ContentBlock[];
  category_overrides?: Record<string, CategoryOverride>;
}

const defaultTpl: TicketTemplate = {
  format: "din_lang", background_color: "#14141e", accent_color: "#d9338a", text_color: "#ffffff",
  show_event_title: true, show_date: true, show_time: true, show_location: true,
  show_address: true, show_category: true, show_holder_name: true, show_qr_code: true,
  logo_url: "", sponsors: [], content_blocks: [],
};

/* ─── Ticket PDF with Template ─── */
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
}>, tpl: TicketTemplate): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // DIN Lang: 595 x 281 pts (210x99mm), A4: 420 x 600 pts
  const isDinLang = tpl.format === "din_lang";
  const pageW = isDinLang ? 595 : 420;
  const pageH = isDinLang ? 281 : 600;

  // Try to embed logo once
  let logoImage: any = null;
  if (tpl.logo_url) {
    try {
      const logoRes = await fetch(tpl.logo_url);
      const logoBytes = new Uint8Array(await logoRes.arrayBuffer());
      const ct = logoRes.headers.get("content-type") || "";
      if (ct.includes("png")) logoImage = await pdfDoc.embedPng(logoBytes);
      else logoImage = await pdfDoc.embedJpg(logoBytes);
    } catch (e) { console.error("Logo embed failed:", e); }
  }

  for (const ticket of tickets) {
    // Apply category override if available
    const catGroup = (ticket.category_group || "").toUpperCase();
    const override = tpl.category_overrides?.[catGroup];
    const effectiveTpl = override ? {
      ...tpl,
      accent_color: override.accent_color || tpl.accent_color,
      background_color: override.background_color || tpl.background_color,
      text_color: override.text_color || tpl.text_color,
      gradient: override.gradient?.enabled ? override.gradient : tpl.gradient,
    } : tpl;

    const [bgR, bgG, bgB] = hexToRgb(effectiveTpl.background_color);
    const [acR, acG, acB] = hexToRgb(effectiveTpl.accent_color);
    const [txR, txG, txB] = hexToRgb(effectiveTpl.text_color);
    const bgColor = rgb(bgR, bgG, bgB);
    const acColor = rgb(acR, acG, acB);
    const txColor = rgb(txR, txG, txB);

    const page = pdfDoc.addPage([pageW, pageH]);
    const { width, height } = page.getSize();
    const m = isDinLang ? 20 : 30; // margin

    // Background with gradient simulation
    const drawGradientBg = (page: any, x0: number, y0: number, w: number, h: number, grad: GradientConfig) => {
      const [fromR, fromG, fromB] = hexToRgb(grad.color_from);
      const [toR, toG, toB] = hexToRgb(grad.color_to);
      const strips = 100;
      const isRadial = grad.type === "radial";
      const angle = (grad as any).angle || 135;

      if (isRadial) {
        // Radial: draw from outside-in with concentric rectangles
        const cx = x0 + w / 2;
        const cy = y0 + h / 2;
        for (let i = strips - 1; i >= 0; i--) {
          const t = i / (strips - 1);
          const r = toR + (fromR - toR) * (1 - t);
          const g = toG + (fromG - toG) * (1 - t);
          const b = toB + (fromB - toB) * (1 - t);
          const scaleX = (1 - t) * w / 2 + 1;
          const scaleY = (1 - t) * h / 2 + 1;
          page.drawRectangle({
            x: cx - scaleX, y: cy - scaleY,
            width: scaleX * 2, height: scaleY * 2,
            color: rgb(Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, b))),
          });
        }
      } else {
        // Linear: use horizontal strips, compute gradient position based on angle
        const rad = (angle * Math.PI) / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);
        // Project all corners to find min/max along gradient direction
        const corners = [[0, 0], [w, 0], [w, h], [0, h]];
        const projections = corners.map(([cx, cy]) => cx * dx + cy * dy);
        const minProj = Math.min(...projections);
        const maxProj = Math.max(...projections);
        const span = maxProj - minProj || 1;

        const stripH = h / strips;
        for (let i = 0; i < strips; i++) {
          // For each horizontal strip, compute the center y position
          const sy = i * stripH;
          // Calculate the average gradient position for this strip
          // Use center-x and center-y of the strip
          const centerX = w / 2;
          const centerY = sy + stripH / 2;
          const proj = centerX * dx + centerY * dy;
          const t = Math.max(0, Math.min(1, (proj - minProj) / span));
          const r = fromR + (toR - fromR) * t;
          const g = fromG + (toG - fromG) * t;
          const b = fromB + (toB - fromB) * t;
          page.drawRectangle({
            x: x0, y: y0 + sy,
            width: w, height: stripH + 0.5,
            color: rgb(Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, b))),
          });
        }
      }
    };

    if (effectiveTpl.gradient?.enabled) {
      drawGradientBg(page, 0, 0, width, height, effectiveTpl.gradient!);
    } else {
      page.drawRectangle({ x: 0, y: 0, width, height, color: bgColor });
    }
    // Accent bar
    page.drawRectangle({ x: 0, y: height - (isDinLang ? 4 : 6), width, height: isDinLang ? 4 : 6, color: acColor });

    if (isDinLang) {
      // ─── DIN Lang: horizontal layout ───
      const qrAreaW = tpl.show_qr_code ? 160 : 0;
      const textAreaW = width - m * 2 - qrAreaW;
      let y = height - m - 8;

      // Logo
      if (logoImage) {
        const logoH = 28;
        const logoW = logoH * (logoImage.width / logoImage.height);
        page.drawImage(logoImage, { x: m, y: y - logoH + 4, width: logoW, height: logoH });
        y -= logoH + 6;
      }

      // TICKET label
      page.drawText("TICKET", { x: m, y, size: 10, font: fontBold, color: acColor });
      y -= 18;

      // Event title
      if (tpl.show_event_title) {
        const titleLines = wrapText(ticket.event_title.toUpperCase(), fontBold, 13, textAreaW);
        for (const line of titleLines) {
          page.drawText(line, { x: m, y, size: 13, font: fontBold, color: acColor });
          y -= 16;
        }
        y -= 4;
      }

      // Divider
      page.drawRectangle({ x: m, y: y + 2, width: textAreaW, height: 0.5, color: txColor, opacity: 0.15 });
      y -= 10;

      // Details
      const details: Array<{ label: string; value: string }> = [];
      if (tpl.show_date) details.push({ label: "DATUM", value: ticket.event_date ? formatDate(ticket.event_date) : "TBA" });
      if (tpl.show_time) details.push({ label: "UHRZEIT", value: ticket.event_time || "TBA" });
      if (tpl.show_location) details.push({ label: "ORT", value: ticket.location_name || "TBA" });
      if (tpl.show_address && ticket.location_address) details.push({ label: "ADRESSE", value: ticket.location_address });
      if (tpl.show_category) details.push({ label: "KATEGORIE", value: `${ticket.category_group ? ticket.category_group + " – " : ""}${ticket.category_name}` });
      if (tpl.show_holder_name && ticket.holder_name) details.push({ label: "NAME", value: ticket.holder_name });

      for (const d of details) {
        if (y < m + 10) break;
        // Inline label + value on same line (matching preview)
        const labelText = d.label + "  ";
        const safeValue = stripEmojis(d.value).substring(0, 40);
        const labelW = fontRegular.widthOfTextAtSize(labelText, 6);
        page.drawText(labelText, { x: m, y, size: 6, font: fontRegular, color: txColor, opacity: 0.5 });
        page.drawText(safeValue, { x: m + labelW, y, size: 8, font: fontBold, color: txColor });
        y -= 14;
      }

      // Content blocks
      const blocks = (tpl.content_blocks || []).filter(b => b.enabled);
      for (const block of blocks) {
        if (y < m + 10) break;
        if (block.type === "text" && block.text) {
          const sz = block.font_size === "lg" ? 9 : block.font_size === "sm" ? 6 : 7;
          const f = block.bold ? fontBold : fontRegular;
          const lines = wrapText(block.text, f, sz, textAreaW);
          for (const line of lines) {
            if (y < m + 10) break;
            page.drawText(line, { x: m, y, size: sz, font: f, color: txColor });
            y -= sz + 3;
          }
          y -= 4;
        }
        if (block.type === "image" && block.image_url) {
          try {
            const imgRes = await fetch(block.image_url);
            const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
            const ct = imgRes.headers.get("content-type") || "";
            const img = ct.includes("png") ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
            const imgW = textAreaW * ((block.image_width || 60) / 100);
            const imgH = imgW * (img.height / img.width);
            if (y - imgH > m) {
              page.drawImage(img, { x: m, y: y - imgH, width: imgW, height: imgH });
              y -= imgH + 6;
            }
          } catch (e) { console.error("Block image failed:", e); }
        }
        if (block.type === "info_list") {
          if (block.list_title) {
            page.drawText(stripEmojis(block.list_title.toUpperCase()), { x: m, y, size: 6, font: fontBold, color: acColor });
            y -= 10;
          }
          for (const item of (block.items || [])) {
            if (!item || y < m + 10) break;
            page.drawText(stripEmojis(`• ${item}`), { x: m + 4, y, size: 7, font: fontRegular, color: txColor });
            y -= 10;
          }
          y -= 4;
        }
      }

      // Sponsors at bottom
      if (tpl.sponsors.length > 0) {
        let sx = m;
        const sy = m;
        for (const s of tpl.sponsors) {
          if (s.type === "text") {
            page.drawText(stripEmojis(s.value), { x: sx, y: sy, size: 6, font: fontRegular, color: txColor, opacity: 0.4 });
            sx += fontRegular.widthOfTextAtSize(stripEmojis(s.value), 6) + 12;
          }
        }
      }

      // QR Code (right side)
      if (tpl.show_qr_code) {
        // Dashed line separator
        const sepX = width - qrAreaW;
        for (let dy = m; dy < height - m; dy += 8) {
          page.drawRectangle({ x: sepX, y: dy, width: 0.5, height: 4, color: txColor, opacity: 0.15 });
        }

        try {
          const qrBytes = await fetchQRCode(ticket.qr_code);
          const qrImage = await pdfDoc.embedPng(qrBytes);
          const qrSize = 110;
          const qrX = sepX + (qrAreaW - qrSize) / 2;
          const qrY = (height - qrSize) / 2;
          // Category label above QR
          if (tpl.show_category) {
            const catLabel = `${ticket.category_group ? ticket.category_group + " – " : ""}${ticket.category_name}`;
            const catLines = wrapText(catLabel.toUpperCase(), fontBold, 8, qrAreaW - 20);
            let catY = qrY + qrSize + 12 + (catLines.length - 1) * 11;
            for (const cl of catLines) {
              const clW = fontBold.widthOfTextAtSize(cl, 8);
              page.drawText(cl, { x: sepX + (qrAreaW - clW) / 2, y: catY, size: 8, font: fontBold, color: acColor });
              catY -= 11;
            }
          }
          page.drawRectangle({ x: qrX - 6, y: qrY - 6, width: qrSize + 12, height: qrSize + 12, color: rgb(1, 1, 1) });
          page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
          const codeW = fontRegular.widthOfTextAtSize(ticket.qr_code, 7);
          page.drawText(ticket.qr_code, { x: sepX + (qrAreaW - codeW) / 2, y: qrY - 18, size: 7, font: fontRegular, color: txColor, opacity: 0.4 });
        } catch (e) {
          console.error("QR embed failed:", e);
          page.drawText(ticket.qr_code, { x: width - qrAreaW + 10, y: height / 2, size: 12, font: fontBold, color: txColor });
        }
      }

    } else {
      // ─── A4: vertical layout (original style, with template colors) ───
      let y = height - m - 10;

      if (logoImage) {
        const logoH = 40;
        const logoW = logoH * (logoImage.width / logoImage.height);
        page.drawImage(logoImage, { x: m, y: y - logoH, width: logoW, height: logoH });
        y -= logoH + 10;
      }

      page.drawText("TICKET", { x: m, y, size: 28, font: fontBold, color: txColor });
      y -= 35;

      if (tpl.show_event_title) {
        const titleLines = wrapText(ticket.event_title.toUpperCase(), fontBold, 14, width - m * 2);
        for (const line of titleLines) {
          page.drawText(line, { x: m, y, size: 14, font: fontBold, color: acColor });
          y -= 20;
        }
      }

      y -= 5;
      page.drawRectangle({ x: m, y, width: width - m * 2, height: 1, color: txColor, opacity: 0.15 });
      y -= 25;

      const details: Array<{ label: string; value: string }> = [];
      if (tpl.show_date) details.push({ label: "DATUM", value: ticket.event_date ? formatDate(ticket.event_date) : "TBA" });
      if (tpl.show_time) details.push({ label: "UHRZEIT", value: ticket.event_time || "TBA" });
      if (tpl.show_location) details.push({ label: "ORT", value: ticket.location_name || "TBA" });
      if (tpl.show_address && ticket.location_address) details.push({ label: "ADRESSE", value: ticket.location_address });
      if (tpl.show_category) details.push({ label: "KATEGORIE", value: `${ticket.category_group ? ticket.category_group + " – " : ""}${ticket.category_name}` });
      if (tpl.show_holder_name && ticket.holder_name) details.push({ label: "NAME", value: ticket.holder_name });

      for (const d of details) {
        const labelText = d.label + "  ";
        const safeValue = stripEmojis(d.value);
        const labelW = fontRegular.widthOfTextAtSize(labelText, 8);
        page.drawText(labelText, { x: m, y, size: 8, font: fontRegular, color: txColor, opacity: 0.5 });
        page.drawText(safeValue, { x: m + labelW, y, size: 10, font: fontBold, color: txColor });
        y -= 18;
      }

      // Content blocks (A4)
      const blocksA4 = (tpl.content_blocks || []).filter(b => b.enabled);
      const contentW = width - m * 2;
      for (const block of blocksA4) {
        if (y < 250) break; // leave room for QR
        if (block.type === "text" && block.text) {
          const sz = block.font_size === "lg" ? 12 : block.font_size === "sm" ? 8 : 10;
          const f = block.bold ? fontBold : fontRegular;
          const lines = wrapText(block.text, f, sz, contentW);
          for (const line of lines) {
            if (y < 250) break;
            page.drawText(line, { x: m, y, size: sz, font: f, color: txColor });
            y -= sz + 4;
          }
          y -= 6;
        }
        if (block.type === "image" && block.image_url) {
          try {
            const imgRes = await fetch(block.image_url);
            const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
            const ct = imgRes.headers.get("content-type") || "";
            const img = ct.includes("png") ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
            const imgW = contentW * ((block.image_width || 60) / 100);
            const imgH = imgW * (img.height / img.width);
            if (y - imgH > 250) {
              page.drawImage(img, { x: m, y: y - imgH, width: imgW, height: imgH });
              y -= imgH + 10;
            }
          } catch (e) { console.error("Block image failed:", e); }
        }
        if (block.type === "info_list") {
          if (block.list_title) {
            page.drawText(stripEmojis(block.list_title.toUpperCase()), { x: m, y, size: 8, font: fontBold, color: acColor });
            y -= 14;
          }
          for (const item of (block.items || [])) {
            if (!item || y < 250) break;
            page.drawText(stripEmojis(`• ${item}`), { x: m + 6, y, size: 9, font: fontRegular, color: txColor });
            y -= 14;
          }
          y -= 6;
        }
      }

      if (tpl.show_qr_code) {
        try {
          const qrBytes = await fetchQRCode(ticket.qr_code);
          const qrImage = await pdfDoc.embedPng(qrBytes);
          const qrSize = 140;
          const qrX = (width - qrSize) / 2;
          const qrY = 60;
          // Category label above QR
          if (tpl.show_category) {
            const catLabel = stripEmojis(`${ticket.category_group ? ticket.category_group + " – " : ""}${ticket.category_name}`);
            const catW = fontBold.widthOfTextAtSize(catLabel.toUpperCase(), 10);
            page.drawText(catLabel.toUpperCase(), { x: (width - catW) / 2, y: qrY + qrSize + 24, size: 10, font: fontBold, color: acColor });
          }
          page.drawRectangle({ x: qrX - 10, y: qrY - 10, width: qrSize + 20, height: qrSize + 20, color: rgb(1, 1, 1) });
          page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });
          const codeW = fontRegular.widthOfTextAtSize(ticket.qr_code, 9);
          page.drawText(ticket.qr_code, { x: (width - codeW) / 2, y: qrY - 22, size: 9, font: fontRegular, color: txColor, opacity: 0.4 });
        } catch (e) {
          console.error("QR embed failed:", e);
          page.drawText(ticket.qr_code, { x: m, y: 100, size: 16, font: fontBold, color: txColor });
        }
      }

      // Sponsors at bottom
      if (tpl.sponsors.length > 0) {
        let sx = m;
        for (const s of tpl.sponsors) {
          if (s.type === "text") {
            page.drawText(stripEmojis(s.value), { x: sx, y: m, size: 7, font: fontRegular, color: txColor, opacity: 0.4 });
            sx += fontRegular.widthOfTextAtSize(stripEmojis(s.value), 7) + 16;
          }
        }
      }
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
  payment_terms?: string;
  additional_text?: string;
  footer_note?: string;
  show_bank_details?: boolean;
  bank_override?: string;
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
  const addressParts = [company.address, [company.zip, company.city].filter(Boolean).join(" "), company.country].filter(Boolean);
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
      y -= 8; // extra spacing before Gesamtbetrag
      page.drawRectangle({ x: marginR - 200, y: y - 6, width: 200, height: 26, color: lightBg });
    }
    page.drawText(t.label, { x: marginR - 8 - valW - 20 - labelW, y, size, font, color: t.bold ? darkColor : grayColor });
    page.drawText(t.value, { x: marginR - 8 - valW, y, size, font, color: darkColor });
    y -= t.bold ? 30 : 18;
  }

  // ─── Template texts (payment terms, additional text) ───
  if (opts.payment_terms) {
    y -= 5;
    const ptLines = wrapText(opts.payment_terms, fontRegular, 8, contentWidth);
    for (const line of ptLines) {
      if (y < 100) break;
      page.drawText(line, { x: marginL, y, size: 8, font: fontRegular, color: grayColor });
      y -= 12;
    }
  }
  if (opts.additional_text) {
    y -= 4;
    const atLines = wrapText(opts.additional_text, fontRegular, 8, contentWidth);
    for (const line of atLines) {
      if (y < 100) break;
      page.drawText(line, { x: marginL, y, size: 8, font: fontRegular, color: grayColor });
      y -= 12;
    }
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
    const body = await req.json();
    const { order_id, download_only } = body;
    if (!order_id) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!download_only && !RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ─── Fetch data in parallel ───
    const [ticketsRes, orderRes, settingsRes] = await Promise.all([
      supabase.from("tickets").select(`
        qr_code, holder_name, holder_email,
        events:event_id (title, date, time, location_name, location_address),
        ticket_categories:ticket_category_id (name, category_group)
      `).eq("order_id", order_id),
      supabase.from("orders").select("*").eq("id", order_id).single(),
      supabase.from("settings").select("key, value").in("key", ["company", "invoice", "email", "ticket_template", "invoice_template"]),
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
    const ticketTemplate: TicketTemplate = { ...defaultTpl, ...(settingsMap.ticket_template || {}) };
    const invoiceTemplate = settingsMap.invoice_template || {};

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
      generateTicketPDF(ticketData, ticketTemplate),
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
        payment_terms: invoiceTemplate.payment_terms || "",
        additional_text: invoiceTemplate.additional_text || "",
        footer_note: invoiceTemplate.footer_note || "",
        show_bank_details: invoiceTemplate.show_bank_details || false,
        bank_override: invoiceTemplate.bank_override || "",
      }),
    ]);

    const ticketPdfBase64 = btoa(String.fromCharCode(...ticketPdfBytes));
    const invoicePdfBase64 = btoa(String.fromCharCode(...invoicePdfBytes));

    // ─── Download only mode: return PDFs as base64 ───
    if (download_only) {
      return new Response(JSON.stringify({ ticket_pdf: ticketPdfBase64, invoice_pdf: invoicePdfBase64 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
    const senderName = emailSettings.sender_name || "Nightlife Generation";
    const senderEmail = "ticket@nightlifeticket.app";
    const replyTo = emailSettings.reply_to || "ticket@nightlifeticket.app";

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
