import { PageLayout } from "@/components/PageLayout";
import { Mail, MessageCircle, Instagram, Phone } from "lucide-react";

const Kontakt = () => (
  <PageLayout title="Kontakt" subtitle="Wir sind für dich da">
    <div className="space-y-8">
      <p>
        Du hast Fragen zu unseren Events, Tickets oder möchtest mit uns zusammenarbeiten? Kontaktiere uns über einen der folgenden Wege – wir melden uns schnellstmöglich bei dir!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="mailto:mail@gimmegimmeparty.com"
          className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:scale-[1.02]"
          style={{ background: "hsl(220 15% 95%)", border: "1px solid hsl(220 15% 88%)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(0 70% 50% / 0.12)" }}>
            <Mail className="w-5 h-5" style={{ color: "hsl(0 70% 50%)" }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: "hsl(220 20% 15%)" }}>E-Mail</div>
            <div className="text-xs" style={{ color: "hsl(220 10% 45%)" }}>mail@gimmegimmeparty.com</div>
          </div>
        </a>

        <a
          href="https://wa.me/491622537300"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:scale-[1.02]"
          style={{ background: "hsl(142 40% 95%)", border: "1px solid hsl(142 40% 85%)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(142 70% 45% / 0.15)" }}>
            <MessageCircle className="w-5 h-5" style={{ color: "hsl(142 60% 38%)" }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: "hsl(220 20% 15%)" }}>WhatsApp</div>
            <div className="text-xs" style={{ color: "hsl(220 10% 45%)" }}>Schreib uns direkt</div>
          </div>
        </a>

        <a
          href="https://www.instagram.com/nightlifegeneration_de/"
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:scale-[1.02]"
          style={{ background: "hsl(220 15% 95%)", border: "1px solid hsl(220 15% 88%)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)" }}>
            <Instagram className="w-5 h-5" style={{ color: "white" }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: "hsl(220 20% 15%)" }}>Instagram</div>
            <div className="text-xs" style={{ color: "hsl(220 10% 45%)" }}>@nightlifegeneration_de</div>
          </div>
        </a>

        <a
          href="tel:+491622537300"
          className="flex items-center gap-4 p-5 rounded-2xl transition-all hover:scale-[1.02]"
          style={{ background: "hsl(220 15% 95%)", border: "1px solid hsl(220 15% 88%)" }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(0 70% 50% / 0.12)" }}>
            <Phone className="w-5 h-5" style={{ color: "hsl(0 70% 50%)" }} />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: "hsl(220 20% 15%)" }}>Telefon</div>
            <div className="text-xs" style={{ color: "hsl(220 10% 45%)" }}>+49 (0) 1622 537 300</div>
          </div>
        </a>
      </div>

      <div className="p-6 rounded-2xl" style={{ background: "hsl(220 15% 95%)", border: "1px solid hsl(220 15% 88%)" }}>
        <h2 className="text-base font-bold uppercase mb-1" style={{ color: "hsl(220 20% 15%)", fontFamily: "'Orbitron', sans-serif" }}>
          Geschäftszeiten
        </h2>
        <p className="text-sm" style={{ color: "hsl(220 10% 45%)" }}>
          Montag – Freitag: 10:00 – 18:00 Uhr<br />
          Am Wochenende & Feiertagen per WhatsApp erreichbar.
        </p>
      </div>
    </div>
  </PageLayout>
);

export default Kontakt;
