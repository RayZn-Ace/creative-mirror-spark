import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type LoyaltyLevel = {
  key: "bronze" | "silver" | "gold" | "platinum" | "legend";
  label: string;
  min: number;
  max: number | null;
  color: string;
  emoji: string;
};

export const LEVELS: LoyaltyLevel[] = [
  { key: "bronze",   label: "Bronze",   min: 0,    max: 99,   color: "hsl(28 60% 50%)",   emoji: "🥉" },
  { key: "silver",   label: "Silber",   min: 100,  max: 299,  color: "hsl(0 0% 75%)",     emoji: "🥈" },
  { key: "gold",     label: "Gold",     min: 300,  max: 699,  color: "hsl(45 100% 55%)",  emoji: "🥇" },
  { key: "platinum", label: "Platin",   min: 700,  max: 1499, color: "hsl(200 80% 70%)",  emoji: "💎" },
  { key: "legend",   label: "Legend",   min: 1500, max: null, color: "hsl(270 70% 60%)",  emoji: "👑" },
];

export function levelFor(points: number): LoyaltyLevel {
  return [...LEVELS].reverse().find((l) => points >= l.min) || LEVELS[0];
}

export function nextLevel(points: number): LoyaltyLevel | null {
  return LEVELS.find((l) => l.min > points) || null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  tier: string;
  sort_order: number;
}

export interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
}

export interface LoyaltyEntry {
  id: string;
  points: number;
  reason: string;
  metadata: any;
  created_at: string;
}

export function useLoyalty() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [ledger, setLedger] = useState<LoyaltyEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlocked, setUnlocked] = useState<UserAchievement[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [ledgerRes, achRes, userAchRes, ordersRes] = await Promise.all([
      supabase.from("loyalty_points").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("achievements").select("*").order("sort_order"),
      supabase.from("user_achievements").select("achievement_id, unlocked_at").eq("user_id", user.id),
      user.email
        ? supabase.from("orders").select("paid_at, created_at").eq("email", user.email).eq("status", "paid")
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const entries = (ledgerRes.data || []) as LoyaltyEntry[];
    setLedger(entries);
    setPoints(entries.reduce((sum, e) => sum + (e.points || 0), 0));
    setAchievements((achRes.data || []) as Achievement[]);
    setUnlocked((userAchRes.data || []) as UserAchievement[]);

    // Streak: consecutive ISO weeks with at least one paid order, counted backwards from current week
    const dates = (ordersRes.data || [])
      .map((o: any) => new Date(o.paid_at || o.created_at))
      .filter((d: Date) => !isNaN(d.getTime()));
    const weeks = new Set(dates.map(isoWeekKey));
    let s = 0;
    let cursor = new Date();
    while (weeks.has(isoWeekKey(cursor))) {
      s++;
      cursor.setDate(cursor.getDate() - 7);
    }
    setStreak(s);
    setLoading(false);
  }, [user?.id, user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const level = levelFor(points);
  const next = nextLevel(points);
  const progress = next ? Math.min(100, ((points - level.min) / (next.min - level.min)) * 100) : 100;
  const toNext = next ? next.min - points : 0;

  const unlockedIds = new Set(unlocked.map((u) => u.achievement_id));

  return {
    loading,
    points,
    level,
    nextLevel: next,
    progress,
    toNext,
    ledger,
    achievements,
    unlocked,
    unlockedIds,
    streak,
    reload: load,
  };
}

function isoWeekKey(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${week}`;
}
