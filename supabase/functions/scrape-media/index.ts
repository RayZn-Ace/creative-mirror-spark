const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const resolveUrl = (src: string, baseUrl: URL): string | null => {
  if (!src || src.startsWith('data:') || src.length < 5) return null;
  try {
    if (src.startsWith('//')) return `https:${src}`;
    if (src.startsWith('http')) return src;
    return new URL(src, baseUrl.href).href;
  } catch {
    return null;
  }
};

const isJunkImage = (url: string): boolean => {
  const lower = url.toLowerCase();
  return (
    lower.includes('favicon') ||
    lower.includes('1x1') ||
    lower.includes('pixel') ||
    lower.includes('tracking') ||
    lower.includes('img.youtube.com') ||
    (lower.endsWith('.svg') && lower.includes('icon')) ||
    lower.includes('logo') ||
    lower.includes('spinner') ||
    lower.includes('loading') ||
    lower.includes('placeholder')
  );
};

/** Extract image URLs from HTML */
const extractImages = (html: string, baseUrl: URL): string[] => {
  const urls: string[] = [];
  const addUrl = (resolved: string) => {
    if (resolved && !urls.includes(resolved) && !isJunkImage(resolved)) {
      urls.push(resolved);
    }
  };

  // <img src="...">
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (resolved) addUrl(resolved);
  }

  // srcset
  const srcsetRegex = /srcset=["']([^"']+)["']/gi;
  while ((match = srcsetRegex.exec(html)) !== null) {
    const entries = match[1].split(',');
    for (const entry of entries) {
      const src = entry.trim().split(/\s+/)[0];
      const resolved = resolveUrl(src, baseUrl);
      if (resolved) addUrl(resolved);
    }
  }

  // background-image: url(...)
  const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (resolved) addUrl(resolved);
  }

  // og:image
  const ogRegex = /<meta[^>]+(?:content=["']([^"']+)["'][^>]+property=["']og:image["']|property=["']og:image["'][^>]+content=["']([^"']+)["'])/gi;
  while ((match = ogRegex.exec(html)) !== null) {
    const src = match[1] || match[2];
    const resolved = resolveUrl(src, baseUrl);
    if (resolved) addUrl(resolved);
  }

  return urls;
};

/** Extract video URLs from HTML */
const extractVideos = (html: string, baseUrl: URL): string[] => {
  const urls: string[] = [];
  const addUrl = (resolved: string) => {
    if (resolved && !urls.includes(resolved)) urls.push(resolved);
  };

  const videoSrcRegex = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = videoSrcRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (resolved) addUrl(resolved);
  }

  const seenYtIds = new Set<string>();
  const ytPatterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/gi,
    /img\.youtube\.com\/vi\/([\w-]{11})\//gi,
  ];
  for (const pattern of ytPatterns) {
    while ((match = pattern.exec(html)) !== null) {
      if (!seenYtIds.has(match[1])) {
        seenYtIds.add(match[1]);
        addUrl(`https://www.youtube.com/watch?v=${match[1]}`);
      }
    }
  }

  const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/gi;
  while ((match = vimeoRegex.exec(html)) !== null) {
    addUrl(`https://vimeo.com/${match[1]}`);
  }

  return urls;
};

/** Scrape a single URL using Firecrawl (with JS rendering) or fallback fetch */
const scrapeHtml = async (url: string, apiKey: string | undefined): Promise<string> => {
  let html = '';

  if (apiKey) {
    try {
      const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['html'],
          waitFor: 5000,
        }),
      });

      if (fcResponse.ok) {
        const fcData = await fcResponse.json();
        html = fcData?.data?.html || fcData?.html || '';
      }
    } catch (e) {
      console.log('Firecrawl failed for', url, e);
    }
  }

  // Fallback: direct fetch
  if (!html || (html.match(/<img[^>]+src=/gi) || []).length < 2) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      });
      if (response.ok) {
        const text = await response.text();
        if ((text.match(/<img[^>]+src=/gi) || []).length > (html.match(/<img[^>]+src=/gi) || []).length) {
          html = text;
        }
      }
    } catch (e) {
      console.log('Fallback fetch failed for', url, e);
    }
  }

  return html;
};

/** Detect internal links on the page that look like album/gallery subpages */
const detectAlbumLinks = (html: string, baseUrl: URL): string[] => {
  const links: string[] = [];
  // Match <a> tags with href
  const linkRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (!resolved) continue;

    try {
      const linkUrl = new URL(resolved);
      // Only follow links on the same domain
      if (linkUrl.hostname !== baseUrl.hostname) continue;
      // Must be a subpath of the current page or a related gallery/album/fotos path
      const currentPath = baseUrl.pathname.replace(/\/$/, '');
      const linkPath = linkUrl.pathname.replace(/\/$/, '');
      // Skip if it's the same page
      if (linkPath === currentPath) continue;
      // Follow if it's a subpath of current page (e.g. /fotos/album-123)
      // or contains common gallery indicators
      const isSubpage = linkPath.startsWith(currentPath + '/');
      const isGalleryPath = /\/(fotos?|photos?|gallery|galler[yi]e|album|media|bilder|impressions?)/i.test(linkPath);

      if (isSubpage || isGalleryPath) {
        if (!links.includes(resolved)) {
          links.push(resolved);
        }
      }
    } catch {
      // invalid URL, skip
    }
  }

  return links;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, type } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping media from:', formattedUrl, 'type:', type);

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const baseUrl = new URL(formattedUrl);

    // Step 1: Scrape the main page
    const html = await scrapeHtml(formattedUrl, apiKey);

    if (!html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Seite konnte nicht geladen werden' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Main page HTML length:', html.length, 'img tags:', (html.match(/<img[^>]+src=/gi) || []).length);

    let mediaUrls: string[] = [];

    if (type === 'videos') {
      mediaUrls = extractVideos(html, baseUrl);
    } else {
      mediaUrls = extractImages(html, baseUrl);
    }

    console.log(`Found ${mediaUrls.length} ${type} URLs on main page`);

    // Step 2: If we found very few images (likely an album listing), detect and follow album links
    if (mediaUrls.length <= 5 && type !== 'videos') {
      const albumLinks = detectAlbumLinks(html, baseUrl);
      console.log(`Detected ${albumLinks.length} potential album links:`, albumLinks.slice(0, 10));

      if (albumLinks.length > 0) {
        // Limit to max 10 album pages to avoid excessive scraping
        const linksToScrape = albumLinks.slice(0, 10);

        // Scrape album pages in parallel (max 3 concurrent)
        const batchSize = 3;
        for (let i = 0; i < linksToScrape.length; i += batchSize) {
          const batch = linksToScrape.slice(i, i + batchSize);
          const results = await Promise.allSettled(
            batch.map(async (albumUrl) => {
              console.log('Scraping album page:', albumUrl);
              const albumHtml = await scrapeHtml(albumUrl, apiKey);
              if (!albumHtml) return [];
              const albumBase = new URL(albumUrl);
              return extractImages(albumHtml, albumBase);
            })
          );

          for (const result of results) {
            if (result.status === 'fulfilled') {
              for (const imgUrl of result.value) {
                if (!mediaUrls.includes(imgUrl)) {
                  mediaUrls.push(imgUrl);
                }
              }
            }
          }
        }

        console.log(`After scraping ${linksToScrape.length} album pages: ${mediaUrls.length} total images`);
      }
    }

    console.log(`Final result: ${mediaUrls.length} ${type} URLs`);

    return new Response(
      JSON.stringify({ success: true, urls: mediaUrls, count: mediaUrls.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping media:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to scrape' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
