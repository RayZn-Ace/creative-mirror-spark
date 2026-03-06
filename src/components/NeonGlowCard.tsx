import { useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useDominantColor } from "@/hooks/useDominantColor";

interface NeonGlowCardProps {
  imageUrl: string | null;
  children: React.ReactNode;
  className?: string;
  index?: number;
}

/**
 * Wraps children with animated neon light beams
 * that match the dominant color of the provided image.
 */
const NeonGlowCard = ({ imageUrl, children, className = "", index = 0 }: NeonGlowCardProps) => {
  const color = useDominantColor(imageUrl);
  const ref = useRef<HTMLDivElement>(null);

  const styles = useMemo(() => {
    if (!color) return null;
    const { hue, sat, light, hue2, sat2, light2 } = color;
    const delay = (index % 5) * 0.6;

    return {
      "--neon-c1": `hsl(${hue}, ${sat}%, ${Math.min(light + 15, 65)}%)`,
      "--neon-c2": `hsl(${hue2}, ${sat2}%, ${Math.min(light2 + 15, 65)}%)`,
      "--neon-h1": `${hue}`,
      "--neon-s1": `${sat}%`,
      "--neon-l1": `${Math.min(light + 15, 65)}%`,
      "--neon-h2": `${hue2}`,
      "--neon-s2": `${sat2}%`,
      "--neon-l2": `${Math.min(light2 + 15, 65)}%`,
      "--neon-glow": `0 0 25px hsla(${hue}, ${sat}%, ${light + 10}%, 0.25), 0 0 60px hsla(${hue2}, ${sat2}%, ${light2 + 10}%, 0.12)`,
      "--neon-delay": `${delay}s`,
      "--beam-angle": `${(hue % 60) + 120}deg`,
      "--beam-angle2": `${(hue2 % 90) + 200}deg`,
    } as React.CSSProperties;
  }, [color, index]);

  if (!styles) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={`neon-glow-card relative ${className}`} style={styles}>
      {/* Animated beam layer 1 */}
      <div className="neon-beam neon-beam-1" aria-hidden="true" />
      {/* Animated beam layer 2 */}
      <div className="neon-beam neon-beam-2" aria-hidden="true" />
      {/* Hover glow pulse */}
      <div className="neon-hover-glow" aria-hidden="true" />
      {children}
    </div>
  );
};

export default NeonGlowCard;
