// Injectable bounded runner: tests cannot contact payment providers or send mail.
export interface BatchOrder { id: string }
export async function runReservationBatch<T extends BatchOrder>(orders: T[], verify: (order: T) => Promise<'resolved' | 'pending'>, quarantine: (order: T, reason: 'provider_pending' | 'verification_unavailable') => Promise<void>) {
  let cursor = 0;
  const counts = { checked: 0, resolved: 0, quarantined: 0 };
  await Promise.all(Array.from({ length: Math.min(3, orders.length) }, async () => {
    while (cursor < orders.length) {
      const order = orders[cursor++];
      let reason: 'provider_pending' | 'verification_unavailable' = 'verification_unavailable';
      try {
        if (await verify(order) === 'resolved') { counts.checked++; counts.resolved++; continue; }
        reason = 'provider_pending';
      } catch { /* No provider details, credentials or personal data leave this runner. */ }
      await quarantine(order, reason);
      counts.checked++; counts.quarantined++;
    }
  }));
  return counts;
}