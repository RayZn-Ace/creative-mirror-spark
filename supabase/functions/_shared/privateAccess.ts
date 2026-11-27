import { createClient } from 'npm:@supabase/supabase-js@2';
import { documentCapability } from './capability.ts';
export async function staffUser(req: Request, roles = ['admin']): Promise<string | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const url = Deno.env.get('SUPABASE_URL');
  if (!token || !key || !url) return null;
  if (token === key) return 'service';
  const admin = createClient(url, key);
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return null;
  const { data } = await admin.from('user_roles').select('role').eq('user_id', user.id).in('role', roles);
  return data?.length ? user.id : null;
}
export async function canReadU18(req: Request, token: unknown, storedHash: unknown, createdAt?: string): Promise<boolean> {
  if (await staffUser(req)) return true;
  return documentCapability(token, storedHash, createdAt);
}