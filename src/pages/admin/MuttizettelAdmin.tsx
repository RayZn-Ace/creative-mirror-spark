import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Search, Eye, Trash2, Download } from "lucide-react";

interface MuttizettelEntry {
  id: string;
  created_at: string;
  child_name: string;
  child_birthdate: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  event_name: string;
  status: string;
}

const MuttizettelAdmin = () => {
  const [search, setSearch] = useState("");

  // Placeholder – currently no DB table for Muttizettel submissions
  const entries: MuttizettelEntry[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "hsl(0 0% 100%)" }}>
            <FileText className="w-6 h-6" style={{ color: "hsl(330 80% 55%)" }} />
            Muttizettel
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Eingereichte Muttizettel verwalten
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
        <input
          type="text"
          placeholder="Name oder Event suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm"
          style={{
            background: "hsl(220 30% 12%)",
            border: "1px solid hsl(220 20% 22%)",
            color: "hsl(0 0% 100%)",
          }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "hsl(220 30% 10%)", border: "1px solid hsl(220 20% 18%)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid hsl(220 20% 18%)" }}>
                {["Datum", "Kind", "Geburtsdatum", "Erziehungsberechtigte/r", "Telefon", "E-Mail", "Event", "Status"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-sm" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                    Noch keine Muttizettel eingereicht.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: "1px solid hsl(220 20% 15%)" }}>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{new Date(entry.created_at).toLocaleDateString("de-DE")}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "hsl(0 0% 100%)" }}>{entry.child_name}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.child_birthdate}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.parent_name}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.parent_phone}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.parent_email}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{entry.event_name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "hsl(220 60% 50% / 0.15)", color: "hsl(220 60% 60%)" }}>
                        {entry.status}
                      </span>
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
