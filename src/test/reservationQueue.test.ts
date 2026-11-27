// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { beforeAll, beforeEach, afterAll, it, expect } from 'vitest';
const event = '11111111-1111-4111-8111-111111111111', cat = '22222222-2222-4222-8222-222222222222';
let db: PGlite;
beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(new URL('./fixtures/security.sql', import.meta.url), 'utf8'));
  await db.exec(`CREATE SCHEMA cron; CREATE TABLE cron.fixture_job(id bigint primary key,active boolean); INSERT INTO cron.fixture_job VALUES(1,false);
    CREATE FUNCTION cron.alter_job(job_id bigint,active boolean) RETURNS void LANGUAGE sql AS $$ UPDATE cron.fixture_job SET active=$2 WHERE id=$1 $$;`);
  const dir = new URL('../../drizzle/migrations/', import.meta.url);
  for (const name of readdirSync(dir).filter(name => /^000[2-9].*\.sql$/.test(name)).sort()) await db.exec(readFileSync(new URL(name, dir), 'utf8'));
  await db.exec(readFileSync(process.env.RESERVATION_QUEUE_SQL ?? new URL('0010_scheduled_reservation_reconciliation.sql', dir), 'utf8'));
  await db.exec(readFileSync(process.env.RESERVATION_JOB_PATCH_SQL ?? new URL('0011_reservation_job_claim_leases.sql', dir), 'utf8'));
  // Reproduce inherited hosted default grants before applying explicit least privilege.
  await db.exec('GRANT ALL ON reservation_job_control TO anon,authenticated');
  await db.exec(readFileSync(new URL('0012_private_reservation_job_grants.sql', dir), 'utf8'));
  await db.exec('UPDATE reservation_job_control SET job_id=1');
}, 30000);
afterAll(async () => { await db.close(); });
beforeEach(async () => {
  await db.exec('RESET ROLE; TRUNCATE events,ticket_categories,orders,tickets,coupons; UPDATE cron.fixture_job SET active=false');
  await db.query("INSERT INTO events(id,title,date,status,is_16plus) VALUES($1,'Fixture',CURRENT_DATE+7,'published',true)",[event]);
  await db.query("INSERT INTO ticket_categories(id,event_id,name,price,group_size) VALUES($1,$2,'Fixture',10,1)",[cat,event]);
});
const add = async (provider = true, minutes = -1) => (await db.query<{id:string}>(`INSERT INTO orders(email,event_id,items,total_amount,currency,status,reservation_expires_at,payment_started_at,mollie_payment_id,payment_provider)
 VALUES('fixture@example.invalid',$1,$2,10,'EUR','pending',now()+($3::text||' minutes')::interval,CASE WHEN $4 THEN now() END,CASE WHEN $4 THEN 'tr_fixture' END,CASE WHEN $4 THEN 'mollie' END) RETURNING id`,[event,JSON.stringify([{ticketId:cat,quantity:1,group_size:1}]),minutes,provider])).rows[0].id;
const active = async () => (await db.query<{active:boolean}>('SELECT active FROM cron.fixture_job')).rows[0].active;
it('enqueue wakes the job and a drained queue pauses it', async () => {
  expect(await active()).toBe(false); await add(false); expect(await active()).toBe(true);
  await db.query('SELECT * FROM claim_reservation_batch()'); expect(await active()).toBe(false);
});
it('a future reservation keeps the job armed without contacting providers', async () => {
  await add(true,20); expect((await db.query('SELECT * FROM claim_reservation_batch()')).rows).toHaveLength(0); expect(await active()).toBe(true);
});
it('never-started expired reservations are released once, without changing audit status', async () => {
  const id=await add(false); await db.query('SELECT * FROM claim_reservation_batch()');
  const first=(await db.query<{released:string;status:string}>('SELECT reservation_released_at released,status FROM orders WHERE id=$1',[id])).rows[0];
  await db.query('SELECT * FROM claim_reservation_batch()');
  expect(first.status).toBe('pending'); expect(first.released).not.toBeNull();
  expect((await db.query<{released:string}>('SELECT reservation_released_at released FROM orders WHERE id=$1',[id])).rows[0].released).toEqual(first.released);
});
it('fair batches claim only twelve and do not starve remaining orders on retry', async () => {
  for(let i=0;i<14;i++) await add();
  const first=(await db.query<{id:string}>('SELECT id FROM claim_reservation_batch()')).rows;
  const second=(await db.query<{id:string}>('SELECT id FROM claim_reservation_batch()')).rows;
  expect(first).toHaveLength(12); expect(second).toHaveLength(2); expect(second.every(x=>!first.some(y=>x.id===y.id))).toBe(true);
});
it('quarantine holds seats and defers provider retry fifteen minutes', async () => {
  const id=await add(); await db.query('SELECT * FROM claim_reservation_batch()');
  await db.query("UPDATE orders SET reservation_review_reason='provider_pending',reservation_next_verify_at=now()+interval '15 minutes',reservation_verification_claimed_at=now()-interval '2 minutes' WHERE id=$1",[id]);
  expect((await db.query('SELECT * FROM claim_reservation_batch()')).rows).toHaveLength(0);
  expect(Number((await db.query<{reserved:number}>('SELECT reserved FROM reservation_inventory($1)',[event])).rows[0].reserved)).toBe(1);
  expect(await active()).toBe(true);
  await db.query("UPDATE orders SET reservation_next_verify_at=now()-interval '1 second' WHERE id=$1",[id]);
  expect((await db.query('SELECT * FROM claim_reservation_batch()')).rows).toHaveLength(1);
});
it('paid orders are never claimed or released', async () => {
  const id=await add(); await db.query("UPDATE orders SET status='paid' WHERE id=$1",[id]);
  expect((await db.query('SELECT * FROM claim_reservation_batch()')).rows).toHaveLength(0);
  expect((await db.query<{reservation_released_at:string|null}>('SELECT reservation_released_at FROM orders WHERE id=$1',[id])).rows[0].reservation_released_at).toBeNull();
});
it('a running batch cannot be reclaimed by checkout after sixty seconds', async () => {
  const id=await add(); await db.query('SELECT * FROM claim_reservation_batch()');
  await db.query("UPDATE orders SET reservation_verification_claimed_at=now()-interval '61 seconds' WHERE id=$1",[id]);
  expect((await db.query('SELECT * FROM claim_expired_reservations($1)',[event])).rows).toHaveLength(0);
  const delay=Number((await db.query<{seconds:number}>('SELECT extract(epoch from reservation_next_verify_at-now()) seconds FROM orders WHERE id=$1',[id])).rows[0].seconds);
  expect(delay).toBeGreaterThan(290); expect(delay).toBeLessThanOrEqual(300);
  await db.query("UPDATE orders SET reservation_next_verify_at=now()-interval '1 second' WHERE id=$1",[id]);
  expect((await db.query('SELECT * FROM claim_expired_reservations($1)',[event])).rows).toHaveLength(1);
});
for (const role of ['anon','authenticated']) it(`${role} cannot control or read the queue`, async () => {
  await db.exec(`SET ROLE ${role}`);
  await expect(db.query('SELECT * FROM claim_reservation_batch()')).rejects.toThrow(/permission denied/);
  await expect(db.query('SELECT sync_reservation_job()')).rejects.toThrow(/permission denied/);
  await expect(db.query('SELECT * FROM reservation_job_control')).rejects.toThrow(/permission denied/);
});