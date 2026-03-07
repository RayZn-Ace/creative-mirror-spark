import { Link } from "react-router-dom";
import { Instagram, Youtube, MessageCircle, Facebook } from "lucide-react";
import { getGlobalTranslations, type GlobalTranslations } from "@/lib/i18n";
import nightlifeLogo from "@/assets/nightlife-generation-logo.png";

const socialLinks = [
  { icon: Instagram, href: "https://www.instagram.com/nightlife.generation", label: "Instagram" },
  { icon: Facebook, href: "https://www.facebook.com/nightlifegeneration", label: "Facebook" },
  { icon: Youtube, href: "https://www.youtube.com/@nightlifegeneration", label: "YouTube" },
];

export default function Footer({ gt: gtProp }: { gt?: GlobalTranslations }) {
  const gt = gtProp || getGlobalTranslations();

  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <img src={nightlifeLogo} alt="Nightlife Generation" className="h-10 w-auto" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">{gt.footerAboutDesc}</p>
            <div className="flex gap-3">
              {socialLinks.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  aria-label={s.label}>
                  <s.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg text-foreground mb-4">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Link to="/termine" className="text-sm text-muted-foreground hover:text-primary transition-colors">Termine & Tickets</Link>
              <Link to="/promoter" className="text-sm text-muted-foreground hover:text-primary transition-colors">Uns Buchen!</Link>
              <Link to="/kontakt" className="text-sm text-muted-foreground hover:text-primary transition-colors">Location anmelden</Link>
              <Link to="/promoter" className="text-sm text-muted-foreground hover:text-primary transition-colors">Partner werden</Link>
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ & Support</Link>
              <Link to="/jobs" className="text-sm text-muted-foreground hover:text-primary transition-colors text-primary">Jobs</Link>
              <Link to="/ticket-umbuchung" className="text-sm text-muted-foreground hover:text-primary transition-colors">Ticket Umbuchung</Link>
              <Link to="/kontakt" className="text-sm text-muted-foreground hover:text-primary transition-colors">Rückerstattung</Link>
              <Link to="/kontakt" className="text-sm text-muted-foreground hover:text-primary transition-colors">Kontakt</Link>
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg text-foreground mb-4">Kontakt</h3>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <a href="mailto:info@nightlifegeneration.de" className="hover:text-primary transition-colors">info@nightlifegeneration.de</a>
              <a href="https://chat.whatsapp.com/GVs4g7qn75VA4DZVWTcNRv" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-primary transition-colors">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Gruppe
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg text-foreground mb-4">Rechtliches</h3>
            <div className="flex flex-col gap-2">
              <Link to="/impressum" className="text-sm text-muted-foreground hover:text-primary transition-colors">Impressum</Link>
              <Link to="/datenschutz" className="text-sm text-muted-foreground hover:text-primary transition-colors">Datenschutz</Link>
              <Link to="/agb" className="text-sm text-muted-foreground hover:text-primary transition-colors">AGB</Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p className="font-body">© {new Date().getFullYear()} partyticket.app</p>
        </div>
      </div>
    </footer>
  );
}
