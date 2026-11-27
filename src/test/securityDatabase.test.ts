// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';
const event = '11111111-1111-4111-8111-111111111111';
const category = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';
const buyer = '44444444-4444-4444-8444-444444444444';
const stranger = '55555555-5555-4555-8555-555555555555';
let db: PGlite;
const body = (quantity = 1) => ({ eventId: event, email: 'synthetic@example.invalid', items: [{ ticketId: category, quantity, priceEur: 0 }], currency: 'EUR', insuranceAccepted: false });
async function reserve(b = body()) { const r = await db.query<{result: {id:string}}>('SELECT reserve_ticket_order($1::jsonb,$2) result',[JSON.stringify(b),'mollie']); return r.rows[0].result.id; }
async function attach(id:string) { await db.query("UPDATE orders SET mollie_payment_id='tr_synthetic',provider_amount_minor=1000,reservation_expires_at=null WHERE id=$1",[id]); }
async function finalize(id:string, amount=1000, status='paid', currency='EUR', provider='mollie', payment='tr_synthetic') { return db.query('SELECT finalize_ticket_payment($1::uuid,$2,$3,$4,$5::bigint,$6,now())',[id,provider,payment,currency,amount,status]); }
const count = async (table:string) => Number((await db.query<{n:number}>(`SELECT count(*) n FROM ${table}`)).rows[0].n);
beforeAll(async () => {
 db = new PGlite();
 await db.exec(readFileSync(new URL('./fixtures/security.sql',import.meta.url),'utf8'));
 for (const file of ['0002_secure_checkout_and_private_capabilities.sql','0003_verified_owners_scoped_counts_and_invoice_numbers.sql','0004_protect_public_payloads_and_invoice_fallback.sql','0005_idempotent_checkout_attempts.sql','0006_preserve_public_settings_reads.sql']) await db.exec(readFileSync(new URL(`../../drizzle/migrations/${file}`,import.meta.url),'utf8'));
},30000);
afterAll(async () => { await db.close(); });
beforeEach(async () => {
 await db.exec('RESET ROLE; RESET request.jwt.claim.sub; TRUNCATE events,ticket_categories,orders,tickets,coupons,u18_forms,auth.users,user_roles,series_managers,settings,ticket_transfers;');
 await db.query("INSERT INTO events(id,title,date,status,sold_out,is_16plus,series_id) VALUES($1,'Synthetic',CURRENT_DATE+7,'published',false,true,$2)",[event,other]);
 await db.query("INSERT INTO ticket_categories(id,event_id,name,price,max_capacity,group_size) VALUES($1,$2,'Synthetic',10,2,1)",[category,event]);
});
describe('isolated checkout and payment transactions', () => {
 it('uses 10 EUR from the database even if the client sends zero',async()=>{ const id=await reserve(); const r=await db.query<{total_amount:string;items:{priceEur:number}[]}>('SELECT total_amount,items FROM orders WHERE id=$1',[id]); expect(Number(r.rows[0].total_amount)).toBe(10); expect(r.rows[0].items[0].priceEur).toBe(10); });
 it('rejects quantity zero without creating an order',async()=>{await expect(reserve(body(0))).rejects.toThrow();expect(await count('orders')).toBe(0);});
 it('enforces the 99 per-category upper limit',async()=>{await expect(reserve(body(100))).rejects.toThrow();});
 it('rejects foreign event categories',async()=>{await db.query('UPDATE ticket_categories SET event_id=$1',[other]);await expect(reserve()).rejects.toThrow();});
 for (const flag of ['sold_out','internal_only','coming_soon']) it(`rejects ${flag}`,async()=>{await db.exec(`UPDATE ticket_categories SET ${flag}=true`);await expect(reserve()).rejects.toThrow();});
 it('rejects a category outside its sale window',async()=>{await db.exec("UPDATE ticket_categories SET sale_end=now()-interval '1 minute'");await expect(reserve()).rejects.toThrow();});
 it('counts pending reservations against capacity',async()=>{await reserve(body(2));await expect(reserve()).rejects.toThrow();expect(await count('orders')).toBe(1);});
 it('counts group members against capacity',async()=>{await db.exec('UPDATE ticket_categories SET group_size=3');await expect(reserve()).rejects.toThrow();});
 it('rejects payment amount mismatch before tickets or paid status',async()=>{const id=await reserve();await attach(id);await expect(finalize(id,1)).rejects.toThrow();expect(await count('tickets')).toBe(0);const r=await db.query<{status:string}>('SELECT status FROM orders');expect(r.rows[0].status).toBe('pending');});
 it('rejects currency mismatch',async()=>{const id=await reserve();await attach(id);await expect(finalize(id,1000,'paid','USD')).rejects.toThrow();});
 it('rejects provider mismatch',async()=>{const id=await reserve();await attach(id);await expect(finalize(id,1000,'paid','EUR','stripe')).rejects.toThrow();});
 it('rejects payment identifier mismatch',async()=>{const id=await reserve();await attach(id);await expect(finalize(id,1000,'paid','EUR','mollie','tr_other')).rejects.toThrow();});
 it('issues tickets once on repeated confirmation',async()=>{const id=await reserve();await attach(id);await finalize(id);await finalize(id);expect(await count('tickets')).toBe(1);});
 it('never downgrades a paid order on delayed cancellation',async()=>{const id=await reserve();await attach(id);await finalize(id);await finalize(id,1000,'cancelled');const r=await db.query<{status:string}>('SELECT status FROM orders');expect(r.rows[0].status).toBe('paid');});
 it('rolls back payment and tickets when ticket insertion fails',async()=>{const id=await reserve();await attach(id);await db.exec("ALTER TABLE tickets ADD CONSTRAINT test_failure CHECK(status <> 'valid')");try {await expect(finalize(id)).rejects.toThrow();expect(await count('tickets')).toBe(0);expect((await db.query<{status:string}>('SELECT status FROM orders')).rows[0].status).toBe('pending');}finally{await db.exec('ALTER TABLE tickets DROP CONSTRAINT test_failure');}});
 it('reserves coupon limits atomically for pending orders',async()=>{await db.query("INSERT INTO coupons(id,code,active,max_uses,discount_type,discount_value) VALUES($1,'SYNTHETIC',true,1,'percentage',10)",[other]);await reserve({...body(),discountCode:'SYNTHETIC'} as ReturnType<typeof body>);await expect(reserve({...body(),discountCode:'SYNTHETIC'} as ReturnType<typeof body>)).rejects.toThrow();});
 it('atomically allows just one valid-to-checked-in transition',async()=>{const id=await reserve();await attach(id);await finalize(id);const claim=()=>db.query("UPDATE tickets SET status='checked_in' WHERE order_id=$1 AND event_id=$2 AND status='valid' RETURNING id",[id,event]);const results=await Promise.all([claim(),claim()]);expect(results.reduce((n,r)=>n+r.rows.length,0)).toBe(1);});
});
describe('authorization and private minors',()=>{
 it('denies anonymous checkout RPC execution',async()=>{await db.exec('SET ROLE anon');await expect(reserve()).rejects.toThrow(/permission denied/);});
 it('denies anonymous scanner link enumeration',async()=>{await db.exec('SET ROLE anon');await expect(db.query('SELECT token FROM scanner_links')).rejects.toThrow(/permission denied/);});
 it('returns owned orders but denies another authenticated user',async()=>{await db.query('INSERT INTO auth.users VALUES($1,$2,now())',[buyer,'synthetic@example.invalid']);await reserve();await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub='${buyer}'`);expect(await count('orders')).toBe(1);await db.exec(`SET request.jwt.claim.sub='${stranger}'`);expect(await count('orders')).toBe(0);});
 it('returns only aggregate counts to assigned staff and denies a foreign series',async()=>{const id=await reserve();await attach(id);await finalize(id);await db.query('INSERT INTO series_managers VALUES($1,$2)',[buyer,other]);await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub='${buyer}'`);const r=await db.query('SELECT * FROM series_ticket_counts($1)',[other]);expect(Object.keys(r.rows[0]).sort()).toEqual(['checked_in','event_id','sold','ticket_category_id']);expect(await count('tickets')).toBe(0);await expect(db.query('SELECT * FROM series_ticket_counts($1)',[event])).rejects.toThrow(/Nicht autorisiert/);});
 it('accepts a real 16+ form and rejects the same form at 18+',async()=>{const insert=()=>db.query("INSERT INTO u18_forms(event_id,email,parent_name,minor_name,parent_address,minor_address,parent_phone,minor_phone,parent_birthday,minor_birthday) VALUES($1,'synthetic@example.invalid','Synthetic parent','Synthetic minor','Test 1','Test 1','123','123',CURRENT_DATE-interval '40 years',CURRENT_DATE-interval '17 years')",[event]);await insert();await db.exec('UPDATE events SET is_16plus=false');await expect(insert()).rejects.toThrow(/16\+/);expect(await count('u18_forms')).toBe(1);});
 it('rejects oversized signatures',async()=>{await expect(db.query("INSERT INTO u18_forms(email,parent_name,minor_name,parent_birthday,minor_birthday,parent_signature) VALUES('synthetic@example.invalid','Parent','Minor',CURRENT_DATE-interval '40 years',CURRENT_DATE-interval '17 years',$1)",['data:image/png;base64,'+'A'.repeat(200001)])).rejects.toThrow(/Unterschrift/);});
 it('allocates one persistent invoice number per paid order',async()=>{await db.exec("INSERT INTO settings VALUES('invoice','{\"prefix\":\"RE\",\"next_number\":7}',now())");const id=await reserve();await attach(id);await finalize(id);const first=(await db.query<{n:string}>('SELECT allocate_order_invoice($1) n',[id])).rows[0].n;expect((await db.query<{n:string}>('SELECT allocate_order_invoice($1) n',[id])).rows[0].n).toBe(first);expect(Number((await db.query<{n:string}>("SELECT value->>'next_number' n FROM settings")).rows[0].n)).toBe(8);});
});

describe('retry and public data boundaries',()=>{
 it('reuses one order for the same explicit attempt without blocking later purchases',async()=>{const b={...body(),attemptId:other};const call=()=>db.query<{r:{id:string}}>('SELECT reserve_checkout_attempt($1::jsonb,$2) r',[JSON.stringify(b),'mollie']);const one=(await call()).rows[0].r.id;expect((await call()).rows[0].r.id).toBe(one);await reserve();expect(await count('orders')).toBe(2);});
 it('rejects reuse of an attempt with changed quantity',async()=>{await db.query('SELECT reserve_checkout_attempt($1::jsonb,$2)',[JSON.stringify({...body(),attemptId:other}),'mollie']);await expect(db.query('SELECT reserve_checkout_attempt($1::jsonb,$2)',[JSON.stringify({...body(2),attemptId:other}),'mollie'])).rejects.toThrow(/Kaufversuch/);});
 it('keeps internal settings private while public feature flags remain readable',async()=>{await db.exec(`INSERT INTO settings VALUES('company','{}',now()),('features','{}',now()); SET ROLE anon;`);const r=await db.query<{key:string}>('SELECT key FROM settings');expect(r.rows.map(x=>x.key)).toEqual(['features']);});
 it('allocates a stable invoice reference even without a legacy counter row',async()=>{const id=await reserve();await attach(id);await finalize(id);const r=await db.query<{n:string}>('SELECT allocate_order_invoice($1) n',[id]);expect(r.rows[0].n.endsWith(id)).toBe(true);expect((await db.query<{n:string}>('SELECT allocate_order_invoice($1) n',[id])).rows[0].n).toBe(r.rows[0].n);});
 it('does not leak new ownership/payment internals through the guest confirmation',async()=>{const id=await reserve();const r=await db.query<{r:{order:Record<string,unknown>}}>('SELECT get_order_confirmation($1) r',[id]);expect(r.rows[0].r.order.id).toBe(id);expect(r.rows[0].r.order).not.toHaveProperty('owner_user_id');expect(r.rows[0].r.order).not.toHaveProperty('provider_amount_minor');expect(r.rows[0].r.order).not.toHaveProperty('checkout_request_hash');});
});
