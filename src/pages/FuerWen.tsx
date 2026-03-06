import { PageLayout } from "@/components/PageLayout";
import { Link } from "react-router-dom";
import crowdAerial from "@/assets/crowd-aerial.jpg";
import crowdParty from "@/assets/crowd-party.jpg";

const sections = [
  {
    icon: "🥂",
    title: "JGA / Bachelorette",
    subtitle: "Die perfekte Feier mit den Mädels vor dem großen Tag.",
    text: "Du planst einen JGA oder eine Bachelorette-Party? Unsere Events bieten das perfekte Setting für einen unvergesslichen Abend mit deinen Mädels. Feiert gemeinsam, tanzt und macht den Abend zu einem ganz besonderen Erlebnis. Kontaktiere uns für spezielle Gruppenangebote!",
  },
  {
    icon: "🎂",
    title: "Geburtstage",
    subtitle: "Feier deinen Geburtstag auf eine einzigartige und unvergessliche Art.",
    text: "Dein Geburtstag verdient etwas Besonderes! Feiere inmitten von hunderten Fans und erlebe eine Partynacht, die du nie vergessen wirst. Unsere Events sind der perfekte Rahmen für jedes Alter – ob 20, 30, 40 oder 50+. Bring deine Freunde mit und macht gemeinsam die Tanzfläche unsicher!",
  },
  {
    icon: "💖",
    title: "Girls Night Out",
    subtitle: "Versammelt die Truppe und erlebt eine unvergessliche Nacht.",
    text: "Mädelsabend deluxe! Schnappt euch eure besten Freundinnen und erlebt die ultimative Girls Night Out. Gemeinsam tanzen, feiern und den Abend genießen. Mit Foto-Momenten und einer Atmosphäre, die ihresgleichen sucht. Das wird EUER Abend!",
  },
  {
    icon: "👥",
    title: "Gruppen",
    subtitle: "Spezielle Angebote für Gruppen ab 10 Personen.",
    text: "Ob Firmenfeier, Teambuilding, Vereinsausflug oder einfach eine große Freundesgruppe – wir bieten spezielle Gruppenangebote ab 10 Personen. Schreibt uns mit Gruppenname, Personenanzahl, gewünschtem Event und euren Kontaktdaten. Wir machen euch ein Angebot, das rockt!",
    email: "info@partyticket.app",
  },
  {
    icon: "🎵",
    title: "Fans aller Generationen",
    subtitle: "Gute Musik kennt keine Altersgrenzen – Fans jeden Alters sind willkommen!",
    text: "Von Teenagern bis zu den erfahrenen Partygängern – bei unseren Events treffen sich alle Generationen. Gemeinsam feiern, tanzen und die beste Musik live erleben. Jeder ist willkommen, jeder gehört dazu!",
  },
];

const FuerWen = () => (
  <div className="min-h-screen" style={{ background: "hsl(220 30% 6%)" }}>
    {/* Hero with background image */}
    <div className="relative w-full h-[50vh] min-h-[350px] flex items-center justify-center overflow-hidden">
      <img
        src={crowdAerial}
        alt="Party crowd"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.4)" }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 50%, hsl(220 30% 6%) 100%)" }} />
      <div className="relative z-10 text-center px-4">
        <h1
          className="text-4xl md:text-6xl font-black uppercase italic"
          style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}
        >
          Für wen ist<span style={{ color: "hsl(230 80% 56%)" }}> die Party?</span>
        </h1>
        <p className="mt-4 text-base md:text-lg max-w-xl mx-auto" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
          Unsere Events sind für alle, die eine unvergessliche Nacht erleben wollen!
        </p>
      </div>
    </div>

    {/* Sections */}
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-16">
      {sections.map((s, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{s.icon}</span>
            <h2
              className="text-xl md:text-2xl font-black uppercase"
              style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}
            >
              {s.title}
            </h2>
          </div>
          <p className="text-sm font-medium mb-4" style={{ color: "hsl(230 80% 56%)" }}>
            {s.subtitle}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.55)" }}>
            {s.text}
          </p>
          {s.email && (
            <a
              href={`mailto:${s.email}`}
              className="inline-block mt-3 text-sm font-bold underline"
              style={{ color: "hsl(230 80% 56%)" }}
            >
              {s.email}
            </a>
          )}
        </div>
      ))}

      {/* Bottom image */}
      <div className="rounded-2xl overflow-hidden">
        <img src={crowdParty} alt="Party" className="w-full h-64 object-cover" />
      </div>

      {/* CTA */}
      <div className="text-center pt-4 pb-8">
        <h3
          className="text-2xl md:text-3xl font-black uppercase mb-6"
          style={{ color: "hsl(0 0% 100%)", fontFamily: "'Orbitron', sans-serif" }}
        >
          Bereit? <span style={{ color: "hsl(230 80% 56%)" }}>DABEI?</span>
        </h3>
        <Link
          to="/termine"
          className="inline-block px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90"
          style={{ background: "hsl(230 80% 56%)", color: "hsl(0 0% 100%)" }}
        >
          Jetzt Tickets sichern
        </Link>
      </div>
    </div>
  </div>
);

export default FuerWen;
