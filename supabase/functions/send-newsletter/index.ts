import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Magic Mode: personalize HTML per recipient ────────────────
interface EventRow {
  id: string;
  title: string;
  city: string | null;
  date: string | null;
  time: string | null;
  location_name: string | null;
  slug: string;
  image_url: string | null;
  status: string | null;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

function buildHighlightHtml(event: EventRow, config: any, siteUrl: string): string {
  const { accentColor = "#e91e8c", bgColor = "#f8f4ff", textColor = "#1a1a1a", ctaText = "🎟 Tickets sichern" } = config;
  const ticketUrl = `${siteUrl}/${event.slug}`;
  const dateStr = event.date ? formatDateLong(event.date) : "TBA";
  const timeStr = event.time || "";

  return `<div style="margin:0 0 16px;border-radius:12px;overflow:hidden;background:${bgColor};border:1px solid ${accentColor}22;">
${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" style="width:100%;height:auto;display:block;" />` : `<div style="height:8px;background:${accentColor};"></div>`}
<div style="padding:24px;">
<h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:${textColor};">${event.title}</h2>
<table cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tbody>
<tr><td style="padding:4px 12px 4px 0;font-size:14px;color:${accentColor};font-weight:700;">📅</td><td style="padding:4px 0;font-size:14px;color:${textColor};">${dateStr}${timeStr ? ` · ${timeStr}` : ""}</td></tr>
<tr><td style="padding:4px 12px 4px 0;font-size:14px;color:${accentColor};font-weight:700;">📍</td><td style="padding:4px 0;font-size:14px;color:${textColor};">${event.location_name || ""}, ${event.city || ""}</td></tr>
</tbody></table>
<div style="text-align:center;"><a href="${ticketUrl}" style="display:inline-block;padding:14px 40px;background:${accentColor};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;border-radius:50px;">${ctaText}</a></div>
</div></div>`;
}

function buildEventListHtml(events: EventRow[], config: any, siteUrl: string): string {
  const { accentColor = "#e91e8c", textColor = "#333333", bgColor = "#fafafa", title = "Alle Termine", limit = 5 } = config;
  const limited = events.slice(0, limit);
  if (limited.length === 0) return "";

  const rows = limited.map((ev) => {
    const ticketUrl = `${siteUrl}/${ev.slug}`;
    const dateStr = ev.date ? formatDate(ev.date) : "TBA";
    return `<tr>
<td style="padding:10px 12px;font-size:14px;font-weight:700;color:${accentColor};border-bottom:1px solid ${accentColor}15;white-space:nowrap;">${dateStr}</td>
<td style="padding:10px 12px;font-size:14px;color:${textColor};border-bottom:1px solid ${accentColor}15;"><strong>${ev.city || ""}</strong><br/><span style="font-size:12px;color:${textColor}99;">${ev.location_name || ""}</span></td>
<td style="padding:10px 12px;border-bottom:1px solid ${accentColor}15;text-align:right;"><a href="${ticketUrl}" style="display:inline-block;padding:6px 16px;background:${accentColor};color:#ffffff;text-decoration:none;font-weight:700;font-size:11px;border-radius:50px;text-transform:uppercase;">Tickets</a></td>
</tr>`;
  }).join("");

  return `<div style="margin:0 0 16px;">
${title ? `<h3 style="margin:0 0 12px;font-size:18px;font-weight:800;color:${textColor};text-align:center;">${title}</h3>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="background:${bgColor};border-radius:8px;overflow:hidden;">
<tbody>${rows}</tbody>
</table></div>`;
}

function personalizeHtml(
  html: string,
  recipientCity: string | null,
  upcomingEvents: EventRow[],
  siteUrl: string
): string {
  let result = html;

  // Replace MAGIC_HIGHLIGHT
  const highlightRegex = /<!--MAGIC_HIGHLIGHT:(.*?)-->\s*<div[^>]*>[\s\S]*?<\/div><\/div>/g;
  result = result.replace(highlightRegex, (_match, configJson) => {
    try {
      const config = JSON.parse(configJson);
      // Find next event in recipient's city, or fallback to next event overall
      const cityEvent = recipientCity
        ? upcomingEvents.find((e) => e.city?.toLowerCase() === recipientCity.toLowerCase())
        : null;
      const event = cityEvent || upcomingEvents[0];
      if (!event) return "";
      return buildHighlightHtml(event, config, siteUrl);
    } catch { return ""; }
  });

  // Replace MAGIC_EVENT_LIST
  const listRegex = /<!--MAGIC_EVENT_LIST:(.*?)-->\s*<div[^>]*>[\s\S]*?<\/div><\/div>/g;
  result = result.replace(listRegex, (_match, configJson) => {
    try {
      const config = JSON.parse(configJson);
      // Prioritize events in recipient's city, then others
      let sortedEvents: EventRow[];
      if (recipientCity) {
        const inCity = upcomingEvents.filter((e) => e.city?.toLowerCase() === recipientCity.toLowerCase());
        const others = upcomingEvents.filter((e) => e.city?.toLowerCase() !== recipientCity.toLowerCase());
        sortedEvents = [...inCity, ...others];
      } else {
        sortedEvents = upcomingEvents;
      }
      return buildEventListHtml(sortedEvents, config, siteUrl);
    } catch { return ""; }
  });

  return result;
}

// ─── Main handler ──────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html, recipients, fromName, fromEmail, magicMode } = await req.json();

    if (!subject || !html || !recipients?.length) {
      return new Response(JSON.stringify({ error: "Missing subject, html or recipients" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const from = `${fromName || "Newsletter"} <${fromEmail || "onboarding@resend.dev"}>`;
    const siteUrl = Deno.env.get("SITE_URL") || "https://gimmegimmeparty.com";

    // If magic mode, pre-fetch events and recipient city data
    let upcomingEvents: EventRow[] = [];
    let recipientCityMap: Map<string, string | null> = new Map();

    if (magicMode) {
      // Fetch upcoming published events sorted by date
      const today = new Date().toISOString().split("T")[0];
      const { data: eventsData } = await adminClient
        .from("events")
        .select("id, title, city, date, time, location_name, slug, image_url, status")
        .eq("status", "published")
        .gte("date", today)
        .order("date", { ascending: true });

      upcomingEvents = (eventsData || []) as EventRow[];

      // Fetch orders to map email → city (most recent order's event city)
      const { data: ordersData } = await adminClient
        .from("orders")
        .select("email, event_id")
        .in("email", recipients.map((e: string) => e.toLowerCase()));

      // Build email → city map from orders
      const eventIds = new Set<string>();
      (ordersData || []).forEach((o: any) => { if (o.event_id) eventIds.add(o.event_id); });

      // Create event ID → city lookup from upcoming + all events
      const eventCityMap = new Map<string, string>();
      upcomingEvents.forEach((e) => { if (e.city) eventCityMap.set(e.id, e.city); });

      // Also look up cities for order event IDs not in upcoming events
      const missingIds = Array.from(eventIds).filter((id) => !eventCityMap.has(id));
      if (missingIds.length > 0) {
        const { data: extraEvents } = await adminClient
          .from("events")
          .select("id, city")
          .in("id", missingIds);
        (extraEvents || []).forEach((e: any) => { if (e.city) eventCityMap.set(e.id, e.city); });
      }

      // Map each recipient email to their most frequent city
      const emailCityCounts = new Map<string, Map<string, number>>();
      (ordersData || []).forEach((o: any) => {
        const email = o.email.toLowerCase();
        const city = o.event_id ? eventCityMap.get(o.event_id) : null;
        if (!city) return;
        if (!emailCityCounts.has(email)) emailCityCounts.set(email, new Map());
        const counts = emailCityCounts.get(email)!;
        counts.set(city, (counts.get(city) || 0) + 1);
      });

      emailCityCounts.forEach((counts, email) => {
        let maxCity = "";
        let maxCount = 0;
        counts.forEach((count, city) => {
          if (count > maxCount) { maxCount = count; maxCity = city; }
        });
        recipientCityMap.set(email, maxCity || null);
      });
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    // Send in batches of 10
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const promises = batch.map(async (email: string) => {
        try {
          // Personalize HTML if magic mode
          let personalizedHtml = html;
          if (magicMode) {
            const recipientCity = recipientCityMap.get(email.toLowerCase()) || null;
            personalizedHtml = personalizeHtml(html, recipientCity, upcomingEvents, siteUrl);
          }

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ from, to: [email], subject, html: personalizedHtml }),
          });

          if (!res.ok) {
            const errBody = await res.text();
            results.push({ email, success: false, error: `${res.status}: ${errBody}` });
          } else {
            await res.json();
            results.push({ email, success: true });
          }
        } catch (err) {
          results.push({ email, success: false, error: String(err) });
        }
      });
      await Promise.all(promises);
    }

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({ sent, failed, total: recipients.length, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Newsletter error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
