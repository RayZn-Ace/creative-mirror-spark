import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, Search, Send, Loader2, Plus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FreeTicketsAdmin = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Recent free tickets (orders with total_amount = 0)
  const { data: recentFreeTickets, refetch: refetchRecent } = useQuery({
    queryKey: ["free-tickets-recent"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, events(title, date)")
        .eq("total_amount", 0)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["admin-events-for-free-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, date, city")
        .order("date", { ascending: false });
      return data || [];
    },
  });

  const { data: ticketCategories } = useQuery({
    queryKey: ["ticket-categories", selectedEventId],
    enabled: !!selectedEventId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ticket_categories")
        .select("id, name, price")
        .eq("event_id", selectedEventId)
        .order("sort_order");
      return data || [];
    },
  });

  const filteredEvents = events?.filter(
    (e) =>
      e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      (e.city && e.city.toLowerCase().includes(eventSearch.toLowerCase()))
  );

  const selectedEvent = events?.find((e) => e.id === selectedEventId);

  const resetForm = () => {
    setSelectedEventId("");
    setSelectedCategoryId("");
    setCustomCategoryName("");
    setUseCustomCategory(false);
    setQuantity(1);
    setRecipientName("");
    setRecipientEmail("");
    setMessage("");
    setEventSearch("");
  };

  const handleSend = async () => {
    if (!selectedEventId || !recipientEmail || quantity < 1) {
      toast.error("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    setSending(true);
    try {
      const categoryLabel = useCustomCategory
        ? customCategoryName || "Freiticket"
        : ticketCategories?.find((c) => c.id === selectedCategoryId)?.name || "Freiticket";

      const recipients = [];
      for (let i = 0; i < quantity; i++) {
        recipients.push({ name: recipientName, email: recipientEmail });
      }

      const { data, error } = await supabase.functions.invoke("issue-free-tickets", {
        body: {
          event_id: selectedEventId,
          recipients,
          category_type: categoryLabel,
          message,
        },
      });

      if (error) throw error;

      const successCount = data?.results?.filter((r: any) => r.success).length || 0;
      toast.success(`${successCount} Freiticket(s) erfolgreich versendet!`);
      setDialogOpen(false);
      resetForm();
      refetchRecent();
    } catch (err: any) {
      toast.error(err.message || "Fehler beim Versenden");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "hsl(0 0% 100%)" }}
          >
            Freitickets versenden
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "hsl(0 0% 100% / 0.5)" }}
          >
            Erstelle und versende kostenlose Tickets an Gäste, Influencer oder Partner.
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2"
          style={{
            background: "hsl(270 70% 55%)",
            color: "hsl(0 0% 100%)",
          }}
        >
          <Gift className="w-4 h-4" />
          Freiticket versenden
        </Button>
      </div>

      {/* Recent free tickets */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "hsl(220 50% 6%)",
          borderColor: "hsl(0 0% 100% / 0.06)",
        }}
      >
        <div
          className="px-5 py-4 flex items-center gap-2"
          style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}
        >
          <Ticket className="w-4 h-4" style={{ color: "hsl(270 70% 55%)" }} />
          <span
            className="text-sm font-semibold"
            style={{ color: "hsl(0 0% 100%)" }}
          >
            Zuletzt versendete Freitickets
          </span>
        </div>
        {recentFreeTickets && recentFreeTickets.length > 0 ? (
          <div className="divide-y" style={{ borderColor: "hsl(0 0% 100% / 0.04)" }}>
            {recentFreeTickets.map((order: any) => (
              <div
                key={order.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "hsl(0 0% 100% / 0.9)" }}
                  >
                    {order.name || order.email}
                  </span>
                  <span
                    className="text-xs ml-3"
                    style={{ color: "hsl(0 0% 100% / 0.4)" }}
                  >
                    {order.events?.title}
                  </span>
                </div>
                <span
                  className="text-xs"
                  style={{ color: "hsl(0 0% 100% / 0.3)" }}
                >
                  {new Date(order.created_at).toLocaleDateString("de-DE")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-10 text-center">
            <Gift
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: "hsl(0 0% 100% / 0.15)" }}
            />
            <p
              className="text-sm"
              style={{ color: "hsl(0 0% 100% / 0.3)" }}
            >
              Noch keine Freitickets versendet.
            </p>
          </div>
        )}
      </div>

      {/* Send Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-lg"
          style={{
            background: "hsl(220 50% 8%)",
            borderColor: "hsl(0 0% 100% / 0.1)",
            color: "hsl(0 0% 100%)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "hsl(0 0% 100%)" }}>
              Freiticket versenden
            </DialogTitle>
            <DialogDescription style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Wähle ein Event, eine Kategorie und den Empfänger aus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Event Selection */}
            <div className="space-y-2">
              <Label style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                Event *
              </Label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "hsl(0 0% 100% / 0.3)" }}
                />
                <Input
                  placeholder="Event suchen…"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="pl-9"
                  style={{
                    background: "hsl(0 0% 100% / 0.05)",
                    borderColor: "hsl(0 0% 100% / 0.1)",
                    color: "hsl(0 0% 100%)",
                  }}
                />
              </div>
              {(eventSearch || !selectedEventId) && (
                <div
                  className="max-h-40 overflow-y-auto rounded-lg border"
                  style={{
                    borderColor: "hsl(0 0% 100% / 0.08)",
                    background: "hsl(220 50% 6%)",
                  }}
                >
                  {filteredEvents?.slice(0, 10).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => {
                        setSelectedEventId(event.id);
                        setSelectedCategoryId("");
                        setEventSearch("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-white/5 transition-colors flex justify-between"
                      style={{
                        color:
                          selectedEventId === event.id
                            ? "hsl(270 70% 55%)"
                            : "hsl(0 0% 100% / 0.8)",
                        background:
                          selectedEventId === event.id
                            ? "hsl(270 70% 55% / 0.1)"
                            : undefined,
                      }}
                    >
                      <span>{event.title}</span>
                      <span style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                        {event.date
                          ? new Date(event.date).toLocaleDateString("de-DE")
                          : ""}
                      </span>
                    </button>
                  ))}
                  {filteredEvents?.length === 0 && (
                    <p
                      className="px-3 py-2 text-sm"
                      style={{ color: "hsl(0 0% 100% / 0.3)" }}
                    >
                      Kein Event gefunden.
                    </p>
                  )}
                </div>
              )}
              {selectedEvent && !eventSearch && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "hsl(270 70% 55% / 0.1)",
                    color: "hsl(270 70% 55%)",
                  }}
                >
                  <Ticket className="w-3 h-3" />
                  {selectedEvent.title}
                  <button
                    onClick={() => setSelectedEventId("")}
                    className="ml-auto text-xs opacity-60 hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Ticket Category */}
            {selectedEventId && (
              <div className="space-y-2">
                <Label style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                  Ticket-Kategorie
                </Label>
                {!useCustomCategory ? (
                  <div className="flex gap-2">
                    <Select
                      value={selectedCategoryId}
                      onValueChange={setSelectedCategoryId}
                    >
                      <SelectTrigger
                        className="flex-1"
                        style={{
                          background: "hsl(0 0% 100% / 0.05)",
                          borderColor: "hsl(0 0% 100% / 0.1)",
                          color: "hsl(0 0% 100%)",
                        }}
                      >
                        <SelectValue placeholder="Kategorie wählen…" />
                      </SelectTrigger>
                      <SelectContent
                        style={{
                          background: "hsl(220 50% 10%)",
                          borderColor: "hsl(0 0% 100% / 0.1)",
                        }}
                      >
                        {ticketCategories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} ({cat.price.toFixed(2)} €)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setUseCustomCategory(true)}
                      title="Eigene Kategorie"
                      style={{
                        borderColor: "hsl(0 0% 100% / 0.1)",
                        color: "hsl(0 0% 100% / 0.6)",
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="z.B. VIP Freiticket"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="flex-1"
                      style={{
                        background: "hsl(0 0% 100% / 0.05)",
                        borderColor: "hsl(0 0% 100% / 0.1)",
                        color: "hsl(0 0% 100%)",
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUseCustomCategory(false);
                        setCustomCategoryName("");
                      }}
                      style={{
                        borderColor: "hsl(0 0% 100% / 0.1)",
                        color: "hsl(0 0% 100% / 0.6)",
                      }}
                    >
                      Liste
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <Label style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                Anzahl *
              </Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                style={{
                  background: "hsl(0 0% 100% / 0.05)",
                  borderColor: "hsl(0 0% 100% / 0.1)",
                  color: "hsl(0 0% 100%)",
                  maxWidth: "120px",
                }}
              />
            </div>

            {/* Recipient */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                  Empfänger Name
                </Label>
                <Input
                  placeholder="Max Mustermann"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  style={{
                    background: "hsl(0 0% 100% / 0.05)",
                    borderColor: "hsl(0 0% 100% / 0.1)",
                    color: "hsl(0 0% 100%)",
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                  E-Mail *
                </Label>
                <Input
                  type="email"
                  placeholder="email@beispiel.de"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  style={{
                    background: "hsl(0 0% 100% / 0.05)",
                    borderColor: "hsl(0 0% 100% / 0.1)",
                    color: "hsl(0 0% 100%)",
                  }}
                />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                Nachricht (optional)
              </Label>
              <Textarea
                placeholder="Persönliche Nachricht an den Empfänger…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                style={{
                  background: "hsl(0 0% 100% / 0.05)",
                  borderColor: "hsl(0 0% 100% / 0.1)",
                  color: "hsl(0 0% 100%)",
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
              style={{
                borderColor: "hsl(0 0% 100% / 0.1)",
                color: "hsl(0 0% 100% / 0.6)",
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !selectedEventId || !recipientEmail}
              className="gap-2"
              style={{
                background: "hsl(270 70% 55%)",
                color: "hsl(0 0% 100%)",
              }}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Wird versendet…" : `${quantity} Ticket(s) versenden`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FreeTicketsAdmin;
