import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Headphones, Search, X, Plus, Send, Clock, CheckCircle, AlertCircle, ArrowLeft,
  MessageCircle, Mail, RefreshCw, User, Briefcase, Building2, Star, Filter,
  ChevronDown, MoreHorizontal, Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type Category = "refund" | "support" | "job" | "collaboration" | "location" | "influencer" | "other";
type Status = "open" | "in_progress" | "waiting" | "resolved" | "closed";
type Priority = "low" | "normal" | "high" | "urgent";

interface Ticket {
  id: string;
  ticket_number: number;
  category: Category;
  status: Status;
  priority: Priority;
  subject: string;
  customer_name: string | null;
  customer_email: string;
  order_id: string | null;
  event_id: string | null;
  assigned_to: string | null;
  source: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_name: string | null;
  sender_email: string | null;
  content: string;
  attachments: unknown[];
  is_internal: boolean;
  created_at: string;
}

const categoryConfig: Record<Category, { label: string; icon: typeof Headphones; color: string }> = {
  refund: { label: "Erstattung", icon: RefreshCw, color: "hsl(0 70% 55%)" },
  support: { label: "Support", icon: Headphones, color: "hsl(200 80% 55%)" },
  job: { label: "Job-Bewerbung", icon: Briefcase, color: "hsl(270 70% 60%)" },
  collaboration: { label: "Zusammenarbeit", icon: Star, color: "hsl(45 90% 55%)" },
  location: { label: "Location", icon: Building2, color: "hsl(142 70% 50%)" },
  influencer: { label: "Influencer", icon: User, color: "hsl(330 80% 55%)" },
  other: { label: "Sonstiges", icon: Tag, color: "hsl(0 0% 50%)" },
};

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  open: { label: "Offen", color: "hsl(200 80% 55%)", bg: "hsl(200 80% 55% / 0.15)" },
  in_progress: { label: "In Bearbeitung", color: "hsl(45 90% 55%)", bg: "hsl(45 90% 55% / 0.15)" },
  waiting: { label: "Wartet", color: "hsl(30 80% 55%)", bg: "hsl(30 80% 55% / 0.15)" },
  resolved: { label: "Gelöst", color: "hsl(142 70% 50%)", bg: "hsl(142 70% 50% / 0.15)" },
  closed: { label: "Geschlossen", color: "hsl(0 0% 50%)", bg: "hsl(0 0% 50% / 0.15)" },
};

const priorityConfig: Record<Priority, { label: string; color: string }> = {
  low: { label: "Niedrig", color: "hsl(0 0% 50%)" },
  normal: { label: "Normal", color: "hsl(200 80% 55%)" },
  high: { label: "Hoch", color: "hsl(30 80% 55%)" },
  urgent: { label: "Dringend", color: "hsl(0 70% 55%)" },
};

export default function SupportAdmin() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [activeStatus, setActiveStatus] = useState<Status | "all">("all");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: "", customer_email: "", customer_name: "", category: "support" as Category, priority: "normal" as Priority, message: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isOnline, setIsOnline] = useState(false);

  // Load online status
  useEffect(() => {
    const loadOnline = async () => {
      const { data } = await supabase.from("settings").select("value").eq("key", "support_online").single();
      if (data) setIsOnline(!!(data.value as Record<string, unknown>)?.online);
    };
    loadOnline();
  }, []);

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await supabase.from("settings").upsert([{ key: "support_online", value: { online: newStatus } }], { onConflict: "key" });
  };

  const loadTickets = useCallback(async () => {
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
    if (data) setTickets(data as unknown as Ticket[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Realtime tickets
  useEffect(() => {
    const ch = supabase.channel("support-tickets-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => loadTickets())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadTickets]);

  // Realtime messages
  useEffect(() => {
    if (!selectedTicket) return;
    const loadMessages = async () => {
      const { data } = await supabase.from("support_messages").select("*").eq("ticket_id", selectedTicket.id).order("created_at", { ascending: true });
      if (data) setMessages(data as unknown as Message[]);
    };
    loadMessages();
    const ch = supabase.channel(`support-messages-${selectedTicket.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${selectedTicket.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as unknown as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedTicket]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    const { error } = await supabase.from("support_messages").insert([{
      ticket_id: selectedTicket.id,
      sender_type: "admin",
      sender_name: user?.email?.split("@")[0] || "Admin",
      sender_email: user?.email || "",
      content: newMessage.trim(),
      is_internal: isInternal,
    }]);
    if (error) { toast.error("Fehler beim Senden"); return; }
    if (selectedTicket.status === "open") {
      await supabase.from("support_tickets").update({ status: "in_progress" as const }).eq("id", selectedTicket.id);
    }
    setNewMessage("");
  };

  const updateTicketStatus = async (ticketId: string, status: Status) => {
    await supabase.from("support_tickets").update({ status: status as "open" | "in_progress" | "waiting" | "resolved" | "closed", ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}) }).eq("id", ticketId);
    if (selectedTicket?.id === ticketId) setSelectedTicket(prev => prev ? { ...prev, status } : null);
    toast.success(`Status geändert: ${statusConfig[status].label}`);
  };

  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.customer_email) { toast.error("Betreff und E-Mail sind erforderlich"); return; }
    const { data, error } = await supabase.from("support_tickets").insert([{
      subject: newTicket.subject,
      customer_email: newTicket.customer_email,
      customer_name: newTicket.customer_name || null,
      category: newTicket.category as "refund" | "support" | "job" | "collaboration" | "location" | "influencer" | "other",
      priority: newTicket.priority as "low" | "normal" | "high" | "urgent",
      source: "manual",
    }]).select().single();
    if (error) { toast.error("Fehler beim Erstellen"); return; }
    if (newTicket.message && data) {
      await supabase.from("support_messages").insert([{
        ticket_id: data.id,
        sender_type: "customer",
        sender_name: newTicket.customer_name || null,
        sender_email: newTicket.customer_email,
        content: newTicket.message,
      }]);
    }
    setShowNewTicket(false);
    setNewTicket({ subject: "", customer_email: "", customer_name: "", category: "support", priority: "normal", message: "" });
    toast.success("Ticket erstellt");
  };

  // Filters
  const filtered = tickets.filter(t => {
    if (activeCategory !== "all" && t.category !== activeCategory) return false;
    if (activeStatus !== "all" && t.status !== activeStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return t.subject.toLowerCase().includes(q) || t.customer_email.toLowerCase().includes(q) || (t.customer_name || "").toLowerCase().includes(q) || `#${t.ticket_number}`.includes(q);
    }
    return true;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    waiting: tickets.filter(t => t.status === "waiting").length,
  };

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return "gerade eben";
    if (mins < 60) return `vor ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `vor ${hrs}h`;
    return `vor ${Math.floor(hrs / 24)}d`;
  };

  // Ticket detail view
  if (selectedTicket) {
    const cat = categoryConfig[selectedTicket.category];
    const st = statusConfig[selectedTicket.status];
    return (
      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
          <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>#{selectedTicket.ticket_number}</span>
              <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{selectedTicket.subject}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: cat.color }}>{cat.label}</span>
              <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>·</span>
              <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{selectedTicket.customer_email}</span>
            </div>
          </div>
          {/* Status selector */}
          <select
            value={selectedTicket.status}
            onChange={(e) => updateTicketStatus(selectedTicket.id, e.target.value as Status)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg outline-none cursor-pointer"
            style={{ background: st.bg, color: st.color, border: "none", colorScheme: "dark" }}
          >
            {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto py-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[75%] rounded-2xl px-4 py-2.5"
                style={{
                  background: msg.is_internal ? "hsl(45 90% 55% / 0.1)" :
                    msg.sender_type === "admin" ? "hsl(330 80% 50% / 0.15)" : "hsl(0 0% 100% / 0.06)",
                  border: msg.is_internal ? "1px solid hsl(45 90% 55% / 0.2)" : "1px solid hsl(0 0% 100% / 0.06)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase" style={{ color: msg.sender_type === "admin" ? "hsl(330 80% 55%)" : "hsl(200 80% 55%)" }}>
                    {msg.sender_type === "admin" ? "Admin" : msg.sender_type === "bot" ? "James (Bot)" : msg.sender_name || "Kunde"}
                  </span>
                  {msg.is_internal && <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: "hsl(45 90% 55% / 0.2)", color: "hsl(45 90% 55%)" }}>Intern</span>}
                  <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>{timeAgo(msg.created_at)}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap" style={{ color: "hsl(0 0% 100% / 0.85)" }}>{msg.content}</p>
                {msg.sender_type === "customer" && msg.attachments && Array.isArray(msg.attachments) && (msg.attachments as Array<{original?: string; language?: string}>).length > 0 && (msg.attachments as Array<{original?: string; language?: string}>)[0]?.original && (
                  <details className="mt-1">
                    <summary className="text-[10px] cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                      Original ({(msg.attachments as Array<{original?: string; language?: string}>)[0]?.language?.toUpperCase()})
                    </summary>
                    <p className="text-xs mt-0.5 italic" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{(msg.attachments as Array<{original?: string; language?: string}>)[0]?.original}</p>
                  </details>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="pt-3" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.08)" }}>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setIsInternal(!isInternal)}
              className="text-[10px] font-bold uppercase px-2 py-1 rounded-md transition-all"
              style={{
                background: isInternal ? "hsl(45 90% 55% / 0.15)" : "hsl(0 0% 100% / 0.06)",
                color: isInternal ? "hsl(45 90% 55%)" : "hsl(0 0% 100% / 0.4)",
                border: isInternal ? "1px solid hsl(45 90% 55% / 0.3)" : "1px solid transparent",
              }}
            >
              {isInternal ? "🔒 Interne Notiz" : "💬 Antwort"}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder={isInternal ? "Interne Notiz schreiben..." : "Nachricht schreiben..."}
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            />
            <button onClick={sendMessage} className="px-4 py-3 rounded-xl font-bold text-sm" style={{ background: "hsl(330 80% 50%)", color: "white" }}>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // New ticket form
  if (showNewTicket) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setShowNewTicket(false)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>Neues Ticket erstellen</h2>
        </div>
        <div className="space-y-4">
          {[
            { label: "Betreff *", value: newTicket.subject, key: "subject", type: "text" },
            { label: "Kunden-E-Mail *", value: newTicket.customer_email, key: "customer_email", type: "email" },
            { label: "Kundenname", value: newTicket.customer_name, key: "customer_name", type: "text" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={(e) => setNewTicket({ ...newTicket, [f.key]: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Kategorie</label>
              <select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as Category })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}>
                {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Priorität</label>
              <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as Priority })} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}>
                {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Erste Nachricht</label>
            <textarea
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
            />
          </div>
          <button onClick={createTicket} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: "hsl(330 80% 50%)", color: "white" }}>
            Ticket erstellen
          </button>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "hsl(0 0% 100%)" }}>Support</h1>
          <button
            onClick={toggleOnline}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
            style={{
              background: isOnline ? "hsl(142 70% 45% / 0.15)" : "hsl(0 0% 100% / 0.06)",
              color: isOnline ? "hsl(142 70% 50%)" : "hsl(0 0% 100% / 0.4)",
              border: isOnline ? "1px solid hsl(142 70% 45% / 0.3)" : "1px solid hsl(0 0% 100% / 0.1)",
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: isOnline ? "hsl(142 70% 50%)" : "hsl(0 0% 100% / 0.3)" }} />
            {isOnline ? "Online" : "Offline"}
          </button>
        </div>
        <button onClick={() => setShowNewTicket(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm" style={{ background: "hsl(330 80% 50%)", color: "white" }}>
          <Plus className="w-4 h-4" /> Neues Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Offen", count: counts.open, color: "hsl(200 80% 55%)" },
          { label: "In Bearbeitung", count: counts.in_progress, color: "hsl(45 90% 55%)" },
          { label: "Wartet", count: counts.waiting, color: "hsl(30 80% 55%)" },
          { label: "Gesamt", count: counts.all, color: "hsl(0 0% 100% / 0.5)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs font-medium" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche nach Ticket, E-Mail, Name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
          />
        </div>
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value as Category | "all")}
          className="px-3 py-2.5 rounded-xl text-xs font-bold outline-none"
          style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.7)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}
        >
          <option value="all">Alle Kategorien</option>
          {Object.entries(categoryConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={activeStatus}
          onChange={(e) => setActiveStatus(e.target.value as Status | "all")}
          className="px-3 py-2.5 rounded-xl text-xs font-bold outline-none"
          style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.7)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}
        >
          <option value="all">Alle Status</option>
          {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Ticket list */}
      {loading ? (
        <div className="text-center py-12 text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Headphones className="w-12 h-12 mx-auto mb-3" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Tickets gefunden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket) => {
            const cat = categoryConfig[ticket.category];
            const st = statusConfig[ticket.status];
            const pr = priorityConfig[ticket.priority];
            const CatIcon = cat.icon;
            return (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:border-white/15"
                style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${cat.color}20` }}>
                  <CatIcon className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.3)" }}>#{ticket.ticket_number}</span>
                    <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{ticket.subject}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    {ticket.priority !== "normal" && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${pr.color}20`, color: pr.color }}>{pr.label}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{ticket.customer_name || ticket.customer_email}</span>
                    <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.3)" }}>· {timeAgo(ticket.created_at)}</span>
                    <span className="text-[10px]" style={{ color: cat.color }}>{cat.label}</span>
                  </div>
                </div>
                <MessageCircle className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
