import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Copy, ExternalLink, QrCode, ToggleLeft, ToggleRight } from "lucide-react";

interface ScannerLink {
  id: string;
  event_id: string;
  token: string;
  label: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  date: string | null;
}

const ScannerAdmin = () => {
  const { toast } = useToast();
  const [links, setLinks] = useState<ScannerLink[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [linksRes, eventsRes] = await Promise.all([
      supabase.from("scanner_links").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("id, title, date").eq("status", "published").order("date", { ascending: false }),
    ]);
    if (linksRes.data) setLinks(linksRes.data as ScannerLink[]);
    if (eventsRes.data) setEvents(eventsRes.data);
    setLoading(false);
  };

  const createLink = async () => {
    if (!selectedEvent) return;
    const { error } = await supabase.from("scanner_links").insert({
      event_id: selectedEvent,
      label: newLabel || null,
    });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Scanner-Link erstellt" });
      setNewLabel("");
      loadData();
    }
  };

  const toggleLink = async (id: string, active: boolean) => {
    await supabase.from("scanner_links").update({ active: !active }).eq("id", id);
    loadData();
  };

  const deleteLink = async (id: string) => {
    await supabase.from("scanner_links").delete().eq("id", id);
    loadData();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/scan?token=${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link kopiert!" });
  };

  const getEventTitle = (eventId: string) => events.find((e) => e.id === eventId)?.title || "Unbekannt";

  if (loading) return <div className="p-6 text-center text-sm text-muted-foreground">Laden…</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><QrCode className="w-5 h-5" /> Scanner-Links</h2>
        <p className="text-sm text-muted-foreground mt-1">Erstelle einmalige Links für Türsteher zum Ticket-Scannen.</p>
      </div>

      {/* Create new */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider">Neuen Link erstellen</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="">Event auswählen…</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title} {e.date ? `(${e.date})` : ""}</option>
            ))}
          </select>
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (z.B. Eingang A)"
            className="px-3 py-2 bg-background border border-border rounded-lg text-sm"
          />
          <button
            onClick={createLink}
            disabled={!selectedEvent}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> Erstellen
          </button>
        </div>
      </div>

      {/* Links list */}
      <div className="space-y-2">
        {links.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Noch keine Scanner-Links erstellt.</p>
        ) : (
          links.map((link) => (
            <div key={link.id} className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${link.active ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-sm font-bold truncate">{link.label || "Kein Label"}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{getEventTitle(link.event_id)}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Token: {link.token.slice(0, 12)}…</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => copyLink(link.token)} className="p-2 hover:bg-accent rounded-lg transition-colors" title="Link kopieren">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={`/scan?token=${link.token}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-accent rounded-lg transition-colors" title="Öffnen">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => toggleLink(link.id, link.active)} className="p-2 hover:bg-accent rounded-lg transition-colors" title={link.active ? "Deaktivieren" : "Aktivieren"}>
                  {link.active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button onClick={() => deleteLink(link.id)} className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-destructive" title="Löschen">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScannerAdmin;
