import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Flame, Trophy, Lock, Sparkles, PartyPopper, Crown, Users, CreditCard, Sunrise, Sun, Star, Award, ChevronRight } from "lucide-react";
import { useLoyalty, LEVELS } from "@/hooks/useLoyalty";
import { cn } from "@/lib/utils";

const ICONS: Record<string, any> = { Sparkles, PartyPopper, Flame, Crown, Users, CreditCard, Sunrise, Sun, Star, Trophy, Award };

const TIER_COLORS: Record<string, string> = {
  bronze: "hsl(28 60% 50%)",
  silver: "hsl(0 0% 75%)",
  gold: "hsl(45 100% 55%)",
  legendary: "hsl(270 70% 60%)",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
}

function reasonLabel(reason: string, metadata: any) {
  if (reason === "ticket_purchase") return `Ticketkauf · ${metadata?.amount ? Number(metadata.amount).toFixed(2) + " " + (metadata.currency || "EUR") : ""}`;
  if (reason === "achievement") return `Badge freigeschaltet`;
  if (reason === "redeem") return `Eingelöst`;
  if (reason === "admin") return `Bonus vom Team`;
  if (reason === "birthday_bonus") return `🎂 Geburtstags-Bonus`;
  return reason;
}

export default function Rewards() {
  const { points, level, nextLevel, progress, toNext, streak, achievements, unlocked, unlockedIds, ledger, loading } = useLoyalty();

  if (loading) {
    return <div className="space-y-4"><div className="h-48 rounded-2xl bg-muted/30 animate-pulse" /><div className="h-64 rounded-2xl bg-muted/30 animate-pulse" /></div>;
  }

  const unlockedMap = new Map(unlocked.map((u) => [u.achievement_id, u.unlocked_at]));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trophy className="h-7 w-7 text-primary" /> Rewards & Level
        </h1>
        <p className="text-muted-foreground mt-1">Sammle Punkte, schalte Badges frei, werde Legend 👑</p>
      </div>

      {/* Hero Level Card */}
      <Card
        className="relative overflow-hidden p-8 border-2"
        style={{
          background: `linear-gradient(135deg, ${level.color}30, hsl(var(--card)) 70%)`,
          borderColor: `${level.color}70`,
        }}
      >
        <div className="absolute -top-20 -right-10 text-[280px] opacity-10 select-none leading-none">{level.emoji}</div>

        <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: level.color }}>Aktuelles Level</div>
            <h2 className="text-5xl font-black mt-1">{level.emoji} {level.label}</h2>
            <div className="text-4xl font-bold mt-3">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-primary">{points.toLocaleString("de-DE")}</motion.span>
              <span className="text-base text-muted-foreground ml-2 font-medium">Punkte gesammelt</span>
            </div>
          </div>

          {streak > 0 && (
            <div className="flex flex-col items-center justify-center px-6 py-4 rounded-2xl bg-orange-500/15 border-2 border-orange-500/40">
              <Flame className="h-8 w-8 text-orange-500" />
              <div className="text-3xl font-black text-orange-500 mt-1">{streak}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-500/80">{streak === 1 ? "Woche" : "Wochen"} Streak</div>
            </div>
          )}
        </div>

        {nextLevel && (
          <div className="relative mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">noch <strong className="text-foreground">{toNext.toLocaleString("de-DE")}</strong> Punkte bis <span style={{ color: nextLevel.color }}>{nextLevel.emoji} {nextLevel.label}</span></span>
              <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full"
                style={{ background: `linear-gradient(90deg, ${level.color}, ${nextLevel.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* All Levels */}
      <div>
        <h3 className="text-lg font-bold mb-3">Alle Stufen</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {LEVELS.map((l) => {
            const reached = points >= l.min;
            const current = l.key === level.key;
            return (
              <div
                key={l.key}
                className={cn(
                  "p-4 rounded-xl border-2 text-center transition-all",
                  current ? "scale-105" : "",
                  reached ? "" : "opacity-40"
                )}
                style={{
                  borderColor: reached ? l.color : "hsl(var(--border))",
                  background: reached ? `${l.color}15` : "hsl(var(--card))",
                }}
              >
                <div className="text-3xl">{l.emoji}</div>
                <div className="font-bold mt-1" style={{ color: reached ? l.color : undefined }}>{l.label}</div>
                <div className="text-xs text-muted-foreground">{l.min}{l.max ? `–${l.max}` : "+"} pts</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements grid */}
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" /> Badges <span className="text-sm text-muted-foreground font-normal">({unlocked.length} / {achievements.length})</span>
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {achievements.map((a) => {
            const isUnlocked = unlockedIds.has(a.id);
            const Icon = ICONS[a.icon] || Award;
            const color = TIER_COLORS[a.tier] || "hsl(var(--primary))";
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all overflow-hidden",
                  isUnlocked ? "" : "opacity-60 grayscale"
                )}
                style={{
                  borderColor: isUnlocked ? `${color}80` : "hsl(var(--border))",
                  background: isUnlocked ? `linear-gradient(135deg, ${color}15, transparent)` : "hsl(var(--card))",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ background: isUnlocked ? `${color}30` : "hsl(var(--muted))" }}
                  >
                    {isUnlocked ? <Icon className="h-6 w-6" style={{ color }} /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold flex items-center gap-2 flex-wrap">
                      {a.name}
                      {a.points_reward > 0 && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${color}25`, color }}>+{a.points_reward}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.description}</p>
                    {isUnlocked && (
                      <p className="text-[10px] text-muted-foreground/70 mt-1.5 uppercase tracking-wider">
                        🎉 {formatDate(unlockedMap.get(a.id)!)}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Points History */}
      <div>
        <h3 className="text-lg font-bold mb-3">Punkte-Verlauf</h3>
        {ledger.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Noch keine Punkte gesammelt. Buch dir dein erstes Ticket, um zu starten 🎟️
          </Card>
        ) : (
          <Card className="divide-y divide-border">
            {ledger.slice(0, 30).map((e) => (
              <div key={e.id} className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{reasonLabel(e.reason, e.metadata)}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(e.created_at)}</div>
                </div>
                <div className={cn("font-bold tabular-nums", e.points >= 0 ? "text-primary" : "text-destructive")}>
                  {e.points >= 0 ? "+" : ""}{e.points}
                </div>
              </div>
            ))}
            {ledger.length > 30 && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                + {ledger.length - 30} weitere Einträge
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
