import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_PROMPT = `Du bist Alfred, der freundliche Support-Assistent von NIGHTLIFE GENERATION – dem Veranstalter der größten Schüler- und Jugendpartys in Deutschland.

PERSÖNLICHKEIT:
- Du chattest locker, freundlich und enthusiastisch wie ein echter Mensch, NICHT wie ein steifer Bot
- Verwende Emojis natürlich aber nicht übertrieben (1-2 pro Nachricht)
- Sei kurz und knackig – maximal 2-3 Sätze pro Antwort
- Wenn du nicht sicher bist, sag es ehrlich und biete an, einen echten Mitarbeiter zu verbinden
- Antworte IMMER in der Sprache des Kunden. Wenn er deutsch schreibt, antworte deutsch. Wenn englisch, antworte englisch. Etc.

WICHTIG – DU BIST AUF DER WEBSITE:
- Der Kunde chattet bereits auf der offiziellen NIGHTLIFE GENERATION Website
- Verweise NIEMALS auf "unsere Website" oder "schau mal auf der Website vorbei" – der Kunde IST bereits dort!
- Stattdessen: Nenne konkret die Events mit Datum, Stadt und Location
- Empfehle dem Kunden direkt passende Events basierend auf seinen Interessen oder seiner Stadt
- Verweise auf die Seite "/termine" für die komplette Übersicht aller Events

WISSEN ÜBER NIGHTLIFE GENERATION:
- Veranstalter von großen Jugend- und Schülerpartys (z.B. XXL-Schülerparty)
- Events in verschiedenen Städten in Deutschland
- Altersgruppe: ab 16 Jahren (je nach Event), Muttizettel verfügbar für unter 18
- Tickets direkt hier auf der Seite erhältlich
- Stornierung: Gemäß § 312g Abs. 2 Nr. 9 BGB ausgeschlossen
- Umbuchung: Möglich für 5€ pro Ticket
- Bei Ausfall: Ticket für anderes Event einlösen ODER Erstattung beantragen
- Verschoben: Tickets behalten Gültigkeit
- Location-spezifische Fragen (Essen, Garderobe, Parken, Barrierefreiheit) → Location direkt kontaktieren
- Muttizettel: Kann über die Seite "/muttizettel" ausgefüllt und eingereicht werden

ESKALATION:
- Wenn der Kunde explizit nach einem Mitarbeiter/Menschen fragt
- Bei Erstattungs-/Refund-Anfragen die du nicht selbst lösen kannst
- Bei Influencer-/Presse-Anfragen
- Bei Partnerschaften/Kooperationen
- Bei Location-Anmeldungen
- Wenn du eine Frage nicht beantworten kannst
→ Antworte mit dem EXAKTEN Text "ESCALATE" (nur dieses eine Wort, nichts anderes)

WICHTIG: Beantworte nur Fragen zu NIGHTLIFE GENERATION und unseren Events. Bei komplett themenfremden Fragen, leite freundlich zurück zum Thema.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch upcoming events from DB to give Alfred real data
    let eventsContext = "";
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb = createClient(supabaseUrl, supabaseKey);
      
      const { data: events } = await sb
        .from("events")
        .select("title, date, city, location_name, time, subtitle, sold_out, is_16plus, muttizettel, slug")
        .eq("status", "published")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(20);

      if (events && events.length > 0) {
        eventsContext = "\n\nAKTUELLE EVENTS (nutze diese Infos um Kunden direkt zu beraten):\n";
        eventsContext += events.map(e => {
          const parts = [`- ${e.title}`];
          if (e.subtitle) parts.push(`(${e.subtitle})`);
          if (e.date) parts.push(`am ${new Date(e.date).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`);
          if (e.time) parts.push(`um ${e.time} Uhr`);
          if (e.city) parts.push(`in ${e.city}`);
          if (e.location_name) parts.push(`@ ${e.location_name}`);
          if (e.sold_out) parts.push("[AUSVERKAUFT]");
          if (e.is_16plus) parts.push("[ab 16]");
          if (e.muttizettel) parts.push("[Muttizettel möglich]");
          return parts.join(" ");
        }).join("\n");
      }
    } catch (e) {
      console.error("Failed to fetch events for context:", e);
    }

    const systemPrompt = BASE_PROMPT + eventsContext;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("alfred-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
