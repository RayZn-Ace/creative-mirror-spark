// @vitest-environment node
import { it, expect, vi } from 'vitest';
import { runReservationBatch } from '../../supabase/functions/_shared/reservationBatch';
it('checks a bounded batch with at most three parallel provider requests', async () => {
  let active = 0, peak = 0;
  const verify = vi.fn(async () => { peak = Math.max(peak, ++active); await new Promise(resolve => setTimeout(resolve, 1)); active--; return 'resolved' as const; });
  const result = await runReservationBatch(Array.from({ length: 12 }, (_, id) => ({ id: String(id) })), verify, vi.fn());
  expect(peak).toBe(3); expect(result).toEqual({ checked: 12, resolved: 12, quarantined: 0 });
});
it('pending and failed verifications are quarantined, not released', async () => {
  const quarantine = vi.fn();
  const result = await runReservationBatch([{ id: 'pending' }, { id: 'offline' }], async order => { if (order.id === 'offline') throw new Error('offline'); return 'pending'; }, quarantine);
  expect(result.resolved).toBe(0); expect(result.quarantined).toBe(2);
  expect(quarantine).toHaveBeenCalledWith({ id: 'pending' }, 'provider_pending');
  expect(quarantine).toHaveBeenCalledWith({ id: 'offline' }, 'verification_unavailable');
});
it('an empty queue makes no provider requests', async () => {
  const verify = vi.fn(), quarantine = vi.fn();
  expect((await runReservationBatch([], verify, quarantine)).checked).toBe(0);
  expect(verify).not.toHaveBeenCalled(); expect(quarantine).not.toHaveBeenCalled();
});