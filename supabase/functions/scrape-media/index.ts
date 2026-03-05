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

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

    let html = '';

    // Primary: Use Firecrawl to render JavaScript SPAs
    if (apiKey) {
      try {
        console.log('Using Firecrawl to render page...');
        const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ['html'],
            waitFor: 5000,
          }),
        });

        if (fcResponse.ok) {
          const fcData = await fcResponse.json();
          html = fcData?.data?.html || fcData?.html || '';
          console.log(`Firecrawl returned ${html.length} bytes, ${(html.match(/<img[^>]+src=/gi) || []).length} img tags`);
        } else {
          console.log('Firecrawl error:', fcResponse.status, await fcResponse.text());
        }
      } catch (e) {
        console.log('Firecrawl failed:', e);
      }
    } else {
      console.log('No FIRECRAWL_API_KEY, falling back to direct fetch');
    }

    // Fallback: direct fetch if Firecrawl unavailable or failed
    if (!html || (html.match(/<img[^>]+src=/gi) || []).length < 2) {
      try {
        const response = await fetch(formattedUrl, {
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
        console.log('Fallback fetch failed:', e);
      }
    }

    if (!html) {
      return new Response(
        JSON.stringify({ success: false, error: 'Seite konnte nicht geladen werden' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = new URL(formattedUrl);
    const mediaUrls: string[] = [];

    console.log('Final HTML length:', html.length, 'img tags:', (html.match(/<img[^>]+src=/gi) || []).length);

    const resolveUrl = (src: string): string | null => {
      if (!src || src.startsWith('data:') || src.length < 5) return null;
      try {
        if (src.startsWith('//')) return `https:${src}`;
        if (src.startsWith('http')) return src;
        return new URL(src, baseUrl.href).href;
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
      const videoSrcRegex = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = videoSrcRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (resolved) addUrl(resolved);
      }

      const seenYtIds = new Set<string>();
      const ytPatterns = [
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/gi,
        /img\.youtube\.com\/vi\/([\w-]{11})\//gi,
      ];
      for (const pattern of ytPatterns) {
        let match;
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
    } else {
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (!resolved) continue;

        const lower = resolved.toLowerCase();
        if (lower.includes('favicon')) continue;
        if (lower.includes('1x1')) continue;
        if (lower.includes('pixel')) continue;
        if (lower.includes('tracking')) continue;
        if (lower.includes('img.youtube.com')) continue;
        if (lower.endsWith('.svg') && lower.includes('icon')) continue;

        addUrl(resolved);
      }

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

      const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
      while ((match = bgRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (resolved) addUrl(resolved);
      }

      const ogRegex = /<meta[^>]+(?:content=["']([^"']+)["'][^>]+property=["']og:image["']|property=["']og:image["'][^>]+content=["']([^"']+)["'])/gi;
      while ((match = ogRegex.exec(html)) !== null) {
        const src = match[1] || match[2];
        const resolved = resolveUrl(src);
        if (resolved) addUrl(resolved);
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
