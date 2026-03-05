import { PageLayout } from "@/components/PageLayout";

const Datenschutz = () => (
  <PageLayout title="Datenschutz" subtitle="Datenschutzerklärung">
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          1. Datenschutz auf einen Blick
        </h2>
        <p>
          Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          2. Datenerfassung auf unserer Website
        </h2>
        <p>
          <strong style={{ color: "hsl(0 0% 100%)" }}>Wer ist verantwortlich für die Datenerfassung?</strong><br />
          Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber Gimme Gimme Party.
        </p>
        <p className="mt-3">
          <strong style={{ color: "hsl(0 0% 100%)" }}>Wie erfassen wir Ihre Daten?</strong><br />
          Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z.B. beim Ticketkauf oder Kontaktformular). Andere Daten werden automatisch beim Besuch der Website durch unsere IT-Systeme erfasst (z.B. Browser, Betriebssystem, Uhrzeit des Seitenaufrufs).
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          3. Cookies
        </h2>
        <p>
          Unsere Website verwendet Cookies. Cookies sind kleine Textdateien, die auf Ihrem Rechner abgelegt werden und die Ihr Browser speichert. Die meisten der von uns verwendeten Cookies sind sogenannte „Session-Cookies", die nach Ende Ihres Besuchs automatisch gelöscht werden.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          4. Ihre Rechte
        </h2>
        <p>
          Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung, Sperrung oder Löschung dieser Daten zu verlangen.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          5. Kontakt
        </h2>
        <p>
          Bei Fragen zum Datenschutz kontaktieren Sie uns unter:<br />
          E-Mail: mail@gimmegimmeparty.com
        </p>
      </div>
    </div>
  </PageLayout>
);

export default Datenschutz;
