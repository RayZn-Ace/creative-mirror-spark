// Pure, injectable provider verification. Never trust a browser's status or deadline.
export interface ReservationPayment {
  id: string; payment_provider: string | null; mollie_payment_id: string | null; stripe_payment_id: string | null;
  currency: string; provider_amount_minor: number | null; total_amount: number;
}
export interface VerifiedReservationPayment { status: 'paid' | 'pending' | 'cancelled' | 'failed'; amount: number; currency: string; paymentId: string; paidAt: string | null }
export async function verifyExpiredPayment(order: ReservationPayment, keys: { mollie?: string; stripe?: string }, request: typeof fetch = fetch): Promise<VerifiedReservationPayment> {
  const mollie = order.payment_provider === 'mollie';
  const paymentId = mollie ? order.mollie_payment_id : order.stripe_payment_id;
  const key = mollie ? keys.mollie : keys.stripe;
  if (!paymentId || !key || (!mollie && order.payment_provider !== 'stripe')) throw new Error('Verification unavailable');
  if (!(mollie ? /^tr_[A-Za-z0-9]+$/ : /^cs_[A-Za-z0-9_]+$/).test(paymentId)) throw new Error('Invalid payment identifier');
  const url = mollie ? `https://api.mollie.com/v2/payments/${paymentId}` : `https://api.stripe.com/v1/checkout/sessions/${paymentId}`;
  const headers = { Authorization: `Bearer ${key}` };
  const read = async () => {
    const response = await request(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Verification unavailable');
    const payment = await response.json();
    const amount = mollie && /^\d+\.\d{2}$/.test(payment.amount?.value ?? '') ? Math.round(Number(payment.amount.value) * 100) : mollie ? NaN : payment.amount_total;
    const currency = String(mollie ? payment.amount?.currency : payment.currency).toUpperCase();
    const expected = order.provider_amount_minor ?? (order.currency === 'EUR' ? Math.round(Number(order.total_amount) * 100) : NaN);
    if (payment.id !== paymentId || payment.metadata?.order_id !== order.id || !Number.isSafeInteger(amount) || amount !== Number(expected) || currency !== order.currency.toUpperCase()) throw new Error('Payment reconciliation required');
    return { payment, amount, currency };
  };
  let checked = await read();
  // A cancelled/expired link must be confirmed by a second authenticated read.
  // Never release processing/authorized/asynchronous payments on a timer alone.
  if (mollie ? checked.payment.status === 'open' && checked.payment.isCancelable === true : checked.payment.status === 'open' && checked.payment.payment_status === 'unpaid') {
    const response = await request(mollie ? url : `${url}/expire`, { method: mollie ? 'DELETE' : 'POST', headers, signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Expiration outcome uncertain');
    checked = await read();
  }
  const payment = checked.payment;
  const status = mollie
    ? ({ paid: 'paid', expired: 'cancelled', canceled: 'cancelled', failed: 'failed' } as const)[payment.status as 'paid' | 'expired' | 'canceled' | 'failed'] ?? 'pending'
    : payment.payment_status === 'paid' || (payment.payment_status === 'no_payment_required' && checked.amount === 0) ? 'paid' : payment.status === 'expired' ? 'cancelled' : 'pending';
  return { status, amount: checked.amount, currency: checked.currency, paymentId, paidAt: mollie ? payment.paidAt ?? null : null };
}