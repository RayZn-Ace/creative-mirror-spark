import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface PartyEvent {
  order_id: string;
  event_id: string | null;
  title: string;
  date: string | null;
  city: string | null;
  image_url: string | null;
  total_amount: number;
  ticket_count: number;
  paid_at: string;
}

export interface UserStats {
  loading: boolean;
  totalSpent: number;
  totalTickets: number;
  partiesAttended: number;
  partiesUpcoming: number;
  topCity: string | null;
  topCityCount: number;
  cities: Array<{ city: string; count: number }>;
  events: PartyEvent[];
  pastEvents: PartyEvent[];
  upcomingEvents: PartyEvent[];
  firstPartyDate: string | null;
  hoursDanced: number;
  avgSpend: number;
  monthBreakdown: Array<{ month: string; count: number }>;
  yearEvents: PartyEvent[];
  yearSpent: number;
  yearCount: number;
  uniqueSeries: number;
}

const HOURS_PER_PARTY = 6;

export function useUserStats(year?: number): UserStats & { reload: () => void } {
  const { user } = useAuth();
  const [data, setData] = useState<UserStats>({
    loading: true,
    totalSpent: 0,
    totalTickets: 0,
    partiesAttended: 0,
    partiesUpcoming: 0,
    topCity: null,
    topCityCount: 0,
    cities: [],
    events: [],
    pastEvents: [],
    upcomingEvents: [],
    firstPartyDate: null,
    hoursDanced: 0,
    avgSpend: 0,
    monthBreakdown: [],
    yearEvents: [],
    yearSpent: 0,
    yearCount: 0,
    uniqueSeries: 0,
  });

  const load = useCallback(async () => {
    if (!user?.email) {
      setData((d) => ({ ...d, loading: false }));
      return;
    }
    const { data: orders } = await supabase
      .from("orders")
      .select("id, total_amount, event_id, items, paid_at, created_at, events(title, date, city, image_url, series_id)")
      .eq("email", user.email)
      .eq("status", "paid")
      .order("created_at", { ascending: false });

    const list = (orders || []) as any[];
    const events: PartyEvent[] = list
      .filter((o) => o.events)
      .map((o) => {
        const tickets = Array.isArray(o.items)
          ? o.items.reduce((s: number, i: any) => s + (i.qty || i.quantity || 1), 0)
          : 1;
        return {
          order_id: o.id,
          event_id: o.event_id,
          title: o.events?.title || "Event",
          date: o.events?.date || null,
          city: o.events?.city || null,
          image_url: o.events?.image_url || null,
          total_amount: Number(o.total_amount || 0),
          ticket_count: tickets,
          paid_at: o.paid_at || o.created_at,
        };
      });

    const now = new Date();
    const past = events.filter((e) => e.date && new Date(e.date) <= now);
    const upcoming = events.filter((e) => e.date && new Date(e.date) > now);

    const cityMap: Record<string, number> = {};
    events.forEach((e) => {
      if (e.city) cityMap[e.city] = (cityMap[e.city] || 0) + 1;
    });
    const cities = Object.entries(cityMap)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);

    const totalSpent = events.reduce((s, e) => s + e.total_amount, 0);
    const totalTickets = events.reduce((s, e) => s + e.ticket_count, 0);

    const firstDate = past.length
      ? [...past].sort((a, b) => (a.date! < b.date! ? -1 : 1))[0].date
      : null;

    // year filtering
    const targetYear = year ?? now.getFullYear();
    const yearEvents = past.filter(
      (e) => e.date && new Date(e.date).getFullYear() === targetYear,
    );
    const yearSpent = yearEvents.reduce((s, e) => s + e.total_amount, 0);

    // month breakdown for target year
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(targetYear, i, 1).toLocaleDateString("de-DE", { month: "short" }),
      count: 0,
    }));
    yearEvents.forEach((e) => {
      if (e.date) months[new Date(e.date).getMonth()].count += 1;
    });

    const uniqueSeries = new Set(
      list.map((o) => o.events?.series_id).filter(Boolean),
    ).size;

    setData({
      loading: false,
      totalSpent,
      totalTickets,
      partiesAttended: past.length,
      partiesUpcoming: upcoming.length,
      topCity: cities[0]?.city || null,
      topCityCount: cities[0]?.count || 0,
      cities,
      events,
      pastEvents: past,
      upcomingEvents: upcoming,
      firstPartyDate: firstDate,
      hoursDanced: past.length * HOURS_PER_PARTY,
      avgSpend: past.length ? totalSpent / past.length : 0,
      monthBreakdown: months,
      yearEvents,
      yearSpent,
      yearCount: yearEvents.length,
      uniqueSeries,
    });
  }, [user?.email, year]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, reload: load };
}
