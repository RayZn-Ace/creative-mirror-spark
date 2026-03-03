import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight, Instagram, MessageCircle, Clock, Music, Sparkles, Users, Heart, Star } from "lucide-react";
import eventHeaderImg from "@/assets/gimme-event-header.jpg";
import gimmeImg2 from "@/assets/gimme-img2.jpg";
import gimmeImg3 from "@/assets/gimme-img3.jpg";
import Navbar from "@/components/Navbar";

/* ─── Event Data ─── */
interface Event {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  dateShort: string;
  time: string;
  location: string;
  city: string;
  image: string | null;
  tag: string;
  highlight?: boolean;
  status?: string;
}

const events: Event[] = [
  {
    id: "1",
    slug: "hannover",
    title: "HANNOVER",
    subtitle: "MAMMA MIA / ABBA TOUR MITSING KONZERT",
    date: "10. Oktober 2026",
    dateShort: "10. OKT",
    time: "20:00 Uhr",
    location: "Baggi Hannover",
    city: "Hannover",
    image: eventHeaderImg,
    tag: "Fast ausverkauft",
    highlight: true,
    status: "Fast ausverkauft!",
  },
  {
    id: "2",
    slug: "",
    title: "NEUSS",
    subtitle: "MAMMA MIA / ABBA TOUR MITSING KONZERT",
    date: "Bald verfügbar",
    dateShort: "TBA",
    time: "20:00 Uhr",
    location: "TBA",
    city: "Neuss",
    image: gimmeImg2,
    tag: "Coming Soon",
  },
  {
    id: "3",
    slug: "",
    title: "POTSDAM",
    subtitle: "MAMMA MIA / ABBA TOUR MITSING KONZERT",
    date: "Bald verfügbar",
    dateShort: "TBA",
    time: "20:00 Uhr",
    location: "TBA",
    city: "Potsdam",
    image: gimmeImg3,
    tag: "Coming Soon",
  },
];

/* ─── Animations ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

/* ─── Video Hero ─── */
const VideoHero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Desktop Video */}
      <video
        src="https://gimmegimmeparty.com/assets/videos/video.mp4"
        className="hidden md:block absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Mobile Video */}
      <video
        src="https://gimmegimmeparty.com/assets/videos/video9_16.mp4"
        className="md:hidden absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(220 50% 10% / 0.3) 0%, hsl(220 50% 10% / 0.1) 30%, hsl(220 50% 10% / 0.5) 70%, hsl(220 50% 8%) 100%)",
        }}
      />
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end max-w-7xl mx-auto px-4 sm:px-8 pb-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          <p
            className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-3"
            style={{ color: "hsl(330 80% 55%)" }}
          >
            Die große Europa-Tour
          </p>
          <h1
            className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase leading-[0.85] mb-4"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
          >
            GIMME
            <br />
            GIMME
            <br />
            <span style={{ color: "hsl(330 80% 55%)" }}>PARTY!</span>
          </h1>
          <p
            className="text-sm sm:text-lg font-semibold uppercase tracking-wider mb-8 max-w-xl"
            style={{ color: "hsl(0 0% 100% / 0.7)" }}
          >
            DAS MAMMA MIA FANKONZERT – 2,5 Stunden Show voller ABBA-Hits, Glitzer & Emotionen
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/hannover"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold uppercase tracking-wider transition-all hover:scale-[1.03]"
              style={{
                background: "hsl(330 80% 50%)",
                color: "hsl(0 0% 100%)",
                boxShadow: "0 4px 30px hsl(330 80% 50% / 0.4)",
              }}
            >
              Tickets sichern
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#about"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold uppercase tracking-wider transition-all hover:scale-[1.03]"
              style={{
                background: "hsl(0 0% 100% / 0.1)",
                color: "hsl(0 0% 100%)",
                border: "1px solid hsl(0 0% 100% / 0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              Mehr erfahren
            </a>
          </div>
        </motion.div>
      </div>
      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 flex justify-center pt-2" style={{ borderColor: "hsl(0 0% 100% / 0.3)" }}>
          <div className="w-1 h-2 rounded-full" style={{ background: "hsl(0 0% 100% / 0.5)" }} />
        </div>
      </motion.div>
    </section>
  );
};

/* ─── About Section ─── */
const AboutSection = () => (
  <section id="about" className="py-20 sm:py-32">
    <div className="max-w-6xl mx-auto px-4 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-3" style={{ color: "hsl(330 80% 55%)" }}>
          Was erwartet dich?
        </p>
        <h2 className="text-3xl sm:text-5xl font-black uppercase mb-6" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
          Mehr als nur <span style={{ color: "hsl(330 80% 55%)" }}>eine Party</span>
        </h2>
        <p className="text-sm sm:text-lg leading-relaxed max-w-3xl mx-auto" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
          Du liebst ABBA, Mamma Mia ist für dich mehr als nur ein Film und du tanzt bei jedem &bdquo;Gimme! Gimme!&ldquo; los? 
          Dann ist das deine Bühne! Dich erwartet eine mitreißende 2,5-stündige Show voller Hits, Glitzer und Emotionen – 
          wie ein echter Mamma Mia Film, nur live!
        </p>
      </motion.div>

      {/* Reasons / Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: Music,
            emoji: "💃",
            title: "Die größten Hits zum Mitsingen",
            desc: 'Von "Dancing Queen" über "Mamma Mia" bis "Waterloo" – alle Kult-Hits live vom DJ-Pult. Jeder Song wird zum Gänsehautmoment!',
          },
          {
            icon: Sparkles,
            emoji: "🪩",
            title: "Einzigartige Mamma Mia Atmosphäre",
            desc: "Wir nehmen euch mit in unsere eigene Mamma Mia Welt – mit verkleideten Akteuren, Fotospots und Disco-Feeling.",
          },
          {
            icon: Heart,
            emoji: "✨",
            title: "Unvergessliche Momente",
            desc: "Mädelsabend, JGA, Mutter-Tochter-Erlebnis oder Geburtstagsparty – hier entstehen magische Erinnerungen fürs Leben.",
          },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            custom={i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded-2xl p-8 text-center transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "hsl(0 0% 100% / 0.04)",
              border: "1px solid hsl(0 0% 100% / 0.08)",
            }}
          >
            <div className="text-4xl mb-4">{item.emoji}</div>
            <h3
              className="text-sm sm:text-base font-bold uppercase mb-3"
              style={{ color: "hsl(0 0% 100%)" }}
            >
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.6)" }}>
              {item.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Musik & Konzept ─── */
const KonzeptSection = () => (
  <section className="py-16 sm:py-24" style={{ background: "hsl(220 50% 6%)" }}>
    <div className="max-w-6xl mx-auto px-4 sm:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-3" style={{ color: "hsl(330 80% 55%)" }}>
            Musik & Konzept
          </p>
          <h2 className="text-2xl sm:text-4xl font-black uppercase mb-6" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            3 Stunden <span style={{ color: "hsl(330 80% 55%)" }}>Zeitreise</span>
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
            Die Mamma Mia Party ist keine normale Party – sie ist eine 3-stündige Zeitreise in die goldene Ära der 70er, 
            kombiniert mit modernen Party-Vibes. Hier geht es nicht ums Zuhören, sondern um Mitsingen, Tanzen und Loslassen.
          </p>
          <div className="space-y-3">
            {[
              "ABBA – alle großen Klassiker (Dancing Queen, Mamma Mia, Gimme! Gimme! Gimme!, Waterloo u.v.m.)",
              "70er & 80er Disco- & Pop-Hits – Feel-Good Classics",
              "Moderne Party-Edits, damit die Tanzfläche nicht stehen bleibt",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Star className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(330 80% 55%)" }} />
                <span className="text-xs sm:text-sm" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider mt-6" style={{ color: "hsl(330 80% 55% / 0.8)" }}>
            Keine Schlagerparty. Kein reiner Oldie-Abend. Sondern ABBA-Power mit Club-Energie.
          </p>
        </motion.div>

        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-3"
        >
          <img
            src="/images/gimme-gallery-1.jpg"
            alt="Gimme Gimme Party Stimmung"
            className="rounded-2xl w-full h-48 sm:h-64 object-cover col-span-2"
          />
          <img
            src="/images/gimme-gallery-2.jpg"
            alt="Gimme Gimme Party Show"
            className="rounded-2xl w-full h-36 sm:h-48 object-cover"
          />
          <img
            src="/images/gimme-gallery-3.jpg"
            alt="Gimme Gimme Party Publikum"
            className="rounded-2xl w-full h-36 sm:h-48 object-cover"
          />
        </motion.div>
      </div>
    </div>
  </section>
);

/* ─── Für wen? ─── */
const ZielgruppeSection = () => (
  <section className="py-16 sm:py-24">
    <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-3" style={{ color: "hsl(330 80% 55%)" }}>
          Für wen?
        </p>
        <h2 className="text-2xl sm:text-4xl font-black uppercase mb-6" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
          Für alle, die Musik <span style={{ color: "hsl(330 80% 55%)" }}>fühlen</span>
        </h2>
        <p className="text-sm sm:text-base leading-relaxed mb-10" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
          Egal ob du ABBA früher gehört hast oder sie durch Filme & TikTok neu entdeckt hast – diese Party holt dich ab.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { emoji: "👯‍♀️", label: "Mädelsabende" },
            { emoji: "🎂", label: "Geburtstage & JGAs" },
            { emoji: "🪩", label: "ABBA-Fans" },
            { emoji: "👩‍👧", label: "Mutter & Tochter" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl p-5 transition-all hover:scale-105"
              style={{
                background: "hsl(0 0% 100% / 0.04)",
                border: "1px solid hsl(0 0% 100% / 0.08)",
              }}
            >
              <div className="text-3xl mb-2">{item.emoji}</div>
              <span className="text-xs sm:text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.8)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

/* ─── Event Card ─── */
const EventCard = ({ event, index }: { event: Event; index: number }) => {
  const Wrapper = event.slug
    ? ({ children, ...props }: any) => (
        <Link to={`/${event.slug}`} {...props}>
          {children}
        </Link>
      )
    : ({ children, ...props }: any) => <div {...props}>{children}</div>;

  return (
    <motion.div custom={index} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
      <Wrapper className="block group cursor-pointer">
        <div
          className="rounded-2xl overflow-hidden transition-all duration-300 group-hover:scale-[1.02]"
          style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}
        >
          <div className="relative aspect-[16/10] overflow-hidden">
            {event.image ? (
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(220 40% 20%) 0%, hsl(220 30% 10%) 100%)" }}
              >
                <span className="text-xl sm:text-2xl font-black uppercase opacity-20" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                  {event.title}
                </span>
              </div>
            )}
            <span
              className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: event.status ? "hsl(330 80% 50% / 0.9)" : "hsl(0 0% 0% / 0.6)",
                color: "hsl(0 0% 100% / 0.95)",
                backdropFilter: "blur(8px)",
              }}
            >
              {event.tag}
            </span>
            {event.dateShort !== "TBA" && (
              <div
                className="absolute bottom-3 left-3 px-3 py-2 rounded-xl text-center leading-tight"
                style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}
              >
                <div className="text-[10px] font-bold uppercase">{event.dateShort.split(" ")[1]}</div>
                <div className="text-lg font-black">{event.dateShort.split(" ")[0]}</div>
              </div>
            )}
          </div>
          <div className="p-4 sm:p-5">
            <h3
              className="text-base sm:text-lg font-black uppercase leading-tight mb-1"
              style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
            >
              {event.title}
            </h3>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              {event.subtitle}
            </p>
            <div className="flex items-center gap-4 text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" style={{ color: "hsl(330 80% 55%)" }} />
                {event.date}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" style={{ color: "hsl(330 80% 55%)" }} />
                {event.city}
              </span>
            </div>
          </div>
        </div>
      </Wrapper>
    </motion.div>
  );
};

/* ─── Events Section ─── */
const EventsSection = () => (
  <section id="events" className="py-16 sm:py-24" style={{ background: "hsl(220 50% 6%)" }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-end justify-between mb-8 sm:mb-12"
      >
        <div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-2" style={{ color: "hsl(330 80% 55%)" }}>
            Kommende
          </p>
          <h2 className="text-2xl sm:text-4xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
            Events & Tickets
          </h2>
        </div>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {events.map((event, i) => (
          <EventCard key={event.id} event={event} index={i} />
        ))}
      </div>
    </div>
  </section>
);

/* ─── Dresscode CTA ─── */
const DresscodeCTA = () => (
  <section className="py-16 sm:py-24">
    <div className="max-w-4xl mx-auto px-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-3xl p-8 sm:p-12 text-center"
        style={{
          background: "linear-gradient(135deg, hsl(330 80% 50% / 0.15) 0%, hsl(280 60% 50% / 0.1) 100%)",
          border: "1px solid hsl(330 80% 55% / 0.2)",
        }}
      >
        <div className="text-5xl mb-4">🪩</div>
        <h2 className="text-2xl sm:text-3xl font-black uppercase mb-4" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
          Dresscode
        </h2>
        <p className="text-sm sm:text-lg mb-2" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
          Glitzer, Mamma Mia oder ABBA-Bezug!
        </p>
        <p className="text-xs sm:text-sm mb-8" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
          Kein Muss, aber gerne gesehen – Schlaghosen, Disco-Outfits, alles kann, nichts muss. 💃
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            to="/hannover"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-[1.03]"
            style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)", boxShadow: "0 4px 30px hsl(330 80% 50% / 0.4)" }}
          >
            Jetzt Tickets sichern
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="http://bit.ly/mammamiacommunity"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-[1.03]"
            style={{ background: "hsl(142 70% 45%)", color: "hsl(0 0% 100%)" }}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Community
          </a>
        </div>
      </motion.div>
    </div>
  </section>
);

/* ─── Footer ─── */
const HomeFooter = () => (
  <footer className="pb-8 sm:pb-12 pt-8 border-t" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <span
            className="text-sm font-black uppercase tracking-wider"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(330 80% 55% / 0.8)" }}
          >
            GIMME GIMME <span style={{ color: "hsl(0 0% 100% / 0.6)" }}>PARTY</span>
          </span>
          <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
            © 2025 Gimme Gimme Party. Alle Rechte vorbehalten.
          </p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <a
            href="https://smea.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] sm:text-xs font-medium transition-opacity hover:opacity-100"
            style={{ color: "hsl(0 0% 100% / 0.35)" }}
          >
            powered by smea
          </a>
          <Link to="/impressum" className="text-[10px] sm:text-xs transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
            Impressum
          </Link>
          <Link to="/datenschutz" className="text-[10px] sm:text-xs transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
            Datenschutz
          </Link>
          <Link to="/agb" className="text-[10px] sm:text-xs transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
            AGB
          </Link>
        </div>
      </div>
    </div>
  </footer>
);

/* ─── Page ─── */
const Index = () => (
  <div className="min-h-screen" style={{ background: "hsl(220 50% 8%)" }}>
    <Navbar />
    <VideoHero />
    <AboutSection />
    <KonzeptSection />
    <ZielgruppeSection />
    <EventsSection />
    <DresscodeCTA />
    <HomeFooter />
  </div>
);

export default Index;
