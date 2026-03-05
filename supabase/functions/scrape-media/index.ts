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
    if (IMAGE_EXTENSIONS.test(match[1]) && !isJunkImage(match[1])) {
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

/** Use Firecrawl Crawl to recursively discover pages and extract images */
const crawlAndExtract = async (url: string, apiKey: string): Promise<string[]> => {
  console.log('Starting Firecrawl Crawl for:', url);
  
  // Start crawl
  const crawlResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      limit: 20,
      maxDepth: 2,
      scrapeOptions: {
        formats: ['rawHtml'],
        waitFor: 5000,
      },
    }),
  });

  if (!crawlResponse.ok) {
    const errText = await crawlResponse.text();
    console.log('Firecrawl Crawl start error:', crawlResponse.status, errText.substring(0, 300));
    return [];
  }

  const crawlData = await crawlResponse.json();
  console.log('Crawl response:', JSON.stringify(crawlData).substring(0, 500));

  // If crawl returns data directly (synchronous)
  if (crawlData.data && Array.isArray(crawlData.data)) {
    console.log(`Crawl returned ${crawlData.data.length} pages directly`);
    const allImages: string[] = [];
    for (const page of crawlData.data) {
      const pageHtml = page.rawHtml || page.html || '';
      const pageUrl = page.metadata?.sourceURL || page.url || url;
      if (pageHtml) {
        const images = extractImages(pageHtml, new URL(pageUrl));
        console.log(`Page ${pageUrl}: found ${images.length} images`);
        for (const img of images) {
          if (!allImages.includes(img)) allImages.push(img);
        }
      }
    }
    return allImages;
  }

  // If crawl is async, we get an id to poll
  const crawlId = crawlData.id;
  if (!crawlId) {
    console.log('No crawl ID returned:', JSON.stringify(crawlData).substring(0, 300));
    return [];
  }

  console.log('Crawl started with ID:', crawlId, '- polling for results...');

  // Poll for results (max 60 seconds)
  const allImages: string[] = [];
  let attempts = 0;
  const maxAttempts = 12;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;

    const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      console.log('Crawl status error:', statusResponse.status);
      break;
    }

    const statusData = await statusResponse.json();
    console.log(`Crawl poll ${attempts}: status=${statusData.status}, completed=${statusData.completed}/${statusData.total}`);

    if (statusData.data && Array.isArray(statusData.data)) {
      for (const page of statusData.data) {
        const pageHtml = page.rawHtml || page.html || '';
        const pageUrl = page.metadata?.sourceURL || page.url || url;
        if (pageHtml) {
          const images = extractImages(pageHtml, new URL(pageUrl));
          console.log(`Page ${pageUrl}: found ${images.length} images`);
          for (const img of images) {
            if (!allImages.includes(img)) allImages.push(img);
          }
        }
      }
    }

    if (statusData.status === 'completed' || statusData.status === 'failed') {
      break;
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

    // Step 2: If few images found and this is a photo gallery page, use Firecrawl Crawl
    // to recursively discover album subpages (handles SPAs with JS navigation)
    if (mediaUrls.length <= 5 && type !== 'videos' && apiKey) {
      console.log('Few images found, using Firecrawl Crawl to discover album pages...');
      
      const crawlImages = await crawlAndExtract(formattedUrl, apiKey);
      console.log(`Crawl discovered ${crawlImages.length} total images`);
      
      for (const img of crawlImages) {
        if (!mediaUrls.includes(img)) {
          mediaUrls.push(img);
        }
      }
      
      console.log(`After crawl merge: ${mediaUrls.length} total images`);
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
