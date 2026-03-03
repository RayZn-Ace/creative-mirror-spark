import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight, Instagram, MessageCircle } from "lucide-react";
import heroImg from "@/assets/hero-home.jpg";
import ppFeedImg from "@/assets/project-paderborn-feed.png";
import cityMadnessImg from "@/assets/city-madness-feed.jpg";
import neonNightsImg from "@/assets/neon-nights-feed.jpg";
import summerBashImg from "@/assets/summer-bash-feed.jpg";

/* ─── Event Data (placeholder – later from backend) ─── */
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
}

const events: Event[] = [
  {
    id: "1",
    slug: "project-paderborn",
    title: "PROJECT PADERBORN",
    subtitle: "DIE GRÖßTE HAUSPARTY DER REGION!",
    date: "05. April 2025",
    dateShort: "05. APR",
    time: "22:00 Uhr",
    location: "Capitol Paderborn",
    city: "Paderborn",
    image: ppFeedImg,
    tag: "Club",
    highlight: true,
  },
  {
    id: "2",
    slug: "",
    title: "CITY MADNESS",
    subtitle: "OPEN AIR FESTIVAL",
    date: "19. April 2025",
    dateShort: "19. APR",
    time: "16:00 Uhr",
    location: "Stadtpark",
    city: "Bielefeld",
    image: cityMadnessImg,
    tag: "Festival",
  },
  {
    id: "3",
    slug: "",
    title: "NEON NIGHTS",
    subtitle: "UV PARTY EXPERIENCE",
    date: "03. Mai 2025",
    dateShort: "03. MAI",
    time: "23:00 Uhr",
    location: "Club XO",
    city: "Dortmund",
    image: neonNightsImg,
    tag: "Club",
  },
  {
    id: "4",
    slug: "",
    title: "SUMMER BASH",
    subtitle: "DIE ULTIMATIVE SOMMER PARTY",
    date: "17. Mai 2025",
    dateShort: "17. MAI",
    time: "20:00 Uhr",
    location: "Strandbar",
    city: "Paderborn",
    image: summerBashImg,
    tag: "Open Air",
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

/* ─── Navbar ─── */
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <span
          className="text-lg sm:text-xl font-black uppercase tracking-wider"
          style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
        >
          NACHTAKTIV
        </span>
        <span
          className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]"
          style={{ color: "hsl(0 70% 50%)" }}
        >
          EVENTS
        </span>
      </Link>
      <div className="flex items-center gap-3 sm:gap-4">
        <a
          href="https://instagram.com/nachtaktiv.events"
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: "hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100% / 0.7)" }}
        >
          <Instagram className="w-4 h-4" />
        </a>
        <a
          href="https://wa.me/49123456789"
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: "hsl(142 70% 45% / 0.2)", color: "hsl(142 70% 55%)" }}
        >
          <MessageCircle className="w-4 h-4" />
        </a>
      </div>
    </div>
  </nav>
);

/* ─── Hero ─── */
const HeroSection = () => {
  const highlightEvent = events.find((e) => e.highlight);

  return (
    <section className="relative min-h-[55vh] sm:min-h-[65vh] flex items-end overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroImg} alt="" className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(0 0% 0% / 0.3) 0%, hsl(0 0% 0% / 0.1) 40%, hsl(0 0% 0% / 0.7) 70%, hsl(0 5% 5%) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-16 sm:pb-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p
            className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-3"
            style={{ color: "hsl(0 70% 55%)" }}
          >
            Nächstes Highlight
          </p>
          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.9] mb-4"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
          >
            {highlightEvent?.title || "NACHTAKTIV"}
            <br />
            <span style={{ color: "hsl(0 70% 50%)" }}>EVENTS</span>
          </h1>
          {highlightEvent && (
            <p
              className="text-sm sm:text-lg font-semibold uppercase tracking-wider mb-6"
              style={{ color: "hsl(0 0% 100% / 0.7)" }}
            >
              {highlightEvent.subtitle}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
            {highlightEvent && (
              <>
                <span
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-bold"
                  style={{ color: "hsl(0 0% 100% / 0.8)" }}
                >
                  <Calendar className="w-4 h-4" style={{ color: "hsl(0 70% 55%)" }} />
                  {highlightEvent.date} · {highlightEvent.time}
                </span>
                <span
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-bold"
                  style={{ color: "hsl(0 0% 100% / 0.8)" }}
                >
                  <MapPin className="w-4 h-4" style={{ color: "hsl(0 70% 55%)" }} />
                  {highlightEvent.location}
                </span>
              </>
            )}
          </div>
          {highlightEvent?.slug && (
            <Link
              to={`/${highlightEvent.slug}`}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold uppercase tracking-wider transition-all hover:scale-[1.03]"
              style={{
                background: "hsl(0 70% 50%)",
                color: "hsl(0 0% 100%)",
                boxShadow: "0 4px 30px hsl(0 70% 50% / 0.4)",
              }}
            >
              Tickets sichern
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </motion.div>
      </div>

    </section>
  );
};

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
          style={{
            background: "hsl(0 0% 100% / 0.04)",
            border: "1px solid hsl(0 0% 100% / 0.08)",
          }}
        >
          {/* Image / Placeholder */}
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
                style={{
                  background: "linear-gradient(135deg, hsl(0 40% 15%) 0%, hsl(0 20% 8%) 100%)",
                }}
              >
                <span
                  className="text-xl sm:text-2xl font-black uppercase opacity-20"
                  style={{ fontFamily: "'Orbitron', sans-serif" }}
                >
                  {event.title}
                </span>
              </div>
            )}
            {/* Tag */}
            <span
              className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "hsl(0 0% 0% / 0.6)", color: "hsl(0 0% 100% / 0.9)", backdropFilter: "blur(8px)" }}
            >
              {event.tag}
            </span>
            {/* Date badge */}
            <div
              className="absolute bottom-3 left-3 px-3 py-2 rounded-xl text-center leading-tight"
              style={{ background: "hsl(0 70% 50%)", color: "hsl(0 0% 100%)" }}
            >
              <div className="text-[10px] font-bold uppercase">{event.dateShort.split(" ")[1]}</div>
              <div className="text-lg font-black">{event.dateShort.split(" ")[0]}</div>
            </div>
          </div>

          {/* Info */}
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
                <Calendar className="w-3 h-3" style={{ color: "hsl(0 70% 55%)" }} />
                {event.date}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" style={{ color: "hsl(0 70% 55%)" }} />
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
  <section className="py-16 sm:py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="flex items-end justify-between mb-8 sm:mb-12"
      >
        <div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-2" style={{ color: "hsl(0 70% 55%)" }}>
            Kommende
          </p>
          <h2
            className="text-2xl sm:text-4xl font-black uppercase"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
          >
            Events
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

/* ─── Footer ─── */
const HomeFooter = () => (
  <footer className="pb-8 sm:pb-12 pt-8 border-t" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left">
          <span
            className="text-sm font-black uppercase tracking-wider"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100% / 0.6)" }}
          >
            NACHTAKTIV <span style={{ color: "hsl(0 70% 50% / 0.6)" }}>EVENTS</span>
          </span>
          <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
            © 2025 Nachtaktiv Events. Alle Rechte vorbehalten.
          </p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs font-medium transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
            powered by smea
          </a>
          <a href="/impressum" className="text-[10px] sm:text-xs transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Impressum</a>
          <a href="/datenschutz" className="text-[10px] sm:text-xs transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Datenschutz</a>
          <a href="/agb" className="text-[10px] sm:text-xs transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>AGB</a>
        </div>
      </div>
    </div>
  </footer>
);

/* ─── Page ─── */
const Index = () => {
  return (
    <div className="min-h-screen" style={{ background: "hsl(0 5% 5%)" }}>
      <Navbar />
      <HeroSection />
      <EventsSection />
      <HomeFooter />
    </div>
  );
};

export default Index;
