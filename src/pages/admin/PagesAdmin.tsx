import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PageRow {
  id: string;
  page_key: string;
  title: string | null;
  content: Record<string, any>;
  updated_at: string;
}

const PagesAdmin = () => {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [editing, setEditing] = useState<Partial<PageRow> | null>(null);
  const [contentStr, setContentStr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("page_contents").select("*").order("page_key");
    setPages((data as PageRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startEdit = (page?: PageRow) => {
    if (page) {
      setEditing(page);
      setContentStr(JSON.stringify(page.content, null, 2));
    } else {
      setEditing({ page_key: "", title: "", content: {} });
      setContentStr("{}");
    }
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.page_key) {
      toast.error("Seiten-Key ist Pflichtfeld");
      return;
    }

    let parsedContent: Record<string, any>;
    try {
      parsedContent = JSON.parse(contentStr);
    } catch {
      toast.error("Ungültiges JSON im Content-Feld");
      return;
    }

    const payload = {
      page_key: editing.page_key,
      title: editing.title,
      content: parsedContent,
    };

    if (editing.id) {
      const { error } = await supabase.from("page_contents").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Seite aktualisiert");
    } else {
      const { error } = await supabase.from("page_contents").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Seite erstellt");
    }
    setEditing(null);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
          Seiten-Inhalte
        </h1>
        <button
          onClick={() => startEdit()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
          style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
        >
          <Plus className="w-4 h-4" /> Neue Seite
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>Laden...</p>
      ) : pages.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}>
          <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Keine Seiten-Inhalte vorhanden</p>
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
                <span className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{page.title || page.page_key}</span>
                <div className="text-xs" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                  Key: {page.page_key} · Aktualisiert: {new Date(page.updated_at).toLocaleDateString("de-DE")}
                </div>
              </div>
              <Pencil className="w-4 h-4 flex-shrink-0" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)} />
            <motion.div
              className="fixed inset-4 sm:inset-y-8 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-lg z-50 rounded-2xl overflow-y-auto"
              style={{ background: "hsl(220 50% 10%)", border: "1px solid hsl(0 0% 100% / 0.1)" }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="p-6 space-y-4">
                <h2 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>
                  {editing.id ? "Seite bearbeiten" : "Neue Seite"}
                </h2>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Seiten-Key *</label>
                  <input
                    value={editing.page_key || ""}
                    onChange={(e) => setEditing({ ...editing, page_key: e.target.value })}
                    placeholder="z.B. homepage-hero"
                    disabled={!!editing.id}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
                    style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Titel</label>
                  <input
                    value={editing.title || ""}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Content (JSON)</label>
                  <textarea
                    value={contentStr}
                    onChange={(e) => setContentStr(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono outline-none resize-none"
                    style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100%)", border: "1px solid hsl(0 0% 100% / 0.12)" }}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditing(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "hsl(0 0% 100% / 0.08)", color: "hsl(0 0% 100% / 0.6)" }}>
                    Abbrechen
                  </button>
                  <button onClick={save} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
                    Speichern
                  </button>
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
