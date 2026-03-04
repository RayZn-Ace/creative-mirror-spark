import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: "Allgemein",
    items: [
      {
        q: "Kann ich mit meinen Kindern kommen, die unter 18 Jahre alt sind?",
        a: "Ja! Die Show ist für alle Altersgruppen geeignet. Unter 16 Jahren nur in Begleitung eines Erziehungsberechtigten, ab 16 mit einem vollständig ausgefüllten Muttizettel. Den Muttizettel findest du auf unserer Website unter dem entsprechenden Menüpunkt.",
      },
      {
        q: "Können auch Männer kommen?",
        a: "Na klar! Unsere Shows sind für ALLE da – egal ob Frau, Mann oder divers. Jeder ist willkommen und wird eine großartige Zeit haben!",
      },
      {
        q: "Ich würde gerne einen Tisch / Lounge mieten?",
        a: "Tisch- und Lounge-Reservierungen hängen von der jeweiligen Location ab. Bitte wende dich direkt an die Location oder schreib uns eine E-Mail an mail@gimmegimmeparty.com – wir helfen dir gerne weiter!",
      },
    ],
  },
  {
    title: "Gruppen",
    items: [
      {
        q: "Wir feiern einen JGA/Geburtstag/Firmenfeier (größere Gruppe).",
        a: "Super! Für Gruppenanfragen ab 10 Personen schreib uns gerne eine Mail an mail@gimmegimmeparty.com mit Angabe des Events, der Personenanzahl und eures Anlasses. Wir kümmern uns um ein tolles Erlebnis für eure Gruppe!",
      },
    ],
  },
  {
    title: "Show",
    items: [
      {
        q: "Wie lange geht die Show?",
        a: "Die Show geht ca. 2 Stunden und 15 Minuten. Einlass ist je nach Event unterschiedlich – schau bitte auf deinem Ticket nach der genauen Uhrzeit.",
      },
      {
        q: "Weshalb geht die Show 'nur 02:15'?",
        a: "Unsere Show ist ein intensives Live-Erlebnis mit professionellen Sänger:innen, Tänzer:innen und einer aufwendigen Licht- und Soundproduktion. 2 Stunden und 15 Minuten pures Entertainment – da bleibt keine Sekunde langweilig!",
      },
      {
        q: "Was passiert vor der Show?",
        a: "Vor der Show gibt es einen Warm-Up mit DJ-Musik, damit ihr euch schon mal in Stimmung bringen könnt. Nutzt die Zeit, euch Drinks zu holen und den besten Platz zu sichern!",
      },
      {
        q: "Wie sieht das Programm aus?",
        a: "Das genaue Programm bleibt eine Überraschung! Aber so viel sei verraten: Es erwartet euch ein Mix aus den größten Hits, einer mitreißenden Show, interaktiven Momenten und jeder Menge Party-Stimmung.",
      },
    ],
  },
  {
    title: "Vor Ort",
    items: [
      {
        q: "Gibt es vor Ort Essen?",
        a: "Das hängt von der jeweiligen Location ab. In den meisten Locations gibt es Snacks und Getränke. Details findest du auf der Eventseite der jeweiligen Veranstaltung.",
      },
      {
        q: "Gibt es eine Garderobe und wie viel kostet die?",
        a: "Die meisten Locations bieten eine Garderobe an. Die Kosten variieren je nach Location (in der Regel 1-2€). Bitte beachte, dass wir keine Haftung für abgegebene Gegenstände übernehmen.",
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
    title: "Tickets",
    items: [
      {
        q: "Was passiert wenn die Veranstaltung/Location verschoben wird?",
        a: "Falls eine Veranstaltung verschoben wird, behält dein Ticket seine Gültigkeit für den neuen Termin. Du wirst per E-Mail über alle Änderungen informiert. Sollte der neue Termin für dich nicht passen, kannst du eine Umbuchung beantragen.",
      },
      {
        q: "Kann ich mein Ticket stornieren?",
        a: "Eine Stornierung ist leider grundsätzlich nicht möglich, da es sich um ein Event handelt. Du kannst dein Ticket aber problemlos an eine andere Person weitergeben. Bei Veranstaltungsausfall durch den Veranstalter erhältst du selbstverständlich eine Rückerstattung.",
      },
      {
        q: "Kann ich mein Ticket umbuchen?",
        a: "Ja! Über unsere Ticket-Umbuchungsseite kannst du dein Ticket auf ein anderes Datum oder eine andere Location umbuchen. Bitte beachte, dass eine Bearbeitungsgebühr von 5€ anfällt.",
      },
      {
        q: "Auf welchen Ticketshops kann ich Tickets kaufen?",
        a: "Tickets gibt es direkt über unsere Website, sowie bei ausgewählten Vorverkaufsstellen. Über unseren offiziellen Ticketshop erhältst du garantiert echte Tickets zum besten Preis.",
      },
    ],
  },
  {
    title: "Kontakt",
    items: [
      {
        q: "Ich brauche eine Telefonnummer / Ansprechpartner",
        a: "Wir sind am besten per E-Mail erreichbar: mail@gimmegimmeparty.com. Alternativ kannst du uns über Instagram oder unsere WhatsApp-Gruppe kontaktieren. Wir antworten in der Regel innerhalb von 24 Stunden.",
      },
    ],
  },
  {
    title: "Booking",
    items: [
      {
        q: "Ich würde euch gerne bei uns in der Location haben",
        a: "Das freut uns! Schreib uns gerne eine E-Mail an mail@gimmegimmeparty.com mit Infos zu deiner Location (Kapazität, Adresse, technische Ausstattung). Wir melden uns dann bei dir!",
      },
    ],
  },
  {
    title: "Media",
    items: [
      {
        q: "Wo finde ich Fotos & Videos?",
        a: "Fotos und Videos von vergangenen Events findest du auf unserer Fotos-Seite sowie auf unseren Social-Media-Kanälen (Instagram, TikTok, YouTube).",
      },
    ],
  },
];

const FAQAccordionItem = ({ q, a }: FAQItem) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="overflow-hidden transition-all"
      style={{
        background: "hsl(220 20% 12%)",
        borderBottom: "1px solid hsl(220 15% 18%)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm sm:text-base font-medium pr-4 text-foreground">
          {q}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed">
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
        <div className="text-center mb-10">
          <h1
            className="text-4xl md:text-6xl font-black uppercase mb-4"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            FAQ & <span className="text-primary">Support</span>
          </h1>
          <p className="text-muted-foreground">
            Hier findest du Antworten auf die häufigsten Fragen.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="FAQ durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl text-sm bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {filteredCategories.map((cat) => (
            <div key={cat.title}>
              <h2
                className="text-xs font-black uppercase tracking-widest mb-3 text-primary"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                {cat.title}
              </h2>
              <div className="rounded-xl overflow-hidden border border-border">
                {cat.items.map((item) => (
                  <FAQAccordionItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
          {filteredCategories.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Keine Ergebnisse für „{search}" gefunden.
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default FAQ;
