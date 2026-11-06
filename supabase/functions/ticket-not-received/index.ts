import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const schema = z.object({
  orderNumber: z.string().trim().min(1).max(100).regex(/^[\p{L}\p{N}\s._/#-]+$/u),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255).transform(value => value.toLowerCase()),
  website: z.string().max(0).default(""),
}).strict();
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Public, write-only intake. Never looks up or returns private order/customer data,
// never sends email or tickets. The existing support inbox is the destination.
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Bitte sende die Anfrage über das Formular." }, 405);
  try {
    const raw = await req.text();
    if (raw.length > 4096) return respond({ error: "Die Anfrage ist zu lang." }, 413);
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return respond({ error: "Bitte prüfe Bestellnummer, Namen und E-Mail-Adresse." }, 400);
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return respond({ error: "Der Support ist vorübergehend nicht erreichbar. Bitte versuche es später erneut." }, 503);
    const client = createClient(url, key);
    const { data, error } = await client.rpc("create_missing_ticket_request", {
      _order_number: parsed.data.orderNumber, _first_name: parsed.data.firstName,
      _last_name: parsed.data.lastName, _email: parsed.data.email,
    });
    if (error || data?.ok !== true) return respond({ error: "Deine Anfrage konnte nicht gespeichert werden. Bitte versuche es erneut." }, 500);
    return respond({ ok: true });
  } catch {
    return respond({ error: "Die Anfrage konnte nicht verarbeitet werden. Bitte prüfe deine Angaben und versuche es erneut." }, 400);
  }
});