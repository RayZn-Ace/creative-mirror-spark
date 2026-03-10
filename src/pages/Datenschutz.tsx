import { PageLayout } from "@/components/PageLayout";
import { usePageContent } from "@/hooks/usePageContent";

const headingClass = "text-foreground font-display";

/* ── Hardcoded fallback ── */
const fallbackSections = [
  { title: "1. Verantwortlicher", body: "Verantwortlich für die Verarbeitung Ihrer personenbezogenen Daten auf dieser Website ist:\nSwaye Event & Gastro UG (haftungsbeschränkt)\nJoshua Eiffinger\nHolzhofstraße 17\n55116 Mainz\nE-Mail: info@nightlifeticket.app" },
  { title: "2. Erhebung und Speicherung personenbezogener Daten", body: "Beim Aufrufen unserer Website erheben wir Informationen, die Ihr Browser automatisch an unseren Server übermittelt (IP-Adresse, Datum/Uhrzeit, URL, Referrer, Browser). Diese Daten werden zur Sicherstellung eines reibungslosen Verbindungsaufbaus verwendet. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO." },
  { title: "3. Weitergabe von Daten", body: "Ihre Daten werden nur an Dritte weitergegeben, wenn dies für die Vertragsabwicklung erforderlich ist (z.B. Zahlungsdienstleister, IT-Dienstleister). Eine darüber hinausgehende Weitergabe erfolgt nur mit ausdrücklicher Zustimmung." },
  { title: "4. Zahlungsabwicklung", body: "Wir bieten verschiedene Zahlungsmethoden an, bei deren Nutzung Daten an die entsprechenden Zahlungsdienstleister übermittelt werden." },
  { title: "5. Cookies", body: "Unsere Website verwendet Cookies. Notwendige Cookies sind für die Funktion erforderlich (Art. 6 Abs. 1 lit. f DSGVO). Für analytische Cookies holen wir Ihre Einwilligung ein (Art. 6 Abs. 1 lit. a DSGVO)." },
  { title: "6. Ihre Rechte", body: "Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung (Art. 18 DSGVO), Widerspruch (Art. 21 DSGVO) und Datenübertragbarkeit (Art. 20 DSGVO)." },
  { title: "7. Dauer der Datenspeicherung", body: "Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies zur Erfüllung der genannten Zwecke erforderlich ist oder wie es gesetzliche Aufbewahrungspflichten vorsehen." },
  { title: "8. Kontakt", body: "Bei Fragen wenden Sie sich an:\nSwaye Event & Gastro UG (haftungsbeschränkt)\nJoshua Eiffinger\nHolzhofstraße 17\n55116 Mainz\nE-Mail: info@nightlifeticket.app" },
];

const Datenschutz = () => {
  const { content, loading } = usePageContent("datenschutz");
  const sections = content?.sections || fallbackSections;
  const subtitle = content?.subtitle || "Datenschutzerklärung";

  return (
    <PageLayout title="Datenschutz" subtitle={subtitle}>
      <div className="space-y-6 text-sm leading-relaxed">
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

export default Datenschutz;
