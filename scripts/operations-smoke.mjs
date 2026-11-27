#!/usr/bin/env node
// Read-only: only GET/OPTIONS; never runs browser scripts, purchases, scans or mail.
import { loadEnv } from 'vite';
const args = process.argv.slice(2);
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'https://nightlifeticket.app';
const origin = new URL(base);
if (origin.protocol !== 'https:' && origin.hostname !== 'localhost') throw Error('HTTPS or localhost required');
const env = loadEnv('production', process.cwd(), 'VITE_SUPABASE_');
const api = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
const checks = [];
async function request(url, method = 'GET', headers = {}) {
 if (!['GET','OPTIONS'].includes(method)) throw Error('Read-only method required');
 return fetch(url, { method, headers, redirect: 'follow', signal: AbortSignal.timeout(20000) });
}
function record(name, ok, details = {}) { checks.push({ name, ok, ...details }); }
try {
 const pages = ['/', '/termine', '/fotos', '/muttizettel', '/ticket-nicht-erhalten'];
 for (const path of pages) {
  const res = await request(new URL(path, origin)); const html = await res.text();
  record(`page ${path}`, res.ok && html.includes('id="root"'), { status: res.status, cache: res.headers.get('cache-control') });
  if (path === '/') {
   const script = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m => m[1]).find(s => s.includes('/assets/') || s.includes('/src/main'));
   if (script) { const asset = await request(new URL(script, origin)); record('entry asset', asset.ok, {status:asset.status, cache:asset.headers.get('cache-control')}); }
   else record('entry asset', false);
  }
 }
 if (!api || !key) record('Cloud configuration available', false);
 else {
  const headers = { apikey: key };
  for (const table of ['events','event_series']) {
   const res = await request(`${api}/rest/v1/${table}?select=slug&status=eq.published&limit=1`, 'GET', headers);
   const rows = await res.json(); record(`public ${table}`, res.ok && Array.isArray(rows), { status:res.status });
   if (table === 'event_series' && rows[0]?.slug) { const page = await request(new URL(`/${encodeURIComponent(rows[0].slug)}`,origin)); const html = await page.text();record('event page',page.ok && html.includes('id="root"'),{status:page.status}); }
  }
  for (const table of ['orders','tickets','u18_forms','muttizettel_submissions','support_tickets','support_messages','customer_profiles','newsletter_subscribers','user_roles','scanner_links','page_visits']) {
   const res = await request(`${api}/rest/v1/${table}?select=id&limit=1`, 'GET', headers);
   const data = await res.json(); record(`anonymous private ${table}`, [401,403].includes(res.status) || (res.ok && Array.isArray(data) && data.length===0), { status:res.status });
  }
  const res = await request(`${api}/rest/v1/settings?select=key&key=eq.company`, 'GET', headers);
  const values = await res.json(); record('anonymous company settings denied',res.ok && Array.isArray(values) && values.length===0,{status:res.status});
  for (const name of ['create-mollie-payment','create-stripe-payment','validate-ticket','ticket-not-received','reconcile-reservations']) {
   const health = await request(`${api}/functions/v1/${name}`, 'OPTIONS', { ...headers, Origin:origin.origin });record(`function reachable ${name}`,health.ok,{status:health.status});
  }
  const queue = await request(`${api}/rest/v1/reservation_job_control?select=singleton`, 'GET', headers);
  record('anonymous reservation job control denied', [401,403].includes(queue.status), {status:queue.status});
  const worker = await request(`${api}/functions/v1/reconcile-reservations`, 'GET', headers);
  record('anonymous scheduled callback denied', worker.status===401, {status:worker.status});
 }
} catch (error) { record('network completion',false,{error:error.name}); }
console.log(JSON.stringify({ time:new Date().toISOString(), origin:origin.origin, readOnly:true, renderedBrowserCheck:false, checks },null,2));
if (checks.some(c => !c.ok)) process.exitCode=1;
