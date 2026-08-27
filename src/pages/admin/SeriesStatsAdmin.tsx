import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layers, Ticket, CheckCircle2, Loader2 } from "lucide-react";

interface SeriesRow {
  id: string;
  title: string;
}

interface EventRow {
  id: string;
  title: string;
  date: string | null;
  city: string | null;
  status: string | null;
  series_id: string | null;
}

interface CategoryRow {
  id: string;
  event_id: string;
  name: string;
  max_capacity: number | null;
  sort_order: number | null;
}

interface TicketRow {
  event_id: string;
  ticket_category_id: string | null;
  status: string;
  checked_in_at: string | null;
}

const fetchAll = async <T,>(build: (from: number, to: number) => any): Promise<T[]> => {
  const PAGE = 1000;
  let all: T[] = [];
  let from = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await build(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
};

const SeriesStatsAdmin = () => {
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [activeSeries, setActiveSeries] = useState<string>("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("event_series")
      .select("id, title")
      .order("title")
      .then(({ data }) => {
        const rows = (data ?? []) as SeriesRow[];
        setSeries(rows);
        setActiveSeries((prev) => prev || rows[0]?.id || "");
        if (!rows.length) setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!activeSeries) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      const { data: evs } = await supabase
        .from("events")
        .select("id, title, date, city, status, series_id")
        .eq("series_id", activeSeries)
        .order("date", { ascending: true });

      const eventList = (evs ?? []) as EventRow[];
      const ids = eventList.map((e) => e.id);

      let cats: CategoryRow[] = [];
      let tix: TicketRow[] = [];
      if (ids.length) {
        const { data: catData } = await supabase
          .from("ticket_categories")
          .select("id, event_id, name, max_capacity, sort_order")
          .in("event_id", ids);
        cats = (catData ?? []) as CategoryRow[];

        tix = await fetchAll<TicketRow>((from, to) =>
          supabase
            .from("tickets")
            .select("event_id, ticket_category_id, status, checked_in_at")
            .in("event_id", ids)
            .range(from, to)
        );
      }

      if (!mounted) return;
      setEvents(eventList);
      setCategories(cats);
      setTickets(tix);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [activeSeries]);

  const perEvent = useMemo(() => {
    return events.map((ev) => {
      const evTickets = tickets.filter((t) => t.event_id === ev.id && t.status !== "canceled");
      const cats = categories
        .filter((c) => c.event_id === ev.id)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((c) => ({
          ...c,
          sold: evTickets.filter((t) => t.ticket_category_id === c.id).length,
        }));
      return {
        ...ev,
        sold: evTickets.length,
        checkedIn: evTickets.filter((t) => t.checked_in_at).length,
        cats,
      };
    });
  }, [events, categories, tickets]);

  const totals = useMemo(
    () => ({
      sold: perEvent.reduce((s, e) => s + e.sold, 0),
      checkedIn: perEvent.reduce((s, e) => s + e.checkedIn, 0),
      events: perEvent.length,
    }),
    [perEvent]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "hsl(0 0% 100%)" }}>
          Ticket-Stand
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(0 0% 100% / 0.45)" }}>
          Verkaufte Tickets pro Event deiner Eventreihe.
        </p>
      </div>

      {series.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {series.map((s) => {
            const active = s.id === activeSeries;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSeries(s.id)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: active ? "hsl(270 70% 55% / 0.18)" : "hsl(0 0% 100% / 0.04)",
                  color: active ? "hsl(270 70% 65%)" : "hsl(0 0% 100% / 0.55)",
                  border: `1px solid ${active ? "hsl(270 70% 55% / 0.4)" : "hsl(0 0% 100% / 0.08)"}`,
                }}
              >
                <Layers className="w-4 h-4" />
                {s.title}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Events", value: totals.events, icon: Layers, color: "hsl(270 70% 60%)" },
          { label: "Tickets verkauft", value: totals.sold, icon: Ticket, color: "hsl(200 80% 55%)" },
          { label: "Eingecheckt", value: totals.checkedIn, icon: CheckCircle2, color: "hsl(140 60% 50%)" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-4"
            style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
          >
            <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
            <div className="text-xl font-black" style={{ color: "hsl(0 0% 100%)" }}>
              {s.value}
            </div>
            <div className="text-[11px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
          <Loader2 className="w-4 h-4 animate-spin" /> Laden…
        </div>
      ) : !perEvent.length ? (
        <p className="text-sm py-10 text-center" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
          Keine Events in dieser Reihe.
        </p>
      ) : (
        <div className="space-y-3">
          {perEvent.map((ev) => {
            const capacity = ev.cats.reduce((s, c) => s + (c.max_capacity ?? 0), 0);
            const pct = capacity > 0 ? Math.min(100, Math.round((ev.sold / capacity) * 100)) : null;
            return (
              <div
                key={ev.id}
                className="rounded-2xl p-4"
                style={{ background: "hsl(0 0% 100% / 0.03)", border: "1px solid hsl(0 0% 100% / 0.06)" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: "hsl(0 0% 100%)" }}>
                      {ev.title}
                    </p>
                    <p className="text-[11px]" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                      {ev.date ? new Date(ev.date).toLocaleDateString("de-DE") : "—"}
                      {ev.city ? ` · ${ev.city}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-black" style={{ color: "hsl(200 80% 60%)" }}>
                        {ev.sold}
                      </div>
                      <div className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                        verkauft
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black" style={{ color: "hsl(140 60% 50%)" }}>
                        {ev.checkedIn}
                      </div>
                      <div className="text-[10px]" style={{ color: "hsl(0 0% 100% / 0.35)" }}>
                        eingecheckt
                      </div>
                    </div>
                  </div>
                </div>

                {pct !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] mb-1" style={{ color: "hsl(0 0% 100% / 0.4)" }}>
                      <span>Auslastung</span>
                      <span>
                        {ev.sold} / {capacity} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: "hsl(270 70% 55%)", transition: "width 0.6s" }}
                      />
                    </div>
                  </div>
                )}

                {ev.cats.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ev.cats.map((c) => (
                      <span
                        key={c.id}
                        className="text-[11px] px-2.5 py-1 rounded-lg"
                        style={{ background: "hsl(0 0% 100% / 0.05)", color: "hsl(0 0% 100% / 0.65)" }}
                      >
                        {c.name}: <strong style={{ color: "hsl(0 0% 100%)" }}>{c.sold}</strong>
                        {c.max_capacity ? ` / ${c.max_capacity}` : ""}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SeriesStatsAdmin;
