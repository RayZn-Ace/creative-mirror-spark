import { PageLayout } from "@/components/PageLayout";

const headingStyle = { color: "hsl(220 20% 15%)", fontFamily: "'Orbitron', sans-serif" };

const Datenschutz = () => (
  <PageLayout title="Datenschutz" subtitle="Datenschutzerklärung">
    <div className="space-y-6 text-sm leading-relaxed">
      <p>
        Wir freuen uns, dass Sie unsere Website besuchen. Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Nachfolgend informieren wir Sie ausführlich über den Umgang mit Ihren Daten gemäß der Datenschutz-Grundverordnung (DSGVO).
      </p>

      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={headingStyle}>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Verarbeitung Ihrer personenbezogenen Daten auf dieser Website ist:<br />
          Swaye Event &amp; Gastro UG (haftungsbeschränkt)<br />
          Joshua Eiffinger<br />
          Holzhofstraße 1<br />
          55116 Mainz<br />
          E-Mail: <a href="mailto:info@nightlifeticket.app" className="text-primary hover:underline">info@nightlifeticket.app</a>
        </p>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={headingStyle}>2. Erhebung und Speicherung personenbezogener Daten sowie Art und Zweck ihrer Verwendung</h2>

        <h3 className="font-bold mt-4 mb-1" style={{ color: "hsl(220 20% 15%)" }}>a) Beim Besuch der Website</h3>
        <p>Beim Aufrufen unserer Website erheben wir folgende Informationen, die Ihr Browser automatisch an unseren Server übermittelt:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>IP-Adresse</li>
          <li>Datum und Uhrzeit des Zugriffs</li>
          <li>Name und URL der abgerufenen Datei</li>
          <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
          <li>Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners</li>
        </ul>
        <p className="mt-2">Diese Daten werden ausschließlich zur Sicherstellung eines reibungslosen Verbindungsaufbaus und einer komfortablen Nutzung der Website sowie zur Auswertung der Systemsicherheit und -stabilität verwendet. Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.</p>

        <h3 className="font-bold mt-4 mb-1" style={{ color: "hsl(220 20% 15%)" }}>b) Nutzung des Ticketshops</h3>
        <p>Wenn Sie Tickets über unseren Ticketshop kaufen, erheben wir folgende Daten:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Vor- und Nachname</li>
          <li>E-Mail-Adresse</li>
          <li>Telefonnummer (falls erforderlich)</li>
          <li>Rechnungsadresse</li>
          <li>Zahlungsdaten (z.&nbsp;B. Kreditkarteninformationen oder PayPal-Daten)</li>
        </ul>
        <p className="mt-2">Die Datenverarbeitung erfolgt zum Zwecke der Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Ohne die Bereitstellung dieser Daten ist eine Ticketbuchung nicht möglich.</p>

        <h3 className="font-bold mt-4 mb-1" style={{ color: "hsl(220 20% 15%)" }}>c) Newsletter</h3>
        <p>Wenn Sie sich für unseren Newsletter anmelden, verwenden wir Ihre E-Mail-Adresse, um Ihnen regelmäßig Informationen über unsere Produkte, Angebote und Veranstaltungen zu senden.</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Rechtsgrundlage: Ihre Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO.</li>
          <li>Abmeldung: Sie können den Newsletter jederzeit über den Abmeldelink in der E-Mail oder durch eine Nachricht an uns widerrufen.</li>
        </ul>
        <p className="mt-2">Wir nutzen für den Versand des Newsletters möglicherweise externe Dienstleister. Diese agieren als Auftragsverarbeiter gemäß Art. 28 DSGVO und verarbeiten Ihre Daten nur auf unsere Weisung.</p>

        <h3 className="font-bold mt-4 mb-1" style={{ color: "hsl(220 20% 15%)" }}>d) Social Media Plugins</h3>
        <p>Unsere Website verwendet Social Media Plugins, um Ihnen die Möglichkeit zu geben, Inhalte in sozialen Netzwerken zu teilen oder uns zu folgen. Die Plugins sind von den folgenden Anbietern:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Facebook (Meta Platforms, Inc.)</li>
          <li>Instagram (Meta Platforms, Inc.)</li>
          <li>Twitter (X Corp.)</li>
        </ul>
        <p className="mt-2">Beim Besuch unserer Website werden keine Daten direkt an die Anbieter übermittelt, solange Sie das Plugin nicht aktiv nutzen. Erst wenn Sie das Plugin anklicken, werden Daten wie Ihre IP-Adresse, Browserinformationen oder die URL der besuchten Seite an den Anbieter weitergegeben.</p>
        <p className="mt-2">Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), die Sie durch Aktivierung des Plugins erteilen. Bitte beachten Sie, dass die Anbieter Ihre Daten möglicherweise in Länder außerhalb der EU übermitteln und dort verarbeiten, in denen ggf. kein vergleichbares Datenschutzniveau besteht.</p>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={headingStyle}>3. Weitergabe von Daten</h2>
        <p>Ihre Daten werden nur an Dritte weitergegeben, wenn dies für die Vertragsabwicklung erforderlich ist, z.&nbsp;B.:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Zahlungsdienstleister (z.&nbsp;B. PayPal, Stripe)</li>
          <li>Versanddienstleister (falls physische Tickets versendet werden)</li>
          <li>IT-Dienstleister, die unsere Website hosten</li>
        </ul>
        <p className="mt-2">Eine darüber hinausgehende Weitergabe Ihrer Daten erfolgt nur, wenn Sie ausdrücklich zugestimmt haben (Art. 6 Abs. 1 lit. a DSGVO) oder wenn wir gesetzlich dazu verpflichtet sind.</p>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={headingStyle}>4. Zahlungsabwicklung</h2>
        <p>Wir bieten verschiedene Zahlungsmethoden an, bei deren Nutzung Daten an die entsprechenden Zahlungsdienstleister übermittelt werden. Diese Dienstleister sind eigenständige Verantwortliche und verarbeiten Ihre Daten gemäß ihrer eigenen Datenschutzerklärungen.</p>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={headingStyle}>5. Cookies</h2>
        <p>Unsere Website verwendet Cookies, um die Nutzung zu analysieren und unser Angebot zu verbessern. Cookies sind kleine Textdateien, die auf Ihrem Endgerät gespeichert werden.</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li><strong>Notwendige Cookies:</strong> Diese Cookies sind erforderlich, damit die Website korrekt funktioniert.</li>
          <li><strong>Analytische Cookies:</strong> Mit Ihrer Einwilligung verwenden wir Cookies von Drittanbietern, um die Nutzung unserer Website zu analysieren (z.&nbsp;B. Google Analytics).</li>
        </ul>
        <p className="mt-2">Die Rechtsgrundlage für notwendige Cookies ist Art. 6 Abs. 1 lit. f DSGVO. Für alle anderen Cookies holen wir Ihre Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO ein.</p>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={headingStyle}>6. Ihre Rechte</h2>
        <p>Sie haben das Recht:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>Auskunft über die von uns gespeicherten Daten zu verlangen (Art. 15 DSGVO),</li>
          <li>die Berichtigung unrichtiger Daten zu verlangen (Art. 16 DSGVO),</li>
          <li>die Löschung Ihrer Daten zu verlangen (Art. 17 DSGVO),</li>
          <li>die Einschränkung der Verarbeitung zu verlangen (Art. 18 DSGVO),</li>
          <li>der Verarbeitung zu widersprechen (Art. 21 DSGVO),</li>
          <li>Ihre Daten in einem strukturierten, gängigen Format zu erhalten (Art. 20 DSGVO).</li>
        </ul>
        <p className="mt-2">Wenn Sie der Meinung sind, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt, können Sie sich bei der zuständigen Aufsichtsbehörde beschweren (Art. 77 DSGVO).</p>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={headingStyle}>7. Dauer der Datenspeicherung</h2>
        <p>Wir speichern Ihre personenbezogenen Daten nur so lange, wie dies zur Erfüllung der genannten Zwecke erforderlich ist oder wie es gesetzliche Aufbewahrungspflichten vorsehen.</p>
      </div>

      <div>
        <h2 className="text-lg font-bold uppercase mb-2" style={headingStyle}>8. Kontakt</h2>
        <p>
          Bei Fragen oder zur Ausübung Ihrer Rechte wenden Sie sich bitte an:<br />
          Swaye Event &amp; Gastro UG (haftungsbeschränkt)<br />
          Joshua Eiffinger<br />
          Holzhofstraße 1<br />
          55116 Mainz<br />
          E-Mail: <a href="mailto:info@nightlifeticket.app" className="text-primary hover:underline">info@nightlifeticket.app</a>
        </p>
      </div>
    </div>
  </PageLayout>
);

export default Datenschutz;
