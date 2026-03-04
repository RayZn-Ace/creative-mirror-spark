import { PageLayout } from "@/components/PageLayout";
import { Link } from "react-router-dom";
import crowdAerial from "@/assets/crowd-aerial.jpg";
import crowdParty from "@/assets/crowd-party.jpg";

const sections = [
  {
    icon: "🥂",
    title: "JGA / Bachelorette",
    subtitle: "Die perfekte Feier mit den Mädels vor dem großen Tag.",
    text: "Du planst einen JGA oder eine Bachelorette-Party? Die GIMME GIMME PARTY bietet das perfekte Setting für einen unvergesslichen Abend mit deinen Mädels. Singt gemeinsam die größten ABBA-Hits, tanzt zu »Dancing Queen« und feiert die Braut gebührend – mit Glitzer, Give-Aways und jeder Menge Party-Stimmung. Viele Gruppen kommen in passenden Outfits und machen den Abend zu einem ganz besonderen Erlebnis. Kontaktiere uns für spezielle Gruppenangebote!",
  },
  {
    icon: "🎂",
    title: "Geburtstage",
    subtitle: "Feier deinen Geburtstag auf eine einzigartige und unvergessliche Art.",
    text: "Dein Geburtstag verdient etwas Besonderes! Feiere inmitten von hunderten ABBA-Fans, singe deine Lieblingshits und erlebe eine Partynacht, die du nie vergessen wirst. Die GIMME GIMME PARTY ist der perfekte Rahmen für jedes Alter – ob 20, 30, 40 oder 50+. Bring deine Freunde mit und macht gemeinsam die Tanzfläche unsicher!",
  },
  {
    icon: "💖",
    title: "Girls Night Out",
    subtitle: "Versammelt die Truppe und singt die Songs, die ihr liebt.",
    text: "Mädelsabend deluxe! Schnappt euch eure besten Freundinnen und erlebt die ultimative Girls Night Out bei der GIMME GIMME PARTY. Von »Mamma Mia« bis »Gimme! Gimme! Gimme!« – hier werden alle Hits gemeinsam gesungen, getanzt und gefeiert. Mit Glitzer-Accessories, Foto-Momenten und einer Atmosphäre, die ihresgleichen sucht. Das wird EUER Abend!",
  },
  {
    icon: "👥",
    title: "Gruppen",
    subtitle: "Spezielle Angebote für Gruppen ab 10 Personen.",
    text: "Ob Firmenfeier, Teambuilding, Vereinsausflug oder einfach eine große Freundesgruppe – die GIMME GIMME PARTY bietet spezielle Gruppenangebote ab 10 Personen. Schreibt uns an mail@gimmegimmeparty.com mit Gruppenname, Personenanzahl, gewünschtem Event und euren Kontaktdaten. Wir machen euch ein Angebot, das rockt!",
    email: "mail@gimmegimmeparty.com",
  },
  {
    icon: "🎵",
    title: "Fans aller Generationen",
    subtitle: "ABBA ist zeitlos – Fans jeden Alters sind willkommen!",
    text: "Die Musik von ABBA kennt keine Altersgrenzen. Von Teenagern, die ABBA durch TikTok und den Mamma-Mia-Film entdeckt haben, bis zu den Fans der ersten Stunde – bei der GIMME GIMME PARTY treffen sich alle Generationen. Gemeinsam singen, tanzen und feiern: Das ist die Magie von ABBA. Jeder ist willkommen, jeder gehört dazu!",
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
          Für wen ist<span style={{ color: "hsl(330 80% 55%)" }}>die Party?</span>
        </h1>
        <p className="mt-4 text-base md:text-lg max-w-xl mx-auto" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
          Die GIMME GIMME PARTY ist für alle, die ABBA lieben und eine unvergessliche Nacht erleben wollen!
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
          <p className="text-sm font-medium mb-4" style={{ color: "hsl(330 80% 55%)" }}>
            {s.subtitle}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.55)" }}>
            {s.text}
          </p>
          {s.email && (
            <a
              href={`mailto:${s.email}`}
              className="inline-block mt-3 text-sm font-bold underline"
              style={{ color: "hsl(330 80% 55%)" }}
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
          Bereit? <span style={{ color: "hsl(330 80% 55%)" }}>DABEI?</span>
        </h3>
        <Link
          to="/termine"
          className="inline-block px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all hover:opacity-90"
          style={{ background: "hsl(330 80% 55%)", color: "hsl(0 0% 100%)" }}
        >
          Jetzt Tickets sichern
        </Link>
      </div>
    </div>
  </div>
);

export default FuerWen;
