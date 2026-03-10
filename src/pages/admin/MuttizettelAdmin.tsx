import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Search, Trash2, RefreshCw, Radio, CalendarClock, History } from "lucide-react";
import { toast } from "sonner";

interface MuttizettelEntry {
  id: string;
  created_at: string;
  minor_name: string;
  minor_birthday: string;
  parent_name: string;
  parent_phone: string;
  email: string;
  event_title: string;
  event_date: string | null;
  supervisor_name: string | null;
  has_signature: boolean;
  has_supervisor_signature: boolean;
}

type TabKey = "live" | "upcoming" | "past";

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "live", label: "Live Events", icon: <Radio className="w-4 h-4" /> },
  { key: "upcoming", label: "Zukünftige Events", icon: <CalendarClock className="w-4 h-4" /> },
  { key: "past", label: "Vergangene Events", icon: <History className="w-4 h-4" /> },
];

const MuttizettelAdmin = () => {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<MuttizettelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("live");

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("u18_forms")
      .select("id, created_at, minor_name, minor_birthday, parent_name, parent_phone, email, event_title, event_date, supervisor_name, has_signature, has_supervisor_signature")
      .order("created_at", { ascending: false });
    if (data) setEntries(data);
    if (error) console.error("Muttizettel fetch error:", error);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const deleteEntry = async (id: string) => {
    if (!confirm("Clubzettel wirklich löschen?")) return;
    const { error } = await supabase.from("u18_forms").delete().eq("id", id);
    if (error) { toast.error("Fehler beim Löschen"); return; }
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Gelöscht");
  };

  const categorized = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const live: MuttizettelEntry[] = [];
    const upcoming: MuttizettelEntry[] = [];
    const past: MuttizettelEntry[] = [];

    for (const entry of entries) {
      if (!entry.event_date) {
        // No event date → treat as past
        past.push(entry);
        continue;
      }
      const eventDateStr = entry.event_date.split("T")[0];
      if (eventDateStr === todayStr) {
        live.push(entry);
      } else if (eventDateStr > todayStr) {
        upcoming.push(entry);
      } else {
        past.push(entry);
      }
    }

    return { live, upcoming, past };
  }, [entries]);

  const filtered = useMemo(() => {
    const list = categorized[activeTab];
    const q = search.toLowerCase();
    if (!q) return list;
    return list.filter((e) =>
      e.minor_name?.toLowerCase().includes(q) ||
      e.parent_name?.toLowerCase().includes(q) ||
      e.event_title?.toLowerCase().includes(q)
    );
  }, [categorized, activeTab, search]);

  const tabCounts = useMemo(() => ({
    live: categorized.live.length,
    upcoming: categorized.upcoming.length,
    past: categorized.past.length,
  }), [categorized]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "hsl(0 0% 100%)" }}>
            <FileText className="w-6 h-6" style={{ color: "hsl(270 70% 55%)" }} />
            Muttizettel / Clubzettel
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            {entries.length} eingereichte Clubzettel
          </p>
        </div>
        <button onClick={fetchEntries} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "hsl(220 30% 12%)", border: "1px solid hsl(220 20% 22%)", color: "hsl(0 0% 100% / 0.7)" }}>
          <RefreshCw className="w-4 h-4" /> Aktualisieren
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
               background: activeTab === tab.key ? "hsl(270 70% 55% / 0.15)" : "hsl(220 30% 12%)",
              border: `1px solid ${activeTab === tab.key ? "hsl(270 70% 55% / 0.4)" : "hsl(220 20% 22%)"}`,
              color: activeTab === tab.key ? "hsl(270 70% 65%)" : "hsl(0 0% 100% / 0.5)",
            }}
          >
            {tab.icon}
            {tab.label}
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs" style={{
              background: activeTab === tab.key ? "hsl(230 80% 56% / 0.2)" : "hsl(220 20% 18%)",
              color: activeTab === tab.key ? "hsl(230 80% 70%)" : "hsl(0 0% 100% / 0.4)",
            }}>
              {tabCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
        <input type="text" placeholder="Name oder Event suchen..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm" style={{ background: "hsl(220 30% 12%)", border: "1px solid hsl(220 20% 22%)", color: "hsl(0 0% 100%)" }} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "hsl(220 30% 10%)", border: "1px solid hsl(220 20% 18%)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(220 20% 18%)" }}>
                {["Datum", "Kind", "Geb.", "Elternteil", "Telefon", "Event", "Event-Datum", "Aufsichtsperson", "Unterschriften", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-16 text-sm" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Laden...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-sm" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Keine Clubzettel gefunden.</td></tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid hsl(220 20% 15%)" }} className="hover:bg-[hsl(220_30%_12%)] transition-colors">
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{new Date(entry.created_at).toLocaleDateString("de-DE")}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "hsl(0 0% 100%)" }}>{entry.minor_name}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{new Date(entry.minor_birthday).toLocaleDateString("de-DE")}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.parent_name}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.parent_phone}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.event_title || "–"}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                      {entry.event_date ? new Date(entry.event_date).toLocaleDateString("de-DE") : "–"}
                    </td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.supervisor_name || "–"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                          background: entry.has_signature ? "hsl(142 60% 50% / 0.15)" : "hsl(45 90% 50% / 0.15)",
                          color: entry.has_signature ? "hsl(142 50% 40%)" : "hsl(45 80% 45%)"
                        }}>
                          {entry.has_signature ? "✓ Eltern" : "○ Eltern"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                          background: entry.has_supervisor_signature ? "hsl(142 60% 50% / 0.15)" : "hsl(45 90% 50% / 0.15)",
                          color: entry.has_supervisor_signature ? "hsl(142 50% 40%)" : "hsl(45 80% 45%)"
                        }}>
                          {entry.has_supervisor_signature ? "✓ Aufsicht" : "○ Aufsicht"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded-lg hover:bg-[hsl(0_70%_50%/0.15)] transition-colors" title="Löschen">
                        <Trash2 className="w-4 h-4" style={{ color: "hsl(0 70% 50%)" }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MuttizettelAdmin;
