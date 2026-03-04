import { Link } from "react-router-dom";
import { Instagram, Youtube, MessageCircle, Facebook } from "lucide-react";

const socialLinks = [
  { icon: Instagram, href: "https://www.instagram.com/mammamia.partymotto", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/profile.php?id=61577320797241", label: "Facebook" },
  { icon: Youtube, href: "https://www.youtube.com/shorts/s8-6TQHgslw", label: "YouTube" },
];

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <span className="font-display leading-none tracking-wide">
                <span className="block text-base text-foreground">GIMME GIMME</span>
                <span className="block text-xl text-gradient-primary">PARTY</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Die größte ABBA Sing-Along Party-Tour Europas – 13 Länder, 150+ Städte, 250.000+ Fans.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label={s.label}>
                  <s.icon className="w-5 h-5" />
                </a>
              ))}
              <a href="https://www.tiktok.com/@mammamia.partymotto" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                aria-label="TikTok">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.7a8.18 8.18 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.13z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg text-foreground mb-4">Schnelllinks</h3>
            <div className="flex flex-col gap-2">
              <Link to="/#events" className="text-sm text-muted-foreground hover:text-primary transition-colors">Alle Events</Link>
              <Link to="/fotos" className="text-sm text-muted-foreground hover:text-primary transition-colors">Fotos & Media</Link>
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
              <Link to="/jobs" className="text-sm text-muted-foreground hover:text-primary transition-colors">Jobs</Link>
              <Link to="/promoter" className="text-sm text-muted-foreground hover:text-primary transition-colors">Promoter werden</Link>
              <Link to="/kontakt" className="text-sm text-muted-foreground hover:text-primary transition-colors">Kontakt</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-lg text-foreground mb-4">Kontakt</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="mailto:mail@gimmegimmeparty.com" className="hover:text-primary transition-colors">mail@gimmegimmeparty.com</a>
              <a href="http://bit.ly/mammamiacommunity" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Community
              </a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display text-lg text-foreground mb-4">Rechtliches</h3>
            <div className="flex flex-col gap-2">
              <Link to="/impressum" className="text-sm text-muted-foreground hover:text-primary transition-colors">Impressum</Link>
              <Link to="/datenschutz" className="text-sm text-muted-foreground hover:text-primary transition-colors">Datenschutz</Link>
              <Link to="/agb" className="text-sm text-muted-foreground hover:text-primary transition-colors">AGB</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground space-y-1">
          <p>© {new Date().getFullYear()} GIMME GIMME PARTY. Alle Rechte vorbehalten.</p>
          <p>Homepage made by <a href="https://homepageschmied.de" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline">Homepageschmied.de</a> · powered by <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline">smea</a></p>
        </div>
      </div>
    </footer>
  );
}