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

    // Try multiple approaches to get the rendered HTML
    let html = '';

    // Approach 1: Use a prerender-style User-Agent (many SPAs serve pre-rendered HTML to bots)
    const botUserAgents = [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/120.0.0.0 Safari/537.36',
      'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    ];

    for (const ua of botUserAgents) {
      try {
        const response = await fetch(formattedUrl, {
          headers: {
            'User-Agent': ua,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
          },
        });
        if (response.ok) {
          const text = await response.text();
          // Check if this response has actual img tags (not just a JS shell)
          const imgCount = (text.match(/<img[^>]+src=/gi) || []).length;
          console.log(`UA "${ua.substring(0, 30)}..." returned ${text.length} bytes, ${imgCount} img tags`);
          if (imgCount > (html.match(/<img[^>]+src=/gi) || []).length) {
            html = text;
          }
          if (imgCount >= 5) break; // Good enough, stop trying
        }
      } catch (e) {
        console.log('UA attempt failed:', e);
      }
    }

    // Approach 2: If bot UAs didn't work well, try Google's cache / web render
    if ((html.match(/<img[^>]+src=/gi) || []).length < 3) {
      try {
        // Try using a web rendering proxy service
        const renderUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(formattedUrl)}`;
        const cacheResp = await fetch(renderUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        if (cacheResp.ok) {
          const cacheHtml = await cacheResp.text();
          const imgCount = (cacheHtml.match(/<img[^>]+src=/gi) || []).length;
          console.log(`Google cache returned ${cacheHtml.length} bytes, ${imgCount} img tags`);
          if (imgCount > (html.match(/<img[^>]+src=/gi) || []).length) {
            html = cacheHtml;
          }
        }
      } catch (e) {
        console.log('Cache approach failed:', e);
      }
    }

    // Approach 3: If still not enough, try regular fetch as fallback
    if ((html.match(/<img[^>]+src=/gi) || []).length < 2) {
      try {
        const response = await fetch(formattedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
        console.log('Regular fetch failed:', e);
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
      // Extract video sources
      const videoSrcRegex = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = videoSrcRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (resolved) addUrl(resolved);
      }

      // Extract YouTube video IDs
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

      // Extract Vimeo
      const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/gi;
      while ((match = vimeoRegex.exec(html)) !== null) {
        addUrl(`https://vimeo.com/${match[1]}`);
      }
    } else {
      // Extract ALL img src attributes
      const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const resolved = resolveUrl(match[1]);
        if (!resolved) continue;

        const lower = resolved.toLowerCase();
        // Skip tiny icons, tracking pixels, favicons, YouTube thumbs
        if (lower.includes('favicon')) continue;
        if (lower.includes('1x1')) continue;
        if (lower.includes('pixel')) continue;
        if (lower.includes('tracking')) continue;
        if (lower.includes('img.youtube.com')) continue;
        // Skip very small placeholder images (base64 or tiny SVGs)
        if (lower.endsWith('.svg') && lower.includes('icon')) continue;

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
