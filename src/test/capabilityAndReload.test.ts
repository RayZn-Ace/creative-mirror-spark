// @vitest-environment node
import { it, expect } from 'vitest';
import { documentCapability, hashToken } from '../../supabase/functions/_shared/capability';
import { canReloadSafely } from '../lib/reloadSafety';
it('requires the correct separate token for new private documents', async () => {
  const token = 'a'.repeat(64), hash = await hashToken(token);
  expect(await documentCapability(token, hash)).toBe(true);
  expect(await documentCapability('b'.repeat(64), hash)).toBe(false);
  expect(await documentCapability(undefined, hash)).toBe(false);
});
it('limits the legacy random-ID capability to 30 minutes', async () => {
  const created = '2026-11-27T23:00:00Z', now = Date.parse(created);
  expect(await documentCapability(undefined,null,created,now+30*60*1000)).toBe(true);
  expect(await documentCapability(undefined,null,created,now+30*60*1000+1)).toBe(false);
  expect(await documentCapability(undefined,null,undefined,now)).toBe(false);
});
it('never reloads active checkout or unsynced data', () => {
  expect(canReloadSafely('/', true, 0)).toBe(false);
  expect(canReloadSafely('/', false, 1)).toBe(false);
});
it('never reloads scanner, payment or U18 form routes', () => {
  for (const path of ['/scan','/scanner','/admin/scanner','/bestellung/synthetic','/muttizettel?event=synthetic']) expect(canReloadSafely(path)).toBe(false);
  expect(canReloadSafely('/termine')).toBe(true);
});