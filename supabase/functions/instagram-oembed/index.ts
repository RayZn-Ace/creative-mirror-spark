const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'urls array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch oEmbed data for each URL in parallel
    const results = await Promise.all(
      urls.map(async (url: string) => {
        try {
          const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&omitscript=true&maxwidth=480`;
          const resp = await fetch(oembedUrl);
          
          if (!resp.ok) {
            // Fallback: try the public noembed service
            const noembedResp = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
            if (noembedResp.ok) {
              const noembedData = await noembedResp.json();
              return {
                url,
                thumbnail: noembedData.thumbnail_url || null,
                title: noembedData.title || '',
                author: noembedData.author_name || '',
                html: noembedData.html || null,
              };
            }
            return { url, thumbnail: null, title: '', author: '', html: null };
          }

          const data = await resp.json();
          return {
            url,
            thumbnail: data.thumbnail_url || null,
            title: data.title || '',
            author: data.author_name || '',
            html: data.html || null,
          };
        } catch (e) {
          console.error('oEmbed fetch failed for', url, e);
          return { url, thumbnail: null, title: '', author: '', html: null };
        }
      })
    );

    return new Response(
      JSON.stringify({ success: true, posts: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
