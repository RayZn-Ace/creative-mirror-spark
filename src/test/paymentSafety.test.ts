// @vitest-environment node
import { describe,it,expect,vi } from 'vitest';
import { checkoutInput,appOrigin,effectiveEvent,amountMinor,generateQRCode,stripeSignature } from '../../supabase/functions/_shared/paymentSafety';
import { scannerCall } from '../lib/scannerSession';
const input={email:'synthetic@example.invalid',eventId:'11111111-1111-4111-8111-111111111111',items:[{ticketId:'22222222-2222-4222-8222-222222222222',quantity:1,priceEur:0,name:'Injected',group_size:100}],currency:'EUR'};
describe('checkout boundaries',()=>{
 it('strips client prices, names, and group sizes',()=>expect(checkoutInput(input).items).toEqual([{ticketId:input.items[0].ticketId,quantity:1}]));
 for(const q of [0,-1,1.1,100,NaN])it(`rejects quantity ${q}`,()=>expect(()=>checkoutInput({...input,items:[{...input.items[0],quantity:q}]})).toThrow());
 it('accepts 99 tickets',()=>expect(checkoutInput({...input,items:[{...input.items[0],quantity:99}]}).items[0].quantity).toBe(99));
 it('rejects duplicate categories',()=>expect(()=>checkoutInput({...input,items:[...input.items,...input.items]})).toThrow());
 it('rejects unknown redirect origins and lookalike hosts',()=>{expect(()=>appOrigin('https://nightlifeticket.app.evil.invalid')).toThrow();expect(()=>appOrigin('https://nightlifeticket.app/path')).toThrow();expect(appOrigin('https://nightlifeticket.app')).toBe('https://nightlifeticket.app');});
 it('rejects event override on a scoped scanner',()=>expect(()=>effectiveEvent('event-a','event-b')).toThrow());
 it('keeps scoped and explicitly all-event scanner behavior',()=>{expect(effectiveEvent('event-a',null)).toBe('event-a');expect(effectiveEvent(null,'event-b')).toBe('event-b');});
 it('rounds provider amounts to concrete minor units',()=>{expect(amountMinor(10,'EUR')).toBe(1000);expect(amountMinor(10,'CHF')).toBe(940);});
 it('generates 128-bit secure QR codes without Math.random',()=>{const spy=vi.spyOn(Math,'random').mockImplementation(()=>{throw Error('insecure RNG');});try{const codes=new Set(Array.from({length:20},()=>generateQRCode()));expect(codes.size).toBe(20);expect([...codes].every(c=>/^[0-9A-F]{32}$/.test(c))).toBe(true);}finally{spy.mockRestore();}});
});
describe('Stripe signatures',()=>{
 const timestamp=1700000000;const body='{"type":"synthetic"}';const secret='synthetic-test-secret';
 const signature=async()=>{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${timestamp}.${body}`))),b=>b.toString(16).padStart(2,'0')).join('');};
 it('accepts a valid signature during provider key rotation',async()=>expect(await stripeSignature(body,`t=${timestamp},v1=${'0'.repeat(64)},v1=${await signature()}`,secret,timestamp*1000)).toBe(true));
 it('rejects changed body, old or malformed timestamps',async()=>{const s=await signature();expect(await stripeSignature(body+' ',`t=${timestamp},v1=${s}`,secret,timestamp*1000)).toBe(false);expect(await stripeSignature(body,`t=${timestamp},v1=${s}`,secret,(timestamp+301)*1000)).toBe(false);expect(await stripeSignature(body,`t=NaN,v1=${s}`,secret,timestamp*1000)).toBe(false);});
});
describe('scanner retries',()=>{
 it('refreshes once after an explicit auth refusal',async()=>{const op=vi.fn().mockResolvedValueOnce({status:401}).mockResolvedValue({status:200});const refresh=vi.fn().mockResolvedValue(true);expect(await scannerCall<{status:number}>(op,refresh,r=>r.status===401)).toEqual({status:200});expect(op).toHaveBeenCalledTimes(2);expect(refresh).toHaveBeenCalledTimes(1);});
 it('does not replay an ambiguous network failure',async()=>{const op=vi.fn().mockRejectedValue(new Error('network'));const refresh=vi.fn();await expect(scannerCall(op,refresh,()=>false)).rejects.toThrow('network');expect(op).toHaveBeenCalledTimes(1);expect(refresh).not.toHaveBeenCalled();});
 it('does not loop or sign out after failed refresh',async()=>{const op=vi.fn().mockResolvedValue({status:401});expect(await scannerCall(op,async()=>false,()=>true)).toEqual({status:401});expect(op).toHaveBeenCalledTimes(1);});
});
