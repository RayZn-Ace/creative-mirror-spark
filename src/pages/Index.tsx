import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Calendar, ArrowRight, Instagram, MessageCircle } from "lucide-react";
import heroImg from "@/assets/gimme-hero.jpg";
import gimmeImg2 from "@/assets/gimme-img2.jpg";
import gimmeImg3 from "@/assets/gimme-img3.jpg";
import eventHeaderImg from "@/assets/gimme-event-header.jpg";
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
}

const events: Event[] = [
  {
    id: "1",
    slug: "hannover",
    title: "HANNOVER",
    subtitle: "MAMMA MIA / ABBA TOUR KONZERT",
    date: "10. April 2025",
    dateShort: "10. APR",
    time: "20:00 Uhr",
    location: "Baggi / Osho",
    city: "Hannover",
    image: eventHeaderImg,
    tag: "Konzert",
    highlight: true,
  },
  {
    id: "2",
    slug: "",
    title: "NEUSS",
    subtitle: "MAMMA MIA / ABBA TOUR KONZERT",
    date: "06. März 2025",
    dateShort: "06. MÄR",
    time: "20:00 Uhr",
    location: "TBA",
    city: "Neuss",
    image: gimmeImg2,
    tag: "Konzert",
  },
  {
    id: "3",
    slug: "",
    title: "POTSDAM",
    subtitle: "MAMMA MIA / ABBA TOUR KONZERT",
    date: "06. März 2025",
    dateShort: "06. MÄR",
    time: "20:00 Uhr",
    location: "TBA",
    city: "Potsdam",
    image: gimmeImg3,
    tag: "Konzert",
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

/* ─── Hero ─── */
const HeroSection = () => {
  const highlightEvent = events.find((e) => e.highlight);

  return (
    <section className="relative min-h-[55vh] sm:min-h-[65vh] flex items-end overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImg} alt="" className="w-full h-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(220 50% 10% / 0.4) 0%, hsl(220 50% 10% / 0.1) 40%, hsl(220 50% 10% / 0.7) 70%, hsl(220 50% 8%) 100%)",
          }}
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-16 sm:pb-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-3" style={{ color: "hsl(330 80% 55%)" }}>
            Nächstes Highlight
          </p>
          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.9] mb-4"
            style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}
          >
            GIMME GIMME
            <br />
            <span style={{ color: "hsl(330 80% 55%)" }}>PARTY!</span>
          </h1>
          <p className="text-sm sm:text-lg font-semibold uppercase tracking-wider mb-6" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
            DAS MAMMA MIA FANKONZERT – DIE GROßE EUROPA-TOUR
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
            {highlightEvent && (
              <>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
                  <Calendar className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
                  {highlightEvent.date} · {highlightEvent.time}
                </span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-bold" style={{ color: "hsl(0 0% 100% / 0.8)" }}>
                  <MapPin className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
                  {highlightEvent.location}, {highlightEvent.city}
                </span>
              </>
            )}
          </div>
          {highlightEvent?.slug && (
            <Link
              to={`/${highlightEvent.slug}`}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold uppercase tracking-wider transition-all hover:scale-[1.03]"
              style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)", boxShadow: "0 4px 30px hsl(330 80% 50% / 0.4)" }}
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
    ? ({ children, ...props }: any) => <Link to={`/${event.slug}`} {...props}>{children}</Link>
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
              <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(220 40% 20%) 0%, hsl(220 30% 10%) 100%)" }}>
                <span className="text-xl sm:text-2xl font-black uppercase opacity-20" style={{ fontFamily: "'Orbitron', sans-serif" }}>{event.title}</span>
              </div>
            )}
            <span
              className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "hsl(0 0% 0% / 0.6)", color: "hsl(0 0% 100% / 0.9)", backdropFilter: "blur(8px)" }}
            >
              {event.tag}
            </span>
            <div className="absolute bottom-3 left-3 px-3 py-2 rounded-xl text-center leading-tight" style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
              <div className="text-[10px] font-bold uppercase">{event.dateShort.split(" ")[1]}</div>
              <div className="text-lg font-black">{event.dateShort.split(" ")[0]}</div>
            </div>
          </div>
          <div className="p-4 sm:p-5">
            <h3 className="text-base sm:text-lg font-black uppercase leading-tight mb-1" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
              {event.title}
            </h3>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              {event.subtitle}
            </p>
            <div className="flex items-center gap-4 text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" style={{ color: "hsl(330 80% 55%)" }} />{event.date}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" style={{ color: "hsl(330 80% 55%)" }} />{event.city}</span>
            </div>
          </div>
        </div>
      </Wrapper>
    </motion.div>
  );
};

/* ─── Events Section ─── */
const EventsSection = () => (
  <section id="events" className="py-16 sm:py-24">
    <div className="max-w-7xl mx-auto px-4 sm:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-8 sm:mb-12">
        <div>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] mb-2" style={{ color: "hsl(330 80% 55%)" }}>Kommende</p>
          <h2 className="text-2xl sm:text-4xl font-black uppercase" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>Events & Tickets</h2>
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

/* ─── About Teaser ─── */
const AboutTeaser = () => (
  <section className="py-16 sm:py-24">
    <div className="max-w-4xl mx-auto px-4 sm:px-8 text-center">
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <h2 className="text-2xl sm:text-4xl font-black uppercase mb-6" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(0 0% 100%)" }}>
          Was ist die <span style={{ color: "hsl(330 80% 55%)" }}>Gimme Gimme Party?</span>
        </h2>
        <p className="text-sm sm:text-base leading-relaxed mb-4" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
          Du liebst ABBA, Mamma Mia ist für dich mehr als nur ein Film und du tanzt bei jedem „Gimme! Gimme!" los? Dann ist das deine Bühne!
        </p>
        <p className="text-sm sm:text-base leading-relaxed mb-8" style={{ color: "hsl(0 0% 100% / 0.7)" }}>
          Dich erwartet eine mitreißende 2,5-stündige Show voller Hits, Glitzer und Emotionen – wie ein echter Mamma Mia Film, nur live! 
          Hier feiern Dancing Queens und Super Troupers aus allen Generationen gemeinsam.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8">
          <div className="rounded-2xl p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <div className="text-3xl mb-3">💃</div>
            <h3 className="text-sm font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)" }}>Die größten Hits</h3>
            <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>ABBA-Hits & Kultsongs zum Mitsingen – eine musikalische Zeitreise!</p>
          </div>
          <div className="rounded-2xl p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <div className="text-3xl mb-3">🪩</div>
            <h3 className="text-sm font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)" }}>Einzigartige Atmosphäre</h3>
            <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Unsere eigene Mamma Mia Welt mit Akteuren, Fotospots und vielem mehr.</p>
          </div>
          <div className="rounded-2xl p-6" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-sm font-bold uppercase mb-2" style={{ color: "hsl(0 0% 100%)" }}>Unvergesslich</h3>
            <p className="text-xs" style={{ color: "hsl(0 0% 100% / 0.5)" }}>Mädelsabend, JGA oder Mutter-Tochter-Erlebnis – magische Momente!</p>
          </div>
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
          <span className="text-sm font-black uppercase tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif", color: "hsl(330 80% 55% / 0.8)" }}>
            GIMME GIMME <span style={{ color: "hsl(0 0% 100% / 0.6)" }}>PARTY</span>
          </span>
          <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.3)" }}>© 2025 Gimme Gimme Party. Alle Rechte vorbehalten.</p>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="https://smea.de/" target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs font-medium transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>powered by smea</a>
          <Link to="/impressum" className="text-[10px] sm:text-xs transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Impressum</Link>
          <Link to="/datenschutz" className="text-[10px] sm:text-xs transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>Datenschutz</Link>
          <Link to="/agb" className="text-[10px] sm:text-xs transition-opacity hover:opacity-100" style={{ color: "hsl(0 0% 100% / 0.35)" }}>AGB</Link>
        </div>
      </div>
    </div>
  </footer>
);

/* ─── Page ─── */
const Index = () => (
  <div className="min-h-screen" style={{ background: "hsl(220 50% 8%)" }}>
    <Navbar />
    <HeroSection />
    <EventsSection />
    <AboutTeaser />
    <HomeFooter />
  </div>
);

export default Index;
