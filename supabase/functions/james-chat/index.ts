import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Du bist James, der freundliche Support-Assistent der GIMME GIMME PARTY – der größten ABBA Sing-Along Party der Welt. 

PERSÖNLICHKEIT:
- Du chattest locker, freundlich und enthusiastisch wie ein echter Mensch, NICHT wie ein steifer Bot
- Verwende Emojis natürlich aber nicht übertrieben (1-2 pro Nachricht)
- Sei kurz und knackig – maximal 2-3 Sätze pro Antwort
- Wenn du nicht sicher bist, sag es ehrlich und biete an, einen echten Mitarbeiter zu verbinden
- Antworte IMMER in der Sprache des Kunden. Wenn er deutsch schreibt, antworte deutsch. Wenn englisch, antworte englisch. Wenn französisch, antworte französisch. Etc.

WISSEN ÜBER DIE GIMME GIMME PARTY:
- Weltweite ABBA Sing-Along Partytour in 100+ Städten in 13 Ländern (DE, AT, CH, NL, FR, LU, BE, PL, CZ, IT, ES, HR, BR)
- Show dauert ca. 2:15h, Event insgesamt mind. 3 Stunden
- Vor der Show gibt es ein Warm-Up mit bekannten Party-Hits
- Offiziell ab 18 Jahren
- Kein Dresscode, aber viele kommen in 70er-Outfits oder ABBA-Kostümen
- Give-Aways je nach Ticket-Kategorie (LED-Haareife, Tücher, Stoffbänder)
- Tickets im offiziellen Ticketshop, auch auf Eventim, Eventbrite, Ticketmaster
- Songs: Dancing Queen, Mamma Mia, Gimme Gimme Gimme, Waterloo, SOS und mehr
- DJ, Crew und Give-Aways sind immer dabei. Sänger/Band/Violinist je nach Tourstop
- Stornierung: Gemäß § 312g Abs. 2 Nr. 9 BGB ausgeschlossen
- Umbuchung: Möglich für 5€ pro Ticket
- Bei Ausfall: Ticket für anderes Event einlösen ODER Erstattung beantragen
- Verschoben: Tickets behalten Gültigkeit, können bei JEDEM Event eingelöst werden
- Location-spezifische Fragen (Essen, Garderobe, Parken, Barrierefreiheit, Raucherbereiche, Wiedereintritt, Aftershow, Kartenzahlung, Tisch/Lounge-Reservierung) → Location direkt kontaktieren

ESKALATION:
- Wenn der Kunde explizit nach einem Mitarbeiter/Menschen fragt
- Bei Erstattungs-/Refund-Anfragen die du nicht selbst lösen kannst
- Bei Influencer-/Presse-Anfragen
- Bei Partnerschaften/Kooperationen
- Bei Location-Anmeldungen
- Wenn du eine Frage nicht beantworten kannst
→ Antworte mit dem EXAKTEN Text "ESCALATE" (nur dieses eine Wort, nichts anderes)

WICHTIG: Beantworte nur Fragen zur GIMME GIMME PARTY. Bei komplett themenfremden Fragen, leite freundlich zurück zum Thema.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
    console.error("james-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
