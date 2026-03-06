import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, HelpCircle } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  title: string;
  emoji: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "Allgemein",
    emoji: "📋",
    items: [
      {
        q: "Was ist partyticket.app?",
        a: "partyticket.app ist deine Plattform für die besten Events und Partys in deiner Stadt. Wir bieten dir eine einfache und sichere Möglichkeit, Tickets für unvergessliche Nächte zu kaufen.",
      },
      {
        q: "Kann ich mit meinen Kindern kommen, die unter 18 Jahre alt sind?",
        a: "Das hängt vom jeweiligen Event ab. Bei vielen unserer Events ist der Einlass ab 16 Jahren möglich – entweder ohne Muttizettel (bis Mitternacht) oder mit Muttizettel & volljähriger Begleitperson. Die genauen Einlass-Bedingungen findest du auf der jeweiligen Eventseite.",
      },
      {
        q: "Ich würde gerne einen Tisch / eine Lounge mieten?",
        a: "Tisch- und Lounge-Reservierungen hängen von der jeweiligen Location ab. Bitte wende dich direkt an die Location oder schreib uns eine E-Mail an mail@partyticket.app – wir helfen dir gerne weiter!",
      },
    ],
  },
  {
    title: "Tickets",
    emoji: "🎟️",
    items: [
      {
        q: "Muss ich mein Ticket ausdrucken?",
        a: "Nein! Du kannst dein Ticket bequem digital auf deinem Handy vorzeigen. Bitte zoome beim Vorzeigen den QR-Code etwas größer, damit er schnell gescannt werden kann.",
      },
      {
        q: "Was passiert wenn die Veranstaltung verschoben wird?",
        a: "Falls eine Veranstaltung verschoben wird, behält dein Ticket seine Gültigkeit für den neuen Termin. Du wirst per E-Mail über alle Änderungen informiert. Sollte der neue Termin für dich nicht passen, kannst du eine Umbuchung beantragen.",
      },
      {
        q: "Kann ich mein Ticket stornieren?",
        a: "Eine Stornierung ist leider grundsätzlich nicht möglich, da es sich um ein Event handelt. Du kannst dein Ticket aber problemlos an eine andere Person weitergeben. Bei Veranstaltungsausfall durch den Veranstalter erhältst du selbstverständlich eine Rückerstattung.",
      },
      {
        q: "Kann ich mein Ticket umbuchen?",
        a: "Ja! Über unsere Ticket-Umbuchungsseite kannst du dein Ticket auf ein anderes Datum oder eine andere Location umbuchen. Bitte beachte, dass eine Bearbeitungsgebühr anfallen kann.",
      },
      {
        q: "Wo finde ich meine Tickets nach dem Kauf?",
        a: 'Du erhältst deine Tickets per E-Mail an die beim Kauf angegebene Adresse. Alternativ kannst du unter \u201eMeine Tickets\u201c auf unserer Website deine Tickets jederzeit abrufen.',
      },
    ],
  },
  {
    title: "Einlass",
    emoji: "🚪",
    items: [
      {
        q: "Was muss ich zum Einlass mitbringen?",
        a: "Du musst dich ausweisen können (Personalausweis oder Reisepass). Dein Ticket zeigst du digital auf dem Handy vor – bitte den QR-Code größer zoomen.",
      },
      {
        q: "Ab welchem Alter komme ich rein?",
        a: "Die Altersfreigabe variiert je nach Event. Bei den meisten Events ist der Einlass ab 16 Jahren möglich – mit oder ohne Muttizettel je nach Uhrzeit. Die genauen Regelungen findest du auf der jeweiligen Eventseite.",
      },
      {
        q: "Wo finde ich den Muttizettel?",
        a: "Den Muttizettel findest du auf unserer Website unter dem Menüpunkt „Muttizettel". Bitte fülle ihn vollständig aus und bringe ihn zusammen mit einer volljährigen Begleitperson mit.",
      },
      {
        q: "Gibt es einen Dresscode?",
        a: "Einige Locations haben einen Dresscode & eine Einlasspolitik. Mit einem sauberen & passenden Outfit und normalem Auftreten freuen wir uns, mit dir zu feiern!",
      },
    ],
  },
  {
    title: "Vor Ort",
    emoji: "📍",
    items: [
      {
        q: "Gibt es vor Ort Essen?",
        a: "Das hängt von der jeweiligen Location ab. In den meisten Locations gibt es Snacks und Getränke. Details findest du auf der Eventseite der jeweiligen Veranstaltung.",
      },
      {
        q: "Gibt es eine Garderobe?",
        a: "Die meisten Locations bieten eine Garderobe an. Die Kosten variieren je nach Location (in der Regel 1–2 €). Bitte beachte, dass wir keine Haftung für abgegebene Gegenstände übernehmen.",
      },
      {
        q: "Kann man vor Ort parken?",
        a: "Parkmöglichkeiten variieren je nach Location. Wir empfehlen die Anreise mit öffentlichen Verkehrsmitteln. Details findest du auf der jeweiligen Eventseite.",
      },
      {
        q: "Kann man vor Ort mit Karte zahlen?",
        a: "In den meisten Locations kannst du mit Karte zahlen. Wir empfehlen dennoch, etwas Bargeld dabei zu haben, da es je nach Location Unterschiede geben kann.",
      },
    ],
  },
  {
    title: "Gruppen & Events",
    emoji: "👥",
    items: [
      {
        q: "Wir feiern einen JGA / Geburtstag / Firmenfeier.",
        a: "Super! Für Gruppenanfragen schreib uns gerne eine Mail an mail@partyticket.app mit Angabe des Events, der Personenanzahl und eures Anlasses. Wir kümmern uns um ein tolles Erlebnis für eure Gruppe!",
      },
      {
        q: "Ich möchte eine Abiparty veranstalten.",
        a: "Wir bieten Abschlussklassen exklusive Abipartys im Club an – ideal, um die Abikasse kostenlos & risikofrei aufzubessern. Schreib uns für mehr Infos!",
      },
    ],
  },
  {
    title: "Kontakt",
    emoji: "💬",
    items: [
      {
        q: "Wie erreiche ich euch?",
        a: "Am besten per E-Mail: mail@partyticket.app. Alternativ über Instagram oder unsere WhatsApp-Gruppe. Wir antworten in der Regel innerhalb von 24 Stunden.",
      },
      {
        q: "Ich möchte meine Location als Veranstaltungsort anbieten.",
        a: "Das freut uns! Schreib uns eine E-Mail an mail@partyticket.app mit Infos zu deiner Location (Kapazität, Adresse, technische Ausstattung). Wir melden uns dann bei dir!",
      },
    ],
  },
];

const FAQAccordionItem = ({ q, a, isLast }: FAQItem & { isLast: boolean }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="overflow-hidden transition-all"
      style={{
        borderBottom: isLast ? "none" : "1px solid hsl(220 20% 18%)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors"
        style={{ background: open ? "hsl(220 30% 14%)" : "transparent" }}
      >
        <span className="text-sm sm:text-base font-semibold pr-4" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: open ? "hsl(230 80% 56% / 0.2)" : "hsl(0 0% 100% / 0.06)" }}
        >
          <ChevronDown className="w-4 h-4" style={{ color: open ? "hsl(230 80% 60%)" : "hsl(0 0% 100% / 0.4)" }} />
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
            <p className="px-4 sm:px-5 pb-5 text-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => {
  const [search, setSearch] = useState("");

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
    <PageLayout title="" subtitle="">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
            style={{ background: "hsl(230 80% 56% / 0.15)", border: "1px solid hsl(230 80% 56% / 0.2)" }}
          >
            <HelpCircle className="w-8 h-8" style={{ color: "hsl(230 80% 60%)" }} />
          </div>
          <h1
            className="text-3xl sm:text-5xl font-black uppercase mb-3"
            style={{ color: "hsl(0 0% 100%)", letterSpacing: "-0.02em" }}
          >
            Häufige Fragen
          </h1>
          <p className="text-sm sm:text-base" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Alles was du wissen musst – schnell und einfach.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          className="relative mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "hsl(0 0% 100% / 0.3)" }} />
          <input
            type="text"
            placeholder="Suche nach einer Frage..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl text-sm focus:outline-none transition-all"
            style={{
              background: "hsl(220 25% 12%)",
              border: "1px solid hsl(220 20% 18%)",
              color: "hsl(0 0% 100%)",
            }}
          />
        </motion.div>

        {/* Categories */}
        <div className="space-y-6">
          {filteredCategories.map((cat, catIdx) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + catIdx * 0.05 }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-lg">{cat.emoji}</span>
                <h2
                  className="text-xs font-black uppercase tracking-[0.15em]"
                  style={{ color: "hsl(230 80% 60%)" }}
                >
                  {cat.title}
                </h2>
              </div>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "hsl(220 25% 11%)",
                  border: "1px solid hsl(220 20% 16%)",
                }}
              >
                {cat.items.map((item, idx) => (
                  <FAQAccordionItem key={item.q} q={item.q} a={item.a} isLast={idx === cat.items.length - 1} />
                ))}
              </div>
            </motion.div>
          ))}
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                Keine Ergebnisse für „{search}" gefunden.
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12 p-6 sm:p-8 rounded-2xl"
          style={{ background: "hsl(220 25% 11%)", border: "1px solid hsl(220 20% 16%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "hsl(0 0% 100% / 0.9)" }}>
            Deine Frage war nicht dabei?
          </p>
          <p className="text-xs mb-4" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
            Schreib uns – wir helfen dir gerne weiter.
          </p>
          <a
            href="/kontakt"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wide transition-all hover:scale-[1.02]"
            style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}
          >
            Kontakt aufnehmen
          </a>
        </motion.div>
      </div>
    </PageLayout>
  );
};

export default FAQ;
