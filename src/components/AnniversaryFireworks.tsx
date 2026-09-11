import { motion } from "framer-motion";

/** Kleines Feuerwerk im Hintergrund – reine Deko. */
const bursts = [
  { left: "12%", top: "22%", delay: 0, hue: 330 },
  { left: "78%", top: "18%", delay: 1.6, hue: 45 },
  { left: "50%", top: "12%", delay: 3.1, hue: 270 },
  { left: "30%", top: "34%", delay: 4.4, hue: 200 },
  { left: "88%", top: "40%", delay: 5.8, hue: 330 },
];

const RAYS = 12;

const AnniversaryFireworks = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
    {bursts.map((b, i) => (
      <span key={i} className="absolute" style={{ left: b.left, top: b.top }}>
        {Array.from({ length: RAYS }).map((_, r) => {
          const angle = (360 / RAYS) * r;
          return (
            <motion.span
              key={r}
              className="anniv-firework-spark"
              style={{
                background: `hsl(${b.hue} 90% 65%)`,
                boxShadow: `0 0 8px hsl(${b.hue} 90% 65%)`,
              }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.6 }}
              animate={{
                x: Math.cos((angle * Math.PI) / 180) * 70,
                y: Math.sin((angle * Math.PI) / 180) * 70 + 18,
                opacity: [0, 1, 0],
                scale: [0.6, 1, 0.3],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                repeatDelay: 6.5,
                delay: b.delay,
                ease: "easeOut",
              }}
            />
          );
        })}
      </span>
    ))}
  </div>
);

export default AnniversaryFireworks;
