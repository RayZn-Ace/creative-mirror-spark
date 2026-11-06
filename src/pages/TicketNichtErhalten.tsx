import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Loader2, Send, ArrowLeft } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ticketSupportSchema } from "@/lib/ticketSupport";

export default function TicketNichtErhalten() {
  const [form, setForm] = useState({ orderNumber: "", firstName: "", lastName: "", email: "", website: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError("");
    const parsed = ticketSupportSchema.safeParse(form);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Bitte prüfe deine Angaben."); return; }
    setLoading(true);
    try {
      const { data, error: sendError } = await supabase.functions.invoke("ticket-not-received", { body: parsed.data });
      if (sendError || data?.ok !== true) {
        let message = "Deine Anfrage wurde nicht bestätigt. Bitte versuche es erneut.";
        if (sendError?.context instanceof Response) {
          const response = await sendError.context.json().catch(() => null);
          if (typeof response?.error === "string") message = response.error;
        }
        throw new Error(message);
      }
      setSuccess(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Bitte versuche es erneut."); }
    finally { setLoading(false); }
  }
  return <PageLayout title="Ticket nicht erhalten?">
    <Button asChild variant="ghost" className="px-0"><Link to="/faq"><ArrowLeft className="mr-2 h-4 w-4" />Zurück zum Support</Link></Button>
    {success ? <div role="status" className="py-8 space-y-4">
      <CheckCircle className="h-10 w-10 text-primary" />
      <h2 className="font-display text-2xl text-foreground">Anfrage erhalten</h2>
      <p>Deine Anfrage ist bei unserem Supportteam eingegangen. Wir prüfen deine Bestellung und melden uns unter deiner angegebenen E-Mail-Adresse. Ein erneuter Ticketversand erfolgt nach manueller Prüfung.</p>
    </div> : <>
      <p>Deine Tickets fehlen auch im Spam-Ordner? Teile uns deine Bestelldaten mit. Unser Team prüft die Bestellung und hilft dir weiter.</p>
      <form onSubmit={submit} className="max-w-xl space-y-5">
        <div className="space-y-2"><Label htmlFor="orderNumber">Bestellnummer *</Label><Input id="orderNumber" required maxLength={100} value={form.orderNumber} onChange={e => setForm({ ...form, orderNumber: e.target.value })} className="text-base" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="firstName">Vorname *</Label><Input id="firstName" autoComplete="given-name" required maxLength={100} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="text-base" /></div>
          <div className="space-y-2"><Label htmlFor="lastName">Nachname *</Label><Input id="lastName" autoComplete="family-name" required maxLength={100} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="text-base" /></div>
        </div>
        <div className="space-y-2"><Label htmlFor="email">E-Mail-Adresse *</Label><Input id="email" type="email" autoComplete="email" required maxLength={255} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="text-base" /></div>
        <div className="hidden" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
        <p className="text-xs">Wir verwenden deine Angaben zur Bearbeitung deiner Anfrage. <Link className="text-primary underline" to="/datenschutz">Datenschutz</Link></p>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}{loading ? "Wird gesendet…" : "Anfrage senden"}</Button>
      </form>
    </>}
  </PageLayout>;
}