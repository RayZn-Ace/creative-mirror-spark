import clubinioImg from "@/assets/clubinio.webp";

const Footer = () => {
  return (
    <footer className="mt-8 sm:mt-12 pb-6 sm:pb-8">
      {/* Contact */}
      <div className="text-center mb-6 sm:mb-8 text-xs sm:text-sm" style={{ color: "hsl(0 0% 100% / 0.85)" }}>
        <p>Fragen, Probleme oder Reservierungsanfragen?</p>
        <p>
          Kontaktiere uns:{" "}
          <a href="mailto:info@city-madness.de" className="underline hover:opacity-80 transition-opacity">
            info@city-madness.de
          </a>
        </p>
      </div>

      {/* Desktop footer */}
      <div className="hidden md:flex items-start justify-between gap-6 lg:gap-8">
        <div className="flex-1">
          <a href="https://clubinio.de/" target="_blank" rel="noopener noreferrer">
            <img src={clubinioImg} alt="Clubinio" className="h-8 lg:h-10 opacity-80 hover:opacity-100 transition-opacity" />
          </a>
          <p className="text-[9px] lg:text-[10px] mt-2 lg:mt-3 max-w-xs lg:max-w-sm" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
            Vertragspartner und Veranstalter für den Ticketkauf ist die TrendID GmbH. Die living the goodlife GmbH tritt ausschließlich als Plattform und technischer Dienstleister für den Ticketverkauf auf. Alle Informationen auf{" "}
            <a href="https://city-madness.de/agb/" className="underline">https://city-madness.de/agb/</a>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 lg:gap-6 text-[10px] lg:text-xs">
          <a href="/impressum" className="footer-link">Impressum</a>
          <a href="/datenschutz" className="footer-link">Datenschutzerklärung</a>
          <a href="/agb" className="footer-link">AGB</a>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="md:hidden text-center space-y-3">
        <a href="https://clubinio.de/" target="_blank" rel="noopener noreferrer">
          <img src={clubinioImg} alt="Clubinio" className="h-7 mx-auto opacity-80" />
        </a>
        <p className="text-[9px] px-4 leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
          Vertragspartner und Veranstalter für den Ticketkauf ist die TrendID GmbH. Die living the goodlife GmbH tritt ausschließlich als Plattform und technischer Dienstleister für den Ticketverkauf auf.
        </p>
        <div className="flex justify-center gap-4 text-[10px]">
          <a href="/impressum" className="footer-link">Impressum</a>
          <a href="/datenschutz" className="footer-link">Datenschutz</a>
          <a href="/agb" className="footer-link">AGB</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
