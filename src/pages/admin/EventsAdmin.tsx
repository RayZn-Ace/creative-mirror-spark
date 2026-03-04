import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Pencil, Trash2, Star, Eye, EyeOff, Layers, ChevronDown, ChevronRight,
  ArrowLeft, ImageIcon, MapPin, Clock, Ticket, Upload, X, Globe, Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

/* ─── City → Country mapping ─── */
const CITY_COUNTRY: Record<string, string> = {
  // Austria
  Dornbirn: "Österreich", Gralla: "Österreich", Innsbruck: "Österreich", Kitzbühel: "Österreich",
  Kollerschlag: "Österreich", Linz: "Österreich", Salzburg: "Österreich", "St. Martin": "Österreich",
  Vöcklabruck: "Österreich", Wien: "Österreich",
  // Switzerland
  Lyss: "Schweiz", Olten: "Schweiz", "St. Gallen": "Schweiz", Winterthur: "Schweiz", Zürich: "Schweiz",
  // Netherlands
  Amsterdam: "Niederlande", Rotterdam: "Niederlande", Utrecht: "Niederlande",
  // Belgium
  Antwerpen: "Belgien",
  // France
  "Le Havre": "Frankreich", Mathay: "Frankreich", Paris: "Frankreich",
  // Luxembourg
  Luxembourg: "Luxemburg",
  // Poland
  Krakow: "Polen",
  // Croatia
  Zadar: "Kroatien",
  // Brazil
  "São Paulo": "Brasilien",
};
const getCountry = (city: string | null) => {
  if (!city) return "Unbekannt";
  return CITY_COUNTRY[city] || "Deutschland";
};

interface InfoBlock {
  id: string;
  title: string;
  content: string;
}

interface EventRow {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  description: string | null;
  date: string | null;
  time: string | null;
  end_time: string | null;
  location_name: string | null;
  location_address: string | null;
  city: string | null;
  image_url: string | null;
  tag: string | null;
  status: string | null;
  highlight: boolean | null;
  ticket_link: string | null;
  sort_order: number | null;
  series_id: string | null;
  service_fee_enabled: boolean | null;
  service_fee_type: string | null;
  service_fee_value: number | null;
  service_fee_vat: number | null;
  info_sections: InfoBlock[] | null;
}

interface TicketRow {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  sold_out: boolean | null;
  sort_order: number | null;
  features: string[] | null;
  badge: string | null;
  coming_soon: boolean | null;
  category_group: string | null;
  sale_start: string | null;
  sale_end: string | null;
  internal_only: boolean | null;
  group_size: number | null;
}

interface SeriesOption {
  id: string;
  title: string;
  city: string | null;
}

const emptyEvent: Omit<EventRow, "id"> = {
  title: "", subtitle: "", slug: "", description: "", date: null, time: "20:00", end_time: "23:00",
  location_name: "", location_address: "", city: "", image_url: "", tag: "Konzert",
  status: "draft", highlight: false, ticket_link: "", sort_order: 0, series_id: null,
  service_fee_enabled: false, service_fee_type: "absolute", service_fee_value: 0, service_fee_vat: 19,
  info_sections: [],
};

const emptyTicket = { name: "", description: "", price: 0, currency: "EUR", sold_out: false, sort_order: 0, features: [] as string[], badge: "", coming_soon: false, category_group: "REGULAR", sale_start: null as string | null, sale_end: null as string | null, internal_only: false, group_size: 1 };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/* ─── Shared Components ─── */
const Field = ({ label, value, onChange, type = "text", placeholder = "" }: any) => (
  <div>
    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
      {label}
    </label>
    <input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1"
      style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}
    />
  </div>
);

const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="rounded-2xl p-5 sm:p-6 space-y-4" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.07)" }}>
    <div className="flex items-center gap-2.5 pb-2" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.06)" }}>
      <Icon className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
      <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{title}</h3>
    </div>
    {children}
  </div>
);

/* ─── Ticket Editor Inline ─── */
const TicketEditor = ({ eventId, tickets, onReload }: { eventId: string; tickets: TicketRow[]; onReload: () => void }) => {
  const [editingTicket, setEditingTicket] = useState<Partial<TicketRow> | null>(null);
  const [featuresInput, setFeaturesInput] = useState("");

  const saveTicket = async () => {
    if (!editingTicket?.name) { toast.error("Ticketname ist Pflicht"); return; }
    const payload: any = {
      name: editingTicket.name,
      description: editingTicket.description || null,
      price: editingTicket.price || 0,
      currency: editingTicket.currency || "EUR",
      sold_out: editingTicket.sold_out || false,
      sort_order: editingTicket.sort_order || 0,
      features: editingTicket.features || [],
      badge: editingTicket.badge || null,
      coming_soon: editingTicket.coming_soon || false,
      category_group: editingTicket.category_group || "REGULAR",
      sale_start: editingTicket.sale_start || null,
      sale_end: editingTicket.sale_end || null,
      internal_only: editingTicket.internal_only || false,
      group_size: editingTicket.group_size || 1,
      event_id: eventId,
    };
    if (editingTicket.id) {
      const { error } = await supabase.from("ticket_categories").update(payload).eq("id", editingTicket.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Ticket aktualisiert");
    } else {
      const { error } = await supabase.from("ticket_categories").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Ticket erstellt");
    }
    setEditingTicket(null);
    onReload();
  };

  const removeTicket = async (id: string) => {
    if (!confirm("Ticket-Variante löschen?")) return;
    await supabase.from("ticket_categories").delete().eq("id", id);
    toast.success("Ticket gelöscht");
    onReload();
  };

  const addFeature = () => {
    if (!featuresInput.trim() || !editingTicket) return;
    setEditingTicket({ ...editingTicket, features: [...(editingTicket.features || []), featuresInput.trim()] });
    setFeaturesInput("");
  };

  return (
    <div className="space-y-3">
      {tickets.map((t) => (
        <div
          key={t.id}
          className="rounded-xl p-4 flex items-center justify-between"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(200 80% 55% / 0.15)", color: "hsl(200 80% 55%)" }}>
                {t.category_group || "REGULAR"}
              </span>
              <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{t.name}</span>
              {t.badge && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(330 80% 55% / 0.15)", color: "hsl(330 80% 55%)" }}>
                  {t.badge}
                </span>
              )}
              {t.coming_soon && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(45 80% 55% / 0.15)", color: "hsl(45 80% 55%)" }}>
                  COMING SOON
                </span>
              )}
              {t.sold_out && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(0 70% 50% / 0.15)", color: "hsl(0 70% 55%)" }}>
                  Ausverkauft
                </span>
              )}
              {(t.sale_start || t.sale_end) && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(270 60% 55% / 0.15)", color: "hsl(270 60% 55%)" }}>
                  {t.sale_start ? new Date(t.sale_start).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "∞"}
                  {" → "}
                  {t.sale_end ? new Date(t.sale_end).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "∞"}
                </span>
              )}
              {t.internal_only && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(45 80% 55% / 0.15)", color: "hsl(45 80% 55%)" }}>
                  Nur intern
                </span>
              )}
              {(t.group_size || 1) > 1 && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ background: "hsl(180 60% 50% / 0.15)", color: "hsl(180 60% 50%)" }}>
                  {t.group_size}er Gruppe
                </span>
              )}
            </div>
            {t.description && <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{t.description}</p>}
            {t.features && t.features.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {t.features.map((f, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsl(142 70% 45% / 0.1)", color: "hsl(142 70% 55%)" }}>
                    ✅ {f}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <div className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
              {t.price.toFixed(2)} €
            </div>
            <button onClick={() => { setEditingTicket(t); setFeaturesInput(""); }} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => removeTicket(t.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Create / Edit Ticket Form */}
      {editingTicket ? (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}>
          <h4 className="text-xs font-bold uppercase" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
            {editingTicket.id ? "Ticket bearbeiten" : "Neues Ticket erstellen"}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name *" value={editingTicket.name} onChange={(v: string) => setEditingTicket({ ...editingTicket, name: v })} placeholder="z.B. LAST CHANCE TICKET" />
            <Field label="Preis (€)" value={editingTicket.price} onChange={(v: string) => setEditingTicket({ ...editingTicket, price: parseFloat(v) || 0 })} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategorie-Gruppe" value={editingTicket.category_group} onChange={(v: string) => setEditingTicket({ ...editingTicket, category_group: v })} placeholder="z.B. REGULAR, DELUXE, FAN" />
            <Field label="Badge" value={editingTicket.badge} onChange={(v: string) => setEditingTicket({ ...editingTicket, badge: v })} placeholder="z.B. FAST AUSVERKAUFT" />
          </div>
          <Field label="Beschreibung" value={editingTicket.description} onChange={(v: string) => setEditingTicket({ ...editingTicket, description: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sortierung" value={editingTicket.sort_order} onChange={(v: string) => setEditingTicket({ ...editingTicket, sort_order: parseInt(v) || 0 })} type="number" />
            <div className="flex items-end pb-1 gap-4 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                <input type="checkbox" checked={editingTicket.sold_out || false} onChange={(e) => setEditingTicket({ ...editingTicket, sold_out: e.target.checked })} className="rounded w-4 h-4" />
                Ausverkauft
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
                <input type="checkbox" checked={editingTicket.coming_soon || false} onChange={(e) => setEditingTicket({ ...editingTicket, coming_soon: e.target.checked })} className="rounded w-4 h-4" />
                Coming Soon
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "hsl(45 80% 55% / 0.9)" }}>
                <input type="checkbox" checked={editingTicket.internal_only || false} onChange={(e) => setEditingTicket({ ...editingTicket, internal_only: e.target.checked })} className="rounded w-4 h-4" />
                Nur intern (Freiticket)
              </label>
            </div>
          </div>
          {/* Group size */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gruppengröße (1 = Einzelticket)" value={editingTicket.group_size || 1} onChange={(v: string) => setEditingTicket({ ...editingTicket, group_size: parseInt(v) || 1 })} type="number" />
          </div>
          {/* Sale Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Verkaufsstart (optional)</label>
              <input
                type="datetime-local"
                value={editingTicket.sale_start || ""}
                onChange={(e) => setEditingTicket({ ...editingTicket, sale_start: e.target.value || null })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Verkaufsende (optional)</label>
              <input
                type="datetime-local"
                value={editingTicket.sale_end || ""}
                onChange={(e) => setEditingTicket({ ...editingTicket, sale_end: e.target.value || null })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              />
            </div>
          </div>
          {/* Features */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Features</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {(editingTicket.features || []).map((f, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.7)" }}>
                  {f}
                  <button onClick={() => setEditingTicket({ ...editingTicket, features: (editingTicket.features || []).filter((_, j) => j !== i) })} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={featuresInput}
                onChange={(e) => setFeaturesInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                placeholder="z.B. VERGÜNSTIGTER EINTRITT"
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              />
              <button onClick={addFeature} className="px-3 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>
                +
              </button>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setEditingTicket(null)} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>
              Abbrechen
            </button>
            <button onClick={saveTicket} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
              Speichern
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditingTicket({ ...emptyTicket })}
          className="w-full rounded-xl p-6 flex flex-col items-center gap-2 transition-all hover:border-white/15"
          style={{ border: "2px dashed hsl(0 0% 100% / 0.1)", background: "transparent" }}
        >
          <Ticket className="w-6 h-6" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
          <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Weiteres Ticket erstellen</span>
          <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.25)" }}>Du kannst beliebig viele Ticket-Varianten erstellen.</span>
        </button>
      )}
    </div>
  );
};

/* ─── Image Upload ─── */
const ImageUpload = ({ imageUrl, onChange }: { imageUrl: string | null; onChange: (url: string) => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file);
    if (error) { toast.error("Upload fehlgeschlagen: " + error.message); setUploading(false); return; }
    const url = `${SUPABASE_URL}/storage/v1/object/public/event-images/${path}`;
    onChange(url);
    setUploading(false);
    toast.success("Bild hochgeladen");
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {imageUrl ? (
        <div className="relative group">
          <img src={imageUrl} alt="Titelbild" className="w-full aspect-[16/9] rounded-xl object-cover" />
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "hsl(0 0% 0% / 0.7)", color: "hsl(0 0% 100%)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-[16/9] rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-white/20"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "2px dashed hsl(0 0% 100% / 0.12)" }}
        >
          {uploading ? (
            <span className="text-xs font-medium" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Hochladen...</span>
          ) : (
            <>
              <Upload className="w-8 h-8" style={{ color: "hsl(0 0% 100% / 0.2)" }} />
              <span className="text-xs font-bold" style={{ color: "hsl(330 80% 55%)" }}>Eigene Datei hochladen</span>
              <span className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>PNG oder JPEG (1200 x 640px)</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

/* ─── Event Edit View ─── */
const EventEditView = ({
  editing, setEditing, seriesOptions, tickets, onSave, onDelete, onBack, onReloadTickets, onSeriesCreated,
}: {
  editing: Partial<EventRow>;
  setEditing: (e: Partial<EventRow>) => void;
  seriesOptions: SeriesOption[];
  tickets: TicketRow[];
  onSave: () => void;
  onDelete?: () => void;
  onBack: () => void;
  onReloadTickets: () => void;
  onSeriesCreated: () => void;
}) => {
  const [newSeriesName, setNewSeriesName] = useState("");
  const [creatingSeries, setCreatingSeries] = useState(false);

  // Auto-detect city and suggest series
  const cityValue = editing.city?.trim() || "";
  const matchingSeries = seriesOptions.find(
    (s) => s.city?.toLowerCase() === cityValue.toLowerCase() || s.title.toLowerCase() === cityValue.toLowerCase()
  );

  const createSeriesFromCity = async () => {
    const name = newSeriesName.trim() || cityValue;
    if (!name) { toast.error("Bitte Stadt oder Serienname eingeben"); return; }
    setCreatingSeries(true);
    const slug = name.toLowerCase().replace(/[^a-z0-9äöü]/g, "-").replace(/-+/g, "-");
    const { data, error } = await supabase
      .from("event_series")
      .insert({ title: name, slug, city: cityValue || name, status: "published", sort_order: 0 })
      .select("id")
      .single();
    if (error) { toast.error(error.message); setCreatingSeries(false); return; }
    toast.success(`Serie "${name}" erstellt`);
    setEditing({ ...editing, series_id: data.id });
    setNewSeriesName("");
    setCreatingSeries(false);
    onSeriesCreated();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105" style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.6)" }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg sm:text-xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            {editing.id ? "Event bearbeiten" : "Neues Event"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {editing.id && onDelete && (
            <button onClick={onDelete} className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(0 70% 50% / 0.1)", color: "hsl(0 70% 55%)", border: "1px solid hsl(0 70% 50% / 0.2)" }}>
              Event löschen
            </button>
          )}
          <button onClick={onSave} className="px-6 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
            Speichern
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Eventbeschreibung" icon={Pencil}>
            <Field label="Titel *" value={editing.title} onChange={(v: string) => setEditing({ ...editing, title: v })} />
            <Field label="Untertitel" value={editing.subtitle} onChange={(v: string) => setEditing({ ...editing, subtitle: v })} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Event Kategorie</label>
                <select
                  value={editing.tag || "Konzert"}
                  onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}
                >
                  <option value="Konzert" style={{ background: "#1a1a1a", color: "#fff" }}>Konzert</option>
                  <option value="Party" style={{ background: "#1a1a1a", color: "#fff" }}>Party</option>
                  <option value="Open Air" style={{ background: "#1a1a1a", color: "#fff" }}>Open Air</option>
                  <option value="Festival" style={{ background: "#1a1a1a", color: "#fff" }}>Festival</option>
                  <option value="Club" style={{ background: "#1a1a1a", color: "#fff" }}>Club</option>
                </select>
              </div>
              <Field label="Slug *" value={editing.slug} onChange={(v: string) => setEditing({ ...editing, slug: v })} placeholder="z.b. hannover-10-04" />
            </div>
          </Section>

          <Section title="Zeit & Ort" icon={MapPin}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Event-Start (Datum)" value={editing.date} onChange={(v: string) => setEditing({ ...editing, date: v })} type="date" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Startzeit" value={editing.time} onChange={(v: string) => setEditing({ ...editing, time: v })} placeholder="20:00" />
                <Field label="Endzeit" value={editing.end_time} onChange={(v: string) => setEditing({ ...editing, end_time: v })} placeholder="23:00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Stadt" value={editing.city} onChange={(v: string) => setEditing({ ...editing, city: v })} placeholder="z.B. Hannover" />
              <Field label="Location" value={editing.location_name} onChange={(v: string) => setEditing({ ...editing, location_name: v })} placeholder="z.B. Baggi / Osho" />
            </div>
            <Field label="Location (Komplette Adresse)" value={editing.location_address} onChange={(v: string) => setEditing({ ...editing, location_address: v })} placeholder="Raschpl. 7L, 30161 Hannover" />
          </Section>

          <Section title="Tickets" icon={Ticket}>
            {editing.id ? (
              <TicketEditor eventId={editing.id} tickets={tickets} onReload={onReloadTickets} />
            ) : (
              <p className="text-xs py-4 text-center" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                Speichere das Event zuerst, um Ticket-Varianten hinzuzufügen.
              </p>
            )}
          </Section>

          <Section title="Info-Blöcke (Akkordeons)" icon={Layers}>
            <p className="text-[10px] mb-2" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Diese Blöcke erscheinen als aufklappbare Akkordeons auf der Eventseite.
            </p>
            <div className="space-y-3">
              {(editing.info_sections || []).map((block, idx) => (
                <div key={block.id} className="rounded-xl p-4 space-y-2" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={block.title}
                      onChange={(e) => {
                        const updated = [...(editing.info_sections || [])];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setEditing({ ...editing, info_sections: updated });
                      }}
                      placeholder="Block-Titel (z.B. Eventinformationen)"
                      className="flex-1 px-3 py-2 rounded-lg text-sm font-bold outline-none"
                      style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                    />
                    <div className="flex items-center gap-1">
                      {idx > 0 && (
                        <button
                          onClick={() => {
                            const updated = [...(editing.info_sections || [])];
                            [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
                            setEditing({ ...editing, info_sections: updated });
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/5"
                          style={{ color: "hsl(0 0% 100% / 0.4)" }}
                          title="Nach oben"
                        >
                          <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                        </button>
                      )}
                      {idx < (editing.info_sections || []).length - 1 && (
                        <button
                          onClick={() => {
                            const updated = [...(editing.info_sections || [])];
                            [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
                            setEditing({ ...editing, info_sections: updated });
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/5"
                          style={{ color: "hsl(0 0% 100% / 0.4)" }}
                          title="Nach unten"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const updated = (editing.info_sections || []).filter((_, i) => i !== idx);
                          setEditing({ ...editing, info_sections: updated });
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/5"
                        style={{ color: "hsl(0 70% 55%)" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={block.content}
                    onChange={(e) => {
                      const updated = [...(editing.info_sections || [])];
                      updated[idx] = { ...updated[idx], content: e.target.value };
                      setEditing({ ...editing, info_sections: updated });
                    }}
                    rows={5}
                    placeholder="Inhalt des Blocks..."
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
                    style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", minHeight: "80px" }}
                  />
                  <p className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
                    Tipp: „whatsapp" als Inhalt zeigt den WhatsApp-Block an.
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const newBlock: InfoBlock = { id: `block-${Date.now()}`, title: "", content: "" };
                setEditing({ ...editing, info_sections: [...(editing.info_sections || []), newBlock] });
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
              style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100% / 0.5)", border: "1px dashed hsl(0 0% 100% / 0.15)" }}
            >
              <Plus className="w-3.5 h-3.5" /> Neuen Block hinzufügen
            </button>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Section title="Titelbild" icon={ImageIcon}>
            <ImageUpload imageUrl={editing.image_url || null} onChange={(url) => setEditing({ ...editing, image_url: url })} />
          </Section>

          <Section title="Event-Serie" icon={Layers}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Serie zuweisen</label>
              <select
                value={editing.series_id || ""}
                onChange={(e) => setEditing({ ...editing, series_id: e.target.value || null })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}
              >
                <option value="" style={{ background: "#1a1a1a", color: "#fff" }}>Keine Serie</option>
                {seriesOptions.map((s) => (
                  <option key={s.id} value={s.id} style={{ background: "#1a1a1a", color: "#fff" }}>{s.title}</option>
                ))}
              </select>
            </div>

            {/* Auto-detect or create new series */}
            {!editing.series_id && cityValue && matchingSeries && (
              <button
                onClick={() => setEditing({ ...editing, series_id: matchingSeries.id })}
                className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all hover:scale-[1.01]"
                style={{ background: "hsl(270 60% 55% / 0.1)", color: "hsl(270 60% 55%)", border: "1px solid hsl(270 60% 55% / 0.2)" }}
              >
                💡 Serie „{matchingSeries.title}" erkannt – Klicke zum Zuweisen
              </button>
            )}

            {!editing.series_id && !matchingSeries && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                  Oder neue Serie erstellen
                </span>
                <div className="flex gap-2">
                  <input
                    value={newSeriesName}
                    onChange={(e) => setNewSeriesName(e.target.value)}
                    placeholder={cityValue || "Serienname"}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
                  />
                  <button
                    onClick={createSeriesFromCity}
                    disabled={creatingSeries}
                    className="px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                    style={{ background: "hsl(270 60% 55%)", color: "hsl(0 0% 100%)" }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </Section>

          <Section title="Einstellungen" icon={Clock}>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Status</label>
              <select
                value={editing.status || "draft"}
                onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(0 0% 100% / 0.06)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.1)", colorScheme: "dark" }}
              >
                <option value="draft" style={{ background: "#1a1a1a", color: "#fff" }}>Entwurf</option>
                <option value="published" style={{ background: "#1a1a1a", color: "#fff" }}>Veröffentlicht</option>
              </select>
            </div>
            <Field label="Sortierung" value={editing.sort_order} onChange={(v: string) => setEditing({ ...editing, sort_order: parseInt(v) || 0 })} type="number" />
            <label className="flex items-center gap-3 text-sm cursor-pointer pt-1" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
              <input type="checkbox" checked={editing.highlight || false} onChange={(e) => setEditing({ ...editing, highlight: e.target.checked })} className="rounded w-4 h-4" />
              Highlight-Event
            </label>
          </Section>

          <Section title="Servicegebühr" icon={Ticket}>
            <label className="flex items-center gap-3 text-sm cursor-pointer" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
              <div
                className="relative w-10 h-5 rounded-full cursor-pointer transition-colors"
                style={{ background: editing.service_fee_enabled ? "hsl(142 70% 45%)" : "hsl(0 0% 100% / 0.15)" }}
                onClick={() => setEditing({ ...editing, service_fee_enabled: !editing.service_fee_enabled })}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    background: "hsl(0 0% 100%)",
                    left: editing.service_fee_enabled ? "calc(100% - 18px)" : "2px",
                  }}
                />
              </div>
              Servicegebühr aktivieren
            </label>

            {editing.service_fee_enabled && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 0% 100% / 0.45)" }}>Gebührenart</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing({ ...editing, service_fee_type: "absolute" })}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                      style={{
                        background: editing.service_fee_type === "absolute" ? "hsl(330 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.06)",
                        color: editing.service_fee_type === "absolute" ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
                        border: `1px solid ${editing.service_fee_type === "absolute" ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.1)"}`,
                      }}
                    >
                      Absolut (€)
                    </button>
                    <button
                      onClick={() => setEditing({ ...editing, service_fee_type: "percent" })}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-bold uppercase transition-all"
                      style={{
                        background: editing.service_fee_type === "percent" ? "hsl(330 80% 55% / 0.2)" : "hsl(0 0% 100% / 0.06)",
                        color: editing.service_fee_type === "percent" ? "hsl(330 80% 55%)" : "hsl(0 0% 100% / 0.5)",
                        border: `1px solid ${editing.service_fee_type === "percent" ? "hsl(330 80% 55% / 0.3)" : "hsl(0 0% 100% / 0.1)"}`,
                      }}
                    >
                      Prozentual (%)
                    </button>
                  </div>
                </div>
                <Field
                  label={editing.service_fee_type === "percent" ? "Gebühr (%)" : "Gebühr (€)"}
                  value={editing.service_fee_value}
                  onChange={(v: string) => setEditing({ ...editing, service_fee_value: parseFloat(v) || 0 })}
                  type="number"
                  placeholder={editing.service_fee_type === "percent" ? "z.B. 10" : "z.B. 2.50"}
                />
              </div>
            )}
          </Section>

          <Section title="MwSt." icon={Ticket}>
            <Field
              label="MwSt.-Satz (%)"
              value={editing.service_fee_vat}
              onChange={(v: string) => setEditing({ ...editing, service_fee_vat: parseFloat(v) || 0 })}
              type="number"
              placeholder="z.B. 19"
            />
          </Section>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const COLLAPSE_STORAGE_KEY = "admin_events_collapsed";

const loadCollapsedState = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
};

const saveCollapsedState = (state: Record<string, boolean>) => {
  try { localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(state)); } catch {}
};

const EventsAdmin = () => {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [seriesMap, setSeriesMap] = useState<Record<string, string>>({});
  const [seriesCityMap, setSeriesCityMap] = useState<Record<string, string | null>>({});
  const [editing, setEditing] = useState<Partial<EventRow> | null>(null);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(loadCollapsedState());
  const [search, setSearch] = useState("");

  const load = async () => {
    const [eventsRes, seriesRes] = await Promise.all([
      supabase.from("events").select("*").order("sort_order"),
      supabase.from("event_series").select("id, title, city").order("title"),
    ]);
    setEvents((eventsRes.data as unknown as EventRow[]) || []);
    const options = (seriesRes.data as SeriesOption[]) || [];
    setSeriesOptions(options);
    const map: Record<string, string> = {};
    const cityMap: Record<string, string | null> = {};
    options.forEach((s) => { map[s.id] = s.title; cityMap[s.id] = (s as any).city || null; });
    setSeriesMap(map);
    setSeriesCityMap(cityMap);
    setLoading(false);
  };

  const loadTickets = () => {
    if (editing?.id) {
      supabase.from("ticket_categories").select("*").eq("event_id", editing.id).order("sort_order")
        .then(({ data }) => setTickets((data as TicketRow[]) || []));
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadTickets(); setTickets([]); }, [editing?.id]);

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing as EventRow;
    if (!rest.title || !rest.slug) { toast.error("Titel und Slug sind Pflichtfelder"); return; }
    if (id) {
      const { error } = await supabase.from("events").update(rest as any).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Event aktualisiert");
    } else {
      const { data, error } = await supabase.from("events").insert(rest as any).select().single();
      if (error) { toast.error(error.message); return; }
      toast.success("Event erstellt");
      // Stay in edit mode with the new ID so tickets can be added
      setEditing(data as unknown as EventRow);
      load();
      return;
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Event wirklich löschen?")) return;
    await supabase.from("events").delete().eq("id", id);
    toast.success("Event gelöscht");
    setEditing(null);
    load();
  };

  const toggleStatus = async (event: EventRow) => {
    const newStatus = event.status === "published" ? "draft" : "published";
    await supabase.from("events").update({ status: newStatus }).eq("id", event.id);
    toast.success(newStatus === "published" ? "Veröffentlicht" : "Auf Entwurf gesetzt");
    load();
  };

  if (editing) {
    return (
      <EventEditView
        editing={editing}
        setEditing={(e) => setEditing(e)}
        seriesOptions={seriesOptions}
        tickets={tickets}
        onSave={save}
        onDelete={editing.id ? () => remove(editing.id!) : undefined}
        onBack={() => setEditing(null)}
        onReloadTickets={loadTickets}
        onSeriesCreated={load}
      />
    );
  }
  const isSearching = !!search.trim();
  const filteredEvents = isSearching
    ? events.filter((e) => {
        const q = search.toLowerCase();
        const city = e.series_id ? seriesCityMap[e.series_id] : e.city;
        const country = getCountry(city || null);
        return (
          e.title.toLowerCase().includes(q) ||
          (e.city || "").toLowerCase().includes(q) ||
          (e.tag || "").toLowerCase().includes(q) ||
          (e.slug || "").toLowerCase().includes(q) ||
          country.toLowerCase().includes(q) ||
          (e.series_id && (seriesMap[e.series_id] || "").toLowerCase().includes(q))
        );
      })
    : events;

  const grouped = filteredEvents.reduce<{ seriesId: string | null; seriesTitle: string; country: string; events: EventRow[] }[]>(
    (acc, event) => {
      const sid = event.series_id || "__none__";
      let group = acc.find((g) => (g.seriesId || "__none__") === sid);
      if (!group) {
        const city = event.series_id ? seriesCityMap[event.series_id] : event.city;
        group = { seriesId: event.series_id, seriesTitle: event.series_id ? seriesMap[event.series_id] || "Unbekannte Serie" : "Ohne Serie", country: getCountry(city || null), events: [] };
        acc.push(group);
      }
      group.events.push(event);
      return acc;
    },
    []
  );

  // Sort groups alphabetically by series title
  grouped.sort((a, b) => a.seriesTitle.localeCompare(b.seriesTitle, "de"));

  // Group by country
  const countryGroups = grouped.reduce<Record<string, typeof grouped>>((acc, g) => {
    if (!acc[g.country]) acc[g.country] = [];
    acc[g.country].push(g);
    return acc;
  }, {});
  const sortedCountries = Object.keys(countryGroups).sort((a, b) => {
    if (a === "Deutschland") return -1;
    if (b === "Deutschland") return 1;
    return a.localeCompare(b, "de");
  });

  // When searching, override collapse: everything is expanded
  const isCollapsed = (key: string) => isSearching ? false : collapsed[key] !== false;

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !isCollapsed(key) };
      saveCollapsedState(next);
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>Events</h1>
        <button onClick={() => setEditing({ ...emptyEvent })} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
          <Plus className="w-4 h-4" /> Neues Event
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Event, Stadt oder Serie suchen..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1"
          style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)", caretColor: "hsl(330 80% 55%)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-white/10">
            <X className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</p>
      ) : events.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <p className="text-sm mb-2" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Noch keine Events vorhanden</p>
          <button onClick={() => setEditing({ ...emptyEvent })} className="text-sm font-bold" style={{ color: "hsl(330 80% 55%)" }}>Jetzt erstes Event erstellen</button>
        </div>
      ) : filteredEvents.length === 0 && isSearching ? (
        <p className="text-sm py-8 text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Keine Events gefunden</p>
      ) : (
        <div className="space-y-8">
          {sortedCountries.map((country) => {
            const countryKey = `country__${country}`;
            const countryEventCount = countryGroups[country].reduce((sum, g) => sum + g.events.length, 0);
            return (
              <div key={country}>
                <button onClick={() => toggleCollapse(countryKey)} className="flex items-center gap-2 mb-4 w-full text-left">
                  <Globe className="w-4 h-4" style={{ color: "hsl(200 70% 55%)" }} />
                  <span className="text-sm font-black uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{country} ({countryEventCount})</span>
                  {isCollapsed(countryKey) ? <ChevronRight className="w-4 h-4 ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }} /> : <ChevronDown className="w-4 h-4 ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }} />}
                </button>
                <AnimatePresence initial={false}>
                  {!isCollapsed(countryKey) && (
                    <motion.div className="space-y-4 pl-4 overflow-hidden" style={{ borderLeft: "2px solid hsl(200 70% 55% / 0.2)" }} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      {countryGroups[country].map((group) => (
                        <div key={group.seriesId || "none"}>
                          <button onClick={() => toggleCollapse(group.seriesId || "__none__")} className="flex items-center gap-2 mb-3 w-full text-left group">
                            {group.seriesId && <Layers className="w-4 h-4" style={{ color: "hsl(270 60% 55%)" }} />}
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{group.seriesTitle} ({group.events.length})</span>
                            {isCollapsed(group.seriesId || "__none__") ? <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }} /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" style={{ color: "hsl(0 0% 100% / 0.3)" }} />}
                          </button>
                          <AnimatePresence initial={false}>
                            {!isCollapsed(group.seriesId || "__none__") && (
                              <motion.div className="space-y-2 overflow-hidden" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                                {group.events.map((event) => (
                                  <div key={event.id} className="rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:border-white/15" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }} onClick={() => setEditing(event)}>
                                    {event.image_url && <img src={event.image_url} alt="" className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>{event.title}</span>
                                        {event.highlight && <Star className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(45 80% 55%)" }} />}
                                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: event.status === "published" ? "hsl(142 70% 45% / 0.15)" : "hsl(0 0% 100% / 0.08)", color: event.status === "published" ? "hsl(142 70% 55%)" : "hsl(0 0% 100% / 0.4)" }}>
                                          {event.status}
                                        </span>
                                      </div>
                                      <span className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>{event.city} · {event.date || "Kein Datum"} · {event.tag}</span>
                                    </div>
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                      <button onClick={() => toggleStatus(event)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                                        {event.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                      <button onClick={() => remove(event.id)} className="p-2 rounded-lg hover:bg-white/5" style={{ color: "hsl(0 70% 55%)" }}>
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsAdmin;
