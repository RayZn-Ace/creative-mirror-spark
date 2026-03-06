import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPin, Calendar, ArrowRight, Ticket, Clock, Music, Music2, Sparkles,
  Users, Heart, Star, Gift, Mic, Quote, Send, MessageCircle,
  ChevronLeft, ChevronRight, Globe, PartyPopper, Cake, Sun
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupportChatbot from "@/components/SupportChatbot";
import SocialProofToast from "@/components/SocialProofToast";
import { events, getNextEvent } from "@/data/events";
import { getGlobalTranslations, getBrowserLang, type GlobalTranslations } from "@/lib/i18n";
import heroBg from "@/assets/hero-crowd.jpg";
import crowdParty from "@/assets/crowd-party.jpg";
import crowdAerial from "@/assets/crowd-aerial.jpg";
import crowdVertical from "@/assets/crowd-vertical.jpg";
import crowdWide from "@/assets/crowd-wide.jpg";
import crowdGlowsticks from "@/assets/crowd-glowsticks.jpg";
import crowdGlowsticks2 from "@/assets/crowd-glowsticks2.jpg";
import crowdHands from "@/assets/crowd-hands.jpg";
import dancerHappy from "@/assets/dancer-happy.jpg";

/* ─── Hero ─── */
const Hero = ({ gt }: { gt: GlobalTranslations }) => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroBg} alt="partyticket – Dein Ticketshop für Events und Partys" className="w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="absolute inset-0 bg-background/40" />
    </div>
    <div className="relative z-10 container text-center px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-none mb-4">
          {gt.heroTitle}{" "}<span className="text-gradient-primary">PARTY</span>
        </h1>
        <p className="font-display text-2xl sm:text-3xl md:text-4xl text-gold mb-2">{gt.heroSubtitle}</p>
        <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10">{gt.heroDesc}</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/termine"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg animate-pulse-glow hover:opacity-90 transition-all">
          <Ticket className="w-5 h-5" /> {gt.heroTicketBtn}
        </Link>
      </motion.div>
    </div>
    <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-2">
      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
    </motion.div>
  </section>
);

/* ─── Trust Badges ─── */
const TrustBadges = ({ gt }: { gt: GlobalTranslations }) => {
  const badges = [
    { icon: MapPin, value: "150+", label: gt.trustCities },
    { icon: Globe, value: "13+", label: gt.trustCountries },
    { icon: Heart, value: "1.5M+", label: gt.trustFollowers },
    { icon: Users, value: "250K+", label: gt.trustFans },
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
const WhatIsIt = ({ gt }: { gt: GlobalTranslations }) => {
  const features = [
    { icon: Clock, label: gt.feat3hParty },
    { icon: Music2, label: gt.featLiveDj },
    { icon: Sparkles, label: gt.featGlitter },
    { icon: Users, label: gt.featFans },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl md:text-5xl text-foreground mb-6">
              <span className="italic">{gt.whatIsTitle1}</span>{" "}
              <span className="text-gradient-primary">{gt.whatIsTitle2}</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-lg">{gt.whatIsDesc}</p>
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
            <img src={crowdParty} alt="Party Crowd" className="w-full h-[300px] md:h-[420px] object-cover" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ─── Country Badges ─── */
const countryCodes = [
  { flag: "🇩🇪", code: "DE" }, { flag: "🇦🇹", code: "AT" },
  { flag: "🇨🇭", code: "CH" }, { flag: "🇳🇱", code: "NL" },
  { flag: "🇫🇷", code: "FR" }, { flag: "🇱🇺", code: "LU" },
  { flag: "🇧🇪", code: "BE" }, { flag: "🇵🇱", code: "PL" },
  { flag: "🇨🇿", code: "CZ" }, { flag: "🇮🇹", code: "IT" },
  { flag: "🇪🇸", code: "ES" }, { flag: "🇭🇷", code: "HR" },
  { flag: "🇧🇷", code: "BR" },
];

const CountryBadges = ({ gt }: { gt: GlobalTranslations }) => (
  <section className="py-12 md:py-20">
    <div className="container">
      <h2 className="font-display text-3xl md:text-5xl text-center mb-3 text-foreground">
        {gt.countriesTitle1} <span className="text-gradient-primary">{gt.countriesTitle2}</span>
      </h2>
      <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">{gt.countriesDesc}</p>
      <div className="flex flex-wrap justify-center gap-3 md:gap-4">
        {countryCodes.map((c, i) => (
          <motion.div key={c.flag} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
            <span className="text-2xl">{c.flag}</span>
            <span className="text-sm font-medium text-foreground">{gt.countryNames[c.code] || c.code}</span>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── For Whom ─── */
const ForWhom = ({ gt }: { gt: GlobalTranslations }) => {
  const audiences = [
    { icon: PartyPopper, title: gt.audJga, desc: gt.audJgaDesc },
    { icon: Cake, title: gt.audBirthday, desc: gt.audBirthdayDesc },
    { icon: Heart, title: gt.audGirlsNight, desc: gt.audGirlsNightDesc },
    { icon: Users, title: gt.audGroups, desc: gt.audGroupsDesc },
    { icon: Star, title: gt.audFans, desc: gt.audFansDesc },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <h2 className="font-display text-3xl md:text-5xl text-center mb-3 text-foreground">
          <span className="italic">{gt.forWhomTitle1}</span>{" "}
          <span className="text-gradient-primary">{gt.forWhomTitle2}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">{gt.forWhomDesc}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <img src={crowdAerial} alt="Party crowd" className="rounded-2xl h-48 md:h-72 w-full object-cover" />
          <img src={crowdVertical} alt="Party atmosphere" className="rounded-2xl h-48 md:h-72 w-full object-cover" />
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
};

/* ─── Event Countdown ─── */
function pad(n: number) { return String(n).padStart(2, "0"); }

const EventCountdown = ({ gt }: { gt: GlobalTranslations }) => {
  const nextEvent = getNextEvent();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    if (!nextEvent) return;
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

  const dateStr = new Date(nextEvent.date).toLocaleDateString("de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="container text-center">
        <h2 className="font-display text-4xl md:text-5xl mb-2 text-foreground">
          {gt.countdownNext} <span className="text-gradient-gold">{gt.countdownEvent}</span>
        </h2>
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8 flex-wrap">
          <MapPin className="w-4 h-4" />
          <span>{nextEvent.city}, {nextEvent.country}</span>
          <span>·</span>
          <span>{nextEvent.locationName}</span>
          <span>·</span>
          <span>{dateStr}</span>
        </div>
        <div className="flex justify-center gap-4 md:gap-6 mb-10">
          {[
            { val: timeLeft.days, label: gt.countdownDays },
            { val: timeLeft.hours, label: gt.countdownHours },
            { val: timeLeft.mins, label: gt.countdownMinutes },
            { val: timeLeft.secs, label: gt.countdownSeconds },
          ].map(u => (
            <motion.div key={u.label} className="flex flex-col items-center" initial={{ scale: 0.8 }} whileInView={{ scale: 1 }} viewport={{ once: true }}>
              <span className="font-display text-4xl md:text-6xl text-primary">{pad(u.val)}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{u.label}</span>
            </motion.div>
          ))}
        </div>
        <Link to={`/${nextEvent.city.toLowerCase().replace(/\s+/g, "-").replace(/ü/g, "ue").replace(/ö/g, "oe").replace(/ä/g, "ae").replace(/ß/g, "ss")}`}
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg animate-pulse-glow hover:opacity-90 transition-all">
          <Ticket className="w-5 h-5" />
          {gt.countdownTicketsFor} {nextEvent.city} {gt.countdownSecure}
        </Link>
      </div>
    </section>
  );
};

/* ─── Upcoming Events ─── */
const UpcomingEvents = ({ gt }: { gt: GlobalTranslations }) => {
  const upcomingEvents = events
    .filter(e => e.status === "planned" && new Date(e.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <section id="events" className="py-16 md:py-24">
      <div className="container">
        <h2 className="font-display text-4xl md:text-5xl text-center mb-12 text-foreground">
          {gt.upcomingTitle1} <span className="text-gradient-primary">{gt.upcomingTitle2}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {upcomingEvents.map((ev, i) => (
            <motion.div key={ev.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
              <div className="flex gap-4 items-center">
                <div className="text-center min-w-[50px]">
                  <span className="font-display text-2xl text-primary">{new Date(ev.date).getDate()}</span>
                  <p className="text-xs text-muted-foreground uppercase">{new Date(ev.date).toLocaleDateString("de-DE", { month: "short" })}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {ev.city}
                    {ev.extras?.toLowerCase().includes("open air") && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-semibold border border-gold/30">
                        <Sun className="w-2.5 h-2.5" /> Open Air
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.locationName}</p>
                </div>
              </div>
              <Link to={`/${ev.city.toLowerCase().replace(/\s+/g, "-").replace(/ü/g, "ue").replace(/ö/g, "oe").replace(/ä/g, "ae").replace(/ß/g, "ss")}`}
                className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                <Ticket className="w-4 h-4" />{gt.navTickets}
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <Link to="/termine" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
            {gt.upcomingAllDates} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

/* ─── What To Expect ─── */
const WhatToExpect = ({ gt }: { gt: GlobalTranslations }) => {
  const features = [
    { icon: Music, title: gt.expectLiveDj, desc: gt.expectLiveDjDesc },
    { icon: Users, title: gt.expectCrew, desc: gt.expectCrewDesc },
    { icon: Sparkles, title: gt.expectGlitter, desc: gt.expectGlitterDesc },
    { icon: Gift, title: gt.expectGiveaways, desc: gt.expectGiveawaysDesc },
    { icon: Mic, title: gt.expectSingAlong, desc: gt.expectSingAlongDesc },
    { icon: Heart, title: gt.expectUnforgettable, desc: gt.expectUnforgettableDesc },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <h2 className="font-display text-4xl md:text-5xl text-center mb-4 text-foreground">
          {gt.expectTitle1} <span className="text-gradient-primary">{gt.expectTitle2}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">{gt.expectDesc}</p>
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
const TicketCategories = ({ gt }: { gt: GlobalTranslations }) => {
  const tickets = [
    { name: gt.ticketRegular, desc: gt.ticketRegularDesc, price: "Ab 19,99€", popular: false },
    { name: gt.ticketDeluxe, desc: gt.ticketDeluxeDesc, price: "Ab 29,99€", popular: false },
    { name: gt.ticketFan, desc: gt.ticketFanDesc, price: "Ab 49,99€", popular: true },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <h2 className="font-display text-4xl md:text-5xl text-center mb-4 text-foreground">
          {gt.ticketCatTitle1} <span className="text-gradient-primary">{gt.ticketCatTitle2}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">{gt.ticketCatDesc}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
          {tickets.map((tk, i) => (
            <motion.div key={tk.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`relative flex flex-col p-6 rounded-xl border transition-all hover:scale-[1.02] ${tk.popular ? "border-primary bg-primary/5 glow-primary" : "border-border bg-card hover:border-primary/30"}`}>
              {tk.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">{gt.ticketCatPopular}</span>}
              <h3 className="font-display text-xl mb-2 text-foreground">{tk.name}</h3>
              <p className="text-sm text-muted-foreground flex-1 mb-4">{tk.desc}</p>
              <p className="font-display text-2xl text-gold mb-4">{tk.price}</p>
              <Link to="/termine"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
                <Ticket className="w-4 h-4" />{gt.ticketCatSecure}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─── Crowd Slideshow ─── */
const slides = [
  { src: crowdWide, alt: "Full Venue Panorama" },
  { src: crowdAerial, alt: "Aerial crowd shot" },
  { src: crowdGlowsticks, alt: "Glowsticks in the crowd" },
  { src: crowdHands, alt: "Hands up at the show" },
  { src: dancerHappy, alt: "Happy fans dancing" },
  { src: crowdParty, alt: "Party atmosphere" },
  { src: crowdGlowsticks2, alt: "Sea of glowsticks" },
];

const CrowdSlideshow = ({ gt }: { gt: GlobalTranslations }) => {
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
          {gt.vibesTitle1} <span className="text-gradient-primary">{gt.vibesTitle2}</span>
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

/* ─── Video Section ─── */
const videoIds = ["53dTybHhlaw", "LrTjwGo_6Z4", "s8-6TQHgslw", "zNJMzCW0qVk", "1GTESLgRtvk"];

const VideoSection = ({ gt }: { gt: GlobalTranslations }) => (
  <section className="py-16 md:py-24 bg-card/50">
    <div className="container">
      <h2 className="font-display text-4xl md:text-5xl text-center mb-4 text-foreground">
        {gt.videoTitle1} <span className="text-gradient-gold">{gt.videoTitle2}</span>
      </h2>
      <p className="text-center text-muted-foreground mb-12">{gt.videoDesc}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {videoIds.map((id, i) => (
          <motion.div key={id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
            className="aspect-[9/16] rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-colors">
            <iframe
              src={`https://www.youtube.com/embed/${id}`}
              title={`Party Video ${i + 1}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ─── Reviews ─── */
const reviews = [
  { name: "Camila R.", text: "Beste Nacht meines Lebens! Die Stimmung war unglaublich, ich habe jeden Moment genossen. Hab schon Tickets für's nächste Mal!", rating: 5 },
  { name: "Fernanda L.", text: "Wir haben den JGA meiner Freundin dort gefeiert und es war PERFEKT. Die Energie, einfach alles war unglaublich!", rating: 5 },
  { name: "Patricia M.", text: "Ich habe meinen 40. Geburtstag mit Freunden gefeiert. Ein einzigartiges Erlebnis, die Atmosphäre war magisch!", rating: 5 },
  { name: "Ana Clara S.", text: "Die Organisation war perfekt, die Tickets super einfach zu kaufen und der Einlass lief reibungslos. Top Erlebnis!", rating: 5 },
  { name: "Juliana K.", text: "Wir waren mit 15 Freunden da. Die Organisation war top, der Gruppenrabatt hat sich absolut gelohnt. Wir kommen wieder!", rating: 5 },
  { name: "Marcos T.", text: "Richtig gute Party! Die Buchung war einfach und der Abend war unvergesslich. Absolute Empfehlung!", rating: 5 },
];

const Reviews = ({ gt }: { gt: GlobalTranslations }) => (
  <section className="py-16 md:py-24">
    <div className="container">
      <h2 className="font-display text-3xl md:text-5xl text-center mb-12 text-foreground italic">
        {gt.reviewsTitle1} <span className="text-gradient-primary">{gt.reviewsTitle2}</span>
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
const NewsletterCTA = ({ gt }: { gt: GlobalTranslations }) => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="py-16 md:py-24 bg-card/50">
      <div className="container max-w-2xl text-center">
        <h2 className="font-display text-4xl md:text-5xl mb-4 text-foreground">
          {gt.newsletterTitle1} <span className="text-gradient-gold">{gt.newsletterTitle2}</span>
        </h2>
        <p className="text-muted-foreground mb-8">{gt.newsletterDesc}</p>

        {submitted ? (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-primary font-semibold text-lg">
            {gt.newsletterThanks}
          </motion.p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input type="email" required placeholder={gt.newsletterPlaceholder} value={email} onChange={e => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            <button type="submit" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
              <Send className="w-4 h-4" /> {gt.newsletterSubmit}
            </button>
          </form>
        )}

        <div className="mt-8">
          <a href="https://chat.whatsapp.com/GVs4g7qn75VA4DZVWTcNRv" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(142,70%,45%)] text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
            <MessageCircle className="w-5 h-5" /> {gt.whatsappJoinGroup}
          </a>
        </div>
      </div>
    </section>
  );
};

/* ─── Page ─── */
export default function Index() {
  const gt = useMemo(() => getGlobalTranslations(), []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar gt={gt} />
      <main className="flex-1 pt-16 md:pt-20">
        <Hero gt={gt} />
        <TrustBadges gt={gt} />
        <WhatIsIt gt={gt} />
        <CountryBadges gt={gt} />
        <ForWhom gt={gt} />
        <EventCountdown gt={gt} />
        <UpcomingEvents gt={gt} />
        <WhatToExpect gt={gt} />
        <TicketCategories gt={gt} />
        <CrowdSlideshow gt={gt} />
        <VideoSection gt={gt} />
        <Reviews gt={gt} />
        <NewsletterCTA gt={gt} />
      </main>
      <Footer gt={gt} />
      <SupportChatbot />
      <SocialProofToast />
    </div>
  );
}
