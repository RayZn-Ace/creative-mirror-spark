import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus, Trash2, Copy, ExternalLink, QrCode, ToggleLeft, ToggleRight,
  Link2, ScanLine, CalendarDays, Loader2,
} from "lucide-react";

type Tab = "links" | "scanner" | "bulk";

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
  city: string | null;
}

const ScannerAdmin = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("scanner");
  const [links, setLinks] = useState<ScannerLink[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);

  // For direct scanner
  const [scanEventId, setScanEventId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [linksRes, eventsRes] = await Promise.all([
      supabase.from("scanner_links").select("*").order("created_at", { ascending: false }),
      supabase.from("events").select("id, title, date, city").eq("status", "published").order("date", { ascending: true }),
    ]);
    if (linksRes.data) setLinks(linksRes.data as ScannerLink[]);
    if (eventsRes.data) setEvents(eventsRes.data);
    setLoading(false);
  };

  const createLink = async (eventId?: string, label?: string) => {
    const eid = eventId || selectedEvent;
    if (!eid) return;
    const { error } = await supabase.from("scanner_links").insert({
      event_id: eid,
      label: label || newLabel || null,
    });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      return false;
    }
    if (!eventId) {
      toast({ title: "Scanner-Link erstellt" });
      setNewLabel("");
    }
    loadData();
    return true;
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

  const createBulkLinks = async () => {
    setBulkLoading(true);
    const existingEventIds = new Set(links.map((l) => l.event_id));
    const missing = events.filter((e) => !existingEventIds.has(e.id));
    let created = 0;
    for (const ev of missing) {
      const ok = await createLink(ev.id, ev.title);
      if (ok) created++;
    }
    setBulkLoading(false);
    toast({ title: `${created} Scanner-Links erstellt`, description: `Für ${created} Events ohne bestehenden Link.` });
    loadData();
  };

  const openDirectScanner = () => {
    if (!scanEventId) return;
    // Find or create a link for this event, then open scanner
    const existing = links.find((l) => l.event_id === scanEventId && l.active);
    if (existing) {
      window.open(`/scan?token=${existing.token}`, "_blank");
    } else {
      toast({ title: "Kein aktiver Link", description: "Erstelle zuerst einen Scanner-Link für dieses Event.", variant: "destructive" });
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "links", label: "Links", icon: Link2 },
    { key: "scanner", label: "Direkt-Scanner", icon: ScanLine },
    { key: "bulk", label: "Alle Events", icon: CalendarDays },
  ];

  if (loading) return <div className="p-6 text-center text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Laden…</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: "hsl(0 0% 100%)" }}>
          <QrCode className="w-5 h-5" /> Scanner
        </h2>
        <p className="text-xs sm:text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
          Scanner-Links verwalten, direkt scannen oder Links für alle Events erstellen.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all"
            style={{
              background: tab === t.key ? "hsl(330 80% 55% / 0.15)" : "transparent",
              color: tab === t.key ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
            }}
          >
            <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split("-")[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab: Links */}
      {tab === "links" && (
        <div className="space-y-4">
          {/* Create new */}
          <div className="rounded-xl p-3 sm:p-4 space-y-3" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Neuen Link erstellen</h3>
            <div className="flex flex-col gap-2">
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)" }}
              >
                <option value="">Event auswählen…</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title} {e.date ? `(${e.date})` : ""}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Label (z.B. Eingang A)"
                  className="flex-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)" }}
                />
                <button
                  onClick={() => createLink()}
                  disabled={!selectedEvent}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: "hsl(330 80% 55%)", color: "hsl(0 0% 100%)" }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Erstellen</span>
                </button>
              </div>
            </div>
          </div>

          {/* Links list */}
          <div className="space-y-2">
            {links.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Noch keine Scanner-Links erstellt.</p>
            ) : (
              links.map((link) => (
                <div
                  key={link.id}
                  className="rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
                  style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${link.active ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>
                        {link.label || "Kein Label"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{getEventTitle(link.event_id)}</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                      {link.token.slice(0, 12)}…
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyLink(link.token)} className="p-2 rounded-lg transition-colors hover:bg-white/5" title="Link kopieren" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                      <Copy className="w-4 h-4" />
                    </button>
                    <a href={`/scan?token=${link.token}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-colors hover:bg-white/5" title="Öffnen" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => toggleLink(link.id, link.active)} className="p-2 rounded-lg transition-colors hover:bg-white/5" title={link.active ? "Deaktivieren" : "Aktivieren"}>
                      {link.active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.4)" }} />}
                    </button>
                    <button onClick={() => deleteLink(link.id)} className="p-2 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: "hsl(0 70% 55%)" }} title="Löschen">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Direct Scanner */}
      {tab === "scanner" && (
        <div className="space-y-4">
          <div className="rounded-xl p-4 sm:p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Direkt scannen (Admin/Scanner)
            </h3>
            <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Als Admin oder Scanner kannst du direkt einen aktiven Scanner-Link öffnen, ohne den Token manuell kopieren zu müssen.
            </p>
            <select
              value={scanEventId}
              onChange={(e) => setScanEventId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm mb-3"
              style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)" }}
            >
              <option value="">Event auswählen…</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title} {e.date ? `(${e.date})` : ""}</option>
              ))}
            </select>
            <button
              onClick={openDirectScanner}
              disabled={!scanEventId}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{ background: "hsl(200 80% 55%)", color: "hsl(0 0% 100%)" }}
            >
              <ScanLine className="w-5 h-5" />
              Scanner öffnen
            </button>
          </div>

          {/* Quick list of events with active links */}
          <div className="rounded-xl p-4 sm:p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Events mit aktiven Links
            </h3>
            <div className="space-y-1.5">
              {events.filter((e) => links.some((l) => l.event_id === e.id && l.active)).length === 0 ? (
                <p className="text-xs py-4 text-center" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Keine Events mit aktiven Scanner-Links.</p>
              ) : (
                events
                  .filter((e) => links.some((l) => l.event_id === e.id && l.active))
                  .map((e) => {
                    const link = links.find((l) => l.event_id === e.id && l.active)!;
                    return (
                      <button
                        key={e.id}
                        onClick={() => window.open(`/scan?token=${link.token}`, "_blank")}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all hover:bg-white/5"
                        style={{ border: "1px solid hsl(0 0% 100% / 0.06)" }}
                      >
                        <div>
                          <span className="text-sm font-medium" style={{ color: "hsl(0 0% 100%)" }}>{e.title}</span>
                          <span className="text-xs ml-2" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{e.date || ""}</span>
                        </div>
                        <ScanLine className="w-4 h-4 shrink-0" style={{ color: "hsl(200 80% 55%)" }} />
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Bulk create */}
      {tab === "bulk" && (
        <div className="space-y-4">
          <div className="rounded-xl p-4 sm:p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Links für alle Events
            </h3>
            <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Erstelle automatisch Scanner-Links für alle veröffentlichten Events, die noch keinen Link haben.
            </p>
            {(() => {
              const existingIds = new Set(links.map((l) => l.event_id));
              const missing = events.filter((e) => !existingIds.has(e.id));
              return (
                <>
                  <div className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    <span className="font-bold" style={{ color: "hsl(330 80% 55%)" }}>{missing.length}</span> Events ohne Scanner-Link · <span className="font-bold" style={{ color: "hsl(200 80% 55%)" }}>{events.length - missing.length}</span> bereits verlinkt
                  </div>
                  <button
                    onClick={createBulkLinks}
                    disabled={missing.length === 0 || bulkLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                    style={{ background: "hsl(270 60% 55%)", color: "hsl(0 0% 100%)" }}
                  >
                    {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {bulkLoading ? "Erstelle Links…" : `${missing.length} Links erstellen`}
                  </button>
                </>
              );
            })()}
          </div>

          {/* Event overview */}
          <div className="rounded-xl p-4 sm:p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              Übersicht
            </h3>
            <div className="space-y-1">
              {events.map((e) => {
                const hasLink = links.some((l) => l.event_id === e.id);
                return (
                  <div key={e.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: hasLink ? "hsl(120 40% 25% / 0.1)" : "hsl(0 40% 25% / 0.1)" }}>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-medium truncate block" style={{ color: "hsl(0 0% 100%)" }}>{e.title}</span>
                      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{e.city} · {e.date || "Kein Datum"}</span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${hasLink ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {hasLink ? "✓ Link" : "Kein Link"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerAdmin;