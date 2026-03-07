import { PageLayout } from "@/components/PageLayout";

const sectionHeading = "text-lg font-bold uppercase mb-2";
const sectionStyle = { color: "hsl(220 20% 15%)", fontFamily: "'Orbitron', sans-serif" };

const Impressum = () => (
  <PageLayout title="Impressum" subtitle="Angaben gemäß § 5 TMG">
    <div className="space-y-6">
      <div>
        <h2 className={sectionHeading} style={sectionStyle}>Angaben gemäß § 5 TMG</h2>
        <p>SMEA GmbH<br />Kothöferdamm 7<br />30177 Hannover</p>
        <p className="mt-2">Handelsregister: HRB 218216<br />Registergericht: Amtsgericht Hannover</p>
      </div>
      <div>
        <h2 className={sectionHeading} style={sectionStyle}>Vertreten durch</h2>
        <p>Dennis Pokorny</p>
      </div>
      <div>
        <h2 className={sectionHeading} style={sectionStyle}>Kontakt</h2>
        <p>Telefon: +49 511 12282957<br />E-Mail: <a href="mailto:dennis@smea.info" className="text-primary hover:underline">dennis@smea.info</a></p>
      </div>
      <div>
        <h2 className={sectionHeading} style={sectionStyle}>Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />DE323622049</p>
      </div>
      <div>
        <h2 className={sectionHeading} style={sectionStyle}>EU-Streitschlichtung</h2>
        <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://ec.europa.eu/consumers/odr</a>.
        </p>
        <p className="mt-2">Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
      </div>
      <div>
        <h2 className={sectionHeading} style={sectionStyle}>Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
        <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </div>
      <div>
        <h2 className={sectionHeading} style={sectionStyle}>Haftung für Inhalte</h2>
        <p>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
        <p className="mt-2">Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.</p>
      </div>
      <div>
        <h2 className={sectionHeading} style={sectionStyle}>Haftung für Links</h2>
        <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.</p>
        <p className="mt-2">Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.</p>
      </div>
      <div>
        <h2 className={sectionHeading} style={sectionStyle}>Urheberrecht</h2>
        <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>
      </div>
    </div>
  </PageLayout>
);

export default Impressum;
