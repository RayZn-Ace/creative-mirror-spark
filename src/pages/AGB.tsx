import { PageLayout } from "@/components/PageLayout";

const AGB = () => (
  <PageLayout title="AGB" subtitle="Allgemeine Geschäftsbedingungen">
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          § 1 Geltungsbereich
        </h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge, die über die Website gimmegimmeparty.de zwischen dem Veranstalter (Gimme Gimme Party) und dem Kunden geschlossen werden. Abweichende AGB des Kunden werden nicht anerkannt.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          § 2 Vertragsschluss
        </h2>
        <p>
          Durch das Bestellen eines Tickets auf unserer Website gibt der Kunde ein verbindliches Angebot zum Kauf ab. Der Vertrag kommt mit der Bestätigung per E-Mail zustande. Die Darstellung der Tickets stellt kein rechtlich bindendes Angebot dar.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          § 3 Preise und Zahlung
        </h2>
        <p>
          Alle angegebenen Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer. Die Zahlung erfolgt über die auf der Website angegebenen Zahlungsmethoden. Eine Rückerstattung ist nur bei Absage der Veranstaltung durch den Veranstalter möglich.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          § 4 Einlass & Hausrecht
        </h2>
        <p>
          Der Veranstalter behält sich das Hausrecht vor. Personen unter Einfluss von Betäubungsmitteln oder mit aggressivem Verhalten kann der Zutritt verweigert werden. Ein Anspruch auf Rückerstattung besteht in diesem Fall nicht.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          § 5 Haftung
        </h2>
        <p>
          Die Haftung des Veranstalters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. Für die Garderobe wird keine Haftung übernommen. Der Besucher nimmt auf eigene Gefahr an der Veranstaltung teil.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}>
          § 6 Widerrufsrecht
        </h2>
        <p>
          Gemäß § 312g Abs. 2 Nr. 9 BGB besteht bei Verträgen zur Erbringung von Dienstleistungen im Zusammenhang mit Freizeitbetätigungen kein Widerrufsrecht, wenn im Vertrag ein bestimmter Termin vorgesehen ist.
        </p>
      </div>
    </div>
  </PageLayout>
);

export default AGB;
