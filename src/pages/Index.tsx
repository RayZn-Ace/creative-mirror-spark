import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPin, ArrowRight, Ticket, Music, Sparkles,
  Users, Heart, Star, Gift, Mic, Quote,
  ChevronLeft, ChevronRight, Sun
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import SupportChatbot from "@/components/SupportChatbot";

import { supabase } from "@/integrations/supabase/client";
import { getGlobalTranslations, getBrowserLang, type GlobalTranslations } from "@/lib/i18n";
import heroBg from "@/assets/hero-crowd.jpg";
import crowdParty from "@/assets/crowd-party.jpg";
import crowdAerial from "@/assets/crowd-aerial.jpg";
import crowdWide from "@/assets/crowd-wide.jpg";
import crowdGlowsticks from "@/assets/crowd-glowsticks.jpg";
import crowdGlowsticks2 from "@/assets/crowd-glowsticks2.jpg";
import crowdHands from "@/assets/crowd-hands.jpg";
import dancerHappy from "@/assets/dancer-happy.jpg";

/* ─── Hero ─── */
const Hero = ({ gt }: { gt: GlobalTranslations }) => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0">
      <img src={heroBg} alt="Nightlife Generation – Dein Ticketshop für Events und Partys" className="w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0 bg-hero-overlay" />
      <div className="absolute inset-0 bg-background/40" />
    </div>
    <div className="relative z-10 container text-center px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl leading-none mb-4">
          {gt.heroTitle}<span className="text-gradient-primary">{gt.heroSubtitle}</span>
        </h1>
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


/* ─── Event Countdown ─── */
function pad(n: number) { return String(n).padStart(2, "0"); }

const EventCountdown = ({ gt }: { gt: GlobalTranslations }) => {
  const [nextEvent, setNextEvent] = useState<{ title: string; city: string | null; date: string; time: string | null; location_name: string | null; slug: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    supabase.from("events").select("title, city, date, time, location_name, slug")
      .eq("status", "published").gte("date", today)
      .order("date", { ascending: true }).limit(1)
      .then(({ data }) => { if (data?.[0]) setNextEvent(data[0]); });
  }, []);

  useEffect(() => {
    if (!nextEvent) return;
    const target = new Date(nextEvent.date + (nextEvent.time ? `T${nextEvent.time}` : "T20:00")).getTime();
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
          <span>{nextEvent.city}</span>
          <span>·</span>
          <span>{nextEvent.location_name}</span>
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
        <Link to={`/termine`}
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
  const [upcomingEvents, setUpcomingEvents] = useState<{ id: string; title: string; city: string | null; date: string | null; location_name: string | null; slug: string }[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    supabase.from("events").select("id, title, city, date, location_name, slug")
      .eq("status", "published").gte("date", today)
      .order("date", { ascending: true }).limit(4)
      .then(({ data }) => setUpcomingEvents(data ?? []));
  }, []);

  if (!upcomingEvents.length) return null;

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
                  <span className="font-display text-2xl text-primary">{ev.date ? new Date(ev.date).getDate() : "?"}</span>
                  <p className="text-xs text-muted-foreground uppercase">{ev.date ? new Date(ev.date).toLocaleDateString("de-DE", { month: "short" }) : ""}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{ev.title}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location_name}{ev.city ? `, ${ev.city}` : ""}</p>
                </div>
              </div>
              <Link to={`/termine`}
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


/* ─── Page ─── */
export default function Index() {
  const gt = useMemo(() => getGlobalTranslations(), []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar gt={gt} />
      <main className="flex-1 pt-16 md:pt-20 pb-20 lg:pb-0">
        <Hero gt={gt} />
        <EventCountdown gt={gt} />
        <UpcomingEvents gt={gt} />
        <WhatToExpect gt={gt} />
        <CrowdSlideshow gt={gt} />
        <Reviews gt={gt} />
      </main>
      <Footer gt={gt} />
      <BottomNav />
      <SupportChatbot />
      
    </div>
  );
}
