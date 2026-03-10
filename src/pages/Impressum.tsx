import { PageLayout } from "@/components/PageLayout";
import { usePageContent } from "@/hooks/usePageContent";

const headingClass = "text-foreground font-display";

const fallbackSections = [
  { title: "Angaben gemäß § 5 TMG", body: "Swaye Event & Gastro UG (haftungsbeschränkt)\nJoshua Eiffinger\nHolzhofstraße 17\n55116 Mainz" },
  { title: "Vertreten durch", body: "Joshua Eiffinger" },
  { title: "Kontakt", body: "E-Mail: info@nightlifeticket.app" },
  { title: "EU-Streitschlichtung", body: "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr" },
  { title: "Verbraucherstreitbeilegung / Universalschlichtungsstelle", body: "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen." },
  { title: "Haftung für Inhalte", body: "Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich." },
  { title: "Haftung für Links", body: "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben." },
  { title: "Urheberrecht", body: "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht." },
];

const Impressum = () => {
  const { content, loading } = usePageContent("impressum");
  const sections = content?.sections || fallbackSections;
  const subtitle = content?.subtitle || "Angaben gemäß § 5 TMG";

  return (
    <PageLayout title="Impressum" subtitle={subtitle}>
      <div className="space-y-6">
        {loading ? (
          <p style={{ color: "hsl(220 10% 50%)" }}>Laden...</p>
        ) : (
          sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-lg font-bold uppercase mb-2" style={headingStyle}>
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

export default Impressum;
