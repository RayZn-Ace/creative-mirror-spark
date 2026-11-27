export function canReloadSafely(path: string, checkoutActive = false, unsyncedCount = 0): boolean {
  const route = path.split(/[?#]/)[0];
  return !checkoutActive && unsyncedCount === 0 && !/^\/(?:scan|scanner|einlass|admin\/scanner|bestellung|muttizettel)(?:\/|$)/.test(route);
}
/** Deliberately no automatic reload or cache/storage deletion. */
export function requestSafeReload(): boolean {
  const path = window.location.hash.startsWith('#/') ? window.location.hash.slice(1) : window.location.pathname;
  if (!canReloadSafely(path, window.__NIGHTLIFE_CHECKOUT_ACTIVE__ === true)) return false;
  window.location.reload();
  return true;
}
declare global { interface Window { __NIGHTLIFE_CHECKOUT_ACTIVE__?: boolean; } }