// @vitest-environment node
import { afterEach, it, expect, vi } from 'vitest';
import { authenticateCronRequest } from '../../supabase/functions/_shared/cron-auth';
declare global { var Deno: { env: { get(name: string): string | undefined } }; }
const request = (token?: string) => new Request('https://fixture.invalid', { headers: token ? { authorization: token } : {} });
const env = (current?: string, previous?: string) => vi.stubGlobal('Deno', { env: { get: (name:string) => name === 'LOVABLE_CRON_SECRET' ? current : previous } });
afterEach(() => vi.unstubAllGlobals());
it('missing scheduling configuration fails closed', () => { env(); expect(authenticateCronRequest(request('Bearer fixture'))?.status).toBe(500); });
for(const token of [undefined,'Bearer wrong','Bearer fixture,wrong','Basic fixture']) it(`rejects an invalid scheduling credential ${token === undefined ? 'missing' : 'provided'}`, () => { env('fixture'); expect(authenticateCronRequest(request(token))?.status).toBe(401); });
it('accepts the managed credential and rotation predecessor only', () => { env('fixture','previous'); expect(authenticateCronRequest(request('Bearer fixture'))).toBeNull(); expect(authenticateCronRequest(request('Bearer previous'))).toBeNull(); expect(authenticateCronRequest(request('Bearer other'))?.status).toBe(401); });