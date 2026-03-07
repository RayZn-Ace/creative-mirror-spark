import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search, HelpCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
    title: "Tickets",
    emoji: "🎟️",
    items: [
      {
        q: "Muss ich mein Ticket ausdrucken?",
        a: "Nein! Du kannst dein Ticket bequem digital auf deinem Handy vorzeigen. Bitte zoome beim Vorzeigen den QR-Code etwas größer, damit er schnell gescannt werden kann.",
      },
      {
        q: "Wo finde ich meine Tickets nach dem Kauf?",
        a: 'Du erhältst deine Tickets per E-Mail an die beim Kauf angegebene Adresse. Alternativ kannst du unter "Meine Tickets" auf unserer Website deine Tickets jederzeit abrufen.',
      },
      {
        q: "Kann ich mein Ticket stornieren?",
        a: "Eine Stornierung ist leider grundsätzlich nicht möglich, da es sich um ein Event handelt. Du kannst dein Ticket aber problemlos an eine andere Person weitergeben. Bei Veranstaltungsausfall durch den Veranstalter erhältst du selbstverständlich eine Rückerstattung.",
      },
      {
        q: "Was passiert wenn die Veranstaltung verschoben wird?",
        a: "Falls eine Veranstaltung verschoben wird, behält dein Ticket seine Gültigkeit für den neuen Termin. Du wirst per E-Mail über alle Änderungen informiert.",
      },
    ],
  },
  {
    title: "Allgemein",
    emoji: "ℹ️",
    items: [
      {
        q: "Wo finden die Events statt?",
        a: "Unsere Events finden im Finn's Penthouse Eventlocation in Mainz statt (Holzhofstraße 1, 55116 Mainz).",
      },
      {
        q: "Wie erreiche ich euch?",
        a: "Am besten per E-Mail: mail@nightlifegeneration.de. Alternativ über Instagram oder unseren Support-Chat. Wir antworten in der Regel innerhalb von 24 Stunden.",
      },
      {
        q: "Gibt es eine Garderobe?",
        a: "Ja, es gibt eine Garderobe vor Ort. Die Kosten liegen bei ca. 1–2 €. Bitte beachte, dass wir keine Haftung für abgegebene Gegenstände übernehmen.",
      },
      {
        q: "Kann man vor Ort mit Karte zahlen?",
        a: "Ja, Kartenzahlung ist möglich. Wir empfehlen dennoch, etwas Bargeld dabei zu haben.",
      },
      {
        q: "Kann man vor Ort parken?",
        a: "Parkmöglichkeiten sind in der Umgebung vorhanden. Wir empfehlen die Anreise mit öffentlichen Verkehrsmitteln.",
      },
    ],
  },
  {
    title: "U18",
    emoji: "🔞",
    items: [
      {
        q: "Ab welchem Alter komme ich rein?",
        a: "Bei den meisten unserer Events ist der Einlass ab 16 Jahren möglich – ohne Muttizettel bis Mitternacht, oder mit Muttizettel & volljähriger Begleitperson auch länger. Die genauen Einlass-Bedingungen findest du auf der jeweiligen Eventseite.",
      },
      {
        q: "Was ist ein Muttizettel und wo finde ich ihn?",
        a: "Der Muttizettel ist eine Einverständniserklärung deiner Eltern, die es dir erlaubt, als Minderjährige/r an unseren Events teilzunehmen. Du findest ihn auf unserer Website unter dem Menüpunkt „Muttizettel". Bitte fülle ihn vollständig aus und bringe ihn zusammen mit einer volljährigen Begleitperson mit.",
      },
      {
        q: "Was muss ich zum Einlass mitbringen?",
        a: "Du musst dich ausweisen können (Personalausweis oder Reisepass). Unter 18 brauchst du zusätzlich einen ausgefüllten Muttizettel und eine volljährige Begleitperson. Dein Ticket zeigst du digital auf dem Handy vor.",
      },
    ],
  },
  {
    title: "Musik",
    emoji: "🎵",
    items: [
      {
        q: "Welche Musik wird gespielt?",
        a: "Bei unseren XXL-Schülerpartys erwartet dich ein Mix aus aktuellen Charts, Hip-Hop, R&B, Dance und Party-Hits. Unsere DJs sorgen dafür, dass für jeden Geschmack etwas dabei ist!",
      },
      {
        q: "Kann ich mir Musik wünschen?",
        a: "Klar! Sprich unsere DJs vor Ort gerne an. Wir versuchen, so viele Wünsche wie möglich zu berücksichtigen.",
      },
    ],
  },
  {
    title: "Jobs",
    emoji: "💪",
    items: [
      {
        q: "Wie kann ich bei euch arbeiten?",
        a: "Wir suchen regelmäßig Promoter, Fotografen und Helfer für unsere Events. Schau auf unserer Jobs-Seite vorbei oder schreib uns direkt eine Nachricht!",
      },
      {
        q: "Ich möchte Promoter werden.",
        a: "Super! Als Promoter verdienst du Geld, indem du Tickets für unsere Events verkaufst. Melde dich über unsere Promoter-Seite an oder schreib uns eine E-Mail.",
      },
    ],
  },
  {
    title: "Gästeliste",
    emoji: "📋",
    items: [
      {
        q: "Gibt es eine Gästeliste?",
        a: "Bei ausgewählten Events bieten wir eine Gästeliste an. Informationen dazu findest du auf der jeweiligen Eventseite oder kontaktiere uns direkt.",
      },
      {
        q: "Wir feiern einen JGA / Geburtstag – gibt es Gruppenangebote?",
        a: "Ja! Für Gruppenanfragen schreib uns gerne eine Mail mit Angabe des Events, der Personenanzahl und eures Anlasses. Wir kümmern uns um ein tolles Erlebnis für eure Gruppe!",
      },
    ],
  },
  {
    title: "Sonstiges",
    emoji: "❓",
    items: [
      {
        q: "Gibt es einen Dresscode?",
        a: "Einige Events haben einen Dresscode. Mit einem sauberen & passenden Outfit und normalem Auftreten freuen wir uns, mit dir zu feiern!",
      },
      {
        q: "Ich möchte meine Location als Veranstaltungsort anbieten.",
        a: "Das freut uns! Schreib uns eine E-Mail mit Infos zu deiner Location (Kapazität, Adresse, technische Ausstattung). Wir melden uns dann bei dir!",
      },
      {
        q: "Ich möchte eine Abiparty veranstalten.",
        a: "Wir bieten Abschlussklassen exklusive Abipartys im Club an – ideal, um die Abikasse kostenlos & risikofrei aufzubessern. Schreib uns für mehr Infos!",
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
        borderBottom: isLast ? "none" : "1px solid hsl(220 15% 90%)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors"
        style={{ background: open ? "hsl(220 20% 97%)" : "transparent" }}
      >
        <span className="text-sm sm:text-base font-semibold pr-4" style={{ color: "hsl(220 20% 20%)" }}>
          {q}
        </span>
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
            <p className="px-4 sm:px-5 pb-5 text-sm leading-relaxed" style={{ color: "hsl(220 10% 40%)" }}>
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{ background: "hsl(230 80% 56% / 0.1)", border: "1px solid hsl(230 80% 56% / 0.15)" }}
            >
              <HelpCircle className="w-8 h-8" style={{ color: "hsl(230 80% 50%)" }} />
            </div>
            <h1
              className="text-3xl sm:text-5xl font-black uppercase mb-3"
              style={{ color: "hsl(220 20% 15%)", letterSpacing: "-0.02em" }}
            >
              Häufige Fragen
            </h1>
            <p className="text-sm sm:text-base" style={{ color: "hsl(220 10% 50%)" }}>
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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "hsl(220 10% 60%)" }} />
            <input
              type="text"
              placeholder="Suche nach einer Frage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl text-sm focus:outline-none transition-all"
              style={{
                background: "hsl(220 20% 97%)",
                border: "1px solid hsl(220 15% 90%)",
                color: "hsl(220 20% 15%)",
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
                    style={{ color: "hsl(230 80% 50%)" }}
                  >
                    {cat.title}
                  </h2>
                </div>
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "hsl(0 0% 100%)",
                    border: "1px solid hsl(220 15% 90%)",
                    boxShadow: "0 1px 3px hsl(220 20% 80% / 0.2)",
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
                <p className="text-sm" style={{ color: "hsl(220 10% 55%)" }}>
                  Keine Ergebnisse für „{search}" gefunden.
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          <motion.div
            className="text-center mt-12 p-6 sm:p-8 rounded-2xl"
            style={{ background: "hsl(220 20% 97%)", border: "1px solid hsl(220 15% 90%)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: "hsl(220 20% 20%)" }}>
              Deine Frage war nicht dabei?
            </p>
            <p className="text-xs mb-4" style={{ color: "hsl(220 10% 50%)" }}>
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
      </div>
      <Footer />
    </div>
  );
};

export default FAQ;
