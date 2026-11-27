import { corsHeaders, finalize } from '../_shared/paymentRuntime.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  try {
    const raw = await req.text();
    if (raw.length > 1024) return new Response('Invalid payload', { status: 400, headers: corsHeaders });
    const id = new URLSearchParams(raw).get('id');
    if (!id || !/^tr_[A-Za-z0-9]{1,100}$/.test(id)) return new Response('Invalid payment ID', { status: 400, headers: corsHeaders });
    const key = Deno.env.get('MOLLIE_API_KEY');
    if (!key) throw new Error('Payment unavailable');
    const response = await fetch(`https://api.mollie.com/v2/payments/${id}`, { headers: { Authorization: `Bearer ${key}` } });
    if (!response.ok) { console.error('Mollie verification failed', response.status); return new Response('Verification unavailable', { status: 502, headers: corsHeaders }); }
    const payment = await response.json();
    if (payment.id !== id || !/^\d+\.\d{2}$/.test(payment.amount?.value ?? '')) return new Response('Invalid payment', { status: 400, headers: corsHeaders });
    const status = ({ paid: 'paid', canceled: 'cancelled', expired: 'cancelled', failed: 'failed', open: 'pending', pending: 'pending', authorized: 'pending' } as Record<string,string>)[payment.status];
    if (!status) return new Response('Unsupported payment status', { status: 400, headers: corsHeaders });
    return await finalize('mollie', id, payment.metadata?.order_id, payment.amount.currency, Math.round(Number(payment.amount.value)*100), status, payment.paidAt ?? null);
  } catch { console.error('Mollie webhook unavailable'); return new Response('Internal error', { status: 500, headers: corsHeaders }); }
});
