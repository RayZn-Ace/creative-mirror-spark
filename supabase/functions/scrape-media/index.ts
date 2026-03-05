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

  let match;

  const imgRegex = /<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (resolved) addUrl(resolved);
  }

  const srcsetRegex = /(?:srcset|data-srcset)=["']([^"']+)["']/gi;
  while ((match = srcsetRegex.exec(html)) !== null) {
    const entries = match[1].split(',');
    for (const entry of entries) {
      const src = entry.trim().split(/\s+/)[0];
      const resolved = resolveUrl(src, baseUrl);
      if (resolved) addUrl(resolved);
    }
  }

  const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (resolved) addUrl(resolved);
  }

  const ogRegex = /<meta[^>]+(?:content=["']([^"']+)["'][^>]+property=["']og:image["']|property=["']og:image["'][^>]+content=["']([^"']+)["'])/gi;
  while ((match = ogRegex.exec(html)) !== null) {
    const src = match[1] || match[2];
    const resolved = resolveUrl(src, baseUrl);
    if (resolved) addUrl(resolved);
  }

  const linkImgRegex = /<a[^>]+href=["']([^"']+\.(?:jpg|jpeg|png|webp|gif|avif))["']/gi;
  while ((match = linkImgRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (resolved) addUrl(resolved);
  }

  const jsonImgRegex = /["'](https?:\/\/[^"'\s\\]+\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?[^"'\s\\]*)?)["']/gi;
  while ((match = jsonImgRegex.exec(html)) !== null) {
    try {
      const cleaned = match[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
      if (!isJunkImage(cleaned)) addUrl(cleaned);
    } catch { /* skip */ }
  }

  const storageRegex = /(https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/[^"'\s<>\\]+)/gi;
  while ((match = storageRegex.exec(html)) !== null) {
    if (!isJunkImage(match[1])) addUrl(match[1]);
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

type Album = {
  index: number;
  title: string;
  coverImage: string | null;
  date: string | null;
};

/** Check if a card HTML snippet looks like a video (youtube thumb, play button, aspect-video) */
const isVideoCard = (cardHtml: string): boolean => {
  const lower = cardHtml.toLowerCase();
  return (
    lower.includes('img.youtube.com') ||
    lower.includes('youtube.com/embed') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com') ||
    lower.includes('aspect-video') ||
    lower.includes('lucide-play') ||
    lower.includes('fa-play') ||
    (lower.includes('play') && lower.includes('svg'))
  );
};

/** Detect album cards on a gallery overview page */
const detectAlbumCards = (html: string, baseUrl: URL): Album[] => {
  const albums: Album[] = [];

  // Pattern 1: <article> cards with heading + image (common SPA pattern)
  const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
  let match;
  let index = 0;
  while ((match = articleRegex.exec(html)) !== null) {
    const card = match[1];

    // Skip video cards
    if (isVideoCard(card)) {
      console.log(`Skipping article ${index + 1}: detected as video`);
      continue;
    }

    // Extract title from h1-h3
    const titleMatch = card.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/i);
    const title = titleMatch ? titleMatch[1].trim() : `Album ${index + 1}`;

    // Extract cover image
    const imgMatch = card.match(/<img[^>]+src=["']([^"']+)["']/i);
    const coverImage = imgMatch ? resolveUrl(imgMatch[1], baseUrl) : null;

    // Extract date
    const dateMatch = card.match(/<time[^>]*>([^<]+)<\/time>/i) || card.match(/(\d{1,2}\.\s*\w+\s*\d{4})/);
    const date = dateMatch ? dateMatch[1].trim() : null;

    albums.push({ index: albums.length, title, coverImage, date });
    index++;
  }

  // Pattern 2: Generic clickable divs — but ONLY if they have album-like structure
  // (multiple images per card, a heading, or link). Single-image divs in a grid are NOT albums.
  if (albums.length === 0) {
    // Look for cards that have BOTH a heading AND an image — that's an album card
    const cardRegex = /<div[^>]*class="[^"]*(?:card|album|gallery-item)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    while ((match = cardRegex.exec(html)) !== null) {
      const card = match[1];
      if (isVideoCard(card)) continue;

      const titleMatch = card.match(/<h[1-4][^>]*>([^<]+)<\/h[1-4]>/i);
      if (!titleMatch) continue; // No heading = not an album card, just an image in a grid
      const title = titleMatch[1].trim();
      const imgMatch = card.match(/<img[^>]+src=["']([^"']+)["']/i);
      const coverImage = imgMatch ? resolveUrl(imgMatch[1], baseUrl) : null;
      albums.push({ index: albums.length, title, coverImage, date: null });
    }
  }

  return albums;
};

/** Click into a specific album card and extract all its images */
const scrapeAlbumByIndex = async (url: string, apiKey: string, albumIndex: number): Promise<string[]> => {
  try {
    console.log(`Clicking album card ${albumIndex + 1}...`);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['rawHtml'],
        waitFor: 3000,
        actions: [
          { type: 'wait', milliseconds: 1500 },
          { type: 'click', selector: `article:nth-child(${albumIndex + 1})` },
          { type: 'wait', milliseconds: 2500 },
          { type: 'scroll', direction: 'down', amount: 5 },
          { type: 'wait', milliseconds: 1500 },
          { type: 'scroll', direction: 'down', amount: 10 },
          { type: 'wait', milliseconds: 1000 },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log(`Click error for album ${albumIndex + 1}:`, response.status, errText.substring(0, 200));
      return [];
    }

    const data = await response.json();
    const albumHtml = data?.data?.rawHtml || data?.data?.html || '';
    const finalUrl = data?.data?.metadata?.sourceURL || url;

    console.log(`Album ${albumIndex + 1}: got ${albumHtml.length} chars, URL: ${finalUrl}`);

    if (albumHtml && albumHtml.length > 1000) {
      const images = extractImages(albumHtml, new URL(finalUrl));
      console.log(`Album ${albumIndex + 1}: extracted ${images.length} images`);
      return images;
    }
    return [];
  } catch (e) {
    console.log(`Error clicking album ${albumIndex + 1}:`, e);
    return [];
  }
};

/** Scrape a single URL using Firecrawl with JS rendering */
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
          formats: ['rawHtml'],
          waitFor: 4000,
          actions: [
            { type: 'scroll', direction: 'down', amount: 5 },
            { type: 'wait', milliseconds: 1500 },
          ],
        }),
      });

      if (fcResponse.ok) {
        const fcData = await fcResponse.json();
        html = fcData?.data?.rawHtml || fcData?.data?.html || '';
        console.log(`Firecrawl scrape returned ${html.length} chars for ${url}`);
      } else {
        const errText = await fcResponse.text();
        console.log(`Firecrawl scrape error ${fcResponse.status}:`, errText.substring(0, 200));
      }
    } catch (e) {
      console.log('Firecrawl scrape failed for', url, e);
    }
  }

  if (!html || html.length < 1000) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
      });
      if (response.ok) {
        const text = await response.text();
        if (text.length > html.length) html = text;
      }
    } catch (e) {
      console.log('Fallback fetch failed for', url, e);
    }
  }

  return html;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, type, mode, albumIndices } = await req.json();

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

    console.log('Scraping media from:', formattedUrl, 'type:', type, 'mode:', mode || 'auto');

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const baseUrl = new URL(formattedUrl);

    // ── MODE: scrape specific albums by index (PARALLEL) ──
    if (mode === 'scrape_albums' && Array.isArray(albumIndices) && apiKey) {
      console.log(`Scraping ${albumIndices.length} albums in parallel:`, albumIndices);
      
      // Scrape up to 3 albums concurrently to avoid rate limits
      const CONCURRENCY = 3;
      const allImages: string[] = [];
      
      for (let i = 0; i < albumIndices.length; i += CONCURRENCY) {
        const batch = albumIndices.slice(i, i + CONCURRENCY);
        const results = await Promise.all(
          batch.map((idx: number) => scrapeAlbumByIndex(formattedUrl, apiKey, idx))
        );
        for (const images of results) {
          for (const img of images) {
            if (!allImages.includes(img)) allImages.push(img);
          }
        }
      }

      console.log(`Total images from selected albums: ${allImages.length}`);
      return new Response(
        JSON.stringify({ success: true, urls: allImages, count: allImages.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Step 1: Scrape main page ──
    const html = await scrapeHtml(formattedUrl, apiKey);

    if (!html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Seite konnte nicht geladen werden' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imgCount = (html.match(/<img[^>]+/gi) || []).length;
    console.log('Main page HTML length:', html.length, 'img tags:', imgCount);

    // Check for album cards
    const albums = type !== 'videos' ? detectAlbumCards(html, baseUrl) : [];
    console.log(`Detected ${albums.length} album cards`);

    let mediaUrls: string[] = [];
    if (type === 'videos') {
      mediaUrls = extractVideos(html, baseUrl);
    } else {
      mediaUrls = extractImages(html, baseUrl);
    }

    console.log(`Found ${mediaUrls.length} ${type} URLs on main page`);

    // ── MODE: discover → return album info if albums found ──
    // Also auto-discover: if albums detected and few direct images, suggest albums
    if (albums.length > 0 && mediaUrls.length <= 20) {
      console.log('Album overview detected, returning album list for user selection');
      return new Response(
        JSON.stringify({
          success: true,
          hasAlbums: true,
          albums,
          // Also include any directly found images as fallback
          urls: mediaUrls,
          count: mediaUrls.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── No albums, return images directly ──
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
