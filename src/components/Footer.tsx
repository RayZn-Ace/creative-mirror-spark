import clubinioImg from "@/assets/clubinio.webp";

const Footer = () => {
  return (
    <footer className="mt-12 pb-8">
      {/* Contact */}
      <div className="text-center mb-8 text-sm" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
        <p>Fragen, Probleme oder Reservierungsanfragen?</p>
        <p>
          Kontaktiere uns:{" "}
          <a
            href="mailto:info@city-madness.de"
            className="underline hover:opacity-80 transition-opacity"
          >
            info@city-madness.de
          </a>
        </p>
      </div>

      {/* Desktop footer */}
      <div className="hidden lg:flex items-start justify-between gap-8">
        <div className="flex-1">
          <a href="https://clubinio.de/" target="_blank" rel="noopener noreferrer">
            <img src={clubinioImg} alt="Clubinio" className="h-10 opacity-80 hover:opacity-100 transition-opacity" />
          </a>
          <p className="text-[10px] mt-3 max-w-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
            Vertragspartner und Veranstalter für den Ticketkauf ist die TrendID GmbH. Die living the goodlife GmbH tritt ausschließlich als Plattform und technischer Dienstleister für den Ticketverkauf auf. Alle Informationen auf{" "}
            <a href="https://city-madness.de/agb/" className="underline">
              https://city-madness.de/agb/
            </a>
          </p>
        </div>
        <div className="flex gap-6">
          <a href="/impressum" className="footer-link">Impressum</a>
          <a href="/datenschutz" className="footer-link">Datenschutzerklärung</a>
          <a href="/agb" className="footer-link">Allgemeine Geschäftsbedingungen</a>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="lg:hidden text-center space-y-4">
        <a href="https://clubinio.de/" target="_blank" rel="noopener noreferrer">
          <img src={clubinioImg} alt="Clubinio" className="h-8 mx-auto opacity-80" />
        </a>
        <p className="text-[10px] px-4" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
          Vertragspartner und Veranstalter für den Ticketkauf ist die TrendID GmbH. Die living the goodlife GmbH tritt ausschließlich als Plattform und technischer Dienstleister für den Ticketverkauf auf.
        </p>
        <div className="flex flex-col gap-2">
          <a href="/impressum" className="footer-link">Impressum</a>
          <a href="/datenschutz" className="footer-link">Datenschutzerklärung</a>
          <a href="/agb" className="footer-link">Allgemeine Geschäftsbedingungen</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
