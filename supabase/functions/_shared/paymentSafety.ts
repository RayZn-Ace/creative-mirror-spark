export class InputError extends Error {}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const RATES: Record<string, number> = { EUR: 1, USD: 1.08, GBP: .86, CHF: .94, PLN: 4.32, CZK: 25.2, HUF: 395, RON: 4.97, BGN: 1.96, DKK: 7.46, NOK: 11.5, SEK: 11.2, TRY: 35.5, JPY: 163, KRW: 1450, CNY: 7.85, THB: 37.5, BRL: 5.45, CAD: 1.48, AUD: 1.66, AED: 3.97 };
export function appOrigin(value: unknown): string {
  const origin = value ?? 'https://nightlifeticket.app';
  if (typeof origin !== 'string') throw new InputError('Ungültige Rückkehradresse.');
  const allowed = ['https://nightlifeticket.app', 'https://nightlife.smeanet.de', 'https://creative-mirror-spark.lovable.app', 'https://project--f082f45b-a1db-4d21-8075-e707c6f2e4d6.lovable.app', 'https://project--f082f45b-a1db-4d21-8075-e707c6f2e4d6-dev.lovable.app', 'https://id-preview--f082f45b-a1db-4d21-8075-e707c6f2e4d6.lovable.app'];
  if (!allowed.includes(origin)) throw new InputError('Unbekannte Rückkehradresse.');
  return origin;
}
export function checkoutInput(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new InputError('Bitte prüfe deine Bestelldaten.');
  const b = body as Record<string, unknown>;
  if (typeof b.email !== 'string' || b.email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) throw new InputError('Bitte prüfe deine E-Mail-Adresse.');
  if (typeof b.eventId !== 'string' || !UUID.test(b.eventId)) throw new InputError('Ungültige Veranstaltung.');
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 100) throw new InputError('Bitte wähle Tickets aus.');
  const seen = new Set<string>();
  const items = b.items.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new InputError('Ungültiges Ticket.');
    const i = value as Record<string, unknown>;
    if (typeof i.ticketId !== 'string' || !UUID.test(i.ticketId) || seen.has(i.ticketId)) throw new InputError('Ungültige oder doppelte Ticketkategorie.');
    if (typeof i.quantity !== 'number' || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99) throw new InputError('Bitte wähle 1 bis 99 Tickets je Kategorie.');
    seen.add(i.ticketId);
    // Never forward a browser-supplied price, name, group size or permission.
    return { ticketId: i.ticketId, quantity: i.quantity };
  });
  const text = (v: unknown, max: number) => { if (v == null || v === '') return null; if (typeof v !== 'string' || v.length > max) throw new InputError('Eingabe zu lang oder ungültig.'); return v.trim(); };
  const currency = b.currency ?? 'EUR';
  if (typeof currency !== 'string' || !Object.prototype.hasOwnProperty.call(RATES, currency)) throw new InputError('Nicht unterstützte Währung.');
  if (b.insuranceAccepted != null && typeof b.insuranceAccepted !== 'boolean') throw new InputError('Ungültige Ticketschutzauswahl.');
  const attemptId = b.attemptId ?? null;
  if (attemptId !== null && (typeof attemptId !== 'string' || !UUID.test(attemptId))) throw new InputError('Ungültiger Kaufversuch.');
  const birthDate = text(b.birthDate, 10);
  if (birthDate && (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isFinite(Date.parse(birthDate)))) throw new InputError('Ungültiges Geburtsdatum.');
  return { email: b.email.trim().toLowerCase(), eventId: b.eventId, items, name: text(b.name, 255), phone: text(b.phone, 100), birthDate, discountCode: text(b.discountCode, 100), currency, origin: appOrigin(b.redirectBase), country: text(b.country, 2), insuranceAccepted: b.insuranceAccepted === true, attemptId };
}
export function amountMinor(eur: number, currency: string): number {
  const rate = RATES[currency];
  if (rate == null || !Number.isFinite(eur) || eur < 0) throw new InputError('Ungültiger Betrag.');
  return Math.round(eur * rate * (['JPY', 'KRW'].includes(currency) ? 1 : 100));
}
export function effectiveEvent(linkEvent: string | null, requested: string | null): string | null {
  if (linkEvent && requested && linkEvent !== requested) throw new InputError('Scanner-Link gilt für eine andere Veranstaltung.');
  return linkEvent ?? requested;
}
export function generateQRCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}
export async function stripeSignature(body: string, header: string, secret: string, now = Date.now()): Promise<boolean> {
  const parts = header.split(',').map(p => p.trim().split('='));
  const time = parts.find(p => p[0] === 't')?.[1];
  if (!time || !/^\d+$/.test(time) || Math.abs(Math.floor(now / 1000) - Number(time)) > 300) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  for (const [name, value] of parts) {
    if (name !== 'v1' || !/^[0-9a-f]{64}$/i.test(value ?? '')) continue;
    const bytes = Uint8Array.from(value.match(/.{2}/g) ?? [], h => parseInt(h, 16));
    if (await crypto.subtle.verify('HMAC', key, bytes, new TextEncoder().encode(`${time}.${body}`))) return true;
  }
  return false;
}