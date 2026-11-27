export async function hashToken(token: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
export async function documentCapability(token: unknown, storedHash: unknown, createdAt?: string, now = Date.now()): Promise<boolean> {
  // Legacy native releases know only the random submission ID. Keep that
  // 122-bit bearer capability valid briefly, not as an unlimited lookup.
  if (storedHash == null) {
    const created = Date.parse(createdAt ?? '');
    return Number.isFinite(created) && now >= created && now - created <= 30 * 60 * 1000;
  }
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token) || typeof storedHash !== 'string') return false;
  const actual = await hashToken(token);
  if (actual.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ storedHash.charCodeAt(i);
  return diff === 0;
}