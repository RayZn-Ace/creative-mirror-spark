import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── City Coordinates (German cities) ──────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  "berlin": [52.52, 13.405],
  "hamburg": [53.5511, 9.9937],
  "münchen": [48.1351, 11.582],
  "munich": [48.1351, 11.582],
  "köln": [50.9375, 6.9603],
  "frankfurt": [50.1109, 8.6821],
  "stuttgart": [48.7758, 9.1829],
  "düsseldorf": [51.2277, 6.7735],
  "dortmund": [51.5136, 7.4653],
  "essen": [51.4556, 7.0116],
  "leipzig": [51.3397, 12.3731],
  "bremen": [53.0793, 8.8017],
  "dresden": [51.0504, 13.7373],
  "hannover": [52.3759, 9.732],
  "nürnberg": [49.4521, 11.0767],
  "duisburg": [51.4344, 6.7623],
  "bochum": [51.4818, 7.2162],
  "wuppertal": [51.2562, 7.1508],
  "bielefeld": [52.0302, 8.5325],
  "bonn": [50.7374, 7.0982],
  "münster": [51.9607, 7.6261],
  "karlsruhe": [49.0069, 8.4037],
  "mannheim": [49.4875, 8.466],
  "augsburg": [48.3705, 10.8978],
  "wiesbaden": [50.0782, 8.2398],
  "aachen": [50.7753, 6.0839],
  "braunschweig": [52.2689, 10.5268],
  "kiel": [54.3233, 10.1228],
  "chemnitz": [50.8278, 12.9214],
  "halle": [51.4828, 11.97],
  "magdeburg": [52.1205, 11.6276],
  "freiburg": [47.999, 7.8421],
  "lübeck": [53.8655, 10.6866],
  "erfurt": [50.9848, 11.0299],
  "rostock": [54.0887, 12.1407],
  "mainz": [49.9929, 8.2473],
  "kassel": [51.3127, 9.4797],
  "saarbrücken": [49.2402, 6.9969],
  "potsdam": [52.3906, 13.0645],
  "oldenburg": [53.1435, 8.2146],
  "osnabrück": [52.2799, 8.0472],
  "würzburg": [49.7913, 9.9534],
  "regensburg": [49.0134, 12.1016],
  "paderborn": [51.7189, 8.7575],
  "heidelberg": [49.3988, 8.6724],
  "darmstadt": [49.8728, 8.6512],
  "ulm": [48.4011, 9.9876],
  "göttingen": [51.5328, 9.9355],
  "wolfsburg": [52.4227, 10.7865],
  "heilbronn": [49.1427, 9.2109],
  "pforzheim": [48.8922, 8.6946],
  "offenbach": [50.0956, 8.7761],
  "recklinghausen": [51.614, 7.1979],
  "bottrop": [51.5247, 6.9286],
  "trier": [49.7557, 6.6396],
  "remscheid": [51.1787, 7.1896],
  "siegen": [50.8748, 8.0243],
  "salzgitter": [52.1542, 10.3306],
  "jena": [50.9272, 11.5892],
  "cottbus": [51.7563, 14.3329],
  "schwerin": [53.6355, 11.4012],
  "hildesheim": [52.1508, 9.9511],
  "gera": [50.8813, 12.0835],
  "gütersloh": [51.9033, 8.3855],
  "plauen": [50.4974, 12.1378],
  "ludwigsburg": [48.8975, 9.1925],
  "esslingen": [48.7394, 9.3108],
  "tübingen": [48.5216, 9.0576],
  "konstanz": [47.6779, 9.1732],
  "bamberg": [49.8988, 10.9028],
  "bayreuth": [49.9427, 11.5761],
  "erlangen": [49.5897, 11.0078],
  "ingolstadt": [48.7665, 11.4258],
  "passau": [48.5665, 13.4319],
  "stralsund": [54.3146, 13.0897],
  "greifswald": [54.0865, 13.3923],
  "neubrandenburg": [53.5574, 13.2613],
  "zwickau": [50.7189, 12.4964],
  "weimar": [50.9795, 11.3235],
  "fulda": [50.5558, 9.6808],
  "marburg": [50.8021, 8.7668],
  "gießen": [50.5841, 8.6784],
  "detmold": [51.9386, 8.8788],
  "lüneburg": [53.2494, 10.4115],
  "celle": [52.6224, 10.0807],
  "delmenhorst": [53.0508, 8.6317],
  "wilhelmshaven": [53.5308, 8.1108],
  "emden": [53.3669, 7.2061],
  "lingen": [52.5222, 7.3222],
  "nordhorn": [52.4352, 7.069],
  "cloppenburg": [52.8474, 8.045],
  "vechta": [52.7297, 8.2863],
  "leer": [53.2297, 7.4528],
  "aurich": [53.4711, 7.4834],
  "papenburg": [53.0775, 7.3922],
  "meppen": [52.6906, 7.2929],
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCityCoords(city: string): [number, number] | null {
  return CITY_COORDS[city.toLowerCase().trim()] || null;
}

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

interface EventWithDistance extends EventRow {
  distanceKm?: number;
}

function buildEventListHtml(events: EventWithDistance[], config: any, siteUrl: string, introText?: string): string {
  const { accentColor = "#e91e8c", textColor = "#333333", bgColor = "#fafafa", title = "Alle Termine", limit = 5 } = config;
  const limited = events.slice(0, limit);
  if (limited.length === 0) return "";

  const rows = limited.map((ev) => {
    const ticketUrl = `${siteUrl}/${ev.slug}`;
    const dateStr = ev.date ? formatDate(ev.date) : "TBA";
    const distanceLabel = ev.distanceKm != null ? ` <span style="font-size:11px;color:${textColor}77;">(~${Math.round(ev.distanceKm)} km)</span>` : "";
    return `<tr>
<td style="padding:10px 12px;font-size:14px;font-weight:700;color:${accentColor};border-bottom:1px solid ${accentColor}15;white-space:nowrap;">${dateStr}</td>
<td style="padding:10px 12px;font-size:14px;color:${textColor};border-bottom:1px solid ${accentColor}15;"><strong>${ev.city || ""}</strong>${distanceLabel}<br/><span style="font-size:12px;color:${textColor}99;">${ev.location_name || ""}</span></td>
<td style="padding:10px 12px;border-bottom:1px solid ${accentColor}15;text-align:right;"><a href="${ticketUrl}" style="display:inline-block;padding:6px 16px;background:${accentColor};color:#ffffff;text-decoration:none;font-weight:700;font-size:11px;border-radius:50px;text-transform:uppercase;">Tickets</a></td>
</tr>`;
  }).join("");

  const intro = introText
    ? `<p style="margin:0 0 12px;font-size:13px;color:${textColor}99;text-align:center;font-style:italic;">${introText}</p>`
    : "";

  return `<div style="margin:0 0 16px;">
${title ? `<h3 style="margin:0 0 12px;font-size:18px;font-weight:800;color:${textColor};text-align:center;">${title}</h3>` : ""}
${intro}
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

  const recipientCoords = recipientCity ? getCityCoords(recipientCity) : null;

  // Replace MAGIC_HIGHLIGHT
  const highlightRegex = /<!--MAGIC_HIGHLIGHT:(.*?)-->\s*<div[^>]*>[\s\S]*?<\/div><\/div>/g;
  result = result.replace(highlightRegex, (_match, configJson) => {
    try {
      const config = JSON.parse(configJson);
      // Find next event in recipient's city only
      const cityEvent = recipientCity
        ? upcomingEvents.find((e) => e.city?.toLowerCase() === recipientCity.toLowerCase())
        : null;
      // If no event in their city, find nearest event by distance
      if (!cityEvent && recipientCoords) {
        const eventsWithDistance = upcomingEvents
          .filter((e) => e.city)
          .map((e) => {
            const coords = getCityCoords(e.city!);
            const dist = coords ? getDistance(recipientCoords[0], recipientCoords[1], coords[0], coords[1]) : 99999;
            return { ...e, distanceKm: dist };
          })
          .sort((a, b) => a.distanceKm - b.distanceKm);
        const nearest = eventsWithDistance[0];
        if (!nearest) return "";
        return buildHighlightHtml(nearest, config, siteUrl);
      }
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

      if (recipientCity) {
        // Only show events in the recipient's city
        const inCity = upcomingEvents.filter((e) => e.city?.toLowerCase() === recipientCity.toLowerCase());

        if (inCity.length > 0) {
          // Events exist in their city → show only those
          return buildEventListHtml(inCity, config, siteUrl);
        } else {
          // No events in their city → show nearest cities with distance
          if (recipientCoords) {
            const eventsWithDistance: EventWithDistance[] = upcomingEvents
              .filter((e) => e.city)
              .map((e) => {
                const coords = getCityCoords(e.city!);
                const dist = coords ? getDistance(recipientCoords[0], recipientCoords[1], coords[0], coords[1]) : 99999;
                return { ...e, distanceKm: Math.round(dist) };
              })
              .sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));

            // Deduplicate by city (keep first/nearest date per city), then show list
            const seenCities = new Set<string>();
            const uniqueCityEvents: EventWithDistance[] = [];
            for (const ev of eventsWithDistance) {
              const cityKey = ev.city!.toLowerCase();
              if (!seenCities.has(cityKey)) {
                seenCities.add(cityKey);
                uniqueCityEvents.push(ev);
              } else {
                // Also add same-city events (different dates)
                uniqueCityEvents.push(ev);
              }
            }

            const introText = `In ${recipientCity} sind wir aktuell leider nicht, aber hier sind die nächsten Termine in deiner Nähe:`;
            return buildEventListHtml(uniqueCityEvents, config, siteUrl, introText);
          }
          // No coords available, show all events
          return buildEventListHtml(upcomingEvents, config, siteUrl);
        }
      }

      // No recipient city known, show all events
      return buildEventListHtml(upcomingEvents, config, siteUrl);
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
