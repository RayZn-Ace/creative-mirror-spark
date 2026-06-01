import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  ticketId: string;
  eventTitle?: string;
  onSuccess?: () => void;
}

export default function TicketTransferDialog({ ticketId, eventTitle, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm(`Ticket wirklich an ${email} übertragen? Du verlierst danach den Zugriff.`)) return;
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("transfer-ticket", {
      body: { ticket_id: ticketId, to_email: email, to_name: name, message },
    });
    setLoading(false);
    if (error || !(data as any)?.ok) {
      toast.error((data as any)?.error || error?.message || "Transfer fehlgeschlagen");
      return;
    }
    toast.success(`Ticket übertragen an ${email} 🎉`);
    setOpen(false);
    setEmail("");
    setName("");
    setMessage("");
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Send className="h-4 w-4 mr-2" /> An Freund senden
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ticket übertragen</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {eventTitle && (
            <div className="text-sm text-muted-foreground">
              Event: <span className="font-semibold text-foreground">{eventTitle}</span>
            </div>
          )}
          <div>
            <Label htmlFor="tt-email">E-Mail des Empfängers *</Label>
            <Input id="tt-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="freund@example.com" />
          </div>
          <div>
            <Label htmlFor="tt-name">Name (optional)</Label>
            <Input id="tt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Max Mustermann" />
          </div>
          <div>
            <Label htmlFor="tt-msg">Nachricht (optional)</Label>
            <Textarea id="tt-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Viel Spaß! 🎉" rows={2} />
          </div>
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
            ⚠️ Transfer ist <strong>endgültig</strong>. Der QR-Code bleibt gültig, geht aber an die neue Person.
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit" disabled={loading}>{loading ? "Sende..." : "Jetzt übertragen"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
