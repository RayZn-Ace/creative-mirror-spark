import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  MapPin, ArrowRight, Ticket, Music, Sparkles,
  Users, Heart, Star, Gift, Mic, Quote, Play,
  ChevronLeft, ChevronRight, Sun
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import SupportChatbot from "@/components/SupportChatbot";

import { supabase } from "@/integrations/supabase/client";
import { getGlobalTranslations, getBrowserLang, type GlobalTranslations } from "@/lib/i18n";
import heroBg from "@/assets/hero-club.jpg";
import heroCrowdOld from "@/assets/hero-crowd.jpg";
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
  const [nextEvent, setNextEvent] = useState<{
    title: string; subtitle: string | null; city: string | null; date: string;
    time: string | null; location_name: string | null; slug: string; image_url: string | null;
    highlight?: boolean;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [isHighlight, setIsHighlight] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    // First try to find a highlight event
    supabase.from("events").select("title, subtitle, city, date, time, location_name, slug, image_url, highlight")
      .eq("status", "published").eq("highlight", true).gte("date", today)
      .order("date", { ascending: true }).limit(1)
      .then(({ data }) => {
        if (data?.[0]) {
          setNextEvent(data[0]);
          setIsHighlight(true);
        } else {
          // Fallback: next upcoming event
          supabase.from("events").select("title, subtitle, city, date, time, location_name, slug, image_url, highlight")
            .eq("status", "published").gte("date", today)
            .order("date", { ascending: true }).limit(1)
            .then(({ data: fallback }) => {
              if (fallback?.[0]) setNextEvent(fallback[0]);
            });
        }
      });
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
    <section className="py-16 md:py-24">
      <div className="container px-4">
        {/* Label */}
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {isHighlight ? "⭐ Unser Highlight" : `${gt.countdownNext} ${gt.countdownEvent}`}
          </span>
        </div>

        <Link
          to={`/${nextEvent.slug}`}
          className="group block rounded-2xl border border-primary/30 bg-card overflow-hidden hover:border-primary/60 transition-all duration-300"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Flyer image */}
            <div className="relative overflow-hidden aspect-[3/4] sm:aspect-[4/5] lg:aspect-auto lg:min-h-[500px]">
              {nextEvent.image_url ? (
                <img
                  src={nextEvent.image_url}
                  alt={nextEvent.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 will-change-transform"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-card" />
              )}
              {/* Gradient fade on mobile (bottom) and desktop (right) */}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-card" />
            </div>

            {/* Info side */}
            <div className="relative flex flex-col justify-center p-8 md:p-12 -mt-20 lg:mt-0">
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl uppercase tracking-wide text-foreground mb-2 group-hover:text-primary transition-colors">
                {nextEvent.title}
              </h2>
              {nextEvent.subtitle && (
                <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-md">
                  {nextEvent.subtitle}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-8">
                {nextEvent.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    {nextEvent.city}
                  </span>
                )}
                {nextEvent.location_name && (
                  <span className="flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-primary" />
                    {nextEvent.location_name}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {dateStr}
                </span>
              </div>

              {/* Countdown */}
              <div className="flex gap-3 md:gap-5 mb-8">
                {[
                  { val: timeLeft.days, label: gt.countdownDays },
                  { val: timeLeft.hours, label: gt.countdownHours },
                  { val: timeLeft.mins, label: gt.countdownMinutes },
                  { val: timeLeft.secs, label: gt.countdownSeconds },
                ].map(u => (
                  <div key={u.label} className="flex flex-col items-center px-3 py-2 rounded-xl bg-muted/50 border border-border min-w-[60px]">
                    <span className="font-display text-2xl md:text-3xl text-primary">{pad(u.val)}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{u.label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div>
                <span className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg group-hover:shadow-[var(--shadow-glow)] transition-shadow duration-300">
                  <Ticket className="w-5 h-5" />
                  {gt.countdownTicketsFor} {nextEvent.city} {gt.countdownSecure}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </div>
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
import heroCrowdOld from "@/assets/hero-crowd.jpg";

const slides = [
  { src: heroCrowdOld, alt: "Crowd bei der Party" },
  { src: crowdWide, alt: "Club-Atmosphäre mit Nebel" },
  { src: crowdAerial, alt: "Crowd mit CO2-Effekten" },
  { src: crowdGlowsticks, alt: "Volle Tanzfläche von oben" },
  { src: crowdHands, alt: "Fans mit Schildern beim Feiern" },
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
  { name: "Lena M., 17", text: "Omg die Party war SO sick 🔥 Hab noch nie so krass gefeiert, die Musik war on point und die Vibes einfach unreal. Nächstes Mal bin ich 100% wieder da!!", rating: 5 },
  { name: "Finn T., 18", text: "Bruder, bester Abend seit langem fr fr. Sound war heftig, Leute waren alle drauf und die Orga war mega smooth. 10/10 no cap 🙌", rating: 5 },
  { name: "Mia S., 16", text: "War meine erste richtige Party und ich bin OBSESSED. Alles war so gut organisiert und die Stimmung war einfach crazy. Komm definitiv wieder!! 💜", rating: 5 },
  { name: "Noah K., 19", text: "Tickets kaufen war easy, Einlass ging mega schnell und drinnen war's dann einfach nur lit. Feiern mit den Jungs war legendär 🎉", rating: 5 },
  { name: "Emilia R., 17", text: "Die Location war ein Traum und alle hatten richtig Bock. Hab so viele neue Leute kennengelernt, das war echt die beste Nacht ever 🤩", rating: 5 },
  { name: "Luis P., 18", text: "Hatte erst keinen Bock aber dann war ich da und es war WILD. Beste Entscheidung, wir gehen jetzt zu jeder Nightlife Generation Party lol 😂", rating: 5 },
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
        <CrowdSlideshow gt={gt} />
        <WhatToExpect gt={gt} />
        
        <Reviews gt={gt} />
      </main>
      <Footer gt={gt} />
      <BottomNav />
      <SupportChatbot />
    </div>
  );
}
