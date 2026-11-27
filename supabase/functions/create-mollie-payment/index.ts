import { InputError, amountMinor } from '../_shared/paymentSafety.ts';
import { corsHeaders, json, adminClient, readCheckout, reserve } from '../_shared/paymentRuntime.ts';
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const input = await readCheckout(req);
    const key = Deno.env.get('MOLLIE_API_KEY');
    if (!key) throw new Error('Payment unavailable');
    const admin = adminClient();
    const supported = ['EUR','USD','GBP','CHF','PLN','CZK','HUF','RON','BGN','DKK','NOK','SEK'];
    const currency = supported.includes(input.currency) ? input.currency : 'EUR';
    const order = await reserve(admin, { ...input, currency }, 'mollie');
    const amount = amountMinor(Number(order.total_amount), currency);
    const redirectUrl = `${input.origin}/bestellung/${order.id}`;
    if (order.status === 'paid') return json({ orderId: order.id });
    if (order.reservation_released_at || (order.reservation_expires_at && Date.parse(order.reservation_expires_at) <= Date.now())) return json({ error: 'Reservierung abgelaufen oder Zahlung noch in Prüfung. Bitte prüfe diese Bestellung, bevor du erneut kaufst.', orderId: order.id, reservationExpiresAt: order.reservation_expires_at }, 409);
    if (order.status === 'failed' || order.status === 'cancelled') return json({ error: 'Dieser Kaufversuch ist beendet. Bitte prüfe die Bestellung.', orderId: order.id }, 409);
    if (order.mollie_payment_id) {
      const existing = await fetch(`https://api.mollie.com/v2/payments/${order.mollie_payment_id}`, { headers: { Authorization: `Bearer ${key}` } });
      if (!existing.ok) return json({ error: 'Bestellstatus derzeit nicht bestätigt.', orderId: order.id }, 503);
      const payment = await existing.json();
      return json({ checkoutUrl: payment.status === 'open' ? payment._links?.checkout?.href : undefined, orderId: order.id, reservationExpiresAt: order.reservation_expires_at });
    }
    if (Date.now() - Date.parse(order.created_at) > 15 * 60 * 1000) return json({ error: 'Dieser Zahlungsstart muss geprüft werden. Bitte nicht erneut kaufen.', orderId: order.id }, 409);

    const { data: started, error: expectationError } = await admin.from('orders').update({ provider_amount_minor: amount, reservation_expires_at: null, payment_started_at: new Date().toISOString() }).eq('id', order.id).eq('status', 'pending').is('reservation_released_at', null).select('reservation_expires_at').single();
    if (expectationError) throw new Error('Payment unavailable');
    if (started.reservation_expires_at && Date.parse(started.reservation_expires_at) <= Date.now()) return json({ error: 'Reservierung abgelaufen. Bitte prüfe die Bestellung.', orderId: order.id }, 409);
    const country = input.country;
    const COUNTRY_METHODS: Record<string, string[]> = {
      DE: ["applepay", "bancontact", "creditcard", "eps", "giropay", "ideal", "klarna", "paypal", "sofort", "przelewy24"],
      AT: ["applepay", "creditcard", "eps", "klarna", "paypal", "sofort"],
      CH: ["applepay", "creditcard", "paypal", "twint"],
      NL: ["applepay", "creditcard", "ideal", "klarna", "paypal"],
      BE: ["applepay", "bancontact", "creditcard", "klarna", "paypal"],
      FR: ["applepay", "creditcard", "klarna", "paypal"],
      PL: ["applepay", "creditcard", "paypal", "przelewy24", "blik"],
      CZ: ["applepay", "creditcard", "paypal"],
      DK: ["applepay", "creditcard", "paypal"],
      SE: ["applepay", "creditcard", "klarna", "paypal"],
      NO: ["applepay", "creditcard", "klarna", "paypal"],
      IT: ["applepay", "creditcard", "klarna", "paypal", "mybank"],
      ES: ["applepay", "creditcard", "klarna", "paypal"],
      PT: ["applepay", "creditcard", "paypal", "multibanco"],
      GB: ["applepay", "creditcard", "klarna", "paypal"],
      HU: ["applepay", "creditcard", "paypal"],
      RO: ["applepay", "creditcard", "paypal"],
      BG: ["applepay", "creditcard", "paypal"],
      LU: ["applepay", "creditcard", "ideal", "paypal"],
      FI: ["applepay", "creditcard", "klarna", "paypal"],
    };

    const paymentMethods = country && COUNTRY_METHODS[country.toUpperCase()]
      ? COUNTRY_METHODS[country.toUpperCase()]
      : undefined; // Let Mollie decide if country unknown

    const response = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `payment-${order.id}` },
      body: JSON.stringify({ amount: { currency, value: (amount / 100).toFixed(2) }, description: `Tickets – Order ${order.id.slice(0, 8)}`, redirectUrl,
        webhookUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mollie-webhook`, ...(paymentMethods ? { method: paymentMethods } : {}), metadata: { order_id: order.id, discount_code: input.discountCode } })
    });
    if (!response.ok) {
      console.error('Mollie checkout refused', response.status);
      await admin.from('orders').update({ status: 'failed' }).eq('id', order.id).eq('status', 'pending');
      return json({ error: 'Zahlung konnte nicht gestartet werden. Bitte prüfe den Bestellstatus, bevor du erneut kaufst.', orderId: order.id }, 502);
    }
    const payment = await response.json();
    const { error } = await admin.from('orders').update({ mollie_payment_id: payment.id, redirect_url: redirectUrl, reservation_expires_at: null }).eq('id', order.id);
    if (error || !payment._links?.checkout?.href) return json({ error: 'Zahlungsstart wird geprüft. Bitte nicht erneut kaufen.', orderId: order.id }, 503);
    return json({ checkoutUrl: payment._links.checkout.href, orderId: order.id, reservationExpiresAt: started.reservation_expires_at });
  } catch (error) {
    console.error('Checkout failed', error instanceof InputError ? 'validation' : 'internal');
    return json({ error: error instanceof InputError ? error.message : 'Zahlungsstart nicht bestätigt. Bitte vor einem weiteren Kauf den Bestellstatus prüfen.' }, error instanceof InputError ? 400 : 503);
  }
});
