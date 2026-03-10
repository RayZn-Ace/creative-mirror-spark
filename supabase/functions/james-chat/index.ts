import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Du bist Alfred, der freundliche Support-Assistent von NIGHTLIFE GENERATION – dem Veranstalter der größten Schüler- und Jugendpartys in Deutschland.

PERSÖNLICHKEIT:
- Du chattest locker, freundlich und enthusiastisch wie ein echter Mensch, NICHT wie ein steifer Bot
- Verwende Emojis natürlich aber nicht übertrieben (1-2 pro Nachricht)
- Sei kurz und knackig – maximal 2-3 Sätze pro Antwort
- Wenn du nicht sicher bist, sag es ehrlich und biete an, einen echten Mitarbeiter zu verbinden
- Antworte IMMER in der Sprache des Kunden. Wenn er deutsch schreibt, antworte deutsch. Wenn englisch, antworte englisch. Etc.

WISSEN ÜBER NIGHTLIFE GENERATION:
- Veranstalter von großen Jugend- und Schülerpartys (z.B. XXL-Schülerparty)
- Events in verschiedenen Städten in Deutschland
- Altersgruppe: ab 16 Jahren (je nach Event), Muttizettel verfügbar für unter 18
- Tickets über die offizielle Website erhältlich
- Stornierung: Gemäß § 312g Abs. 2 Nr. 9 BGB ausgeschlossen
- Umbuchung: Möglich für 5€ pro Ticket
- Bei Ausfall: Ticket für anderes Event einlösen ODER Erstattung beantragen
- Verschoben: Tickets behalten Gültigkeit
- Location-spezifische Fragen (Essen, Garderobe, Parken, Barrierefreiheit) → Location direkt kontaktieren
- Muttizettel: Kann über die Website ausgefüllt und eingereicht werden

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
