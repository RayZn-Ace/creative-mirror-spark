import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
interface Lease { id: string; status: string; reservation_expires_at: string | null; payment_reconciliation_required: boolean; reservation_review_reason: string | null; reservation_next_verify_at: string | null }
export default function ReservationStatus({ eventId }: { eventId: string }) {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [error, setError] = useState(false);
  const refresh = async () => {
    const { data, error } = await supabase.from('orders').select('id,status,reservation_expires_at,payment_reconciliation_required,reservation_review_reason,reservation_next_verify_at').eq('event_id', eventId)
      .or('status.eq.pending,payment_reconciliation_required.eq.true').order('created_at', { ascending: false }).limit(50);
    setError(Boolean(error));
    if (!error) setLeases((data ?? []) as Lease[]);
  };
  useEffect(() => { void refresh(); }, [eventId]);
  return <section className="border-t border-border pt-4 text-sm text-foreground">
    <div className="flex items-center justify-between gap-2"><h4 className="font-semibold">Offene Reservierungen / Zahlungsabgleich</h4>
      <Button variant="ghost" size="icon" onClick={refresh} aria-label="Reservierungen aktualisieren" title="Reservierungen aktualisieren"><RefreshCw className="h-4 w-4" /></Button>
    </div>
    {error ? <p className="text-destructive">Reservierungen konnten nicht geladen werden.</p> : leases.length === 0 ? <p className="text-muted-foreground">Keine offenen Reservierungen.</p> : <ul className="space-y-2">
      {leases.map(lease => <li key={lease.id} className="flex flex-wrap justify-between gap-2 border-b border-border py-2">
        <span className="font-mono">{lease.id.slice(0,8).toUpperCase()}</span>
        <span>{lease.payment_reconciliation_required ? 'Bezahlt – manueller Ticketabgleich erforderlich' : lease.reservation_review_reason ? `Quarantäne – ${lease.reservation_review_reason === 'provider_pending' ? 'Zahlung läuft oder ist autorisiert' : 'Anbieterprüfung unklar'}; Plätze bleiben gesperrt${lease.reservation_next_verify_at ? `; nächste Prüfung: ${new Date(lease.reservation_next_verify_at).toLocaleString('de-DE')}` : ''}` : lease.reservation_expires_at ? `Frist: ${new Date(lease.reservation_expires_at).toLocaleString('de-DE')}${Date.parse(lease.reservation_expires_at) <= Date.now() ? ' – abgelaufen / Zahlungsprüfung' : ''}` : 'Zahlungsstatus entscheidet; keine feste Frist'}</span>
      </li>)}
    </ul>}
  </section>;
}