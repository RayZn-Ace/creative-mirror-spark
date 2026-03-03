import { PageLayout } from "@/components/PageLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Ab welchem Alter darf ich an den Events teilnehmen?",
    a: "Unsere Events sind ab 16 Jahren. Unter 18 Jahren benötigst du einen gültigen Muttizettel, den du ausgefüllt und unterschrieben mitbringen musst.",
  },
  {
    q: "Muss ich mein Ticket ausdrucken?",
    a: "Nein! Du kannst dein Ticket digital auf dem Handy vorzeigen. Bitte zoome den QR-Code beim Vorzeigen etwas größer.",
  },
  {
    q: "Kann ich mein Ticket zurückgeben?",
    a: "Eine Rückerstattung ist leider nur bei Absage der Veranstaltung durch den Veranstalter möglich. Tickets können aber an andere Personen weitergegeben werden.",
  },
  {
    q: "Was ist, wenn das Event ausverkauft ist?",
    a: "Wenn ein Event ausverkauft ist, kannst du dich auf unsere Warteliste setzen lassen. Folge uns auf Instagram für Updates!",
  },
  {
    q: "Gibt es eine Garderobe?",
    a: "Ja, in den meisten Locations gibt es eine Garderobe. Bitte beachte, dass wir keine Haftung für abgegebene Gegenstände übernehmen.",
  },
  {
    q: "Wie kann ich Promoter werden?",
    a: "Melde dich einfach bei uns per WhatsApp oder Instagram (@nachtaktiv.events). Wir erklären dir alles Weitere persönlich!",
  },
  {
    q: "Welche Zahlungsmethoden werden akzeptiert?",
    a: "Du kannst per Kreditkarte, PayPal, Apple Pay und Google Pay bezahlen. Barzahlung ist online nicht möglich.",
  },
  {
    q: "Darf ich Getränke oder Essen mitbringen?",
    a: "Nein, das Mitbringen von eigenen Getränken und Speisen ist nicht gestattet. In der Location gibt es ausreichend Angebote.",
  },
];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
      >
        <span className="text-sm sm:text-base font-bold pr-4" style={{ color: "hsl(0 0% 100%)" }}>
          {q}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 shrink-0" style={{ color: "hsl(0 70% 55%)" }} />
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
            <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => (
  <PageLayout title="FAQ" subtitle="Häufig gestellte Fragen">
    <div className="space-y-3">
      {faqs.map((faq) => (
        <FAQItem key={faq.q} q={faq.q} a={faq.a} />
      ))}
    </div>
  </PageLayout>
);

export default FAQ;
