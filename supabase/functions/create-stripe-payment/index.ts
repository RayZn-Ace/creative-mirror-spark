import { InputError, amountMinor } from '../_shared/paymentSafety.ts';
import { corsHeaders, json, adminClient, readCheckout, reserve } from '../_shared/paymentRuntime.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const input = await readCheckout(req);
    const key = Deno.env.get('STRIPE_SECRET_KEY');
    if (!key) throw new Error('Payment unavailable');
    const admin = adminClient();
    const order = await reserve(admin, input, 'stripe');
    const currency = input.currency;
    const redirectUrl = `${input.origin}/bestellung/${order.id}`;
    if (order.status === 'paid') return json({ orderId: order.id });
    if (order.status === 'failed' || order.status === 'cancelled') return json({ error: 'Dieser Kaufversuch ist beendet. Bitte prüfe die Bestellung.', orderId: order.id }, 409);
    if (order.stripe_payment_id) {
      const existing = await fetch(`https://api.stripe.com/v1/checkout/sessions/${order.stripe_payment_id}`, { headers: { Authorization: `Bearer ${key}` } });
      if (!existing.ok) return json({ error: 'Bestellstatus derzeit nicht bestätigt.', orderId: order.id }, 503);
      const session = await existing.json();
      return json({ checkoutUrl: session.url, orderId: order.id });
    }
    if (Date.now() - Date.parse(order.created_at) > 15 * 60 * 1000) return json({ error: 'Dieser Zahlungsstart muss geprüft werden. Bitte nicht erneut kaufen.', orderId: order.id }, 409);

    const lines = input.discountCode
      ? [{ name: 'Nightlife Tickets inkl. Gebühren und Gutschein', quantity: 1, amount: amountMinor(Number(order.total_amount), currency) }]
      : order.items.map((item: any) => ({ name: item.name, quantity: item.quantity, amount: amountMinor(Number(item.priceEur), currency) }));
    if (!input.discountCode) {
      if (order.service_fee > 0) lines.push({ name: 'Servicegebühr', quantity: 1, amount: amountMinor(Number(order.service_fee), currency) });
      if (order.insurance_fee > 0) lines.push({ name: 'Ticketversicherung', quantity: 1, amount: amountMinor(Number(order.insurance_fee), currency) });
    }
    const amount = lines.reduce((sum: number, i: any) => sum + i.quantity * i.amount, 0);
    const { error: expectationError } = await admin.from('orders').update({ provider_amount_minor: amount, reservation_expires_at: null }).eq('id', order.id);
    if (expectationError) throw new Error('Payment unavailable');
    const params = new URLSearchParams({ mode: 'payment', success_url: redirectUrl, cancel_url: redirectUrl, customer_email: input.email, 'metadata[order_id]': order.id, expires_at: String(Math.floor(Date.parse(order.created_at)/1000)+1800) });
    if (input.discountCode) params.set('metadata[discount_code]', input.discountCode);
    lines.forEach((i: any, n: number) => {
      params.set(`line_items[${n}][price_data][currency]`, currency.toLowerCase());
      params.set(`line_items[${n}][price_data][product_data][name]`, i.name);
      params.set(`line_items[${n}][price_data][unit_amount]`, String(i.amount));
      params.set(`line_items[${n}][quantity]`, String(i.quantity));
    });
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `payment-${order.id}` }, body: params.toString() });
    if (!response.ok) {
      console.error('Stripe checkout refused', response.status);
      await admin.from('orders').update({ status: 'failed' }).eq('id', order.id).eq('status', 'pending');
      return json({ error: 'Zahlung konnte nicht gestartet werden. Bitte prüfe den Bestellstatus, bevor du erneut kaufst.', orderId: order.id }, 502);
    }
    const session = await response.json();
    const { error } = await admin.from('orders').update({ stripe_payment_id: session.id, redirect_url: redirectUrl, reservation_expires_at: null }).eq('id', order.id);
    if (error || !session.url) return json({ error: 'Zahlungsstart wird geprüft. Bitte nicht erneut kaufen.', orderId: order.id }, 503);
    return json({ checkoutUrl: session.url, orderId: order.id });
  } catch (error) {
    console.error('Checkout failed', error instanceof InputError ? 'validation' : 'internal');
    return json({ error: error instanceof InputError ? error.message : 'Zahlungsstart nicht bestätigt. Bitte vor einem weiteren Kauf den Bestellstatus prüfen.' }, error instanceof InputError ? 400 : 503);
  }
});
