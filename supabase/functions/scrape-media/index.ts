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

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|avif|bmp|tiff?)(\?|$)/i;

/** Extract image URLs from HTML */
const extractImages = (html: string, baseUrl: URL): string[] => {
  const urls: string[] = [];
  const addUrl = (resolved: string) => {
    if (resolved && !urls.includes(resolved) && !isJunkImage(resolved)) {
      urls.push(resolved);
    }
  };

  let match;

  // <img src="..."> and lazy-load variants
  const imgRegex = /<img[^>]+(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/gi;
  while ((match = imgRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (resolved) addUrl(resolved);
  }

  // srcset and data-srcset
  const srcsetRegex = /(?:srcset|data-srcset)=["']([^"']+)["']/gi;
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

  // <a href="image.jpg"> (galleries often link to full-size images)
  const linkImgRegex = /<a[^>]+href=["']([^"']+\.(?:jpg|jpeg|png|webp|gif|avif))["']/gi;
  while ((match = linkImgRegex.exec(html)) !== null) {
    const resolved = resolveUrl(match[1], baseUrl);
    if (resolved) addUrl(resolved);
  }

  // Image URLs in JSON/JS strings (SPAs embed image data in scripts)
  const jsonImgRegex = /["'](https?:\/\/[^"'\s\\]+\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?[^"'\s\\]*)?)["']/gi;
  while ((match = jsonImgRegex.exec(html)) !== null) {
    try {
      const cleaned = match[1].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
      if (!isJunkImage(cleaned)) {
        addUrl(cleaned);
      }
    } catch { /* skip */ }
  }

  // Supabase storage URLs (common pattern for uploaded images)
  const storageRegex = /(https?:\/\/[a-z0-9]+\.supabase\.co\/storage\/v1\/object\/public\/[^"'\s<>\\]+)/gi;
  while ((match = storageRegex.exec(html)) !== null) {
    if (!isJunkImage(match[1])) {
      addUrl(match[1]);
    }
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

/** Count album cards on the page and click into each one to extract photos */
const scrapeAlbumCards = async (url: string, apiKey: string, mainHtml: string): Promise<string[]> => {
  const allImages: string[] = [];
  
  // Count how many album cards there are (look for article.glass-card or similar patterns)
  const cardMatches = mainHtml.match(/<article[^>]*class="[^"]*glass-card[^"]*"[^>]*>/gi) || [];
  const cardCount = cardMatches.length;
  
  // Also count generic clickable cards
  const clickableCards = mainHtml.match(/cursor-pointer[^<]*<div[^>]*class="[^"]*h-\d+/gi) || [];
  const totalCards = Math.max(cardCount, clickableCards.length, 1);
  
  console.log(`Found ${cardCount} glass-card articles, ${clickableCards.length} clickable cards, using ${totalCards}`);
  
  // Click on each album card using Firecrawl actions
  for (let i = 0; i < Math.min(totalCards, 10); i++) {
    try {
      console.log(`Clicking album card ${i + 1}/${totalCards}...`);
      
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['rawHtml'],
          waitFor: 5000,
          actions: [
            // Wait for page to load
            { type: 'wait', milliseconds: 3000 },
            // Click on the nth album card (using CSS nth-child selector)
            { type: 'click', selector: `article:nth-child(${i + 1})` },
            // Wait for album content to load
            { type: 'wait', milliseconds: 4000 },
            // Scroll down to load lazy images
            { type: 'scroll', direction: 'down', amount: 3 },
            { type: 'wait', milliseconds: 2000 },
            { type: 'scroll', direction: 'down', amount: 5 },
            { type: 'wait', milliseconds: 2000 },
            { type: 'scroll', direction: 'down', amount: 8 },
            { type: 'wait', milliseconds: 2000 },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.log(`Click scrape error for card ${i + 1}:`, response.status, errText.substring(0, 200));
        continue;
      }

      const data = await response.json();
      const albumHtml = data?.data?.rawHtml || data?.data?.html || '';
      const finalUrl = data?.data?.metadata?.sourceURL || data?.data?.metadata?.url || url;
      
      console.log(`Album card ${i + 1}: got ${albumHtml.length} chars HTML, final URL: ${finalUrl}`);
      
      if (albumHtml && albumHtml.length > 1000) {
        const baseUrl = new URL(finalUrl);
        const images = extractImages(albumHtml, baseUrl);
        console.log(`Album card ${i + 1}: extracted ${images.length} images`);
        
        for (const img of images) {
          if (!allImages.includes(img)) {
            allImages.push(img);
          }
        }
      }
    } catch (e) {
      console.log(`Error clicking album card ${i + 1}:`, e);
    }
  }
  
  return allImages;
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
          waitFor: 8000,
          actions: [
            { type: 'scroll', direction: 'down', amount: 3 },
            { type: 'wait', milliseconds: 2000 },
            { type: 'scroll', direction: 'down', amount: 5 },
            { type: 'wait', milliseconds: 2000 },
          ],
        }),
      });

      if (fcResponse.ok) {
        const fcData = await fcResponse.json();
        html = fcData?.data?.rawHtml || fcData?.data?.html || fcData?.rawHtml || fcData?.html || '';
        console.log(`Firecrawl scrape returned ${html.length} chars for ${url}`);
      } else {
        const errText = await fcResponse.text();
        console.log(`Firecrawl scrape error ${fcResponse.status}:`, errText.substring(0, 200));
      }
    } catch (e) {
      console.log('Firecrawl scrape failed for', url, e);
    }
  }

  // Fallback: direct fetch
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
        if (text.length > html.length) {
          html = text;
          console.log(`Fallback fetch returned ${html.length} chars for ${url}`);
        }
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

    // Step 1: Scrape the main page with JS rendering
    const html = await scrapeHtml(formattedUrl, apiKey);

    if (!html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Seite konnte nicht geladen werden' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imgCount = (html.match(/<img[^>]+/gi) || []).length;
    console.log('Main page HTML length:', html.length, 'img tags:', imgCount);

    let mediaUrls: string[] = [];

    if (type === 'videos') {
      mediaUrls = extractVideos(html, baseUrl);
    } else {
      mediaUrls = extractImages(html, baseUrl);
    }

    console.log(`Found ${mediaUrls.length} ${type} URLs on main page`);

    // Step 2: If few images found, this is likely a gallery overview page with album cards.
    // Use Firecrawl click actions to navigate INTO each album and extract the actual photos.
    if (mediaUrls.length <= 10 && type !== 'videos' && apiKey) {
      console.log('Few images found - detected album overview page. Clicking into album cards...');
      
      const albumImages = await scrapeAlbumCards(formattedUrl, apiKey, html);
      console.log(`Album click-through discovered ${albumImages.length} total images`);
      
      for (const img of albumImages) {
        if (!mediaUrls.includes(img)) {
          mediaUrls.push(img);
        }
      }
      
      console.log(`After album merge: ${mediaUrls.length} total images`);
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
