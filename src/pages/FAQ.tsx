import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePageContent } from "@/hooks/usePageContent";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  title: string;
  emoji: string;
  items: FAQItem[];
}

const defaultFaqData: FAQCategory[] = [
  {
    title: "Tickets", emoji: "🎟️",
    items: [
      { q: "Muss ich mein Ticket ausdrucken?", a: "Nein! Du kannst dein Ticket bequem digital auf deinem Handy vorzeigen." },
      { q: "Wo finde ich meine Tickets nach dem Kauf?", a: "Du erhältst deine Tickets per E-Mail. Alternativ unter \"Meine Tickets\" auf unserer Website." },
      { q: "Kann ich mein Ticket stornieren?", a: "Eine Stornierung ist leider grundsätzlich nicht möglich. Du kannst dein Ticket aber an eine andere Person weitergeben." },
    ],
  },
  {
    title: "Allgemein", emoji: "ℹ️",
    items: [
      { q: "Wie erreiche ich euch?", a: "Am besten per E-Mail: mail@nightlifegeneration.de. Alternativ über Instagram oder unseren Support-Chat." },
    ],
  },
  {
    title: "U18", emoji: "🔞",
    items: [
      { q: "Ab welchem Alter komme ich rein?", a: "Bei den meisten Events ist der Einlass ab 16 Jahren möglich – mit Muttizettel & volljähriger Begleitperson auch länger." },
      { q: "Was ist ein Muttizettel?", a: "Eine Einverständniserklärung deiner Eltern. Du findest ihn auf unserer Website unter \"Muttizettel\"." },
    ],
  },
];

const FAQAccordionItem = ({ q, a, isLast }: FAQItem & { isLast: boolean }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden transition-all" style={{ borderBottom: isLast ? "none" : "1px solid hsl(220 15% 90%)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors"
        style={{ background: open ? "hsl(220 20% 97%)" : "transparent" }}
      >
        <span className="text-sm sm:text-base font-semibold pr-4" style={{ color: "hsl(220 20% 20%)" }}>{q}</span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: open ? "hsl(230 80% 56% / 0.12)" : "hsl(220 15% 92%)" }}
        >
          <ChevronDown className="w-4 h-4" style={{ color: open ? "hsl(230 80% 50%)" : "hsl(220 10% 50%)" }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-4 sm:px-5 pb-5 text-sm leading-relaxed" style={{ color: "hsl(220 10% 40%)" }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const [search, setSearch] = useState("");
  const { content } = usePageContent("faq");

  const faqData: FAQCategory[] = content?.categories && content.categories.length > 0
    ? content.categories
    : defaultFaqData;

  const filteredCategories = faqData
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(search.toLowerCase()) ||
          item.a.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ background: "hsl(230 80% 56% / 0.1)", border: "1px solid hsl(230 80% 56% / 0.15)" }}>
              <HelpCircle className="w-8 h-8" style={{ color: "hsl(230 80% 50%)" }} />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase mb-3" style={{ color: "hsl(220 20% 15%)", letterSpacing: "-0.02em" }}>
              Häufige Fragen
            </h1>
            <p className="text-sm sm:text-base" style={{ color: "hsl(220 10% 50%)" }}>
              {content?.subtitle || "Alles was du wissen musst – schnell und einfach."}
            </p>
          </motion.div>

          <motion.div className="relative mb-10" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "hsl(220 10% 60%)" }} />
            <input
              type="text"
              placeholder="Suche nach einer Frage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-sm focus:outline-none transition-all"
              style={{ background: "hsl(220 20% 97%)", border: "1px solid hsl(220 15% 90%)", color: "hsl(220 20% 15%)" }}
            />
          </motion.div>

          <div className="space-y-6">
            {filteredCategories.map((cat, catIdx) => (
              <motion.div key={cat.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 + catIdx * 0.05 }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-lg">{cat.emoji}</span>
                  <h2 className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: "hsl(230 80% 50%)" }}>{cat.title}</h2>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 15% 90%)", boxShadow: "0 1px 3px hsl(220 20% 80% / 0.2)" }}>
                  {cat.items.map((item, idx) => (
                    <FAQAccordionItem key={item.q} q={item.q} a={item.a} isLast={idx === cat.items.length - 1} />
                  ))}
                </div>
              </motion.div>
            ))}
            {filteredCategories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: "hsl(220 10% 55%)" }}>Keine Ergebnisse für „{search}" gefunden.</p>
              </div>
            )}
          </div>

          <motion.div className="text-center mt-12 p-6 sm:p-8 rounded-2xl" style={{ background: "hsl(220 20% 97%)", border: "1px solid hsl(220 15% 90%)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "hsl(220 20% 20%)" }}>Deine Frage war nicht dabei?</p>
            <p className="text-xs mb-4" style={{ color: "hsl(220 10% 50%)" }}>Schreib uns – wir helfen dir gerne weiter.</p>
            <a href="/kontakt" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.02]" style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}>
              Kontakt aufnehmen
            </a>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
