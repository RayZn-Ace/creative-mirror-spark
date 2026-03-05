import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── City Database: coords [lat, lng] + language ───────────────
interface CityInfo { coords: [number, number]; lang: string }

const CITIES: Record<string, CityInfo> = {
  // Germany (de)
  "berlin": { coords: [52.52, 13.405], lang: "de" },
  "hamburg": { coords: [53.5511, 9.9937], lang: "de" },
  "münchen": { coords: [48.1351, 11.582], lang: "de" },
  "munich": { coords: [48.1351, 11.582], lang: "de" },
  "köln": { coords: [50.9375, 6.9603], lang: "de" },
  "frankfurt": { coords: [50.1109, 8.6821], lang: "de" },
  "stuttgart": { coords: [48.7758, 9.1829], lang: "de" },
  "düsseldorf": { coords: [51.2277, 6.7735], lang: "de" },
  "dortmund": { coords: [51.5136, 7.4653], lang: "de" },
  "essen": { coords: [51.4556, 7.0116], lang: "de" },
  "leipzig": { coords: [51.3397, 12.3731], lang: "de" },
  "bremen": { coords: [53.0793, 8.8017], lang: "de" },
  "dresden": { coords: [51.0504, 13.7373], lang: "de" },
  "hannover": { coords: [52.3759, 9.732], lang: "de" },
  "nürnberg": { coords: [49.4521, 11.0767], lang: "de" },
  "duisburg": { coords: [51.4344, 6.7623], lang: "de" },
  "bochum": { coords: [51.4818, 7.2162], lang: "de" },
  "wuppertal": { coords: [51.2562, 7.1508], lang: "de" },
  "bielefeld": { coords: [52.0302, 8.5325], lang: "de" },
  "bonn": { coords: [50.7374, 7.0982], lang: "de" },
  "münster": { coords: [51.9607, 7.6261], lang: "de" },
  "karlsruhe": { coords: [49.0069, 8.4037], lang: "de" },
  "mannheim": { coords: [49.4875, 8.466], lang: "de" },
  "augsburg": { coords: [48.3705, 10.8978], lang: "de" },
  "wiesbaden": { coords: [50.0782, 8.2398], lang: "de" },
  "aachen": { coords: [50.7753, 6.0839], lang: "de" },
  "braunschweig": { coords: [52.2689, 10.5268], lang: "de" },
  "kiel": { coords: [54.3233, 10.1228], lang: "de" },
  "chemnitz": { coords: [50.8278, 12.9214], lang: "de" },
  "halle": { coords: [51.4828, 11.97], lang: "de" },
  "magdeburg": { coords: [52.1205, 11.6276], lang: "de" },
  "freiburg": { coords: [47.999, 7.8421], lang: "de" },
  "lübeck": { coords: [53.8655, 10.6866], lang: "de" },
  "erfurt": { coords: [50.9848, 11.0299], lang: "de" },
  "rostock": { coords: [54.0887, 12.1407], lang: "de" },
  "mainz": { coords: [49.9929, 8.2473], lang: "de" },
  "kassel": { coords: [51.3127, 9.4797], lang: "de" },
  "saarbrücken": { coords: [49.2402, 6.9969], lang: "de" },
  "potsdam": { coords: [52.3906, 13.0645], lang: "de" },
  "oldenburg": { coords: [53.1435, 8.2146], lang: "de" },
  "osnabrück": { coords: [52.2799, 8.0472], lang: "de" },
  "würzburg": { coords: [49.7913, 9.9534], lang: "de" },
  "regensburg": { coords: [49.0134, 12.1016], lang: "de" },
  "paderborn": { coords: [51.7189, 8.7575], lang: "de" },
  "heidelberg": { coords: [49.3988, 8.6724], lang: "de" },
  "darmstadt": { coords: [49.8728, 8.6512], lang: "de" },
  "ulm": { coords: [48.4011, 9.9876], lang: "de" },
  "göttingen": { coords: [51.5328, 9.9355], lang: "de" },
  "wolfsburg": { coords: [52.4227, 10.7865], lang: "de" },
  "heilbronn": { coords: [49.1427, 9.2109], lang: "de" },
  "pforzheim": { coords: [48.8922, 8.6946], lang: "de" },
  "offenbach": { coords: [50.0956, 8.7761], lang: "de" },
  "trier": { coords: [49.7557, 6.6396], lang: "de" },
  "siegen": { coords: [50.8748, 8.0243], lang: "de" },
  "jena": { coords: [50.9272, 11.5892], lang: "de" },
  "cottbus": { coords: [51.7563, 14.3329], lang: "de" },
  "schwerin": { coords: [53.6355, 11.4012], lang: "de" },
  "hildesheim": { coords: [52.1508, 9.9511], lang: "de" },
  "gütersloh": { coords: [51.9033, 8.3855], lang: "de" },
  "ludwigsburg": { coords: [48.8975, 9.1925], lang: "de" },
  "esslingen": { coords: [48.7394, 9.3108], lang: "de" },
  "tübingen": { coords: [48.5216, 9.0576], lang: "de" },
  "konstanz": { coords: [47.6779, 9.1732], lang: "de" },
  "bamberg": { coords: [49.8988, 10.9028], lang: "de" },
  "bayreuth": { coords: [49.9427, 11.5761], lang: "de" },
  "erlangen": { coords: [49.5897, 11.0078], lang: "de" },
  "ingolstadt": { coords: [48.7665, 11.4258], lang: "de" },
  "passau": { coords: [48.5665, 13.4319], lang: "de" },
  "fulda": { coords: [50.5558, 9.6808], lang: "de" },
  "marburg": { coords: [50.8021, 8.7668], lang: "de" },
  "gießen": { coords: [50.5841, 8.6784], lang: "de" },
  "detmold": { coords: [51.9386, 8.8788], lang: "de" },
  "lüneburg": { coords: [53.2494, 10.4115], lang: "de" },
  "celle": { coords: [52.6224, 10.0807], lang: "de" },
  "weimar": { coords: [50.9795, 11.3235], lang: "de" },
  "zwickau": { coords: [50.7189, 12.4964], lang: "de" },

  // Austria (de)
  "wien": { coords: [48.2082, 16.3738], lang: "de" },
  "vienna": { coords: [48.2082, 16.3738], lang: "de" },
  "graz": { coords: [47.0707, 15.4395], lang: "de" },
  "linz": { coords: [48.3069, 14.2858], lang: "de" },
  "salzburg": { coords: [47.8095, 13.055], lang: "de" },
  "innsbruck": { coords: [47.2692, 11.4041], lang: "de" },
  "klagenfurt": { coords: [46.6247, 14.3053], lang: "de" },

  // Switzerland (de/fr/it)
  "zürich": { coords: [47.3769, 8.5417], lang: "de" },
  "zurich": { coords: [47.3769, 8.5417], lang: "de" },
  "bern": { coords: [46.948, 7.4474], lang: "de" },
  "basel": { coords: [47.5596, 7.5886], lang: "de" },
  "genf": { coords: [46.2044, 6.1432], lang: "fr" },
  "genève": { coords: [46.2044, 6.1432], lang: "fr" },
  "geneva": { coords: [46.2044, 6.1432], lang: "fr" },
  "lausanne": { coords: [46.5197, 6.6323], lang: "fr" },
  "lugano": { coords: [46.0037, 8.9511], lang: "it" },
  "luzern": { coords: [47.0502, 8.3093], lang: "de" },
  "st. gallen": { coords: [47.4245, 9.3767], lang: "de" },

  // Netherlands (nl)
  "amsterdam": { coords: [52.3676, 4.9041], lang: "nl" },
  "rotterdam": { coords: [51.9225, 4.4792], lang: "nl" },
  "den haag": { coords: [52.0705, 4.3007], lang: "nl" },
  "the hague": { coords: [52.0705, 4.3007], lang: "nl" },
  "utrecht": { coords: [52.0907, 5.1214], lang: "nl" },
  "eindhoven": { coords: [51.4416, 5.4697], lang: "nl" },
  "groningen": { coords: [53.2194, 6.5665], lang: "nl" },
  "tilburg": { coords: [51.5555, 5.0913], lang: "nl" },
  "breda": { coords: [51.5719, 4.7683], lang: "nl" },
  "nijmegen": { coords: [51.8126, 5.8372], lang: "nl" },
  "arnhem": { coords: [51.9851, 5.8987], lang: "nl" },
  "maastricht": { coords: [50.8514, 5.6913], lang: "nl" },

  // Belgium (nl/fr)
  "brüssel": { coords: [50.8503, 4.3517], lang: "fr" },
  "brussel": { coords: [50.8503, 4.3517], lang: "nl" },
  "brussels": { coords: [50.8503, 4.3517], lang: "fr" },
  "bruxelles": { coords: [50.8503, 4.3517], lang: "fr" },
  "antwerpen": { coords: [51.2194, 4.4025], lang: "nl" },
  "antwerp": { coords: [51.2194, 4.4025], lang: "nl" },
  "gent": { coords: [51.0543, 3.7174], lang: "nl" },
  "ghent": { coords: [51.0543, 3.7174], lang: "nl" },
  "lüttich": { coords: [50.6292, 5.5797], lang: "fr" },
  "liège": { coords: [50.6292, 5.5797], lang: "fr" },
  "brügge": { coords: [51.2093, 3.2247], lang: "nl" },
  "bruges": { coords: [51.2093, 3.2247], lang: "nl" },

  // France (fr)
  "paris": { coords: [48.8566, 2.3522], lang: "fr" },
  "marseille": { coords: [43.2965, 5.3698], lang: "fr" },
  "lyon": { coords: [45.764, 4.8357], lang: "fr" },
  "toulouse": { coords: [43.6047, 1.4442], lang: "fr" },
  "nice": { coords: [43.7102, 7.262], lang: "fr" },
  "nantes": { coords: [47.2184, -1.5536], lang: "fr" },
  "strasbourg": { coords: [48.5734, 7.7521], lang: "fr" },
  "straßburg": { coords: [48.5734, 7.7521], lang: "fr" },
  "montpellier": { coords: [43.6108, 3.8767], lang: "fr" },
  "bordeaux": { coords: [44.8378, -0.5792], lang: "fr" },
  "lille": { coords: [50.6292, 3.0573], lang: "fr" },

  // Italy (it)
  "rom": { coords: [41.9028, 12.4964], lang: "it" },
  "roma": { coords: [41.9028, 12.4964], lang: "it" },
  "rome": { coords: [41.9028, 12.4964], lang: "it" },
  "mailand": { coords: [45.4642, 9.19], lang: "it" },
  "milano": { coords: [45.4642, 9.19], lang: "it" },
  "milan": { coords: [45.4642, 9.19], lang: "it" },
  "neapel": { coords: [40.8518, 14.2681], lang: "it" },
  "napoli": { coords: [40.8518, 14.2681], lang: "it" },
  "naples": { coords: [40.8518, 14.2681], lang: "it" },
  "turin": { coords: [45.0703, 7.6869], lang: "it" },
  "torino": { coords: [45.0703, 7.6869], lang: "it" },
  "florenz": { coords: [43.7696, 11.2558], lang: "it" },
  "firenze": { coords: [43.7696, 11.2558], lang: "it" },
  "florence": { coords: [43.7696, 11.2558], lang: "it" },
  "venedig": { coords: [45.4408, 12.3155], lang: "it" },
  "venezia": { coords: [45.4408, 12.3155], lang: "it" },
  "venice": { coords: [45.4408, 12.3155], lang: "it" },
  "bologna": { coords: [44.4949, 11.3426], lang: "it" },
  "genova": { coords: [44.4056, 8.9463], lang: "it" },
  "palermo": { coords: [38.1157, 13.3615], lang: "it" },
  "verona": { coords: [45.4384, 10.9917], lang: "it" },

  // Spain (es)
  "madrid": { coords: [40.4168, -3.7038], lang: "es" },
  "barcelona": { coords: [41.3874, 2.1686], lang: "es" },
  "valencia": { coords: [39.4699, -0.3763], lang: "es" },
  "sevilla": { coords: [37.3891, -5.9845], lang: "es" },
  "seville": { coords: [37.3891, -5.9845], lang: "es" },
  "málaga": { coords: [36.7213, -4.4214], lang: "es" },
  "malaga": { coords: [36.7213, -4.4214], lang: "es" },
  "bilbao": { coords: [43.263, -2.935], lang: "es" },
  "palma": { coords: [39.5696, 2.6502], lang: "es" },
  "ibiza": { coords: [38.9067, 1.4206], lang: "es" },

  // Portugal (pt)
  "lissabon": { coords: [38.7223, -9.1393], lang: "pt" },
  "lisboa": { coords: [38.7223, -9.1393], lang: "pt" },
  "lisbon": { coords: [38.7223, -9.1393], lang: "pt" },
  "porto": { coords: [41.1579, -8.6291], lang: "pt" },

  // UK (en)
  "london": { coords: [51.5074, -0.1278], lang: "en" },
  "manchester": { coords: [53.4808, -2.2426], lang: "en" },
  "birmingham": { coords: [52.4862, -1.8904], lang: "en" },
  "glasgow": { coords: [55.8642, -4.2518], lang: "en" },
  "edinburgh": { coords: [55.9533, -3.1883], lang: "en" },
  "liverpool": { coords: [53.4084, -2.9916], lang: "en" },
  "bristol": { coords: [51.4545, -2.5879], lang: "en" },
  "leeds": { coords: [53.8008, -1.5491], lang: "en" },

  // Ireland (en)
  "dublin": { coords: [53.3498, -6.2603], lang: "en" },
  "cork": { coords: [51.8969, -8.4863], lang: "en" },

  // Poland (pl)
  "warschau": { coords: [52.2297, 21.0122], lang: "pl" },
  "warszawa": { coords: [52.2297, 21.0122], lang: "pl" },
  "warsaw": { coords: [52.2297, 21.0122], lang: "pl" },
  "krakau": { coords: [50.0647, 19.945], lang: "pl" },
  "kraków": { coords: [50.0647, 19.945], lang: "pl" },
  "krakow": { coords: [50.0647, 19.945], lang: "pl" },
  "breslau": { coords: [51.1079, 17.0385], lang: "pl" },
  "wrocław": { coords: [51.1079, 17.0385], lang: "pl" },
  "danzig": { coords: [54.352, 18.6466], lang: "pl" },
  "gdańsk": { coords: [54.352, 18.6466], lang: "pl" },
  "posen": { coords: [52.4064, 16.9252], lang: "pl" },
  "poznań": { coords: [52.4064, 16.9252], lang: "pl" },

  // Czech Republic (cs)
  "prag": { coords: [50.0755, 14.4378], lang: "cs" },
  "praha": { coords: [50.0755, 14.4378], lang: "cs" },
  "prague": { coords: [50.0755, 14.4378], lang: "cs" },
  "brünn": { coords: [49.1951, 16.6068], lang: "cs" },
  "brno": { coords: [49.1951, 16.6068], lang: "cs" },

  // Denmark (da)
  "kopenhagen": { coords: [55.6761, 12.5683], lang: "da" },
  "københavn": { coords: [55.6761, 12.5683], lang: "da" },
  "copenhagen": { coords: [55.6761, 12.5683], lang: "da" },
  "aarhus": { coords: [56.1629, 10.2039], lang: "da" },
  "odense": { coords: [55.396, 10.3886], lang: "da" },

  // Sweden (sv)
  "stockholm": { coords: [59.3293, 18.0686], lang: "sv" },
  "göteborg": { coords: [57.7089, 11.9746], lang: "sv" },
  "gothenburg": { coords: [57.7089, 11.9746], lang: "sv" },
  "malmö": { coords: [55.605, 13.0038], lang: "sv" },

  // Norway (no)
  "oslo": { coords: [59.9139, 10.7522], lang: "no" },
  "bergen": { coords: [60.3913, 5.3221], lang: "no" },

  // Finland (fi)
  "helsinki": { coords: [60.1699, 24.9384], lang: "fi" },
  "tampere": { coords: [61.4978, 23.761], lang: "fi" },

  // Hungary (hu)
  "budapest": { coords: [47.4979, 19.0402], lang: "hu" },

  // Romania (ro)
  "bukarest": { coords: [44.4268, 26.1025], lang: "ro" },
  "bucurești": { coords: [44.4268, 26.1025], lang: "ro" },
  "bucharest": { coords: [44.4268, 26.1025], lang: "ro" },
  "cluj-napoca": { coords: [46.7712, 23.6236], lang: "ro" },

  // Croatia (hr)
  "zagreb": { coords: [45.815, 15.9819], lang: "hr" },
  "split": { coords: [43.5081, 16.4402], lang: "hr" },
  "dubrovnik": { coords: [42.6507, 18.0944], lang: "hr" },

  // Greece (el)
  "athen": { coords: [37.9838, 23.7275], lang: "el" },
  "athens": { coords: [37.9838, 23.7275], lang: "el" },
  "thessaloniki": { coords: [40.6401, 22.9444], lang: "el" },

  // Turkey (tr)
  "istanbul": { coords: [41.0082, 28.9784], lang: "tr" },
  "ankara": { coords: [39.9334, 32.8597], lang: "tr" },
  "izmir": { coords: [38.4237, 27.1428], lang: "tr" },
  "antalya": { coords: [36.8969, 30.7133], lang: "tr" },

  // Luxembourg (fr/de)
  "luxemburg": { coords: [49.6117, 6.1319], lang: "fr" },
  "luxembourg": { coords: [49.6117, 6.1319], lang: "fr" },
};

const LANG_NAMES: Record<string, string> = {
  de: "German", en: "English", fr: "French", nl: "Dutch", it: "Italian",
  es: "Spanish", pt: "Portuguese", pl: "Polish", cs: "Czech", da: "Danish",
  sv: "Swedish", no: "Norwegian", fi: "Finnish", hu: "Hungarian", ro: "Romanian",
  hr: "Croatian", el: "Greek", tr: "Turkish",
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCityInfo(city: string): CityInfo | null {
  return CITIES[city.toLowerCase().trim()] || null;
}

// ─── AI Translation ────────────────────────────────────────────
async function translateHtml(html: string, targetLang: string): Promise<string> {
  if (targetLang === "de") return html; // Already German, no translation needed

  const langName = LANG_NAMES[targetLang] || targetLang;
  const API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!API_KEY) {
    console.warn("LOVABLE_API_KEY not set, skipping translation");
    return html;
  }

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the following HTML email content from German to ${langName}. 
CRITICAL RULES:
- ONLY translate visible text content (headings, paragraphs, button labels, alt text)
- Do NOT translate or modify any HTML tags, attributes, CSS styles, URLs, email addresses, or inline styles
- Do NOT translate brand names, event names, city names, location names, or proper nouns
- Do NOT translate voucher/discount codes (e.g. "PARTY2026")
- Do NOT translate dates or times — keep them in their original format
- Keep all HTML structure, comments (<!-- -->), and formatting exactly as-is
- Return ONLY the translated HTML, nothing else — no markdown, no explanations
- If you're unsure about a word, keep the original`
          },
          { role: "user", content: html }
        ],
        temperature: 0.1,
        max_tokens: 16000,
      }),
    });

    if (!res.ok) {
      console.error("Translation API error:", res.status, await res.text());
      return html;
    }

    const data = await res.json();
    const translated = data.choices?.[0]?.message?.content;
    if (!translated) return html;

    // Strip markdown code fences if the model wrapped it
    return translated.replace(/^```html?\n?/i, "").replace(/\n?```$/i, "").trim();
  } catch (err) {
    console.error("Translation error:", err);
    return html;
  }
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

  const cityInfo = recipientCity ? getCityInfo(recipientCity) : null;
  const recipientCoords = cityInfo?.coords || null;

  // Replace MAGIC_HIGHLIGHT
  const highlightRegex = /<!--MAGIC_HIGHLIGHT:(.*?)-->\s*<div[^>]*>[\s\S]*?<\/div><\/div>/g;
  result = result.replace(highlightRegex, (_match, configJson) => {
    try {
      const config = JSON.parse(configJson);
      const cityEvent = recipientCity
        ? upcomingEvents.find((e) => e.city?.toLowerCase() === recipientCity.toLowerCase())
        : null;
      if (!cityEvent && recipientCoords) {
        const eventsWithDistance = upcomingEvents
          .filter((e) => e.city)
          .map((e) => {
            const info = getCityInfo(e.city!);
            const dist = info ? getDistance(recipientCoords[0], recipientCoords[1], info.coords[0], info.coords[1]) : 99999;
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
        const inCity = upcomingEvents.filter((e) => e.city?.toLowerCase() === recipientCity.toLowerCase());

        if (inCity.length > 0) {
          return buildEventListHtml(inCity, config, siteUrl);
        } else {
          if (recipientCoords) {
            const eventsWithDistance: EventWithDistance[] = upcomingEvents
              .filter((e) => e.city)
              .map((e) => {
                const info = getCityInfo(e.city!);
                const dist = info ? getDistance(recipientCoords[0], recipientCoords[1], info.coords[0], info.coords[1]) : 99999;
                return { ...e, distanceKm: Math.round(dist) };
              })
              .sort((a, b) => (a.distanceKm ?? 99999) - (b.distanceKm ?? 99999));

            const introText = `In ${recipientCity} sind wir aktuell leider nicht, aber hier sind die nächsten Termine in deiner Nähe:`;
            return buildEventListHtml(eventsWithDistance, config, siteUrl, introText);
          }
          return buildEventListHtml(upcomingEvents, config, siteUrl);
        }
      }

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

    let upcomingEvents: EventRow[] = [];
    let recipientCityMap: Map<string, string | null> = new Map();

    // ─── Always look up recipient info for placeholder replacement ───
    interface RecipientInfo { name: string | null; city: string | null; email: string }
    const recipientInfoMap = new Map<string, RecipientInfo>();

    // Look up from orders
    const { data: ordersData } = await adminClient
      .from("orders")
      .select("email, name, event_id")
      .in("email", recipients.map((e: string) => e.toLowerCase()));

    // Look up from newsletter_subscribers
    const { data: subscribersData } = await adminClient
      .from("newsletter_subscribers")
      .select("email, name, city")
      .in("email", recipients.map((e: string) => e.toLowerCase()));

    // Populate recipientInfoMap from subscribers first, then orders (orders override)
    (subscribersData || []).forEach((s: any) => {
      const email = s.email.toLowerCase();
      recipientInfoMap.set(email, { name: s.name, city: s.city, email });
    });
    (ordersData || []).forEach((o: any) => {
      const email = o.email.toLowerCase();
      const existing = recipientInfoMap.get(email);
      if (!existing) {
        recipientInfoMap.set(email, { name: o.name, city: null, email });
      } else if (!existing.name && o.name) {
        existing.name = o.name;
      }
    });

    if (magicMode) {
      const today = new Date().toISOString().split("T")[0];
      const { data: eventsData } = await adminClient
        .from("events")
        .select("id, title, city, date, time, location_name, slug, image_url, status")
        .eq("status", "published")
        .gte("date", today)
        .order("date", { ascending: true });

      upcomingEvents = (eventsData || []) as EventRow[];

      const eventIds = new Set<string>();
      (ordersData || []).forEach((o: any) => { if (o.event_id) eventIds.add(o.event_id); });

      const eventCityMap = new Map<string, string>();
      upcomingEvents.forEach((e) => { if (e.city) eventCityMap.set(e.id, e.city); });

      const missingIds = Array.from(eventIds).filter((id) => !eventCityMap.has(id));
      if (missingIds.length > 0) {
        const { data: extraEvents } = await adminClient
          .from("events")
          .select("id, city")
          .in("id", missingIds);
        (extraEvents || []).forEach((e: any) => { if (e.city) eventCityMap.set(e.id, e.city); });
      }

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
        // Also set city in recipientInfoMap if not already set
        const info = recipientInfoMap.get(email);
        if (info && !info.city && maxCity) info.city = maxCity;
      });
    }

    // ─── Placeholder replacement helper ───
    function replacePlaceholders(text: string, info: RecipientInfo): string {
      const fullName = info.name || "";
      const firstName = fullName.split(/\s+/)[0] || "";
      return text
        .replace(/\{\{name\}\}/gi, fullName)
        .replace(/\{\{vorname\}\}/gi, firstName)
        .replace(/\{\{city\}\}/gi, info.city || "")
        .replace(/\{\{email\}\}/gi, info.email);
    }

    // Pre-compute translation cache: translate once per language, not per recipient
    const translationCache = new Map<string, string>();

    const results: { email: string; success: boolean; error?: string }[] = [];

    // Rate limit: Resend allows max 2 emails/second
    // Send sequentially with 500ms delay between each email
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    for (let i = 0; i < recipients.length; i++) {
      const email = recipients[i] as string;
      try {
        const recipientInfo: RecipientInfo = recipientInfoMap.get(email.toLowerCase()) || { name: null, city: null, email };
        let personalizedHtml = html;
        let personalizedSubject = subject;
        let recipientLang = "de";

        personalizedHtml = replacePlaceholders(personalizedHtml, recipientInfo);
        personalizedSubject = replacePlaceholders(personalizedSubject, recipientInfo);

        if (magicMode) {
          const recipientCity = recipientCityMap.get(email.toLowerCase()) || recipientInfo.city || null;
          personalizedHtml = personalizeHtml(personalizedHtml, recipientCity, upcomingEvents, siteUrl);

          if (recipientCity) {
            const info = getCityInfo(recipientCity);
            if (info) recipientLang = info.lang;
          }
        }

        if (recipientLang !== "de") {
          const cacheKey = `${recipientLang}:${personalizedHtml.length}:${personalizedHtml.slice(0, 100)}`;
          if (translationCache.has(cacheKey)) {
            personalizedHtml = translationCache.get(cacheKey)!;
          } else {
            const translated = await translateHtml(personalizedHtml, recipientLang);
            translationCache.set(cacheKey, translated);
            personalizedHtml = translated;
          }
        }

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from, to: [email], subject: personalizedSubject, html: personalizedHtml }),
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

      // Wait 500ms between sends to respect 2/sec rate limit
      if (i < recipients.length - 1) {
        await delay(500);
      }
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
