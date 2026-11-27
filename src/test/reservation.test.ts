import { it, expect } from 'vitest';
import { availableBundles, remainingSeconds } from '../lib/reservation';
it('8 free persons permit two groups of three, not eight bundles',()=>{expect(availableBundles(8,3)).toBe(2);});
it('unlimited capacity stays unlimited',()=>{expect(availableBundles(null,3)).toBe(null);});
it('exact 20-minute deadline expires without extending on rerender',()=>{const start=Date.UTC(2026,10,28);const deadline=new Date(start+1200000).toISOString();expect(remainingSeconds(deadline,start+1199000)).toBe(1);expect(remainingSeconds(deadline,start+1200000)).toBe(0);expect(remainingSeconds(deadline,start+1201000)).toBe(0);});