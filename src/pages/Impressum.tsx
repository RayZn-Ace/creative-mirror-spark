import { PageLayout } from "@/components/PageLayout";

const Impressum = () => (
  <PageLayout title="Impressum" subtitle="Angaben gemäß § 5 TMG">
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Angaben gemäß § 5 TMG
        </h2>
        <p>
          Gimme Gimme Party<br />
          c/o IP-Management #6097<br />
          Ludwig-Erhard-Straße 18<br />
          20459 Hamburg
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Vertreten durch
        </h2>
        <p>Son Thai</p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Kontakt
        </h2>
        <p>
          Telefon: +49 (0) 1622 537 300<br />
          E-Mail: mail@gimmegimmeparty.com
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
        </h2>
        <p>
          Gimme Gimme Party<br />
          c/o IP-Management #6097<br />
          Ludwig-Erhard-Straße 18<br />
          20459 Hamburg
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
