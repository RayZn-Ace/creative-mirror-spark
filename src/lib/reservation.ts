export interface TicketInventory { ticket_category_id: string; sold: number; reserved: number; available: number | null; scarce: boolean; event_available?: number | null; event_sold?: number; event_reserved?: number }
export function availableBundles(available: number | null, groupSize: number | null) {
  return available === null ? null : Math.max(0, Math.floor(Number(available) / Math.max(1, groupSize ?? 1)));
}
export function remainingSeconds(deadline: string | null, now = Date.now()) {
  if (!deadline) return null;
  const timestamp = Date.parse(deadline);
  return Number.isFinite(timestamp) ? Math.max(0, Math.ceil((timestamp - now) / 1000)) : null;
}