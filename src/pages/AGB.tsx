import { PageLayout } from "@/components/PageLayout";
import { usePageContent } from "@/hooks/usePageContent";

const headingClass = "text-foreground font-display";

const fallbackSections = [
  { title: "§ 1 Geltungsbereich", body: "Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge, die über die Website zwischen dem Veranstalter und dem Kunden geschlossen werden." },
  { title: "§ 2 Vertragsschluss", body: "Durch das Bestellen eines Tickets gibt der Kunde ein verbindliches Angebot zum Kauf ab. Der Vertrag kommt mit der Bestätigung per E-Mail zustande." },
  { title: "§ 3 Preise und Zahlung", body: "Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer. Eine Rückerstattung ist nur bei Absage der Veranstaltung durch den Veranstalter möglich." },
  { title: "§ 4 Einlass & Hausrecht", body: "Der Veranstalter behält sich das Hausrecht vor. Personen unter Einfluss von Betäubungsmitteln oder mit aggressivem Verhalten kann der Zutritt verweigert werden." },
  { title: "§ 5 Haftung", body: "Die Haftung des Veranstalters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. Für die Garderobe wird keine Haftung übernommen." },
  { title: "§ 6 Widerrufsrecht", body: "Gemäß § 312g Abs. 2 Nr. 9 BGB besteht bei Verträgen zur Erbringung von Dienstleistungen im Zusammenhang mit Freizeitbetätigungen kein Widerrufsrecht." },
];

const AGB = () => {
  const { content, loading } = usePageContent("agb");
  const sections = content?.sections || fallbackSections;
  const subtitle = content?.subtitle || "Allgemeine Geschäftsbedingungen";

  return (
    <PageLayout title="AGB" subtitle={subtitle}>
      <div className="space-y-6">
        {loading ? (
          <p style={{ color: "hsl(220 10% 50%)" }}>Laden...</p>
        ) : (
          sections.map((section, idx) => (
            <div key={idx}>
              <h2 className={`text-lg font-bold uppercase mb-2 ${headingClass}`}>
                {section.title}
              </h2>
              {section.body.split("\n").map((line, lineIdx) => (
                <p key={lineIdx} className={lineIdx > 0 ? "mt-1" : ""}>
                  {line}
                </p>
              ))}
            </div>
          ))
        )}
      </div>
    </PageLayout>
  );
};

export default AGB;
