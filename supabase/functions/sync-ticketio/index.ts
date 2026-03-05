const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TioEvent {
  title: string;
  city: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  ticketLink: string;
  soldOut: boolean;
  price: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: 'URL is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching ticket.io page:', url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'de-DE,de;q=0.9',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: `Failed to fetch: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = await response.text();
    const events: TioEvent[] = [];

    // Parse each <tr> with event data using the data-search attribute
    // Pattern: <td data-search="CITY - TITLE DATE LOCATION CITY">
    const rowRegex = /<tr>\s*<td\s+data-search="([^"]+)">([\s\S]*?)<\/tr>/gi;
    let match;

    while ((match = rowRegex.exec(html)) !== null) {
      const dataSearch = match[1];
      const rowContent = match[2];

      // Extract event link title from <a class="a-eventlink">
      const linkMatch = rowContent.match(/<a[^>]*class="a-eventlink"[^>]*>([^<]+)<\/a>/i);
      const fullTitle = linkMatch ? linkMatch[1].trim() : '';
      if (!fullTitle) continue;

      // Extract city from title (format: "CITY - EVENT NAME" or "CITY - EVENT NAME - AUSVERKAUFT")
      const titleParts = fullTitle.split(' - ');
      const city = titleParts[0]?.trim() || '';

      // Extract ticket link
      const ticketLinkMatch = rowContent.match(/<a\s+href="(https:\/\/[^"]*ticket\.io[^"]*)"[^>]*class="[^"]*btn[^"]*"/i);
      const ticketLink = ticketLinkMatch ? ticketLinkMatch[1] : '';

      // Check if sold out
      const soldOut = /ausverkauft|sold\s*out/i.test(fullTitle) || /class="[^"]*btn[^"]*sold-out/i.test(rowContent) || />sold out</i.test(rowContent);

      // Extract date from "at DD.MM.YYYY to HH:MM" pattern
      const dateMatch = rowContent.match(/at\s+(\d{2})\.(\d{2})\.(\d{4})\s*(?:<br\s*\/?>)?\s*to\s+(\d{2}:\d{2})/i) 
        || dataSearch.match(/(\d{2})\.(\d{2})\.(\d{4})/);
      
      let date = '';
      let time = '20:00';
      if (dateMatch) {
        if (dateMatch.length >= 5) {
          date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
          time = dateMatch[4];
        } else {
          date = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        }
      }

      // Extract location from the location_on span
      const locationMatch = rowContent.match(/location_on<\/i>(?:<span[^>]*>[^<]*<\/span>)?\s*\n?\s*([^<]+)/i);
      let location = locationMatch ? locationMatch[1].trim() : '';
      // Clean: "Location Name, City" -> "Location Name"
      if (location.includes(',')) {
        const parts = location.split(',');
        parts.pop(); // remove city part
        location = parts.join(',').trim();
      }

      // Extract price
      const priceMatch = rowContent.match(/<b>(\d+[.,]\d+)\s*Euro<\/b>/i);
      const price = priceMatch ? priceMatch[1].replace(',', '.') : '';

      events.push({
        title: fullTitle,
        city,
        date,
        time,
        location,
        ticketLink,
        soldOut,
        price,
      });
    }

    console.log(`Parsed ${events.length} events from ticket.io`);

    return new Response(JSON.stringify({ success: true, events }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
