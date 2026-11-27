/** Refresh only before a call or after an explicit authorization refusal.
 * Never replay a network-ambiguous check-in and never sign out on failure. */
export async function scannerCall<T>(operation: () => Promise<T>, refresh: () => Promise<boolean>, unauthorized: (result: T) => boolean): Promise<T> {
  const result = await operation();
  if (!unauthorized(result) || !await refresh()) return result;
  return operation();
}