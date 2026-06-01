import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, QrCode } from "lucide-react";
import TicketTransferDialog from "@/components/account/TicketTransferDialog";

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("email", user.email)
        .eq("status", "paid");
      const orderIds = (orders || []).map((o) => o.id);
      if (!orderIds.length) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("tickets")
        .select("*, events(title, date, time, city, location_name, image_url), ticket_categories(name)")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false });
      setTickets(data || []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div>Lade...</div>;

  const upcoming = tickets.filter((t) => t.events?.date && new Date(t.events.date) >= new Date(new Date().setHours(0, 0, 0, 0)));
  const past = tickets.filter((t) => !t.events?.date || new Date(t.events.date) < new Date(new Date().setHours(0, 0, 0, 0)));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Meine Tickets</h1>

      {tickets.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          Keine Tickets. <Link to="/" className="text-primary">Jetzt Event finden →</Link>
        </Card>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 text-muted-foreground uppercase text-xs tracking-wider">Kommende Events</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {upcoming.map((t) => <TicketCard key={t.id} ticket={t} onTransferred={() => location.reload()} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="font-semibold mb-3 text-muted-foreground uppercase text-xs tracking-wider">Vergangen</h2>
          <div className="grid md:grid-cols-2 gap-4 opacity-60">
            {past.map((t) => <TicketCard key={t.id} ticket={t} past />)}
          </div>
        </section>
      )}
    </div>
  );
}

function TicketCard({ ticket, past, onTransferred }: any) {
  const ev = ticket.events;
  const canTransfer = !past && ticket.status === "valid";
  return (
    <Card className="overflow-hidden group hover:border-primary transition-colors">
      <div className="aspect-video relative bg-muted overflow-hidden">
        {ev?.image_url && <img src={ev.image_url} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <Badge className="absolute top-3 right-3" variant={ticket.status === "checked_in" ? "secondary" : "default"}>
          {ticket.status === "checked_in" ? "Eingecheckt" : past ? "Abgelaufen" : "Gültig"}
        </Badge>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="text-xs opacity-80">{ticket.ticket_categories?.name}</div>
          <div className="font-bold text-lg leading-tight">{ev?.title}</div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {ev?.date && new Date(ev.date).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}
          {ev?.time && ` · ${ev.time}`}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {ev?.location_name || ev?.city}
        </div>
        {ticket.holder_email && (
          <div className="text-xs text-muted-foreground">
            Inhaber: <span className="font-medium text-foreground">{ticket.holder_name || ticket.holder_email}</span>
          </div>
        )}
        <Button asChild className="w-full mt-3" variant={past ? "outline" : "default"}>
          <Link to={`/bestellung/${ticket.order_id}`}>
            <QrCode className="h-4 w-4 mr-2" /> QR-Code anzeigen
          </Link>
        </Button>
        {canTransfer && (
          <TicketTransferDialog ticketId={ticket.id} eventTitle={ev?.title} onSuccess={onTransferred} />
        )}
      </div>
    </Card>
  );
}
