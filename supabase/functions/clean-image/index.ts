import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_url } = await req.json();
    if (!image_url) throw new Error("image_url is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const callAiGateway = async (instruction: string) => {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: instruction,
                },
                {
                  type: "image_url",
                  image_url: { url: image_url },
                },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI gateway error:", response.status, errText);

        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error: " + response.status);
      }

      return await response.json();
    };

    const extractImageUrl = (data: any): string | undefined => {
      const msg = data?.choices?.[0]?.message;
      return (
        msg?.images?.[0]?.image_url?.url ||
        msg?.image_url?.url ||
        msg?.content?.find?.((item: any) => item?.type === "image_url")?.image_url?.url
      );
    };

    const primaryPrompt = "Create a NEW clean background image inspired by this event photo. Keep a similar crowd, lighting, venue mood, and color atmosphere, but generate an original image with no readable text, logos, badges, labels, or branding. Return image output only.";
    const fallbackPrompt = "Generate an original nightclub/event background image based on this reference photo's vibe (crowd, lights, colors). The result must contain no readable text or logos and should work as a blurred ticket backdrop. Return image output only.";

    const primaryData = await callAiGateway(primaryPrompt);
    let cleanedImageUrl = extractImageUrl(primaryData);

    if (!cleanedImageUrl) {
      const fallbackData = await callAiGateway(fallbackPrompt);
      cleanedImageUrl = extractImageUrl(fallbackData);
    }

    if (!cleanedImageUrl) {
      console.error("No image in AI response after retry");
      return new Response(JSON.stringify({ error: "No image generated", fallback: image_url }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ cleaned_image_url: cleanedImageUrl }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("clean-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
