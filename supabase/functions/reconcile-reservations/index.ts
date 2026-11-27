import { corsHeaders, adminClient, finalize, json } from '../_shared/paymentRuntime.ts';
import { authenticateCronRequest } from '../_shared/cron-auth.ts';
import { verifyExpiredPayment, type ReservationPayment } from '../_shared/reservationProvider.ts';
import { runReservationBatch } from '../_shared/reservationBatch.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const denied = authenticateCronRequest(req);
  if (denied) return new Response(denied.body, { status: denied.status, headers: { ...corsHeaders, 'Cache-Control': 'no-store' } });
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 256) return json({ error: 'Invalid request' }, 400);
    const body = JSON.parse(raw);
    if (!body || Object.keys(body).length !== 1 || !['run', 'health'].includes(body.mode)) return json({ error: 'Invalid request' }, 400);
    const admin = adminClient();
    // Authenticated read-only probe, including schema readiness; no claims/providers/mail.
    if (body.mode === 'health') {
      const { error } = await admin.from('reservation_job_control').select('singleton').limit(1);
      return json({ ok: !error, readOnly: true }, error ? 503 : 200);
    }
    const { data, error } = await admin.rpc('claim_reservation_batch');
    if (error) throw new Error('Claim unavailable');
    const counts = await runReservationBatch((data ?? []) as ReservationPayment[], async order => {
      const provider = order.payment_provider ?? (order.mollie_payment_id ? 'mollie' : 'stripe');
      const verified = await verifyExpiredPayment({ ...order, payment_provider: provider }, { mollie: Deno.env.get('MOLLIE_API_KEY'), stripe: Deno.env.get('STRIPE_SECRET_KEY') });
      if (verified.status === 'pending') return 'pending';
      // Scheduled reconciliation never sends customer mail. Existing verified webhooks
      // retain the usual durable delivery claim; pending delivery stays visible to staff.
      const response = await finalize(provider, verified.paymentId, order.id, verified.currency, verified.amount, verified.status, verified.paidAt, false);
      if (!response.ok) throw new Error('Finalization unavailable');
      await admin.from('orders').update({ reservation_review_reason: null, reservation_next_verify_at: null }).eq('id', order.id).neq('status', 'pending');
      return 'resolved';
    }, async (order, reason) => {
      const { error } = await admin.from('orders').update({ reservation_review_reason: reason, reservation_next_verify_at: new Date(Date.now() + 15 * 60_000).toISOString() }).eq('id', order.id).eq('status', 'pending').is('reservation_released_at', null);
      if (error) throw new Error('Quarantine unavailable');
    });
    const { error: syncError } = await admin.rpc('sync_reservation_job');
    if (syncError) throw new Error('Schedule unavailable');
    return json({ ok: true, ...counts });
  } catch { return json({ error: 'Reservation reconciliation unavailable' }, 503); }
});