import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { TicketInventory } from '@/lib/reservation';
import { fetchAll } from '@/lib/fetchAll';
export function useTicketInventory(eventId: string) {
  const [inventory, setInventory] = useState<TicketInventory[]>([]);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      if (document.hidden) return;
      try {
        const data = await fetchAll<TicketInventory>((from,to) => supabase.rpc('ticket_inventory', { p_event: eventId }).range(from,to));
        if (active) setInventory(data);
      } catch { /* Keep the last confirmed stock; checkout always checks server-side. */ }
    };
    setInventory([]);
    void refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [eventId]);
  return inventory;
}