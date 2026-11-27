import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { InputError, checkoutInput, UUID } from './paymentSafety.ts';
export { corsHeaders };
export const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export function adminClient() {
  const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Configuration unavailable');
  return createClient(url, key);
}
export async function readCheckout(req: Request) {
  if (req.method !== 'POST') throw new InputError('Bitte POST verwenden.');
  const raw = await req.text();
  if (raw.length > 65536) throw new InputError('Bestellung zu groß.');
  try { return checkoutInput(JSON.parse(raw)); } catch (e) { if (e instanceof InputError) throw e; throw new InputError('Ungültige Bestelldaten.'); }
}
export async function reserve(admin: ReturnType<typeof adminClient>, input: ReturnType<typeof checkoutInput>, provider: string) {
  const { data, error } = await admin.rpc('reserve_checkout_attempt', { p_body: input, p_provider: provider });
  if (error) { console.warn('Checkout reservation refused', error.code); throw new InputError(error.code === 'P0001' ? error.message : 'Bestellung konnte nicht reserviert werden.'); }
  if (!data?.id) throw new Error('Reservation unavailable');
  const { data: order, error: readError } = await admin.from('orders').select('*').eq('id', data.id).single();
  if (readError || !order) throw new Error('Reservation unavailable');
  return order;
}
export async function finalize(provider: string, paymentId: string, orderId: unknown, currency: string, amount: number, status: string, paidAt: string | null) {
  if (typeof orderId !== 'string' || !UUID.test(orderId) || !Number.isSafeInteger(amount) || amount < 0) return new Response('Invalid payment', { status: 400, headers: corsHeaders });
  const admin = adminClient();
  const { data, error } = await admin.rpc('finalize_ticket_payment', { p_order: orderId, p_provider: provider, p_payment_id: paymentId, p_currency: currency, p_amount: amount, p_status: status, p_paid_at: paidAt });
  if (error) { console.error('Payment reconciliation failed', error.code); return new Response('Payment reconciliation required', { status: 500, headers: corsHeaders }); }
  if (data?.send_email) {
    // One durable claim; uncertain mail outcomes are NOT automatically resent.
    const { data: claim, error: claimError } = await admin.from('orders').update({ ticket_email_state: 'sending' }).eq('id', orderId).eq('ticket_email_state', 'pending').select('id').maybeSingle();
    if (claimError) return new Response('Delivery claim failed', { status: 500, headers: corsHeaders });
    if (claim) {
      try {
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-tickets`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` }, body: JSON.stringify({ order_id: orderId }) });
        await admin.from('orders').update({ ticket_email_state: response.ok ? 'sent' : 'failed' }).eq('id', orderId);
        if (!response.ok) console.error('Ticket delivery needs manual retry', response.status);
      } catch { await admin.from('orders').update({ ticket_email_state: 'uncertain' }).eq('id', orderId); console.error('Ticket delivery outcome uncertain'); }
    }
  }
  return new Response('OK', { headers: corsHeaders });
}