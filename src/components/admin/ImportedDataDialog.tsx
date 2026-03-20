import { useState, useEffect } from "react";
import { X, Download, Mail, Search, FileSpreadsheet } from "lucide-react";
import { motion } from "framer-motion";

interface ImportedRow {
  checkoutId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ticketType: string;
  pricePerTicket: string;
  quantity: number;
  subtotal: string;
  fees: string;
  total: string;
}

const parseCSV = (csv: string): ImportedRow[] => {
  const lines = csv.trim().split("\n");
  return lines.slice(1).map((line) => {
    const cols = line.split(";").map((c) => c.trim());
    return {
      checkoutId: cols[0],
      firstName: cols[1],
      lastName: cols[2],
      email: cols[3],
      phone: cols[4],
      ticketType: cols[5],
      pricePerTicket: cols[6],
      quantity: parseInt(cols[7]) || 0,
      subtotal: cols[8],
      fees: cols[9],
      total: cols[10],
    };
  });
};

interface Props {
  onClose: () => void;
}

const ImportedDataDialog = ({ onClose }: Props) => {
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/src/data/xxl-nightlife-import.csv")
      .then((r) => r.text())
      .then((text) => {
        setRows(parseCSV(text));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.firstName.toLowerCase().includes(q) ||
      r.lastName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      r.checkoutId.includes(q)
    );
  });

  const totalTickets = rows.reduce((s, r) => s + r.quantity, 0);

  const handleExportCSV = () => {
    const header = "Checkout-Id;Vorname;Nachname;E-Mail;Telefonnummer;Ticketart;Anzahl;Ticketsumme\n";
    const body = filtered
      .map((r) => `${r.checkoutId};${r.firstName};${r.lastName};${r.email};${r.phone};${r.ticketType};${r.quantity};${r.total}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "xxl-schuelerparty-import-daten.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "hsl(0 0% 0% / 0.7)", backdropFilter: "blur(8px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-5xl max-h-[85vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ background: "hsl(230 25% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5" style={{ color: "hsl(45 80% 55%)" }} />
            <div>
              <h2 className="text-base font-bold" style={{ color: "hsl(0 0% 100%)" }}>
                Importierte Daten (Alt-Shop)
              </h2>
              <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                {rows.length} Bestellungen · {totalTickets} Tickets
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Name, E-Mail, Telefon..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
            style={{ background: "hsl(142 70% 45% / 0.15)", color: "hsl(142 70% 55%)", border: "1px solid hsl(142 70% 45% / 0.3)" }}
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-6 py-3">
          {loading ? (
            <p className="text-sm py-8 text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
                  {["#", "Name", "E-Mail", "Telefon", "Ticketart", "Anz.", "Summe"].map((h) => (
                    <th key={h} className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.checkoutId + i}
                    className="transition-colors hover:bg-white/[0.03]"
                    style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.04)" }}
                  >
                    <td className="py-2.5 px-2 font-mono text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{r.checkoutId}</td>
                    <td className="py-2.5 px-2 font-medium" style={{ color: "hsl(0 0% 100%)" }}>
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="py-2.5 px-2" style={{ color: "hsl(200 80% 60%)" }}>
                      <a href={`mailto:${r.email}`} className="hover:underline">{r.email}</a>
                    </td>
                    <td className="py-2.5 px-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{r.phone}</td>
                    <td className="py-2.5 px-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{
                        background: r.ticketType.includes("EARLY") ? "hsl(142 70% 45% / 0.15)" : "hsl(200 80% 55% / 0.12)",
                        color: r.ticketType.includes("EARLY") ? "hsl(142 70% 55%)" : "hsl(200 80% 60%)",
                      }}>
                        {r.ticketType}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{r.quantity}</td>
                    <td className="py-2.5 px-2 font-bold text-right" style={{ color: "hsl(142 70% 55%)" }}>{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.08)" }}>
          <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
            {filtered.length} von {rows.length} Einträgen
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImportedDataDialog;
