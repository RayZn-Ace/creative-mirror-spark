import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAnniversary } from "@/hooks/useAnniversary";
import { ANNIVERSARY_TITLE } from "@/lib/anniversary";

/** Schmaler Jubiläums-Streifen oben im Menü. Verschwindet automatisch nach dem 20.09. */
const AnniversaryBanner = () => {
  const active = useAnniversary();
  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="anniv-strip relative overflow-hidden"
    >
      <div className="container flex items-center justify-center gap-2 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-primary-foreground">
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{ANNIVERSARY_TITLE}</span>
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
      </div>
      <span className="anniv-shine" aria-hidden />
    </motion.div>
  );
};

export default AnniversaryBanner;
