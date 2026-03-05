import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket } from "lucide-react";

const NAMES = [
  "Sophie", "Lena", "Emma", "Mia", "Hannah", "Laura", "Anna", "Lea",
  "Marie", "Lisa", "Julia", "Sarah", "Lara", "Nina", "Jana", "Alina",
  "Amelie", "Clara", "Johanna", "Katharina", "Elena", "Luisa", "Nele",
  "Paulina", "Chiara", "Franziska", "Emilia", "Charlotte", "Victoria",
];

const CITIES = [
  "Hamburg", "Berlin", "Köln", "München", "Frankfurt", "Düsseldorf",
  "Stuttgart", "Dortmund", "Essen", "Leipzig", "Dresden", "Hannover",
  "Nürnberg", "Bonn", "Augsburg", "Braunschweig", "Bielefeld", "Bochum",
];

const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const randCount = () => Math.random() < 0.5 ? 2 : Math.random() < 0.7 ? 3 : 4;

export default function SocialProofToast() {
  const [msg, setMsg] = useState<{ name: string; count: number; city: string; id: number } | null>(null);

  useEffect(() => {
    const show = () => {
      setMsg({ name: rand(NAMES), count: randCount(), city: rand(CITIES), id: Date.now() });
      setTimeout(() => setMsg(null), 4000);
    };
    // initial delay
    const first = setTimeout(show, 5000);
    const interval = setInterval(show, (15 + Math.random() * 15) * 1000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      <AnimatePresence>
        {msg && (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs"
            style={{
              background: "linear-gradient(135deg, hsl(330 80% 55% / 0.15), hsl(220 50% 12% / 0.9))",
              border: "1px solid hsl(330 80% 55% / 0.3)",
            }}
          >
            <div
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "hsl(330 80% 55% / 0.25)" }}
            >
              <Ticket className="w-4 h-4" style={{ color: "hsl(330 80% 55%)" }} />
            </div>
            <div>
              <p className="text-xs font-semibold" style={{ color: "hsl(0 0% 100%)" }}>
                {msg.name} hat gerade {msg.count} Tickets gekauft
              </p>
              <p className="text-[11px] mt-0.5 font-medium" style={{ color: "hsl(330 80% 65%)" }}>
                📍 {msg.city} · GIMME GIMME
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
