import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/xml; charset=utf-8",
};

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const baseUrl = "https://gimmetestooo.lovable.app";

  // Fetch all published series
  const { data: series } = await supabase
    .from("event_series")
    .select("slug, updated_at")
    .eq("status", "published");

  const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/termine", priority: "0.9", changefreq: "daily" },
    { loc: "/faq", priority: "0.6", changefreq: "monthly" },
    { loc: "/ueber-uns", priority: "0.5", changefreq: "monthly" },
    { loc: "/kontakt", priority: "0.5", changefreq: "monthly" },
    { loc: "/jobs", priority: "0.5", changefreq: "monthly" },
    { loc: "/promoter", priority: "0.5", changefreq: "monthly" },
    { loc: "/influencer", priority: "0.5", changefreq: "monthly" },
    { loc: "/partner", priority: "0.5", changefreq: "monthly" },
    { loc: "/fuer-wen", priority: "0.6", changefreq: "monthly" },
    { loc: "/media", priority: "0.4", changefreq: "weekly" },
    { loc: "/blog", priority: "0.6", changefreq: "weekly" },
    { loc: "/muttizettel", priority: "0.4", changefreq: "monthly" },
    { loc: "/ticket-umbuchung", priority: "0.4", changefreq: "monthly" },
  ];

  let urls = staticPages.map(
    (p) =>
      `<url><loc>${baseUrl}${p.loc}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  );

  if (series) {
    for (const s of series) {
      const lastmod = s.updated_at ? s.updated_at.split("T")[0] : new Date().toISOString().split("T")[0];
      urls.push(
        `<url><loc>${baseUrl}/${s.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
