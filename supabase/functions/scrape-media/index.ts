const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

    const response = await fetch(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch page: ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    const baseUrl = new URL(formattedUrl);
    const mediaUrls: string[] = [];

    const resolveUrl = (src: string): string | null => {
      if (!src || src.startsWith('data:') || src.length < 5) return null;
      try {
        if (src.startsWith('//')) return `https:${src}`;
        if (src.startsWith('http')) return src;
        if (src.startsWith('/')) return `${baseUrl.origin}${src}`;
        return `${baseUrl.origin}/${src}`;
      } catch {
        return null;
      }
    };

    if (type === 'videos') {
      // Extract video sources
      const videoSrcRegex = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = videoSrcRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (resolved && !mediaUrls.includes(resolved)) {
          mediaUrls.push(resolved);
        }
      }

      // Extract YouTube/Vimeo embeds
      const iframeRegex = /<iframe[^>]+src=["']([^"']*(?:youtube|youtu\.be|vimeo)[^"']*)["']/gi;
      while ((match = iframeRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (resolved && !mediaUrls.includes(resolved)) {
          mediaUrls.push(resolved);
        }
      }

      // Extract YouTube thumbnail links as video URLs
      const ytRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/gi;
      while ((match = ytRegex.exec(html)) !== null) {
        const ytUrl = `https://www.youtube.com/watch?v=${match[1]}`;
        if (!mediaUrls.includes(ytUrl)) {
          mediaUrls.push(ytUrl);
        }
      }
    } else {
      // Extract image sources
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (resolved && !mediaUrls.includes(resolved)) {
          // Filter out tiny icons/tracking pixels
          const lower = resolved.toLowerCase();
          if (lower.includes('.svg') || lower.includes('favicon') || lower.includes('1x1') || lower.includes('pixel') || lower.includes('tracking')) continue;
          mediaUrls.push(resolved);
        }
      }

      // Extract from srcset
      const srcsetRegex = /srcset=["']([^"']+)["']/gi;
      while ((match = srcsetRegex.exec(html)) !== null) {
        const entries = match[1].split(',');
        for (const entry of entries) {
          const src = entry.trim().split(/\s+/)[0];
          const resolved = resolveUrl(src);
          if (resolved && !mediaUrls.includes(resolved)) {
            const lower = resolved.toLowerCase();
            if (lower.includes('.svg') || lower.includes('favicon')) continue;
            mediaUrls.push(resolved);
          }
        }
      }

      // Extract from CSS background-image
      const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
      while ((match = bgRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (resolved && !mediaUrls.includes(resolved)) {
          mediaUrls.push(resolved);
        }
      }

      // Extract from og:image meta tags
      const ogRegex = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']|<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;
      while ((match = ogRegex.exec(html)) !== null) {
        const src = match[1] || match[2];
        const resolved = resolveUrl(src);
        if (resolved && !mediaUrls.includes(resolved)) {
          mediaUrls.push(resolved);
        }
      }
    }

    console.log(`Found ${mediaUrls.length} ${type} URLs`);

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
