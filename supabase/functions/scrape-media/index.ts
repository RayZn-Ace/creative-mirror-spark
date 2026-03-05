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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
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

    console.log('HTML length:', html.length);

    const resolveUrl = (src: string): string | null => {
      if (!src || src.startsWith('data:') || src.length < 5) return null;
      try {
        if (src.startsWith('//')) return `https:${src}`;
        if (src.startsWith('http')) return src;
        if (src.startsWith('/')) return `${baseUrl.origin}${src}`;
        return new URL(src, formattedUrl).href;
      } catch {
        return null;
      }
    };

    const addUrl = (resolved: string) => {
      if (resolved && !mediaUrls.includes(resolved)) {
        mediaUrls.push(resolved);
      }
    };

    if (type === 'videos') {
      // Extract video sources
      const videoSrcRegex = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = videoSrcRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (resolved) addUrl(resolved);
      }

      // Extract YouTube video IDs and create watch URLs
      const ytRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/gi;
      const seenYtIds = new Set<string>();
      while ((match = ytRegex.exec(html)) !== null) {
        if (!seenYtIds.has(match[1])) {
          seenYtIds.add(match[1]);
          addUrl(`https://www.youtube.com/watch?v=${match[1]}`);
        }
      }

      // Also check for YouTube thumbnail images (img.youtube.com/vi/ID/...)
      const ytThumbRegex = /img\.youtube\.com\/vi\/([\w-]{11})\//gi;
      while ((match = ytThumbRegex.exec(html)) !== null) {
        if (!seenYtIds.has(match[1])) {
          seenYtIds.add(match[1]);
          addUrl(`https://www.youtube.com/watch?v=${match[1]}`);
        }
      }

      // Extract Vimeo embeds
      const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/gi;
      while ((match = vimeoRegex.exec(html)) !== null) {
        addUrl(`https://vimeo.com/${match[1]}`);
      }
    } else {
      // Extract ALL src attributes from img tags
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (!resolved) continue;
        
        const lower = resolved.toLowerCase();
        // Skip tiny icons, tracking pixels, favicons
        if (lower.includes('favicon')) continue;
        if (lower.includes('1x1')) continue;
        if (lower.includes('pixel')) continue;
        if (lower.includes('tracking')) continue;
        // Skip YouTube thumbnails (those are for videos)
        if (lower.includes('img.youtube.com')) continue;
        
        addUrl(resolved);
      }

      // Extract from srcset
      const srcsetRegex = /srcset=["']([^"']+)["']/gi;
      while ((match = srcsetRegex.exec(html)) !== null) {
        const entries = match[1].split(',');
        for (const entry of entries) {
          const src = entry.trim().split(/\s+/)[0];
          const resolved = resolveUrl(src);
          if (resolved && !resolved.toLowerCase().includes('favicon')) {
            addUrl(resolved);
          }
        }
      }

      // Extract from CSS background-image
      const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
      while ((match = bgRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (resolved) addUrl(resolved);
      }

      // Extract from og:image meta tags
      const ogRegex = /<meta[^>]+(?:content=["']([^"']+)["'][^>]+property=["']og:image["']|property=["']og:image["'][^>]+content=["']([^"']+)["'])/gi;
      while ((match = ogRegex.exec(html)) !== null) {
        const src = match[1] || match[2];
        const resolved = resolveUrl(src);
        if (resolved) addUrl(resolved);
      }
    }

    console.log(`Found ${mediaUrls.length} ${type} URLs:`, mediaUrls.slice(0, 5));

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
