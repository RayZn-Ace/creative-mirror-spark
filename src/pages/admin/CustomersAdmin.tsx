import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, ChevronDown, ChevronUp, Mail, Phone, Calendar, ShoppingCart,
  TrendingUp, User, CreditCard, X, ArrowUpDown, Eye, MapPin,
  Download, Upload, FileSpreadsheet, Ticket, UserCheck, Filter, Check, Send, Loader2,
} from "lucide-react";
import { toast } from "sonner";

type Order = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  birth_date: string | null;
  status: string;
  total_amount: number;
  service_fee: number;
  currency: string;
  items: unknown;
  event_id: string | null;
  created_at: string;
  paid_at: string | null;
};

type EventInfo = {
  id: string;
  title: string;
  date: string | null;
  city: string | null;
};

type Customer = {
  email: string;
  name: string | null;
  phone: string | null;
  birth_date: string | null;
  orders: Order[];
  totalSpent: number;
  orderCount: number;
  lastOrder: string;
  firstOrder: string;
};

type SortField = "email" | "totalSpent" | "orderCount" | "lastOrder";

/* ─── CSV Helpers ─── */
const escapeCsv = (val: unknown): string => {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
  const bom = "\uFEFF"; // Excel UTF-8 BOM
  const csv = bom + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ";" || ch === ",") { result.push(current.trim()); current = ""; }
      else current += ch;
    }
  }
  result.push(current.trim());
  return result;
};

type TicketRow = {
  id: string; event_id: string; order_id: string; status: string;
  checked_in_at: string | null; holder_name: string | null; holder_email: string | null;
  qr_code: string; created_at: string; ticket_category_id: string | null;
};

type TicketCategory = {
  id: string; name: string; event_id: string; price: number;
};

/* ─── Resend Tickets Button ─── */
const ResendTicketsButton = ({ orderId }: { orderId: string }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sending || sent) return;
    if (!confirm("Tickets erneut per E-Mail versenden?")) return;
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-tickets", {
        body: { order_id: orderId },
      });
      if (error) throw error;
      toast.success("Tickets wurden erneut versendet");
      setSent(true);
    } catch (err: any) {
      toast.error("Fehler beim Versenden: " + (err.message || "Unbekannt"));
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={handleResend}
      disabled={sending || sent}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all hover:scale-[1.03] disabled:opacity-50"
      style={{
        background: sent ? "hsl(140 60% 40% / 0.15)" : "hsl(215 90% 55% / 0.12)",
        color: sent ? "hsl(140 60% 50%)" : "hsl(215 90% 60%)",
        border: `1px solid ${sent ? "hsl(140 60% 40% / 0.25)" : "hsl(215 90% 55% / 0.2)"}`,
      }}
      title="Tickets erneut versenden"
    >
      {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : sent ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
      {sent ? "Gesendet" : "Erneut senden"}
    </button>
  );
};

/* ─── Download Tickets Button ─── */
const DownloadTicketsButton = ({ orderId }: { orderId: string }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-tickets", {
        body: { order_id: orderId, download_only: true },
      });
      if (error) throw error;
      // data should contain base64 PDF
      const pdfBase64 = data?.ticket_pdf || data?.ticketPdf;
      if (!pdfBase64) throw new Error("Kein PDF erhalten");
      const byteChars = atob(pdfBase64);
      const byteArray = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets-${orderId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Tickets heruntergeladen");
    } catch (err: any) {
      toast.error("Fehler: " + (err.message || "Unbekannt"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all hover:scale-[1.03] disabled:opacity-50"
      style={{
        background: "hsl(270 60% 55% / 0.12)",
        color: "hsl(270 60% 65%)",
        border: "1px solid hsl(270 60% 55% / 0.2)",
      }}
      title="Tickets als PDF herunterladen"
    >
      {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
      Download
    </button>
  );
};

const CustomersAdmin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [allTickets, setAllTickets] = useState<TicketRow[]>([]);
  const [ticketCategories, setTicketCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("lastOrder");
  const [sortAsc, setSortAsc] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAll = async (table: string, select: string, orderCol?: string) => {
      const PAGE = 1000;
      let all: any[] = [];
      let from = 0;
      while (true) {
        let q = (supabase.from as any)(table).select(select).range(from, from + PAGE - 1);
        if (orderCol) q = q.order(orderCol, { ascending: false });
        const { data } = await q;
        if (!data || data.length === 0) break;
        all = all.concat(data);
        if (data.length < PAGE) break;
        from += PAGE;
      }
      return all;
    };

    const load = async () => {
      const [ordersData, eventsData, ticketsData, categoriesData] = await Promise.all([
        fetchAll("orders", "*", "created_at"),
        fetchAll("events", "id, title, date, city"),
        fetchAll("tickets", "id, event_id, order_id, status, checked_in_at, holder_name, holder_email, qr_code, created_at, ticket_category_id"),
        fetchAll("ticket_categories", "id, name, event_id, price"),
      ]);
      setOrders(ordersData as unknown as Order[]);
      setEvents(eventsData as unknown as EventInfo[]);
      setAllTickets(ticketsData as unknown as TicketRow[]);
      setTicketCategories(categoriesData as unknown as TicketCategory[]);
      setLoading(false);
    };
    load();
  }, []);

  const customers = useMemo(() => {
    const map = new Map<string, Customer>();
    orders.forEach((order) => {
      const email = order.email.toLowerCase().trim();
      if (!map.has(email)) {
        map.set(email, {
          email,
          name: order.name,
          phone: order.phone,
          birth_date: order.birth_date,
          orders: [],
          totalSpent: 0,
          orderCount: 0,
          lastOrder: order.created_at,
          firstOrder: order.created_at,
        });
      }
      const c = map.get(email)!;
      c.orders.push(order);
      if (order.status === "paid") c.totalSpent += order.total_amount;
      c.orderCount++;
      if (!c.name && order.name) c.name = order.name;
      if (!c.phone && order.phone) c.phone = order.phone;
      if (!c.birth_date && order.birth_date) c.birth_date = order.birth_date;
      if (order.created_at > c.lastOrder) c.lastOrder = order.created_at;
      if (order.created_at < c.firstOrder) c.firstOrder = order.created_at;
    });
    return Array.from(map.values());
  }, [orders]);

  const eventMap = useMemo(() => {
    const m = new Map<string, EventInfo>();
    events.forEach((e) => m.set(e.id, e));
    return m;
  }, [events]);

  const getCustomerCitiesSet = (customer: Customer): Set<string> => {
    const cities = new Set<string>();
    customer.orders.forEach((o) => {
      if (o.event_id && o.status === "paid") {
        const city = eventMap.get(o.event_id)?.city;
        if (city) cities.add(city);
      }
    });
    return cities;
  };

  const allCities = useMemo(() => {
    const cities = new Set<string>();
    customers.forEach((c) => {
      c.orders.forEach((o) => {
        if (o.event_id) {
          const city = eventMap.get(o.event_id)?.city;
          if (city) cities.add(city);
        }
      });
    });
    return Array.from(cities).sort();
  }, [customers, eventMap]);

  const ticketsByOrderId = useMemo(() => {
    const map = new Map<string, TicketRow[]>();
    allTickets.forEach(t => {
      const arr = map.get(t.order_id) || [];
      arr.push(t);
      map.set(t.order_id, arr);
    });
    return map;
  }, [allTickets]);

  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => {
        // Match email, name, phone
        if (c.email.includes(q) || c.name?.toLowerCase().includes(q) || c.phone?.includes(q)) return true;
        // Match order IDs
        if (c.orders.some(o => o.id.toLowerCase().includes(q))) return true;
        // Match ticket QR codes / IDs
        const customerTickets = c.orders.flatMap(o => ticketsByOrderId.get(o.id) || []);
        if (customerTickets.some(t => t.qr_code.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))) return true;
        return false;
      });
    }
    if (statusFilter !== "all") {
      result = result.filter((c) =>
        c.orders.some((o) => o.status === statusFilter)
      );
    }
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "email": cmp = a.email.localeCompare(b.email); break;
        case "totalSpent": cmp = a.totalSpent - b.totalSpent; break;
        case "orderCount": cmp = a.orderCount - b.orderCount; break;
        case "lastOrder": cmp = new Date(a.lastOrder).getTime() - new Date(b.lastOrder).getTime(); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return result;
  }, [customers, search, sortField, sortAsc, statusFilter, eventMap, ticketsByOrderId]);

  const getEventTitle = (eventId: string | null) => {
    if (!eventId) return "–";
    return eventMap.get(eventId)?.title || "Unbekannt";
  };

  const getCustomerCities = (customer: Customer): string[] => {
    return Array.from(getCustomerCitiesSet(customer)).sort();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const paidOrders = orders.filter((o) => o.status === "paid").length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatCurrency = (v: number) => v.toFixed(2).replace(".", ",") + " €";

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: "hsl(150 60% 40% / 0.12)", text: "hsl(150 60% 40%)", label: "Bezahlt" },
    pending: { bg: "hsl(45 80% 55% / 0.12)", text: "hsl(45 80% 55%)", label: "Ausstehend" },
    failed: { bg: "hsl(0 70% 55% / 0.12)", text: "hsl(0 70% 55%)", label: "Fehlgeschlagen" },
    expired: { bg: "hsl(0 0% 100% / 0.06)", text: "hsl(0 0% 100% / 0.35)", label: "Abgelaufen" },
    canceled: { bg: "hsl(0 0% 100% / 0.06)", text: "hsl(0 0% 100% / 0.35)", label: "Storniert" },
  };

  const getStatus = (s: string) => statusColors[s] || { bg: "hsl(0 0% 100% / 0.06)", text: "hsl(0 0% 100% / 0.4)", label: s };

  const catMap = useMemo(() => new Map(ticketCategories.map(c => [c.id, c])), [ticketCategories]);

  /* ─── EXPORT FUNCTIONS ─── */
  const exportCustomers = () => {
    const headers = ["Name", "E-Mail", "Telefon", "Geburtsdatum", "Bestellungen", "Bezahlte Bestellungen", "Umsatz (€)", "Servicegebühren (€)", "Erste Bestellung", "Letzte Bestellung", "Städte", "Stammkunde"];
    const rows = filteredCustomers.map(c => {
      const paidOrders = c.orders.filter(o => o.status === "paid");
      const serviceFees = paidOrders.reduce((s, o) => s + Number(o.service_fee), 0);
      const cities = getCustomerCities(c).join(", ");
      return [
        escapeCsv(c.name), escapeCsv(c.email), escapeCsv(c.phone), escapeCsv(c.birth_date ? formatDate(c.birth_date) : ""),
        String(c.orderCount), String(paidOrders.length), c.totalSpent.toFixed(2).replace(".", ","), serviceFees.toFixed(2).replace(".", ","),
        formatDate(c.firstOrder), formatDate(c.lastOrder), escapeCsv(cities), paidOrders.length > 2 ? "Ja" : "Nein",
      ];
    });
    downloadCsv(`kunden-export-${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    toast.success(`${rows.length} Kunden exportiert`);
    setShowExportModal(false);
  };

  const exportOrders = () => {
    const headers = ["Bestell-ID", "Datum", "Bezahlt am", "Kunde", "E-Mail", "Telefon", "Geburtsdatum", "Event", "Stadt", "Status", "Betrag (€)", "Servicegebühr (€)", "Gesamt (€)", "Währung", "Zahlungs-ID"];
    const rows = orders.filter(o => {
      const d = new Date(o.created_at);
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return true;
    }).map(o => {
      const ev = o.event_id ? eventMap.get(o.event_id) : null;
      return [
        escapeCsv(o.id), formatDate(o.created_at), o.paid_at ? formatDate(o.paid_at) : "",
        escapeCsv(o.name), escapeCsv(o.email), escapeCsv(o.phone),
        o.birth_date ? formatDate(o.birth_date) : "",
        escapeCsv(ev?.title), escapeCsv(ev?.city), o.status,
        Number(o.total_amount).toFixed(2).replace(".", ","),
        Number(o.service_fee).toFixed(2).replace(".", ","),
        (Number(o.total_amount) + Number(o.service_fee)).toFixed(2).replace(".", ","),
        o.currency, escapeCsv((o as any).mollie_payment_id),
      ];
    });
    downloadCsv(`bestellungen-export-${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    toast.success(`${rows.length} Bestellungen exportiert`);
    setShowExportModal(false);
  };

  const exportTickets = () => {
    const headers = ["Ticket-ID", "QR-Code", "Event", "Stadt", "Event-Datum", "Ticket-Kategorie", "Preis (€)", "Inhaber Name", "Inhaber E-Mail", "Status", "Erstellt am", "Eingecheckt am", "Bestell-ID"];
    const rows = allTickets.map(t => {
      const ev = eventMap.get(t.event_id);
      const cat = t.ticket_category_id ? catMap.get(t.ticket_category_id) : null;
      return [
        escapeCsv(t.id), escapeCsv(t.qr_code), escapeCsv(ev?.title), escapeCsv(ev?.city),
        ev?.date ? formatDate(ev.date) : "", escapeCsv(cat?.name), cat ? cat.price.toFixed(2).replace(".", ",") : "",
        escapeCsv(t.holder_name), escapeCsv(t.holder_email), t.status,
        formatDate(t.created_at), t.checked_in_at ? formatDate(t.checked_in_at) : "", escapeCsv(t.order_id),
      ];
    });
    downloadCsv(`tickets-export-${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    toast.success(`${rows.length} Tickets exportiert`);
    setShowExportModal(false);
  };

  const exportEventReport = (eventId: string) => {
    const ev = eventMap.get(eventId);
    if (!ev) return;
    const eventOrders = orders.filter(o => o.event_id === eventId);
    const eventTickets = allTickets.filter(t => t.event_id === eventId);
    const paidOrders = eventOrders.filter(o => o.status === "paid");
    const checkedIn = eventTickets.filter(t => t.checked_in_at);
    const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total_amount), 0);
    const totalFees = paidOrders.reduce((s, o) => s + Number(o.service_fee), 0);

    // Summary sheet
    const summaryHeaders = ["Kennzahl", "Wert"];
    const summaryRows = [
      ["Event", escapeCsv(ev.title)],
      ["Stadt", escapeCsv(ev.city)],
      ["Datum", ev.date ? formatDate(ev.date) : ""],
      ["Bestellungen gesamt", String(eventOrders.length)],
      ["Bezahlte Bestellungen", String(paidOrders.length)],
      ["Umsatz (€)", totalRevenue.toFixed(2).replace(".", ",")],
      ["Servicegebühren (€)", totalFees.toFixed(2).replace(".", ",")],
      ["Tickets gesamt", String(eventTickets.length)],
      ["Check-ins", String(checkedIn.length)],
      ["Check-in-Rate", eventTickets.length > 0 ? `${((checkedIn.length / eventTickets.length) * 100).toFixed(1)}%` : "0%"],
      ["", ""],
      ["--- KÄUFER ---", ""],
    ];

    // Buyer details
    const buyerHeaders = ["Name", "E-Mail", "Telefon", "Geburtsdatum", "Betrag (€)", "Servicegebühr (€)", "Status", "Bestellt am", "Bezahlt am"];
    const buyerRows = eventOrders.map(o => [
      escapeCsv(o.name), escapeCsv(o.email), escapeCsv(o.phone),
      o.birth_date ? formatDate(o.birth_date) : "", Number(o.total_amount).toFixed(2).replace(".", ","),
      Number(o.service_fee).toFixed(2).replace(".", ","), o.status, formatDate(o.created_at),
      o.paid_at ? formatDate(o.paid_at) : "",
    ]);

    // Ticket details
    const ticketHeaders = ["Ticket-ID", "Kategorie", "Preis (€)", "Inhaber", "E-Mail", "Status", "Check-in"];
    const ticketRows = eventTickets.map(t => {
      const cat = t.ticket_category_id ? catMap.get(t.ticket_category_id) : null;
      return [
        escapeCsv(t.id.slice(0, 8)), escapeCsv(cat?.name), cat ? cat.price.toFixed(2).replace(".", ",") : "",
        escapeCsv(t.holder_name), escapeCsv(t.holder_email), t.status,
        t.checked_in_at ? formatDate(t.checked_in_at) : "Nein",
      ];
    });

    // Combine into one CSV
    const bom = "\uFEFF";
    const allLines = [
      summaryHeaders.join(";"),
      ...summaryRows.map(r => r.join(";")),
      "",
      buyerHeaders.join(";"),
      ...buyerRows.map(r => r.join(";")),
      "",
      `--- TICKETS (${eventTickets.length}) ---`,
      ticketHeaders.join(";"),
      ...ticketRows.map(r => r.join(";")),
    ];
    const csv = bom + allLines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug = (ev.title || "event").toLowerCase().replace(/[^a-z0-9äöü]/g, "-").replace(/-+/g, "-");
    a.download = `event-report-${slug}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Event-Report für "${ev.title}" exportiert`);
    setShowExportModal(false);
  };

  const exportCheckins = () => {
    const headers = ["Event", "Stadt", "Event-Datum", "Ticket-ID", "Kategorie", "Inhaber Name", "Inhaber E-Mail", "Check-in Zeit"];
    const rows = allTickets.filter(t => t.checked_in_at).map(t => {
      const ev = eventMap.get(t.event_id);
      const cat = t.ticket_category_id ? catMap.get(t.ticket_category_id) : null;
      return [
        escapeCsv(ev?.title), escapeCsv(ev?.city), ev?.date ? formatDate(ev.date) : "",
        escapeCsv(t.id.slice(0, 8)), escapeCsv(cat?.name),
        escapeCsv(t.holder_name), escapeCsv(t.holder_email),
        t.checked_in_at ? new Date(t.checked_in_at).toLocaleString("de-DE") : "",
      ];
    });
    downloadCsv(`checkins-export-${new Date().toISOString().split("T")[0]}.csv`, headers, rows);
    toast.success(`${rows.length} Check-ins exportiert`);
    setShowExportModal(false);
  };

  /* ─── IMPORT ─── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) { toast.error("CSV muss mindestens Header + 1 Zeile haben"); return; }
      const headers = parseCsvLine(lines[0]);
      const rows = lines.slice(1).map(parseCsvLine);
      setImportPreview({ headers, rows });
      setShowImportModal(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const runImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    const { headers, rows } = importPreview;
    const emailIdx = headers.findIndex(h => h.toLowerCase().includes("mail"));
    const nameIdx = headers.findIndex(h => h.toLowerCase().includes("name") && !h.toLowerCase().includes("mail"));
    const cityIdx = headers.findIndex(h => h.toLowerCase().includes("stadt") || h.toLowerCase().includes("city"));
    const sourceIdx = headers.findIndex(h => h.toLowerCase().includes("quelle") || h.toLowerCase().includes("source"));

    if (emailIdx === -1) {
      toast.error("Spalte 'E-Mail' nicht gefunden");
      setImporting(false);
      return;
    }

    let imported = 0;
    let skipped = 0;
    for (const row of rows) {
      const email = row[emailIdx]?.trim().toLowerCase();
      if (!email || !email.includes("@")) { skipped++; continue; }
      const payload: any = { email, source: sourceIdx >= 0 ? row[sourceIdx] || "csv-import" : "csv-import" };
      if (nameIdx >= 0 && row[nameIdx]) payload.name = row[nameIdx];
      if (cityIdx >= 0 && row[cityIdx]) payload.city = row[cityIdx];
      const { error } = await supabase.from("newsletter_subscribers").upsert(payload, { onConflict: "email" });
      if (error) skipped++;
      else imported++;
    }
    toast.success(`${imported} importiert, ${skipped} übersprungen`);
    setImporting(false);
    setShowImportModal(false);
    setImportPreview(null);
  };

  // Events with data for event-oriented export
  const eventsWithOrders = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => { if (o.event_id) map.set(o.event_id, (map.get(o.event_id) ?? 0) + 1); });
    return events
      .filter(e => map.has(e.id))
      .map(e => ({ ...e, orderCount: map.get(e.id) ?? 0 }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }, [events, orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Laden...</div>
      </div>
    );
  }

  const modalBg: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 50, background: "hsl(0 0% 0% / 0.7)", display: "flex", alignItems: "center", justifyContent: "center" };
  const modalCard: React.CSSProperties = { background: "hsl(220 40% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)", borderRadius: 20, maxWidth: 700, width: "95%", maxHeight: "85vh", overflow: "auto", padding: 24 };
  const exportBtn: React.CSSProperties = { background: "hsl(0 0% 100% / 0.05)", border: "1px solid hsl(0 0% 100% / 0.08)", borderRadius: 14, padding: "14px 18px", cursor: "pointer", textAlign: "left" as const, width: "100%", transition: "all 0.15s" };

  return (
    <div>
      {/* Hidden file input for import */}
      <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileSelect} />

      {/* ─── EXPORT MODAL ─── */}
      {showExportModal && (
        <div style={modalBg} onClick={() => setShowExportModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
                <Download className="w-4 h-4 inline mr-2" style={{ color: "hsl(330 80% 55%)" }} />
                CSV Export
              </h2>
              <button onClick={() => setShowExportModal(false)} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "hsl(0 0% 100% / 0.3)" }}>Globale Exports</p>

              <button onClick={exportCustomers} style={exportBtn} className="hover:border-white/20 hover:bg-white/[0.07]">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 shrink-0" style={{ color: "hsl(330 80% 55%)" }} />
                  <div>
                    <div className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>Kundenliste</div>
                    <div className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                      Name, E-Mail, Telefon, Umsatz, Bestellungen, Städte ({filteredCustomers.length} Kunden)
                    </div>
                  </div>
                </div>
              </button>

              <button onClick={exportOrders} style={exportBtn} className="hover:border-white/20 hover:bg-white/[0.07]">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 shrink-0" style={{ color: "hsl(200 80% 55%)" }} />
                  <div>
                    <div className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>Alle Bestellungen</div>
                    <div className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                      Komplett mit Käuferdetails, Events, Status, Beträge ({orders.length} Bestellungen)
                    </div>
                  </div>
                </div>
              </button>

              <button onClick={exportTickets} style={exportBtn} className="hover:border-white/20 hover:bg-white/[0.07]">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 shrink-0" style={{ color: "hsl(140 60% 50%)" }} />
                  <div>
                    <div className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>Alle Tickets</div>
                    <div className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                      QR-Codes, Kategorien, Preise, Inhaber, Check-in-Status ({allTickets.length} Tickets)
                    </div>
                  </div>
                </div>
              </button>

              <button onClick={exportCheckins} style={exportBtn} className="hover:border-white/20 hover:bg-white/[0.07]">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 shrink-0" style={{ color: "hsl(45 90% 55%)" }} />
                  <div>
                    <div className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>Alle Check-ins</div>
                    <div className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                      Nur eingecheckte Tickets mit Zeitstempel ({allTickets.filter(t => t.checked_in_at).length} Check-ins)
                    </div>
                  </div>
                </div>
              </button>

              {eventsWithOrders.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider mt-6 mb-2" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                    Event-Report (Komplett)
                  </p>
                  <div className="max-h-[300px] overflow-auto space-y-2 pr-1">
                    {eventsWithOrders.map(ev => {
                      const evTickets = allTickets.filter(t => t.event_id === ev.id);
                      const checkedIn = evTickets.filter(t => t.checked_in_at).length;
                      return (
                        <button key={ev.id} onClick={() => exportEventReport(ev.id)} style={exportBtn} className="hover:border-white/20 hover:bg-white/[0.07]">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="w-4 h-4 shrink-0" style={{ color: "hsl(260 70% 60%)" }} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{ev.title}</div>
                              <div className="text-[10px] flex items-center gap-2 flex-wrap" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                                {ev.city && <span>{ev.city}</span>}
                                {ev.date && <span>{formatDate(ev.date)}</span>}
                                <span>{ev.orderCount} Bestellungen</span>
                                <span>{evTickets.length} Tickets</span>
                                <span>{checkedIn} Check-ins</span>
                              </div>
                            </div>
                            <Download className="w-3.5 h-3.5 shrink-0" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── IMPORT MODAL ─── */}
      {showImportModal && importPreview && (
        <div style={modalBg} onClick={() => { setShowImportModal(false); setImportPreview(null); }}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
                <Upload className="w-4 h-4 inline mr-2" style={{ color: "hsl(140 60% 50%)" }} />
                CSV Import – Vorschau
              </h2>
              <button onClick={() => { setShowImportModal(false); setImportPreview(null); }} className="p-1.5 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid hsl(0 0% 100% / 0.08)" }}>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "hsl(0 0% 100% / 0.04)" }}>
                      {importPreview.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: "hsl(0 0% 100% / 0.4)", fontSize: 10 }}>
                          {h}
                          {h.toLowerCase().includes("mail") && <Check className="w-3 h-3 inline ml-1" style={{ color: "hsl(140 60% 50%)" }} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.rows.slice(0, 10).map((row, i) => (
                      <tr key={i} style={{ borderTop: "1px solid hsl(0 0% 100% / 0.04)" }}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 whitespace-nowrap" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                {importPreview.rows.length} Zeilen erkannt · Import in Newsletter-Abonnenten
                {importPreview.rows.length > 10 && ` (${importPreview.rows.length - 10} weitere nicht angezeigt)`}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowImportModal(false); setImportPreview(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)" }}>
                  Abbrechen
                </button>
                <button onClick={runImport} disabled={importing}
                  className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2" style={{ background: "hsl(140 60% 45%)", color: "hsl(0 0% 100%)" }}>
                  {importing ? "Importiere..." : <><Upload className="w-3.5 h-3.5" /> Jetzt importieren</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1
          className="text-xl sm:text-2xl font-black uppercase"
          style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
        >
          Kunden
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
            style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.7)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
            <Upload className="w-3.5 h-3.5" /> CSV Import
          </button>
          <button onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
            style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
            <Download className="w-3.5 h-3.5" /> CSV Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Kunden", value: customers.length.toString(), icon: Users, color: "hsl(330 80% 55%)" },
          { label: "Bestellungen", value: orders.length.toString(), icon: ShoppingCart, color: "hsl(215 90% 55%)" },
          { label: "Bezahlt", value: paidOrders.toString(), icon: CreditCard, color: "hsl(150 60% 40%)" },
          { label: "Umsatz", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "hsl(45 80% 55%)" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-4"
            style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                {stat.label}
              </span>
            </div>
            <span className="text-lg font-black" style={{ color: "hsl(0 0% 100%)" }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, E-Mail, Telefon, Bestell-ID oder Ticketnummer..."
            className="w-full pl-10 pr-3 py-2 rounded-lg text-sm"
            style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
        >
          <option value="all" style={{ background: "hsl(220 50% 10%)" }}>Alle Status</option>
          <option value="paid" style={{ background: "hsl(220 50% 10%)" }}>Nur bezahlt</option>
          <option value="pending" style={{ background: "hsl(220 50% 10%)" }}>Nur ausstehend</option>
          <option value="failed" style={{ background: "hsl(220 50% 10%)" }}>Nur fehlgeschlagen</option>
        </select>
      </div>

      {/* Sort buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { field: "lastOrder" as SortField, label: "Letzte Bestellung" },
          { field: "totalSpent" as SortField, label: "Umsatz" },
          { field: "orderCount" as SortField, label: "Bestellungen" },
          { field: "email" as SortField, label: "E-Mail" },
        ]).map((s) => (
          <button
            key={s.field}
            onClick={() => handleSort(s.field)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: sortField === s.field ? "hsl(330 80% 55% / 0.15)" : "hsl(0 0% 100% / 0.04)",
              color: sortField === s.field ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
            }}
          >
            <ArrowUpDown className="w-3 h-3" />
            {s.label}
            {sortField === s.field && (sortAsc ? " ↑" : " ↓")}
          </button>
        ))}
      </div>

      {/* Customer list */}
      <div className="space-y-2">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-8 h-8 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
            <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              {search ? "Keine Kunden gefunden" : "Noch keine Bestellungen vorhanden"}
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer, i) => {
            const isExpanded = expandedCustomer === customer.email;
            return (
              <motion.div
                key={customer.email}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "hsl(0 0% 100% / 0.04)",
                  border: `1px solid ${isExpanded ? "hsl(330 80% 55% / 0.25)" : "hsl(0 0% 100% / 0.06)"}`,
                }}
              >
                {/* Row header */}
                <div
                  className="flex items-center gap-3 px-4 sm:px-5 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-all"
                  onClick={() => setExpandedCustomer(isExpanded ? null : customer.email)}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "hsl(330 80% 55% / 0.12)", color: "hsl(330 80% 55%)" }}
                  >
                    {(customer.name || customer.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>
                        {customer.name || customer.email}
                      </span>
                      {customer.orders.filter(o => o.status === "paid").length > 2 && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0" style={{ background: "hsl(330 80% 55% / 0.12)", color: "hsl(330 80% 55%)" }}>
                          Stammkunde
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs truncate" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                        {customer.email}
                      </span>
                      {getCustomerCities(customer).map((city) => (
                        <span
                          key={city}
                          className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: "hsl(215 90% 55% / 0.12)", color: "hsl(215 90% 55%)" }}
                        >
                          <MapPin className="w-2.5 h-2.5" />
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs block font-bold" style={{ color: "hsl(150 60% 40%)" }}>
                        {formatCurrency(customer.totalSpent)}
                      </span>
                      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Umsatz</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs block font-bold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                        {customer.orderCount}
                      </span>
                      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Bestellungen</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs block" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                        {formatDate(customer.lastOrder)}
                      </span>
                      <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Letzte</span>
                    </div>
                  </div>
                  <ChevronDown
                    className="w-4 h-4 shrink-0 transition-transform"
                    style={{ color: "hsl(0 0% 100% / 0.3)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-4 pt-1 space-y-4" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
                        {/* Contact info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                            <Mail className="w-3.5 h-3.5" style={{ color: "hsl(215 90% 55%)" }} />
                            <span className="text-xs font-mono truncate" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                              {customer.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                            <Phone className="w-3.5 h-3.5" style={{ color: "hsl(150 60% 40%)" }} />
                            <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                              {customer.phone || "–"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.03)" }}>
                            <Calendar className="w-3.5 h-3.5" style={{ color: "hsl(45 80% 55%)" }} />
                            <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                              {customer.birth_date ? formatDate(customer.birth_date) : "–"}
                            </span>
                          </div>
                        </div>

                        {/* Revenue summary */}
                        {(() => {
                          const paidOrders = customer.orders.filter(o => o.status === "paid");
                          const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total_amount), 0);
                          const totalServiceFees = paidOrders.reduce((s, o) => s + Number(o.service_fee), 0);
                          const totalInsurance = paidOrders.reduce((s, o) => s + Number((o as any).insurance_fee || 0), 0);
                          const totalTicketRevenue = totalRevenue - totalServiceFees - totalInsurance;

                          // Ticket category breakdown
                          const catMap = new Map<string, { name: string; count: number; revenue: number }>();
                          paidOrders.forEach(o => {
                            const orderTickets = allTickets.filter(t => t.order_id === o.id);
                            orderTickets.forEach(t => {
                              const cat = ticketCategories.find(c => c.id === t.ticket_category_id);
                              const catName = cat?.name || "Standard";
                              const catPrice = cat?.price || 0;
                              const key = cat?.id || "unknown";
                              if (!catMap.has(key)) catMap.set(key, { name: catName, count: 0, revenue: 0 });
                              const entry = catMap.get(key)!;
                              entry.count++;
                              entry.revenue += catPrice;
                            });
                          });
                          const catBreakdown = Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue);

                          return (
                            <>
                              {/* Revenue KPIs */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="px-3 py-2.5 rounded-xl text-center" style={{ background: "hsl(150 60% 40% / 0.08)", border: "1px solid hsl(150 60% 40% / 0.15)" }}>
                                  <span className="text-sm font-black block" style={{ color: "hsl(150 60% 40%)" }}>{formatCurrency(totalRevenue)}</span>
                                  <span className="text-[9px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Gesamtumsatz</span>
                                </div>
                                <div className="px-3 py-2.5 rounded-xl text-center" style={{ background: "hsl(215 90% 55% / 0.08)", border: "1px solid hsl(215 90% 55% / 0.15)" }}>
                                  <span className="text-sm font-black block" style={{ color: "hsl(215 90% 55%)" }}>{formatCurrency(totalTicketRevenue)}</span>
                                  <span className="text-[9px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Ticketumsatz</span>
                                </div>
                                <div className="px-3 py-2.5 rounded-xl text-center" style={{ background: "hsl(45 80% 55% / 0.08)", border: "1px solid hsl(45 80% 55% / 0.15)" }}>
                                  <span className="text-sm font-black block" style={{ color: "hsl(45 80% 55%)" }}>{formatCurrency(totalServiceFees)}</span>
                                  <span className="text-[9px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Servicegebühren</span>
                                </div>
                                <div className="px-3 py-2.5 rounded-xl text-center" style={{ background: "hsl(270 60% 55% / 0.08)", border: "1px solid hsl(270 60% 55% / 0.15)" }}>
                                  <span className="text-sm font-black block" style={{ color: "hsl(270 60% 55%)" }}>
                                    {paidOrders.length > 0 ? formatCurrency(totalRevenue / paidOrders.length) : "–"}
                                  </span>
                                  <span className="text-[9px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Ø Bestellwert</span>
                                </div>
                              </div>

                              {/* Ticket categories breakdown */}
                              {catBreakdown.length > 0 && (
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                                    Ticketkategorien
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {catBreakdown.map((cat, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                                        style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Ticket className="w-3 h-3" style={{ color: "hsl(330 80% 55%)" }} />
                                          <span className="text-xs font-semibold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{cat.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-bold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{cat.count}×</span>
                                          <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{formatCurrency(cat.revenue)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {/* Orders table */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                            Bestellungen ({customer.orderCount})
                          </span>
                          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr style={{ background: "hsl(0 0% 100% / 0.02)", borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Datum</th>
                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Event</th>
                                    <th className="text-left px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Status</th>
                                    <th className="text-right px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Tickets</th>
                                    <th className="text-right px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Gebühren</th>
                                    <th className="text-right px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Gesamt</th>
                                    <th className="text-center px-3 py-2 text-[10px] font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Aktionen</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {customer.orders.map((order) => {
                                    const st = getStatus(order.status);
                                    const orderTickets = allTickets.filter(t => t.order_id === order.id);
                                    const ticketDetails = orderTickets.map(t => {
                                      const cat = ticketCategories.find(c => c.id === t.ticket_category_id);
                                      return cat?.name || "Standard";
                                    });
                                    const ticketSummary = ticketDetails.reduce((acc, name) => {
                                      acc[name] = (acc[name] || 0) + 1;
                                      return acc;
                                    }, {} as Record<string, number>);

                                    return (
                                      <tr key={order.id} style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.04)" }}>
                                        <td className="px-3 py-2 text-xs font-mono" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                                          {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-3 py-2 text-xs" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                                          {getEventTitle(order.event_id)}
                                        </td>
                                        <td className="px-3 py-2">
                                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: st.bg, color: st.text }}>
                                            {st.label}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <div className="flex flex-col items-end gap-0.5">
                                            {Object.entries(ticketSummary).map(([name, count]) => (
                                              <span key={name} className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                                                {count}× {name}
                                              </span>
                                            ))}
                                            {orderTickets.length === 0 && (
                                              <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>–</span>
                                            )}
                                            <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                                              {formatCurrency(order.total_amount - order.service_fee - Number((order as any).insurance_fee || 0))}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-right" style={{ color: "hsl(45 80% 55% / 0.7)" }}>
                                          {Number(order.service_fee) > 0 ? formatCurrency(order.service_fee) : "–"}
                                        </td>
                                        <td className="px-3 py-2 text-xs font-bold text-right" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
                                          {formatCurrency(order.total_amount)}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {order.status === "paid" && (
                                            <div className="flex items-center gap-1.5 justify-center">
                                              <ResendTicketsButton orderId={order.id} />
                                              <DownloadTicketsButton orderId={order.id} />
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Count */}
      {filteredCustomers.length > 0 && (
        <p className="text-xs text-center mt-4" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
          {filteredCustomers.length} von {customers.length} Kunden
        </p>
      )}
    </div>
  );
};

export default CustomersAdmin;