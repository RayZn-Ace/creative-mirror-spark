import { PageLayout } from "@/components/PageLayout";

const Impressum = () => (
  <PageLayout title="Impressum" subtitle="Angaben gemäß § 5 TMG">
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Veranstalter
        </h2>
        <p>
          Nachtaktiv Events<br />
          Musterstraße 123<br />
          33098 Paderborn<br />
          Deutschland
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Kontakt
        </h2>
        <p>
          E-Mail: info@nachtaktiv-events.de<br />
          Telefon: +49 (0) 123 456789
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
        </h2>
        <p>
          Nachtaktiv Events<br />
          Musterstraße 123<br />
          33098 Paderborn
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Haftungsausschluss
        </h2>
        <p>
          Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
        </p>
        <p className="mt-3">
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Urheberrecht
        </h2>
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
        </p>
      </div>
    </div>
  </PageLayout>
);

export default Impressum;
