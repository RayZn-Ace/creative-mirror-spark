const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username = 'nightlifegeneration_de', limit = 12 } = await req.json().catch(() => ({}));

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profileUrl = `https://www.instagram.com/${username}/`;
    console.log('Scraping Instagram profile:', profileUrl);

    // Use Firecrawl to scrape the Instagram profile page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: profileUrl,
        formats: ['rawHtml', 'links'],
        waitFor: 5000,
        actions: [
          { type: 'wait', milliseconds: 3000 },
          { type: 'scroll', direction: 'down', amount: 3 },
          { type: 'wait', milliseconds: 2000 },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Firecrawl error:', response.status, errText.substring(0, 300));
      return new Response(
        JSON.stringify({ success: false, error: `Firecrawl error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const html = data?.data?.rawHtml || '';
    const links = data?.data?.links || [];

    console.log('Got HTML length:', html.length, 'links:', links.length);

    // Extract post data from the Instagram page
    const posts: Array<{
      url: string;
      shortcode: string;
      imageUrl: string | null;
      type: 'post' | 'reel' | 'video';
    }> = [];

    // Method 1: Extract shortcodes from links
    const shortcodeSet = new Set<string>();
    const linkPatterns = [
      /instagram\.com\/p\/([\w-]+)/g,
      /instagram\.com\/reel\/([\w-]+)/g,
    ];

    const allText = html + ' ' + JSON.stringify(links);
    for (const pattern of linkPatterns) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        shortcodeSet.add(match[1]);
      }
    }

    console.log('Found shortcodes:', shortcodeSet.size);

    // Method 2: Extract image URLs associated with posts from HTML
    // Instagram stores post thumbnails in various formats
    const imageMap = new Map<string, string>();

    // Look for image URLs near post links
    const imgRegex = /src=["'](https:\/\/[^"']*(?:cdninstagram|fbcdn)[^"']*\.(?:jpg|webp)[^"']*)["']/gi;
    let imgMatch;
    const allImages: string[] = [];
    while ((imgMatch = imgRegex.exec(html)) !== null) {
      const imgUrl = imgMatch[1].replace(/&amp;/g, '&');
      if (!imgUrl.includes('150x150') && !imgUrl.includes('s150x150') && 
          !imgUrl.includes('44x44') && !imgUrl.includes('profile_pic')) {
        allImages.push(imgUrl);
      }
    }

    console.log('Found post images:', allImages.length);

    // Build posts from shortcodes
    const shortcodes = Array.from(shortcodeSet);
    for (let i = 0; i < Math.min(shortcodes.length, limit); i++) {
      const sc = shortcodes[i];
      const isReel = allText.includes(`/reel/${sc}`);
      posts.push({
        shortcode: sc,
        url: isReel ? `https://www.instagram.com/reel/${sc}/` : `https://www.instagram.com/p/${sc}/`,
        imageUrl: allImages[i] || null,
        type: isReel ? 'reel' : 'post',
      });
    }

    // If we got images but no shortcodes, create image-only entries
    if (posts.length === 0 && allImages.length > 0) {
      for (let i = 0; i < Math.min(allImages.length, limit); i++) {
        posts.push({
          shortcode: `img-${i}`,
          url: profileUrl,
          imageUrl: allImages[i],
          type: 'post',
        });
      }
    }

    console.log('Returning', posts.length, 'posts');

    return new Response(
      JSON.stringify({
        success: true,
        username,
        posts,
        count: posts.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping Instagram:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to scrape' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
