import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Search, Trash2, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface MuttizettelEntry {
  id: string;
  created_at: string;
  child_name: string;
  child_birthdate: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string | null;
  event_name: string | null;
  companion_name: string | null;
  status: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "hsl(45 90% 50% / 0.15)", text: "hsl(45 80% 45%)" },
  approved: { bg: "hsl(142 60% 50% / 0.15)", text: "hsl(142 50% 40%)" },
  rejected: { bg: "hsl(0 70% 50% / 0.15)", text: "hsl(0 60% 50%)" },
};

const MuttizettelAdmin = () => {
  const [search, setSearch] = useState("");
  const [entries, setEntries] = useState<MuttizettelEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("muttizettel_submissions")
      .select("id, created_at, child_name, child_birthdate, parent_name, parent_phone, parent_email, event_name, companion_name, status")
      .order("created_at", { ascending: false }) as any;
    if (data) setEntries(data);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchEntries(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("muttizettel_submissions").update({ status } as any).eq("id", id) as any;
    if (error) { toast.error("Fehler"); return; }
    toast.success(`Status auf „${status}" gesetzt`);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Muttizettel wirklich löschen?")) return;
    await supabase.from("muttizettel_submissions").delete().eq("id", id) as any;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Gelöscht");
  };

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase();
    return !q || e.child_name?.toLowerCase().includes(q) || e.parent_name?.toLowerCase().includes(q) || e.event_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "hsl(0 0% 100%)" }}>
            <FileText className="w-6 h-6" style={{ color: "hsl(230 80% 56%)" }} />
            Muttizettel
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            {entries.length} eingereichte Muttizettel
          </p>
        </div>
        <button onClick={fetchEntries} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "hsl(220 30% 12%)", border: "1px solid hsl(220 20% 22%)", color: "hsl(0 0% 100% / 0.7)" }}>
          <RefreshCw className="w-4 h-4" /> Aktualisieren
        </button>
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
                {["Datum", "Kind", "Geb.", "Elternteil", "Telefon", "Event", "Begleitperson", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-16 text-sm" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Laden...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-sm" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Keine Muttizettel gefunden.</td></tr>
              ) : (
                filtered.map((entry) => {
                  const sc = statusColors[entry.status] || statusColors.pending;
                  return (
                    <tr key={entry.id} style={{ borderBottom: "1px solid hsl(220 20% 15%)" }} className="hover:bg-[hsl(220_30%_12%)] transition-colors">
                      <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{new Date(entry.created_at).toLocaleDateString("de-DE")}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "hsl(0 0% 100%)" }}>{entry.child_name}</td>
                      <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.child_birthdate ? new Date(entry.child_birthdate).toLocaleDateString("de-DE") : "–"}</td>
                      <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.parent_name}</td>
                      <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.parent_phone}</td>
                      <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.event_name || "–"}</td>
                      <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.companion_name || "–"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={entry.status}
                          onChange={(e) => updateStatus(entry.id, e.target.value)}
                          className="px-2 py-0.5 rounded-full text-xs font-medium border-0 cursor-pointer"
                          style={{ background: sc.bg, color: sc.text }}
                        >
                          <option value="pending">Ausstehend</option>
                          <option value="approved">Genehmigt</option>
                          <option value="rejected">Abgelehnt</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded-lg hover:bg-[hsl(0_70%_50%/0.15)] transition-colors" title="Löschen">
                          <Trash2 className="w-4 h-4" style={{ color: "hsl(0 70% 50%)" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MuttizettelAdmin;
