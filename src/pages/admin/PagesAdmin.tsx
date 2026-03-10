import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Save, X, Trash2, GripVertical, ChevronDown, ChevronUp, FileText, HelpCircle, Eye, ChevronRight, Search, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PageSection {
  title: string;
  body: string;
}

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  title: string;
  emoji: string;
  items: FAQItem[];
}

interface PageRow {
  id: string;
  page_key: string;
  title: string | null;
  content: Record<string, any>;
  updated_at: string;
}

type PageType = "sections" | "faq";

const inputStyle = {
  background: "hsl(0 0% 100% / 0.08)",
  color: "hsl(0 0% 100%)",
  border: "1px solid hsl(0 0% 100% / 0.12)",
};

const labelClass = "block text-xs font-bold uppercase tracking-wider mb-1";
const labelStyle = { color: "hsl(0 0% 100% / 0.5)" };

/* ── Section-based editor (Impressum, Datenschutz, AGB) ── */
const SectionsEditor = ({
  sections,
  onChange,
}: {
  sections: PageSection[];
  onChange: (s: PageSection[]) => void;
}) => {
  const update = (idx: number, field: keyof PageSection, value: string) => {
    const next = [...sections];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };
  const add = () => onChange([...sections, { title: "", body: "" }]);
  const remove = (idx: number) => onChange(sections.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {sections.map((s, idx) => (
        <div
          key={idx}
          className="rounded-xl p-4 space-y-3"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Abschnitt {idx + 1}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => move(idx, -1)} className="p-1 rounded hover:bg-white/10" disabled={idx === 0}>
                <ChevronUp className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              </button>
              <button onClick={() => move(idx, 1)} className="p-1 rounded hover:bg-white/10" disabled={idx === sections.length - 1}>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              </button>
              <button onClick={() => remove(idx)} className="p-1 rounded hover:bg-red-500/20">
                <Trash2 className="w-3.5 h-3.5" style={{ color: "hsl(0 70% 60%)" }} />
              </button>
            </div>
          </div>
          <input
            value={s.title}
            onChange={(e) => update(idx, "title", e.target.value)}
            placeholder="Überschrift"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
          <textarea
            value={s.body}
            onChange={(e) => update(idx, "body", e.target.value)}
            placeholder="Inhalt..."
            rows={4}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={inputStyle}
          />
        </div>
      ))}
      <button
        onClick={add}
        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-white/[0.06]"
        style={{ border: "1px dashed hsl(0 0% 100% / 0.15)", color: "hsl(0 0% 100% / 0.5)" }}
      >
        <Plus className="w-4 h-4" /> Abschnitt hinzufügen
      </button>
    </div>
  );
};

/* ── FAQ editor ── */
const FAQEditor = ({
  categories,
  onChange,
}: {
  categories: FAQCategory[];
  onChange: (c: FAQCategory[]) => void;
}) => {
  const updateCat = (idx: number, field: keyof FAQCategory, value: any) => {
    const next = [...categories];
    next[idx] = { ...next[idx], [field]: value };
    onChange(next);
  };
  const addCat = () => onChange([...categories, { title: "", emoji: "❓", items: [{ q: "", a: "" }] }]);
  const removeCat = (idx: number) => onChange(categories.filter((_, i) => i !== idx));
  const moveCat = (idx: number, dir: -1 | 1) => {
    const next = [...categories];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const updateItem = (catIdx: number, itemIdx: number, field: keyof FAQItem, value: string) => {
    const next = [...categories];
    const items = [...next[catIdx].items];
    items[itemIdx] = { ...items[itemIdx], [field]: value };
    next[catIdx] = { ...next[catIdx], items };
    onChange(next);
  };
  const addItem = (catIdx: number) => {
    const next = [...categories];
    next[catIdx] = { ...next[catIdx], items: [...next[catIdx].items, { q: "", a: "" }] };
    onChange(next);
  };
  const removeItem = (catIdx: number, itemIdx: number) => {
    const next = [...categories];
    next[catIdx] = { ...next[catIdx], items: next[catIdx].items.filter((_, i) => i !== itemIdx) };
    onChange(next);
  };

  return (
    <div className="space-y-5">
      {categories.map((cat, catIdx) => (
        <div
          key={catIdx}
          className="rounded-xl p-4 space-y-3"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              Kategorie {catIdx + 1}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => moveCat(catIdx, -1)} className="p-1 rounded hover:bg-white/10" disabled={catIdx === 0}>
                <ChevronUp className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              </button>
              <button onClick={() => moveCat(catIdx, 1)} className="p-1 rounded hover:bg-white/10" disabled={catIdx === categories.length - 1}>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: "hsl(0 0% 100% / 0.4)" }} />
              </button>
              <button onClick={() => removeCat(catIdx)} className="p-1 rounded hover:bg-red-500/20">
                <Trash2 className="w-3.5 h-3.5" style={{ color: "hsl(0 70% 60%)" }} />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              value={cat.emoji}
              onChange={(e) => updateCat(catIdx, "emoji", e.target.value)}
              placeholder="Emoji"
              className="w-16 px-3 py-2 rounded-lg text-sm outline-none text-center"
              style={inputStyle}
            />
            <input
              value={cat.title}
              onChange={(e) => updateCat(catIdx, "title", e.target.value)}
              placeholder="Kategorie-Name"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>

          {/* FAQ Items */}
          <div className="space-y-2 pl-2" style={{ borderLeft: "2px solid hsl(230 80% 56% / 0.3)" }}>
            {cat.items.map((item, itemIdx) => (
              <div key={itemIdx} className="space-y-1.5 pl-3 py-2">
                <div className="flex items-start gap-2">
                  <input
                    value={item.q}
                    onChange={(e) => updateItem(catIdx, itemIdx, "q", e.target.value)}
                    placeholder="Frage"
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold outline-none"
                    style={inputStyle}
                  />
                  <button onClick={() => removeItem(catIdx, itemIdx)} className="p-1 rounded hover:bg-red-500/20 mt-0.5">
                    <X className="w-3 h-3" style={{ color: "hsl(0 70% 60%)" }} />
                  </button>
                </div>
                <textarea
                  value={item.a}
                  onChange={(e) => updateItem(catIdx, itemIdx, "a", e.target.value)}
                  placeholder="Antwort"
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none resize-none"
                  style={inputStyle}
                />
              </div>
            ))}
            <button
              onClick={() => addItem(catIdx)}
              className="text-xs font-bold py-1.5 px-3 rounded-lg transition-all hover:bg-white/[0.06]"
              style={{ color: "hsl(230 80% 65%)" }}
            >
              + Frage hinzufügen
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addCat}
        className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-white/[0.06]"
        style={{ border: "1px dashed hsl(0 0% 100% / 0.15)", color: "hsl(0 0% 100% / 0.5)" }}
      >
        <Plus className="w-4 h-4" /> Kategorie hinzufügen
      </button>
    </div>
  );
};

/* ── Sections Preview (Impressum, Datenschutz, AGB) ── */
const SectionsPreview = ({ title, subtitle, sections }: { title: string; subtitle: string; sections: PageSection[] }) => (
  <div>
    <h1 className="text-2xl sm:text-3xl font-black uppercase mb-2" style={{ color: "hsl(220 20% 15%)", letterSpacing: "-0.02em" }}>
      {title || "Seitentitel"}
    </h1>
    {subtitle && (
      <p className="text-xs font-semibold uppercase tracking-wider mb-8" style={{ color: "hsl(230 80% 50%)" }}>
        {subtitle}
      </p>
    )}
    <div className="space-y-5">
      {sections.length === 0 && (
        <p className="text-sm italic" style={{ color: "hsl(220 10% 60%)" }}>Noch keine Abschnitte hinzugefügt…</p>
      )}
      {sections.map((s, idx) => (
        <div key={idx}>
          <h2 className="text-base font-bold uppercase mb-1.5" style={{ color: "hsl(220 20% 15%)" }}>{s.title || "Überschrift"}</h2>
          {(s.body || "").split("\n").map((line, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: "hsl(220 10% 40%)" }}>{line || "\u00A0"}</p>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/* ── FAQ Preview ── */
const FAQPreviewItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid hsl(220 15% 90%)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors"
        style={{ background: open ? "hsl(220 20% 97%)" : "transparent" }}
      >
        <span className="text-sm font-semibold pr-4" style={{ color: "hsl(220 20% 20%)" }}>{q || "Frage?"}</span>
        <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ color: "hsl(220 10% 50%)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && (
        <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "hsl(220 10% 40%)" }}>{a || "Antwort…"}</p>
      )}
    </div>
  );
};

const FAQPreview = ({ subtitle, categories }: { subtitle: string; categories: FAQCategory[] }) => (
  <div>
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: "hsl(230 80% 56% / 0.1)", border: "1px solid hsl(230 80% 56% / 0.15)" }}>
        <HelpCircle className="w-6 h-6" style={{ color: "hsl(230 80% 50%)" }} />
      </div>
      <h1 className="text-2xl font-black uppercase mb-2" style={{ color: "hsl(220 20% 15%)", letterSpacing: "-0.02em" }}>
        Häufige Fragen
      </h1>
      <p className="text-sm" style={{ color: "hsl(220 10% 50%)" }}>{subtitle || "Alles was du wissen musst"}</p>
    </div>
    <div className="space-y-5">
      {categories.length === 0 && (
        <p className="text-sm italic text-center" style={{ color: "hsl(220 10% 60%)" }}>Noch keine Kategorien hinzugefügt…</p>
      )}
      {categories.map((cat, idx) => (
        <div key={idx}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{cat.emoji}</span>
            <h2 className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: "hsl(230 80% 50%)" }}>{cat.title || "Kategorie"}</h2>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 15% 90%)", boxShadow: "0 1px 3px hsl(220 20% 80% / 0.2)" }}>
            {cat.items.map((item, i) => (
              <FAQPreviewItem key={i} q={item.q} a={item.a} />
            ))}
            {cat.items.length === 0 && (
              <p className="p-4 text-sm italic" style={{ color: "hsl(220 10% 60%)" }}>Keine Fragen</p>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ── Preset pages ── */
const PRESET_PAGES = [
  { key: "faq", title: "FAQ", type: "faq" as PageType, icon: HelpCircle },
  { key: "datenschutz", title: "Datenschutz", type: "sections" as PageType, icon: FileText },
  { key: "impressum", title: "Impressum", type: "sections" as PageType, icon: FileText },
  { key: "agb", title: "AGB", type: "sections" as PageType, icon: FileText },
];

const PagesAdmin = () => {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [editing, setEditing] = useState<Partial<PageRow> | null>(null);
  const [pageType, setPageType] = useState<PageType>("sections");
  const [sections, setSections] = useState<PageSection[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [subtitle, setSubtitle] = useState("");
  const [loading, setLoading] = useState(true);

  // Alfred Butler settings
  const [alfredEnabled, setAlfredEnabled] = useState(false);
  const [alfredSelfLearn, setAlfredSelfLearn] = useState(false);
  const [alfredLoading, setAlfredLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("page_contents").select("*").order("page_key");
    setPages((data as PageRow[]) || []);
    setLoading(false);
  };

  const loadAlfredSettings = async () => {
    const { data } = await supabase.from("settings").select("value").eq("key", "alfred_butler").maybeSingle();
    if (data?.value) {
      const val = data.value as any;
      setAlfredEnabled(val.enabled ?? false);
      setAlfredSelfLearn(val.self_learn ?? false);
    }
    setAlfredLoading(false);
  };

  const saveAlfredSettings = async (enabled: boolean, selfLearn: boolean) => {
    await supabase.from("settings").upsert(
      { key: "alfred_butler", value: { enabled, self_learn: selfLearn } as any, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  };

  useEffect(() => { load(); loadAlfredSettings(); }, []);

  const detectType = (content: Record<string, any>): PageType => {
    if (content?.categories && Array.isArray(content.categories)) return "faq";
    return "sections";
  };

  const startEdit = (page: PageRow) => {
    setEditing(page);
    const type = detectType(page.content);
    setPageType(type);
    setSubtitle(page.content?.subtitle || "");
    if (type === "faq") {
      setCategories(page.content?.categories || []);
      setSections([]);
    } else {
      setSections(page.content?.sections || []);
      setCategories([]);
    }
  };

  const createPreset = async (preset: typeof PRESET_PAGES[0]) => {
    const existing = pages.find((p) => p.page_key === preset.key);
    if (existing) {
      startEdit(existing);
      return;
    }

    const defaultContent: Record<string, any> =
      preset.type === "faq"
        ? { subtitle: "Alles was du wissen musst – schnell und einfach.", categories: [] }
        : { subtitle: "", sections: [] };

    const { data, error } = await supabase
      .from("page_contents")
      .insert({ page_key: preset.key, title: preset.title, content: defaultContent })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${preset.title} erstellt`);
    await load();
    if (data) startEdit(data as PageRow);
  };

  const save = async () => {
    if (!editing?.id) return;

    const content: Record<string, any> = { subtitle };
    if (pageType === "faq") {
      content.categories = categories;
    } else {
      content.sections = sections;
    }

    const { error } = await supabase
      .from("page_contents")
      .update({ title: editing.title, content })
      .eq("id", editing.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Seite gespeichert");
    setEditing(null);
    load();
  };

  const existingKeys = pages.map((p) => p.page_key);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xl sm:text-2xl font-black uppercase"
          style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
        >
          Seiten-Inhalte
        </h1>
      </div>

      {/* Preset quick-create buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {PRESET_PAGES.map((preset) => {
          const exists = existingKeys.includes(preset.key);
          const Icon = preset.icon;
          return (
            <button
              key={preset.key}
              onClick={() => createPreset(preset)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
              style={{
                background: exists ? "hsl(0 0% 100% / 0.06)" : "hsl(230 80% 56% / 0.15)",
                border: `1px solid ${exists ? "hsl(0 0% 100% / 0.1)" : "hsl(230 80% 56% / 0.3)"}`,
                color: exists ? "hsl(0 0% 100% / 0.7)" : "hsl(230 80% 70%)",
              }}
            >
              <Icon className="w-5 h-5" />
              {preset.title}
              <span className="text-[10px] font-normal" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                {exists ? "Bearbeiten" : "Erstellen"}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</p>
      ) : pages.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
        >
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Klicke oben auf eine Seite, um sie zu erstellen und zu bearbeiten.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map((page) => (
            <div
              key={page.id}
              className="rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-all"
              style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
              onClick={() => startEdit(page)}
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>
                  {page.title || page.page_key}
                </span>
                <div className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  Key: {page.page_key} · Aktualisiert: {new Date(page.updated_at).toLocaleDateString("de-DE")}
                </div>
              </div>
              <Pencil className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Alfred der Butler */}
      <div className="mt-8 rounded-2xl p-5 space-y-4" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(270 80% 56% / 0.15)" }}>
              <Bot className="w-5 h-5" style={{ color: "hsl(270 80% 56%)" }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>Alfred der Butler</h3>
              <p className="text-[11px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>KI-Support-Chatbot für deine Besucher</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !alfredEnabled;
              setAlfredEnabled(next);
              if (!next) setAlfredSelfLearn(false);
              saveAlfredSettings(next, next ? alfredSelfLearn : false);
              toast.success(next ? "Alfred aktiviert" : "Alfred deaktiviert");
            }}
            disabled={alfredLoading}
            className="w-11 h-6 rounded-full relative transition-all cursor-pointer"
            style={{ background: alfredEnabled ? "hsl(270 80% 56%)" : "hsl(0 0% 100% / 0.1)" }}
          >
            <div
              className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
              style={{ background: "#fff", left: alfredEnabled ? "22px" : "2px" }}
            />
          </button>
        </div>

        <AnimatePresence>
          {alfredEnabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.06)" }}>
                {/* Self-learn toggle */}
                <div className="flex items-center justify-between rounded-xl p-3" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "hsl(0 0% 100% / 0.8)" }}>Selbstständig lernen</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                       {alfredSelfLearn
                        ? "Alfred darf eigene Antworten generieren und über den FAQ-Inhalt hinausgehen"
                        : "Alfred antwortet ausschließlich mit Inhalten aus dem vorhandenen FAQ"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !alfredSelfLearn;
                      setAlfredSelfLearn(next);
                      saveAlfredSettings(alfredEnabled, next);
                      toast.success(next ? "Selbstständiges Lernen aktiviert" : "Nur FAQ-Modus aktiv");
                    }}
                    className="w-11 h-6 rounded-full relative transition-all cursor-pointer shrink-0 ml-4"
                    style={{ background: alfredSelfLearn ? "hsl(150 70% 45%)" : "hsl(0 0% 100% / 0.1)" }}
                  >
                    <div
                      className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                      style={{ background: "#fff", left: alfredSelfLearn ? "22px" : "2px" }}
                    />
                  </button>
                </div>

                {/* Info box */}
                <div className="rounded-xl p-3" style={{ background: "hsl(270 80% 56% / 0.06)", border: "1px solid hsl(270 80% 56% / 0.12)" }}>
                  <p className="text-[11px]" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    {jamesSelfLearn
                      ? "⚡ James nutzt KI, um auch auf unbekannte Fragen intelligent zu antworten. Er greift zusätzlich auf allgemeines Wissen zurück."
                      : "📋 James beantwortet nur Fragen, die im FAQ hinterlegt sind. Unbekannte Fragen werden höflich abgelehnt."}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Full-Screen Side-by-Side */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(null)}
            />
            <motion.div
              className="fixed inset-2 sm:inset-4 z-50 rounded-2xl overflow-hidden flex flex-col lg:flex-row"
              style={{ background: "hsl(220 50% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* ── Left: Editor ── */}
              <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-5 lg:max-w-[50%]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>
                    {editing.title || editing.page_key} bearbeiten
                  </h2>
                  <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-white/10">
                    <X className="w-4 h-4" style={{ color: "hsl(0 0% 100% / 0.5)" }} />
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label className={labelClass} style={labelStyle}>Seitentitel</label>
                  <input
                    value={editing.title || ""}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className={labelClass} style={labelStyle}>Untertitel</label>
                  <input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={inputStyle}
                    placeholder="z.B. Angaben gemäß § 5 TMG"
                  />
                </div>

                {/* Type indicator */}
                <div className="flex gap-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{
                      background: pageType === "faq" ? "hsl(280 70% 50% / 0.2)" : "hsl(230 80% 56% / 0.2)",
                      color: pageType === "faq" ? "hsl(280 70% 70%)" : "hsl(230 80% 70%)",
                    }}
                  >
                    {pageType === "faq" ? "FAQ-Seite" : "Text-Seite"}
                  </span>
                </div>

                {/* Editor */}
                {pageType === "faq" ? (
                  <FAQEditor categories={categories} onChange={setCategories} />
                ) : (
                  <SectionsEditor sections={sections} onChange={setSections} />
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2 sticky bottom-0 pb-2" style={{ background: "hsl(220 50% 10%)" }}>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={save}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                    style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}
                  >
                    <Save className="w-4 h-4" /> Speichern
                  </button>
                </div>
              </div>

              {/* ── Right: Live Preview ── */}
              <div
                className="hidden lg:flex flex-col flex-1 min-w-0 border-l"
                style={{ borderColor: "hsl(0 0% 100% / 0.08)" }}
              >
                <div className="flex items-center gap-2 px-4 py-3" style={{ background: "hsl(0 0% 100% / 0.03)", borderBottom: "1px solid hsl(0 0% 100% / 0.08)" }}>
                  <Eye className="w-4 h-4" style={{ color: "hsl(230 80% 65%)" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
                    Live-Vorschau
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto bg-white rounded-br-2xl">
                  <div className="p-6 sm:p-10 max-w-3xl mx-auto">
                    {pageType === "faq" ? (
                      <FAQPreview subtitle={subtitle} categories={categories} />
                    ) : (
                      <SectionsPreview title={editing.title || ""} subtitle={subtitle} sections={sections} />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PagesAdmin;
