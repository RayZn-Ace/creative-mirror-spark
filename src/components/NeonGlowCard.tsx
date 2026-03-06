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
    const c1 = `${hue}, ${sat}%, ${light}%`;
    const c2 = `${hue2}, ${sat2}%, ${light2}%`;
    // Offset animation delays per card for visual variety
    const delay = (index % 5) * 0.8;

    return {
      // Outer glow border
      "--neon-c1": `hsl(${c1})`,
      "--neon-c2": `hsl(${c2})`,
      "--neon-glow": `0 0 20px hsla(${c1}, 0.15), 0 0 60px hsla(${c2}, 0.08)`,
      "--neon-delay": `${delay}s`,
      // Beam angles based on hue for uniqueness
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
