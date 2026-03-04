import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Plus, Trash2, Send, Loader2, CheckCircle2, Users, Ticket } from "lucide-react";

interface Recipient {
  id: string;
  name: string;
  email: string;
}

interface Event {
  id: string;
  title: string;
  date: string | null;
}

const FreeTicketsAdmin = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [categoryType, setCategoryType] = useState<"freiticket" | "fan_freiticket">("freiticket");
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: crypto.randomUUID(), name: "", email: "" },
  ]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Array<{ email: string; success: boolean; qr_code?: string; error?: string }> | null>(null);

  // Load issued free tickets stats
  const [stats, setStats] = useState<{ total: number; events: Record<string, number> }>({ total: 0, events: {} });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, date")
        .eq("status", "published")
        .order("date", { ascending: false });
      if (data) setEvents(data);
    })();
  }, []);

  const addRecipient = () => {
    setRecipients([...recipients, { id: crypto.randomUUID(), name: "", email: "" }]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((r) => r.id !== id));
  };

  const updateRecipient = (id: string, field: "name" | "email", value: string) => {
    setRecipients(recipients.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async () => {
    if (!selectedEvent) {
      toast({ title: "Bitte Event auswählen", variant: "destructive" });
      return;
    }

    const validRecipients = recipients.filter((r) => r.email.trim());
    if (validRecipients.length === 0) {
      toast({ title: "Mindestens eine E-Mail-Adresse angeben", variant: "destructive" });
      return;
    }

    setSending(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke("issue-free-tickets", {
        body: {
          event_id: selectedEvent,
          category_type: categoryType,
          recipients: validRecipients.map((r) => ({ name: r.name, email: r.email })),
        },
      });

      if (error) throw error;

      setResults(data.results);
      const successCount = data.results.filter((r: any) => r.success).length;
      toast({
        title: `${successCount} Freiticket${successCount !== 1 ? "s" : ""} erstellt`,
        description: `E-Mails werden versendet.`,
      });
    } catch (err) {
      toast({ title: "Fehler", description: String(err), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setRecipients([{ id: crypto.randomUUID(), name: "", email: "" }]);
    setResults(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Gift className="w-5 h-5" /> Freitickets
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Erstelle Freitickets für Gäste – sie erhalten eine E-Mail mit QR-Code & PDF.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {results ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Ergebnis
              </h3>
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className={`w-2 h-2 rounded-full ${r.success ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm flex-1">{r.email}</span>
                  {r.success ? (
                    <span className="text-xs font-mono text-muted-foreground">{r.qr_code}</span>
                  ) : (
                    <span className="text-xs text-destructive">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90"
            >
              Weitere Freitickets erstellen
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Event + Category */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider">Event & Kategorie</h3>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="">Event auswählen…</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} {e.date ? `(${e.date})` : ""}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => setCategoryType("freiticket")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                    categoryType === "freiticket"
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "bg-transparent text-muted-foreground border-border"
                  }`}
                >
                  <Ticket className="w-4 h-4" /> Freiticket
                </button>
                <button
                  onClick={() => setCategoryType("fan_freiticket")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                    categoryType === "fan_freiticket"
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "bg-transparent text-muted-foreground border-border"
                  }`}
                >
                  <Users className="w-4 h-4" /> Fan Freiticket
                </button>
              </div>
            </div>

            {/* Recipients */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider">Empfänger</h3>
                <button
                  onClick={addRecipient}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-accent/50 hover:bg-accent rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> Hinzufügen
                </button>
              </div>

              <div className="space-y-2">
                {recipients.map((r, i) => (
                  <div key={r.id} className="flex gap-2 items-start">
                    <div className="flex-1 flex gap-2">
                      <input
                        value={r.name}
                        onChange={(e) => updateRecipient(r.id, "name", e.target.value)}
                        placeholder="Name (optional)"
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                      <input
                        value={r.email}
                        onChange={(e) => updateRecipient(r.id, "email", e.target.value)}
                        placeholder="E-Mail *"
                        type="email"
                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeRecipient(r.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      disabled={recipients.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={sending || !selectedEvent}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-primary/90 disabled:opacity-40 transition-all"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Erstelle Tickets…</>
              ) : (
                <><Send className="w-4 h-4" /> {recipients.filter((r) => r.email.trim()).length} Freiticket{recipients.filter((r) => r.email.trim()).length !== 1 ? "s" : ""} erstellen & senden</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FreeTicketsAdmin;
