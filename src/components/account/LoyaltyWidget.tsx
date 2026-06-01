import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Flame, Trophy, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLoyalty } from "@/hooks/useLoyalty";

export default function LoyaltyWidget() {
  const { points, level, nextLevel, progress, toNext, streak, unlocked, loading } = useLoyalty();

  if (loading) {
    return <Card className="p-6 animate-pulse h-40 bg-muted/30" />;
  }

  return (
    <Link to="/account/rewards" className="block">
      <Card
        className="relative overflow-hidden p-6 border-2 hover:scale-[1.01] transition-transform"
        style={{
          background: `linear-gradient(135deg, ${level.color}25, hsl(var(--card)) 60%)`,
          borderColor: `${level.color}80`,
        }}
      >
        <div className="absolute -top-12 -right-12 text-[180px] opacity-10 select-none">{level.emoji}</div>

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: level.color }}>
              <Trophy className="h-3.5 w-3.5" /> Level
            </div>
            <h3 className="text-3xl font-black mt-1">
              {level.emoji} {level.label}
            </h3>
            <p className="text-2xl font-bold mt-2">
              <motion.span
                key={points}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-primary"
              >
                {points.toLocaleString("de-DE")}
              </motion.span>
              <span className="text-sm text-muted-foreground ml-1.5">Punkte</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-500 text-sm font-bold">
                <Flame className="h-4 w-4" /> {streak}w Streak
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {unlocked.length} {unlocked.length === 1 ? "Badge" : "Badges"}
            </div>
          </div>
        </div>

        {nextLevel && (
          <div className="relative mt-5">
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>noch <strong className="text-foreground">{toNext}</strong> bis {nextLevel.emoji} {nextLevel.label}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${level.color}, ${nextLevel.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        <div className="relative mt-4 flex items-center justify-end text-xs font-semibold text-primary">
          Alle Rewards <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </div>
      </Card>
    </Link>
  );
}
