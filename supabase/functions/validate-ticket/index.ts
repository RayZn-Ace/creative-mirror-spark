import { corsHeaders, json, adminClient } from '../_shared/paymentRuntime.ts';
import { staffUser } from '../_shared/privateAccess.ts';
import { effectiveEvent, InputError, UUID } from '../_shared/paymentSafety.ts';
type ScanTicket = { id: string; event_id: string; status: string; checked_in_at: string | null; holder_name: string | null; events: { title: string; date: string; location_name: string; city: string } | null; ticket_categories: { name: string; category_group: string } | null };
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 4096) return json({ error: 'Anfrage zu groß' }, 400);
    const body = JSON.parse(raw);
    const action = body.action ?? 'validate';
    if (!['info','validate','checkin'].includes(action) || (body.event_id != null && (typeof body.event_id !== 'string' || !UUID.test(body.event_id)))) return json({ error: 'Ungültige Anfrage' }, 400);
    const admin = adminClient();
    let linkEvent: string | null = null; let label = 'Alle Events';
    if (body.scanner_token != null) {
      if (typeof body.scanner_token !== 'string' || body.scanner_token.length < 8 || body.scanner_token.length > 256) return json({ error: 'Ungültiger Scanner-Link' }, 403);
      const { data: link, error } = await admin.from('scanner_links').select('event_id,label,expires_at').eq('token', body.scanner_token).eq('active', true).maybeSingle();
      if (error || !link || (link.expires_at && Date.parse(link.expires_at) <= Date.now())) return json({ error: 'Scanner-Link ungültig oder abgelaufen' }, 403);
      linkEvent = link.event_id; label = link.label ?? label;
    } else if (!await staffUser(req, ['admin','scanner'])) return json({ error: 'Nicht autorisiert' }, 403);
    const eventId = effectiveEvent(linkEvent, body.event_id ?? null);
    if (action === 'info') {
      let title = label;
      if (eventId) { const { data } = await admin.from('events').select('title').eq('id', eventId).single(); title = data?.title ?? label; }
      let all = admin.from('tickets').select('id', { count: 'exact', head: true });
      let checked = admin.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'checked_in');
      if (eventId) { all = all.eq('event_id', eventId); checked = checked.eq('event_id', eventId); }
      const [a,b] = await Promise.all([all, checked]);
      if (a.error || b.error) return json({ error: 'Statistik nicht verfügbar' }, 503);
      return json({ event: { id: eventId ?? '__ALL__', title }, stats: { total: a.count ?? 0, checkedIn: b.count ?? 0 } });
    }
    if (typeof body.qr_code !== 'string' || body.qr_code.length < 3 || body.qr_code.length > 128 || !/^[A-Za-z0-9-]+$/.test(body.qr_code)) return json({ error: 'Ungültiger Ticketcode' }, 400);
    let query = admin.from('tickets').select('id,event_id,status,checked_in_at,holder_name,events:event_id(title,date,location_name,city),ticket_categories:ticket_category_id(name,category_group)').eq('qr_code', body.qr_code.toUpperCase());
    if (eventId) query = query.eq('event_id', eventId);
    const { data: ticket, error } = await query.returns<ScanTicket[]>().maybeSingle();
    if (error) return json({ error: 'Ticketprüfung nicht verfügbar' }, 503);
    // No information about tickets outside the authorized event is returned.
    if (!ticket) return json({ valid: false, status: 'not_found', error: 'Ticket für diese Veranstaltung nicht gefunden' });
    if (ticket.status !== 'valid') return json({ valid: false, status: ticket.status === 'checked_in' ? 'already_checked_in' : 'cancelled', error: ticket.status === 'checked_in' ? 'Ticket bereits eingecheckt' : 'Ticket nicht gültig', checked_in_at: ticket.checked_in_at });
    if (action === 'checkin') {
      const { data: claimed, error: updateError } = await admin.from('tickets').update({ status: 'checked_in', checked_in_at: new Date().toISOString() }).eq('id', ticket.id).eq('event_id', ticket.event_id).eq('status', 'valid').select('id').maybeSingle();
      if (updateError) return json({ valid: false, status: 'error', error: 'Einlass konnte nicht bestätigt werden. Bitte erneut prüfen.' }, 503);
      if (!claimed) return json({ valid: false, status: 'already_checked_in', error: 'Ticket bereits eingecheckt' });
    }
    return json({ valid: true, status: action === 'checkin' ? 'checked_in' : 'valid', ticket: { id: ticket.id, holder_name: ticket.holder_name, category: ticket.ticket_categories?.name, group: ticket.ticket_categories?.category_group, event: ticket.events?.title, event_date: ticket.events?.date, location: ticket.events?.location_name, city: ticket.events?.city } });
  } catch (e) { return json({ error: e instanceof InputError ? e.message : 'Ticketprüfung nicht verfügbar' }, e instanceof InputError || e instanceof SyntaxError ? 400 : 503); }
});
