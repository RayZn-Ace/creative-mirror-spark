import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X, Send } from "lucide-react";

interface Lounge {
  id: string;
  name: string;
  price: number;
  min_persons: number;
  max_persons: number;
}

interface Props {
  lounge: Lounge;
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const LoungeBookingForm = ({ lounge, eventId, onClose, onSuccess }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(lounge.min_persons);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSubmitting(true);
    const { error } = await supabase.from("lounge_bookings").insert({
      lounge_id: lounge.id,
      event_id: eventId,
      customer_name: name,
      customer_email: email,
      customer_phone: phone || null,
      party_size: partySize,
      message: message || null,
    });
    if (error) {
      setSubmitting(false);
      toast.error("Fehler beim Senden der Anfrage");
      return;
    }
    // Auto-set lounge to reserved
    await supabase.from("lounges").update({ status: "reserved" }).eq("id", lounge.id);
    setSubmitting(false);
    toast.success("Lounge-Anfrage gesendet! Du erhältst eine Bestätigung per E-Mail.");
    onSuccess();
  };

  const inputStyle = {
    background: "hsl(0 0% 100% / 0.06)",
    border: "1px solid hsl(0 0% 100% / 0.1)",
    color: "hsl(0 0% 100%)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "hsl(0 0% 0% / 0.7)" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: "hsl(220 40% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>{lounge.name} anfragen</h3>
            {lounge.price > 0 && (
              <p className="text-sm mt-0.5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                ab {lounge.price} € · {lounge.min_persons}–{lounge.max_persons} Personen
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
            <X className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.5)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required placeholder="Name *" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle}
          />
          <input
            required type="email" placeholder="E-Mail *" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle}
          />
          <input
            type="tel" placeholder="Telefon (optional)" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle}
          />
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Anzahl Personen
            </label>
            <input
              type="number" min={lounge.min_persons} max={lounge.max_persons}
              value={partySize} onChange={e => setPartySize(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl text-sm" style={inputStyle}
            />
          </div>
          <textarea
            placeholder="Nachricht (optional)" value={message} onChange={e => setMessage(e.target.value)}
            rows={3} className="w-full px-3 py-2.5 rounded-xl text-sm resize-none" style={inputStyle}
          />
          <button
            type="submit" disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
            style={{ background: "hsl(270 70% 55%)", color: "white" }}
          >
            <Send className="w-4 h-4" />
            {submitting ? "Wird gesendet..." : "Anfrage senden"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoungeBookingForm;
