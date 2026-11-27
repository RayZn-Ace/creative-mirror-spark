import { stripeSignature } from '../_shared/paymentSafety.ts';
import { corsHeaders, finalize } from '../_shared/paymentRuntime.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  try {
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) throw new Error('Signature verification unavailable');
    const raw = await req.text(); const header = req.headers.get('stripe-signature');
    if (raw.length > 1048576 || !header || !await stripeSignature(raw, header, secret)) return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    const event = JSON.parse(raw);
    const supported = ['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'];
    if (!supported.includes(event.type)) return new Response('OK', { headers: corsHeaders });
    const session = event.data?.object;
    if (!session || typeof session.id !== 'string' || !/^cs_[A-Za-z0-9_]+$/.test(session.id)) return new Response('Invalid session', { status: 400, headers: corsHeaders });
    // A completed session can still have an unpaid asynchronous payment.
    const status = event.type === 'checkout.session.expired' ? 'cancelled' : event.type === 'checkout.session.async_payment_failed' ? 'failed' : session.payment_status === 'paid' || (session.payment_status === 'no_payment_required' && session.amount_total === 0) ? 'paid' : 'pending';
    return await finalize('stripe', session.id, session.metadata?.order_id, session.currency, session.amount_total, status, status === 'paid' ? new Date().toISOString() : null);
  } catch { console.error('Stripe webhook unavailable'); return new Response('Internal error', { status: 500, headers: corsHeaders }); }
});
