import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// deno-lint-ignore no-explicit-any
async function fetchAll(query: (from: number, to: number) => any) {
  const PAGE = 1000;
  let all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Nicht autorisiert");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Nicht autorisiert");

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: partner } = await admin
      .from("partners")
      .select("id, name, company, permissions, series_ids, active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!partner || !partner.active) throw new Error("Kein aktiver Partner-Zugang");

    const perms: string[] = partner.permissions ?? [];
    const seriesIds: string[] = partner.series_ids ?? [];
    const can = (p: string) => perms.includes(p);

    // Scope: which event series is this partner allowed to see?
    let seriesTitles: { id: string; title: string }[] = [];
    if (seriesIds.length) {
      const { data } = await admin.from("event_series").select("id, title").in("id", seriesIds);
      seriesTitles = data ?? [];
    }

    let eventQuery = admin
      .from("events")
      .select("id, title, subtitle, slug, description, date, time, end_time, city, location_name, location_address, status, image_url, series_id, sold_out, open_air, is_16plus, muttizettel, insurance_enabled, insurance_amount, box_office_enabled, box_office_price, lounge_enabled, service_fee_enabled, service_fee_type, service_fee_value, tag, highlight")
      .order("date", { ascending: false })
      .limit(200);
    if (seriesIds.length) eventQuery = eventQuery.in("series_id", seriesIds);
    const { data: eventRows } = await eventQuery;
    const events = eventRows ?? [];
    const eventIds = events.map((e) => e.id);

    const result: Record<string, unknown> = {
      partner: {
        name: partner.name,
        company: partner.company,
        permissions: perms,
        series: seriesTitles,
        scoped: seriesIds.length > 0,
      },
    };

    if (can("events")) result.events = events;
    else result.events = events.map((e) => ({ id: e.id, title: e.title, date: e.date }));

    let categories: any[] = [];
    if (eventIds.length && (can("events") || can("tickets") || can("capacity"))) {
      const { data: cats } = await admin
        .from("ticket_categories")
        .select("id, event_id, name, description, price, currency, badge, sold_out, coming_soon, sale_start, sale_end, max_capacity, sort_order, internal_only, group_size")
        .in("event_id", eventIds)
        .order("sort_order", { ascending: true });
      categories = cats ?? [];
      if (can("events")) result.categories = categories;
    }

    if ((can("tickets") || can("revenue") || can("customers")) && eventIds.length) {
      const orders = await fetchAll((from, to) =>
        admin
          .from("orders")
          .select("id, event_id, status, total_amount, items, created_at, paid_at, name, email, phone")
          .in("event_id", eventIds)
          .range(from, to),
      );
      const paid = orders.filter((o) => o.status === "paid");
      const ticketCount = (o: any) =>
        Array.isArray(o.items)
          ? o.items.reduce((s: number, i: any) => s + Math.max(1, Number(i?.quantity ?? 1)), 0)
          : 0;

      if (can("tickets")) {
        const byEvent: Record<string, { tickets: number; orders: number }> = {};
        paid.forEach((o) => {
          const k = o.event_id ?? "none";
          byEvent[k] ??= { tickets: 0, orders: 0 };
          byEvent[k].tickets += ticketCount(o);
          byEvent[k].orders += 1;
        });
        const capByEvent: Record<string, number> = {};
        categories.forEach((c) => {
          if (!c.max_capacity) return;
          capByEvent[c.event_id] = (capByEvent[c.event_id] ?? 0) + Number(c.max_capacity);
        });
        let availableTotal = 0;
        Object.entries(capByEvent).forEach(([eid, cap]) => {
          availableTotal += Math.max(0, cap - (byEvent[eid]?.tickets ?? 0));
        });
        Object.keys(byEvent).forEach((eid) => {
          (byEvent[eid] as any).available =
            capByEvent[eid] != null ? Math.max(0, capByEvent[eid] - byEvent[eid].tickets) : null;
        });
        Object.keys(capByEvent).forEach((eid) => {
          byEvent[eid] ??= { tickets: 0, orders: 0 } as any;
          (byEvent[eid] as any).available = Math.max(0, capByEvent[eid] - byEvent[eid].tickets);
        });
        result.tickets = {
          total: paid.reduce((s, o) => s + ticketCount(o), 0),
          orders: paid.length,
          available: Object.keys(capByEvent).length ? availableTotal : null,
          capacity: Object.values(capByEvent).reduce((s, v) => s + v, 0),
          byEvent,
        };
      }

      if (can("customers")) {
        const byEvent: Record<string, any[]> = {};
        paid
          .slice()
          .sort((a, b) => String(b.paid_at ?? b.created_at).localeCompare(String(a.paid_at ?? a.created_at)))
          .forEach((o) => {
            const k = o.event_id ?? "none";
            byEvent[k] ??= [];
            byEvent[k].push({
              id: o.id,
              name: o.name ?? null,
              email: o.email,
              phone: o.phone ?? null,
              tickets: ticketCount(o),
              amount: Number(o.total_amount ?? 0),
              date: o.paid_at ?? o.created_at,
            });
          });
        result.customers = { total: paid.length, byEvent };
      }

      if (can("revenue")) {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        let today = 0, week = 0, month = 0, total = 0;
        const byEvent: Record<string, number> = {};
        paid.forEach((o) => {
          const amount = Number(o.total_amount ?? 0);
          const pa = o.paid_at ?? o.created_at ?? "";
          total += amount;
          if (pa >= todayStr) today += amount;
          if (pa >= weekAgo) week += amount;
          if (pa >= monthStart) month += amount;
          const k = o.event_id ?? "none";
          byEvent[k] = (byEvent[k] ?? 0) + amount;
        });
        result.revenue = { today, week, month, total, byEvent };
      }
    }

    if ((can("checkins") || can("capacity")) && eventIds.length) {
      const tickets = await fetchAll((from, to) =>
        admin
          .from("tickets")
          .select("id, event_id, ticket_category_id, status, checked_in_at")
          .in("event_id", eventIds)
          .range(from, to),
      );
      const valid = tickets.filter((t) => t.status !== "cancelled");

      if (can("checkins")) {
        const byEvent: Record<string, { total: number; checked: number }> = {};
        valid.forEach((t) => {
          const k = t.event_id ?? "none";
          byEvent[k] ??= { total: 0, checked: 0 };
          byEvent[k].total += 1;
          if (t.checked_in_at) byEvent[k].checked += 1;
        });
        result.checkins = {
          total: valid.length,
          checked: valid.filter((t) => t.checked_in_at).length,
          byEvent,
        };
      }

      if (can("capacity")) {
        const cats = categories;
        const soldByCat: Record<string, number> = {};
        valid.forEach((t) => {
          if (!t.ticket_category_id) return;
          soldByCat[t.ticket_category_id] = (soldByCat[t.ticket_category_id] ?? 0) + 1;
        });
        result.capacity = cats.map((c) => ({
          id: c.id,
          event_id: c.event_id,
          name: c.name,
          max_capacity: c.max_capacity,
          sold_out: c.sold_out,
          sold: soldByCat[c.id] ?? 0,
        }));
      }
    }

    if (can("lounges") && eventIds.length) {
      const { data: bookings } = await admin
        .from("lounge_bookings")
        .select("id, event_id, lounge_id, party_size, status, created_at")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false })
        .limit(500);
      const { data: lounges } = await admin
        .from("lounges")
        .select("id, event_id, name")
        .in("event_id", eventIds);
      result.lounges = {
        bookings: bookings ?? [],
        names: Object.fromEntries((lounges ?? []).map((l) => [l.id, l.name])),
      };
    }

    if (can("waitlist") && eventIds.length) {
      const entries = await fetchAll((from, to) =>
        admin.from("waitlist").select("id, event_id").in("event_id", eventIds).range(from, to),
      );
      const byEvent: Record<string, number> = {};
      entries.forEach((w) => {
        byEvent[w.event_id] = (byEvent[w.event_id] ?? 0) + 1;
      });
      result.waitlist = { total: entries.length, byEvent };
    }

    if (can("media")) {
      let albumQuery = admin
        .from("media_albums")
        .select("id, title, slug, cover_image_url, event_date, location, photo_count, status, event_id")
        .eq("status", "published")
        .order("event_date", { ascending: false })
        .limit(60);
      if (seriesIds.length && eventIds.length) albumQuery = albumQuery.in("event_id", eventIds);
      else if (seriesIds.length) albumQuery = albumQuery.in("event_id", ["00000000-0000-0000-0000-000000000000"]);
      const { data: albums } = await albumQuery;
      result.albums = albums ?? [];
    }

    return json(result);
  } catch (error) {
    console.error("partner-data error:", error);
    return json({ error: (error as Error).message }, 400);
  }
});
