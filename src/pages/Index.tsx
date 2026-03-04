import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPin, Calendar, ArrowRight, Ticket, Clock, Music, Music2, Sparkles,
  Users, Heart, Star, Gift, Mic, Quote, Send, MessageCircle,
  ChevronLeft, ChevronRight, Globe, PartyPopper, Cake
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportChatbot from "@/components/SupportChatbot";
import { supabase } from "@/integrations/supabase/client";
import heroImg from "@/assets/gimme-hero.jpg";
import eventHeaderImg from "@/assets/gimme-event-header.jpg";
import gimmeImg2 from "@/assets/gimme-img2.jpg";
import gimmeImg3 from "@/assets/gimme-img3.jpg";

const fallbackImages = [eventHeaderImg, gimmeImg2, gimmeImg3];

/* ─── Hero ─── */
const Hero = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroImg} alt="GIMME GIMME PARTY – Tausende Fans feiern zur ABBA Musik" className="w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="absolute inset-0 bg-background/40" />
    </div>
    <div className="relative z-10 container text-center px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-none mb-4">
          GIMME GIMME{" "}<span className="text-gradient-primary">PARTY!</span>
        </h1>
        <p className="font-display text-2xl sm:text-3xl md:text-4xl text-gold mb-2">Die große Europa-Tour</p>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10">
          DAS MAMMA MIA FANKONZERT – 2,5 Stunden Show voller ABBA-Hits, Glitzer & Emotionen
        </p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="https://mammamia-partymotto.ticket.io/?view=table" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg animate-pulse-glow hover:opacity-90 transition-all">
          <Ticket className="w-5 h-5" /> Tickets sichern
        </a>
      </motion.div>
    </div>
    <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-2">
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
    </motion.div>
  </section>
);

/* ─── Trust Badges ─── */
const TrustBadges = () => {
  const badges = [
    { icon: MapPin, value: "150+", label: "STÄDTE" },
    { icon: Globe, value: "13+", label: "LÄNDER" },
    { icon: Heart, value: "1.5M+", label: "FOLLOWER" },
    { icon: Users, value: "250K+", label: "FANS" },
  ];

  return (
    <section className="py-12 md:py-16 bg-card/50">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {badges.map((b, i) => (
            <motion.div key={b.value} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
              <b.icon className="w-7 h-7 text-primary mb-3" />
              <span className="font-display text-3xl md:text-4xl text-gradient-primary">{b.value}</span>
              <span className="text-xs font-semibold tracking-wider text-muted-foreground mt-1">{b.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── What Is It ─── */
const WhatIsIt = () => {
  const features = [
    { icon: Clock, label: "3+ Stunden Party" },
    { icon: Music2, label: "Live DJ & Performer" },
    { icon: Sparkles, label: "Glitter & Accessoires inklusive" },
    { icon: Users, label: "250.000+ Fans weltweit" },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl md:text-5xl text-foreground mb-6">
              <span className="italic">Was ist die</span>{" "}
              <span className="text-gradient-primary">GIMME GIMME PARTY?</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg">
              Die weltweit größte ABBA Party! Ein einzigartiges Sing-Along Erlebnis mit den Songs, die Generationen geprägt haben. 
              Zieh dein glitzerndstes Outfit an, bring deine Freunde mit und mach dich bereit für Dancing Queen, Mamma Mia, Waterloo und mehr!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((f, i) => (
                <motion.div key={f.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card/50">
                  <f.icon className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm font-medium text-foreground">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border border-border">
            <img src={eventHeaderImg} alt="GIMME GIMME PARTY Crowd" className="w-full h-[300px] md:h-[420px] object-cover" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─── Country Badges ─── */
const countries = [
  { flag: "🇩🇪", name: "Deutschland" }, { flag: "🇦🇹", name: "Österreich" },
  { flag: "🇨🇭", name: "Schweiz" }, { flag: "🇳🇱", name: "Niederlande" },
  { flag: "🇫🇷", name: "Frankreich" }, { flag: "🇱🇺", name: "Luxemburg" },
  { flag: "🇧🇪", name: "Belgien" }, { flag: "🇵🇱", name: "Polen" },
  { flag: "🇨🇿", name: "Tschechien" }, { flag: "🇮🇹", name: "Italien" },
  { flag: "🇪🇸", name: "Spanien" }, { flag: "🇭🇷", name: "Kroatien" },
  { flag: "🇧🇷", name: "Brasilien" },
];

const CountryBadges = () => (
  <section className="py-12 md:py-20">
    <div className="container">
      <h2 className="font-display text-3xl md:text-5xl text-center mb-3 text-foreground">
        Wir sind in <span className="text-gradient-primary">13 Ländern</span>
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
        Die größte ABBA Sing-Along Party-Tour Europas – und darüber hinaus.
      </p>
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        {countries.map((c, i) => (
          <motion.div key={c.flag} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
            <span className="text-2xl">{c.flag}</span>
            <span className="text-sm font-medium text-foreground">{c.name}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── For Whom ─── */
const audiences = [
  { icon: PartyPopper, title: "JGA / Bachelorette", desc: "Die perfekte Feier mit den Mädels vor dem großen Tag." },
  { icon: Cake, title: "Geburtstage", desc: "Feier deinen Geburtstag auf eine einzigartige und unvergessliche Art." },
  { icon: Heart, title: "Girls Night Out", desc: "Versammelt die Truppe und singt die Songs, die ihr liebt." },
  { icon: Users, title: "Gruppen", desc: "Spezielle Angebote für Gruppen ab 10 Personen." },
  { icon: Star, title: "Fans aller Generationen", desc: "ABBA ist zeitlos – Fans jeden Alters sind willkommen!" },
];

const ForWhom = () => (
  <section className="py-16 md:py-24">
    <div className="container">
      <h2 className="font-display text-3xl md:text-5xl text-center mb-3 text-foreground">
        <span className="italic">Für wen ist</span>{" "}
        <span className="text-gradient-primary">die Party?</span>
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
        Die GIMME GIMME PARTY ist für alle, die ABBA lieben und eine unvergessliche Nacht erleben wollen!
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <img src={gimmeImg2} alt="Party crowd" className="rounded-2xl h-48 md:h-72 w-full object-cover" />
        <img src={gimmeImg3} alt="Party atmosphere" className="rounded-2xl h-48 md:h-72 w-full object-cover" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {audiences.map((a, i) => (
          <motion.div key={a.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
            <a.icon className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-display text-lg text-primary mb-1">{a.title}</h3>
            <p className="text-sm text-muted-foreground">{a.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Event Countdown ─── */
function pad(n: number) { return String(n).padStart(2, "0"); }

const EventCountdown = () => {
  const [nextEvent, setNextEvent] = useState<{ city: string; location: string; date: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const fetchNext = async () => {
      const { data } = await supabase
        .from("events")
        .select("city, location_name, date")
        .eq("status", "published")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date")
        .limit(1);
      if (data?.[0]) setNextEvent({ city: data[0].city || "", location: data[0].location_name || "", date: data[0].date || "" });
    };
    fetchNext();
  }, []);

  useEffect(() => {
    if (!nextEvent?.date) return;
    const target = new Date(nextEvent.date).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextEvent]);

  if (!nextEvent) return null;

  const dateStr = nextEvent.date ? new Date(nextEvent.date).toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }) : "";

  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="container text-center">
        <h2 className="font-display text-4xl md:text-5xl mb-2 text-foreground">
          Nächstes <span className="text-gradient-gold">Event</span>
        </h2>
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8 flex-wrap">
          <MapPin className="w-4 h-4" />
          <span>{nextEvent.city}</span>
          <span>·</span>
          <span>{nextEvent.location}</span>
          <span>·</span>
          <span>{dateStr}</span>
        </div>
        <div className="flex justify-center gap-4 md:gap-6 mb-10">
          {[
            { val: timeLeft.days, label: "Tage" },
            { val: timeLeft.hours, label: "Stunden" },
            { val: timeLeft.mins, label: "Minuten" },
            { val: timeLeft.secs, label: "Sekunden" },
          ].map(u => (
            <motion.div key={u.label} className="flex flex-col items-center" initial={{ scale: 0.8 }} whileInView={{ scale: 1 }} viewport={{ once: true }}>
              <span className="font-display text-4xl md:text-6xl text-primary">{pad(u.val)}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{u.label}</span>
            </motion.div>
          ))}
        </div>
        <a href="https://mammamia-partymotto.ticket.io/?view=table" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg animate-pulse-glow hover:opacity-90 transition-all">
          <Ticket className="w-5 h-5" />
          Tickets für {nextEvent.city}
        </a>
      </div>
    </section>
  );
};

/* ─── Upcoming Events from DB ─── */
interface Event {
  id: string; slug: string; title: string; subtitle: string;
  date: string; dateShort: string; time: string; location: string;
  city: string; image: string | null; tag: string; highlight?: boolean;
}

const UpcomingEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: series } = await supabase
        .from("event_series")
        .select("id, slug, title, city, image_url")
        .eq("status", "published")
        .order("sort_order")
        .limit(6);
      if (!series) return;

      const mapped: Event[] = [];
      for (const s of series) {
        const { data: ev } = await supabase
          .from("events")
          .select("date, time, location_name, highlight, tag")
          .eq("series_id", s.id)
          .eq("status", "published")
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date")
          .limit(1);

        const e = ev?.[0];
        const d = e?.date ? new Date(e.date + "T00:00:00") : null;
        const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

        mapped.push({
          id: s.id, slug: s.slug,
          title: (s.city || s.title).toUpperCase(),
          subtitle: "MAMMA MIA / ABBA TOUR",
          date: d ? `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}` : "Bald verfügbar",
          dateShort: d ? `${d.getDate()}. ${months[d.getMonth()].toUpperCase()}` : "TBA",
          time: e?.time || "20:00",
          location: e?.location_name || "TBA",
          city: s.city || s.title,
          image: s.image_url || fallbackImages[mapped.length % fallbackImages.length],
          tag: e ? (e.highlight ? "Fast ausverkauft" : e.tag || "Konzert") : "Coming Soon",
          highlight: e?.highlight || false,
        });
      }
      setEvents(mapped);
    };
    fetch();
  }, []);

  return (
    <section id="events" className="py-16 md:py-24">
      <div className="container">
        <h2 className="font-display text-4xl md:text-5xl text-center mb-12 text-foreground">
          Kommende <span className="text-gradient-primary">Events</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {events.map((ev, i) => (
            <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Link to={`/${ev.slug}`} className="flex items-center justify-between p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                <div className="flex gap-4 items-center">
                  <div className="text-center min-w-[50px]">
                    <span className="font-display text-2xl text-primary">{ev.dateShort.split(".")[0]}</span>
                    <p className="text-xs text-muted-foreground uppercase">{ev.dateShort.split(" ").pop()}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{ev.city}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">
                  <Ticket className="w-4 h-4" />Tickets
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <Link to="/vergangene-events" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            Alle Events ansehen <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

/* ─── What To Expect ─── */
const WhatToExpect = () => {
  const features = [
    { icon: Music, title: "Live DJ", desc: "Professioneller DJ mit den besten ABBA-Hits und Party-Classics." },
    { icon: Users, title: "Show-Crew", desc: "Verkleidete Performer sorgen für die ultimative Mamma Mia Atmosphäre." },
    { icon: Sparkles, title: "Glitter & Accessoires", desc: "Glitter, Leuchtstäbe und Accessoires – alles inklusive!" },
    { icon: Gift, title: "Goodie Bags", desc: "Jeder Gast bekommt ein Party-Kit mit Überraschungen." },
    { icon: Mic, title: "Sing-Along", desc: "Alle Texte auf großen Screens – jeder singt mit!" },
    { icon: Heart, title: "Unvergesslich", desc: "Emotionen, Gänsehaut und magische Momente garantiert." },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <h2 className="font-display text-4xl md:text-5xl text-center mb-4 text-foreground">
          Was dich <span className="text-gradient-primary">erwartet</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
          Jede GIMME GIMME PARTY ist ein Gesamterlebnis – mehr als nur Musik.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
              <f.icon className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display text-lg text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Ticket Categories ─── */
const TicketCategories = () => {
  const tickets = [
    { name: "Regular Ticket", desc: "Eintritt zur Party mit allen Basis-Features.", price: "Ab 19,99€", popular: false },
    { name: "Deluxe Ticket", desc: "Inkl. Goodie Bag, Glitter-Kit und Priority-Einlass.", price: "Ab 29,99€", popular: false },
    { name: "VIP Ticket", desc: "Alles aus Deluxe + VIP-Bereich, Getränk und Meet & Greet.", price: "Ab 49,99€", popular: true },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <h2 className="font-display text-4xl md:text-5xl text-center mb-4 text-foreground">
          Unsere <span className="text-gradient-primary">Tickets</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">Wähle das Ticket, das zu dir passt.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
          {tickets.map((tk, i) => (
            <motion.div key={tk.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative flex flex-col p-6 rounded-xl border transition-all hover:scale-[1.02] ${tk.popular ? "border-primary bg-primary/5 glow-primary" : "border-border bg-card hover:border-primary/30"}`}>
              {tk.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">Beliebt</span>}
              <h3 className="font-display text-xl mb-2 text-foreground">{tk.name}</h3>
              <p className="text-sm text-muted-foreground flex-1 mb-4">{tk.desc}</p>
              <p className="font-display text-2xl text-gold mb-4">{tk.price}</p>
              <a href="https://mammamia-partymotto.ticket.io/?view=table" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                <Ticket className="w-4 h-4" />Jetzt buchen
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Gallery Slideshow ─── */
const slides = [
  { src: "/images/gimme-gallery-1.jpg", alt: "GIMME GIMME PARTY – Full Venue" },
  { src: "/images/gimme-gallery-2.jpg", alt: "Crowd at ABBA show" },
  { src: "/images/gimme-gallery-3.jpg", alt: "Party atmosphere" },
];

const GallerySlideshow = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback((dir: 1 | -1) => {
    setDirection(dir);
    setCurrent(prev => (prev + dir + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => go(1), 5000);
    return () => clearInterval(timer);
  }, [go]);

  return (
    <section className="py-16 md:py-24 overflow-hidden">
      <div className="container">
        <h2 className="font-display text-4xl md:text-5xl text-center mb-10 text-foreground">
          PARTY <span className="text-gradient-primary">VIBES</span>
        </h2>
        <div className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden aspect-[16/9] bg-card">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              initial={{ x: direction > 0 ? "100%" : "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? "-100%" : "100%", opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img src={slides[current].src} alt={slides[current].alt} className="w-full h-full object-cover" />
            </motion.div>
          </AnimatePresence>
          <button onClick={() => go(-1)} aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 transition-colors z-10">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => go(1)} aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/80 transition-colors z-10">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {slides.map((_, i) => (
              <button key={i} onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? "bg-primary w-6" : "bg-foreground/40 hover:bg-foreground/60"}`}
                aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── Reviews ─── */
const reviews = [
  { name: "Camila R.", text: "Beste Nacht meines Lebens! Wir haben jeden Song zusammen gesungen, ich habe bei Dancing Queen geweint. Hab schon Tickets für's nächste Mal!", rating: 5 },
  { name: "Fernanda L.", text: "Wir haben den JGA meiner Freundin dort gefeiert und es war PERFEKT. Der Glitter, die Energie, einfach alles war unglaublich!", rating: 5 },
  { name: "Patricia M.", text: "Ich habe meinen 40. Geburtstag mit Freunden gefeiert. Ein einzigartiges Erlebnis, wir fühlten uns wie in den 70ern!", rating: 5 },
  { name: "Ana Clara S.", text: "Ich habe meine Mutter mitgebracht und es war so emotional. ABBA verbindet Generationen! Die Produktion ist makellos.", rating: 5 },
  { name: "Juliana K.", text: "Wir waren mit 15 Freunden da. Die Organisation war top, der Gruppenrabatt hat sich absolut gelohnt. Wir kommen wieder!", rating: 5 },
  { name: "Marcos T.", text: "Ich dachte, es wäre nur für Frauen, aber ich hatte SO VIEL SPASS. Die Party ist für alle, die gute Laune lieben!", rating: 5 },
];

const Reviews = () => (
  <section className="py-16 md:py-24">
    <div className="container">
      <h2 className="font-display text-3xl md:text-5xl text-center mb-12 text-foreground italic">
        Was unsere <span className="text-gradient-primary">Fans sagen</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <motion.div key={r.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="p-6 rounded-xl bg-card border border-border flex flex-col">
            <Quote className="w-8 h-8 text-primary mb-3" />
            <p className="text-sm text-foreground/90 mb-4 flex-1">"{r.text}"</p>
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-sm font-semibold text-foreground">{r.name}</span>
              <div className="flex gap-0.5">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-gold text-gold" />
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Newsletter CTA ─── */
const NewsletterCTA = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    await supabase.from("newsletter_subscribers").insert({ email, source: "landing_page" });
    setSubmitted(true);
  };

  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="container max-w-2xl text-center">
        <h2 className="font-display text-4xl md:text-5xl mb-4 text-foreground">
          Bleib <span className="text-gradient-gold">informiert</span>
        </h2>
        <p className="text-muted-foreground mb-8">Erhalte exklusive News, Presale-Zugang und Party-Updates direkt in dein Postfach.</p>

        {submitted ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-primary font-semibold text-lg">
            🎉 Du bist dabei! Check dein Postfach.
          </motion.p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input type="email" required placeholder="Deine E-Mail Adresse" value={email} onChange={e => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <button type="submit" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" /> Anmelden
            </button>
          </form>
        )}

        <div className="mt-8">
          <a href="http://bit.ly/mammamiacommunity" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(142,70%,45%)] text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
            <MessageCircle className="w-5 h-5" /> WhatsApp Community
          </a>
        </div>
      </div>
    </section>
  );
};

/* ─── Page ─── */
export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 md:pt-20">
        <Hero />
        <TrustBadges />
        <WhatIsIt />
        <CountryBadges />
        <ForWhom />
        <EventCountdown />
        <UpcomingEvents />
        <WhatToExpect />
        <TicketCategories />
        <GallerySlideshow />
        <Reviews />
        <NewsletterCTA />
      </main>
      <Footer />
      <SupportChatbot />
    </div>
  );
}