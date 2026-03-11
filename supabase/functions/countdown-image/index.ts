import satori from "npm:satori@0.10.14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Cache font between requests (same isolate)
let fontCache: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  // Fetch Inter Bold from Google Fonts
  const cssRes = await fetch(
    "https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    }
  );
  const css = await cssRes.text();
  const fontUrl = css.match(
    /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/
  )?.[1];
  if (!fontUrl) throw new Error("Could not extract font URL");
  const fontRes = await fetch(fontUrl);
  fontCache = await fontRes.arrayBuffer();
  return fontCache;
}

function hexToRgba(hex: string): string {
  // Ensure hex starts with #
  const h = hex.startsWith("#") ? hex : `#${hex}`;
  return h;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const targetDate =
      url.searchParams.get("d") ||
      new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const targetTime = url.searchParams.get("t") || "23:59";
    const bgColor = hexToRgba(url.searchParams.get("bg") || "#f8f4ff");
    const accentColor = hexToRgba(
      url.searchParams.get("accent") || "#e91e8c"
    );
    const textColor = hexToRgba(url.searchParams.get("text") || "#1a1a1a");
    const title = decodeURIComponent(url.searchParams.get("title") || "");
    const expired = decodeURIComponent(
      url.searchParams.get("expired") || "Abgelaufen!"
    );

    // Calculate countdown
    const now = new Date();
    const target = new Date(`${targetDate}T${targetTime}:00`);
    const diff = Math.max(0, target.getTime() - now.getTime());
    const isExpired = diff === 0;

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const pad = (n: number) => String(n).padStart(2, "0");

    const font = await loadFont();

    const units = [
      { val: pad(days), label: "TAGE" },
      { val: pad(hours), label: "STD" },
      { val: pad(mins), label: "MIN" },
      { val: pad(secs), label: "SEK" },
    ];

    const hasTitle = title.length > 0;
    const imgWidth = 500;
    const imgHeight = isExpired ? 80 : hasTitle ? 180 : 150;

    // Build virtual DOM for satori
    const children: any[] = [];

    if (isExpired) {
      children.push({
        type: "p",
        props: {
          style: {
            fontSize: 20,
            fontWeight: 700,
            color: textColor,
            margin: 0,
          },
          children: expired,
        },
      });
    } else {
      if (hasTitle) {
        children.push({
          type: "p",
          props: {
            style: {
              fontSize: 16,
              fontWeight: 700,
              color: textColor,
              margin: "0 0 14px",
            },
            children: title,
          },
        });
      }

      children.push({
        type: "div",
        props: {
          style: { display: "flex", gap: 14 },
          children: units.map(({ val, label }) => ({
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      backgroundColor: accentColor,
                      color: "#ffffff",
                      fontSize: 38,
                      fontWeight: 700,
                      padding: "10px 18px",
                      borderRadius: 10,
                      minWidth: 72,
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                    children: val,
                  },
                },
                {
                  type: "span",
                  props: {
                    style: {
                      fontSize: 11,
                      fontWeight: 700,
                      color: textColor,
                      marginTop: 6,
                      opacity: 0.45,
                    },
                    children: label,
                  },
                },
              ],
            },
          })),
        },
      });
    }

    const svg = await satori(
      {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: bgColor,
            borderRadius: 12,
            fontFamily: "Inter",
          },
          children,
        },
      },
      {
        width: imgWidth,
        height: imgHeight,
        fonts: [
          {
            name: "Inter",
            data: font,
            weight: 700,
            style: "normal" as const,
          },
        ],
      }
    );

    // Return SVG as image
    // SVG works in Apple Mail, Outlook (modern), Yahoo Mail, Thunderbird
    // Gmail proxies & converts images, SVG support varies
    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Countdown image error:", error);
    // Simple text fallback
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="80" viewBox="0 0 500 80">
      <rect width="500" height="80" rx="12" fill="#f8f4ff"/>
      <text x="250" y="45" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="bold" fill="#1a1a1a">⏰ Countdown Timer</text>
    </svg>`;
    return new Response(fallbackSvg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }
});
