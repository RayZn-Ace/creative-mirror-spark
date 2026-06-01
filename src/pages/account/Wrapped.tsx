import { useState } from "react";
import { useUserStats } from "@/hooks/useUserStats";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, Ticket, Clock, Euro, Calendar, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Wrapped() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const stats = useUserStats(year);
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      key: "intro",
      bg: "from-primary via-purple-600 to-pink-600",
      content: (
        <div className="text-center">
          <Sparkles className="h-16 w-16 mx-auto mb-6 animate-pulse" />
          <div className="text-5xl md:text-7xl font-bold mb-4">Dein {year}</div>
          <div className="text-2xl opacity-90">war sick fr fr 🔥</div>
        </div>
      ),
    },
    {
      key: "parties",
      bg: "from-pink-600 via-rose-500 to-orange-500",
      content: (
        <div className="text-center">
          <Ticket className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">Du warst auf</div>
          <div className="text-8xl md:text-9xl font-black mb-3">{stats.yearCount}</div>
          <div className="text-3xl font-bold">Partys 🎉</div>
          <div className="mt-6 opacity-80">
            Das sind {stats.yearCount * 6} Stunden Vibes
          </div>
        </div>
      ),
    },
    {
      key: "city",
      bg: "from-cyan-500 via-blue-600 to-indigo-700",
      content: (
        <div className="text-center">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">Deine Homebase</div>
          <div className="text-6xl md:text-7xl font-black mb-3">
            {stats.topCity || "—"}
          </div>
          <div className="text-2xl opacity-90">
            {stats.topCityCount}x am Start
          </div>
        </div>
      ),
    },
    {
      key: "spend",
      bg: "from-emerald-500 via-teal-600 to-green-700",
      content: (
        <div className="text-center">
          <Euro className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">Du hast investiert</div>
          <div className="text-7xl md:text-8xl font-black mb-3">
            {stats.yearSpent.toFixed(0)}€
          </div>
          <div className="text-xl opacity-90">in unvergessliche Nächte 💸</div>
        </div>
      ),
    },
    {
      key: "month",
      bg: "from-violet-600 via-purple-700 to-fuchsia-700",
      content: (
        <div className="text-center w-full max-w-md">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-70" />
          <div className="text-xl opacity-80 mb-3">Dein Party-Monat</div>
          <div className="text-5xl font-black mb-6">
            {(() => {
              const max = stats.monthBreakdown.reduce(
                (a, b) => (b.count > a.count ? b : a),
                { month: "—", count: 0 },
              );
              return max.count > 0 ? max.month : "—";
            })()}
          </div>
          <div className="grid grid-cols-12 gap-1 items-end h-32">
            {stats.monthBreakdown.map((m) => {
              const max = Math.max(...stats.monthBreakdown.map((x) => x.count), 1);
              const h = (m.count / max) * 100;
              return (
                <div key={m.month} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-white/80 rounded-t transition-all"
                    style={{ height: `${h}%`, minHeight: m.count ? "8%" : "0" }}
                  />
                  <div className="text-[10px] opacity-70">{m.month[0]}</div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      key: "outro",
      bg: "from-primary via-pink-600 to-orange-500",
      content: (
        <div className="text-center">
          <div className="text-6xl mb-6">👑</div>
          <div className="text-4xl md:text-6xl font-black mb-4">
            Du bist eine Legende
          </div>
          <div className="text-xl opacity-90 mb-8">
            Bereit für noch mehr Bangers in {now.getFullYear() + (year < now.getFullYear() ? 1 : 1)}? 🚀
          </div>
          <Button
            size="lg"
            variant="secondary"
            onClick={async () => {
              try {
                if (navigator.share) {
                  await navigator.share({
                    title: `Mein ${year} bei Nightlife`,
                    text: `Ich war auf ${stats.yearCount} Partys in ${year} – ${stats.yearCount * 6}h Vibes! 🔥`,
                  });
                } else {
                  await navigator.clipboard.writeText(
                    `Mein ${year}: ${stats.yearCount} Partys, ${stats.yearSpent.toFixed(0)}€ in Vibes investiert. 🔥`,
                  );
                  toast.success("Kopiert!");
                }
              } catch {}
            }}
          >
            <Share2 className="h-4 w-4 mr-2" /> Mit der Squad teilen
          </Button>
        </div>
      ),
    },
  ];

  if (stats.loading) {
    return <div className="p-12 text-center text-muted-foreground">Lade dein Wrapped...</div>;
  }

  if (stats.yearCount === 0) {
    return (
      <div className="space-y-6">
        <YearPicker year={year} setYear={setYear} />
        <Card className="p-12 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Noch keine Story für {year}</h2>
          <p className="text-muted-foreground">
            Schnapp dir Tickets und komm wieder, wenn du was zu wrappen hast 🎉
          </p>
        </Card>
      </div>
    );
  }

  const current = slides[slide];
  const next = () => setSlide((s) => Math.min(slides.length - 1, s + 1));
  const prev = () => setSlide((s) => Math.max(0, s - 1));

  return (
    <div className="space-y-4">
      <YearPicker year={year} setYear={setYear} onChange={() => setSlide(0)} />

      <div className="relative aspect-[9/16] sm:aspect-[4/5] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className={`absolute inset-0 bg-gradient-to-br ${current.bg} flex items-center justify-center p-8 text-white`}
          >
            {current.content}
          </motion.div>
        </AnimatePresence>

        {/* progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full ${i <= slide ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>

        {/* tap zones */}
        <button
          className="absolute inset-y-0 left-0 w-1/3 z-10"
          onClick={prev}
          aria-label="Previous"
        />
        <button
          className="absolute inset-y-0 right-0 w-1/3 z-10"
          onClick={next}
          aria-label="Next"
        />
      </div>

      <div className="flex justify-center gap-3">
        <Button variant="outline" size="sm" onClick={prev} disabled={slide === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm text-muted-foreground self-center">
          {slide + 1} / {slides.length}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={next}
          disabled={slide === slides.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function YearPicker({
  year,
  setYear,
  onChange,
}: {
  year: number;
  setYear: (y: number) => void;
  onChange?: () => void;
}) {
  const current = new Date().getFullYear();
  const years = [current, current - 1, current - 2];
  return (
    <div>
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Sparkles className="h-7 w-7 text-primary" /> Year in Review
      </h1>
      <p className="text-muted-foreground mt-1">Deine Nightlife-Story als Story 📲</p>
      <div className="flex gap-2 mt-4">
        {years.map((y) => (
          <Button
            key={y}
            size="sm"
            variant={y === year ? "default" : "outline"}
            onClick={() => {
              setYear(y);
              onChange?.();
            }}
          >
            {y}
          </Button>
        ))}
      </div>
    </div>
  );
}
