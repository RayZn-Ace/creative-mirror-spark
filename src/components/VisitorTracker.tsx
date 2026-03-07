import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  let sid = sessionStorage.getItem("visitor_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("visitor_sid", sid);
  }
  return sid;
}

function detectSourceFromClickIds(): string | null {
  const params = new URLSearchParams(window.location.search);
  if (params.has("fbclid")) return "Facebook";
  if (params.has("igshid")) return "Instagram";
  if (params.has("gclid")) return "Google";
  if (params.has("ttclid")) return "TikTok";
  if (params.has("msclkid")) return "Microsoft";
  if (params.has("li_fat_id")) return "LinkedIn";
  if (params.has("twclid")) return "Twitter";
  if (params.has("sclid")) return "Snapchat";
  if (params.has("epik")) return "Pinterest";
  return null;
}

function detectSource(referrer: string): string {
  if (!referrer) return "Direkt";
  const r = referrer.toLowerCase();
  // Meta redirect domains
  if (r.includes("1.facebook.com") || r.includes("1m.facebook.com") || r.includes("lm.facebook.com") || r.includes("l.facebook.com")) return "Facebook";
  if (r.includes("1.instagram.com") || r.includes("l.instagram.com")) return "Instagram";
  if (r.includes("whatsapp") || r.includes("wa.me")) return "WhatsApp";
  if (r.includes("instagram") || r.includes("ig.me")) return "Instagram";
  if (r.includes("google.")) return "Google";
  if (r.includes("facebook.com") || r.includes("fb.com") || r.includes("fbclid")) return "Facebook";
  if (r.includes("tiktok.com")) return "TikTok";
  if (r.includes("twitter.com") || r.includes("t.co") || r.includes("x.com")) return "Twitter";
  if (r.includes("youtube.com") || r.includes("youtu.be")) return "YouTube";
  if (r.includes("linkedin.com")) return "LinkedIn";
  if (r.includes("snapchat.com")) return "Snapchat";
  if (r.includes("pinterest.")) return "Pinterest";
  if (r.includes("t.me") || r.includes("telegram.")) return "Telegram";
  if (r.includes("mail") || r.includes("outlook") || r.includes("gmail")) return "E_Mail";
  return "Andere";
}

function detectSourceFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source")?.toLowerCase();
  if (!utm) return null;
  if (utm.includes("whatsapp")) return "WhatsApp";
  if (utm.includes("instagram")) return "Instagram";
  if (utm.includes("google")) return "Google";
  if (utm.includes("facebook") || utm.includes("fb")) return "Facebook";
  if (utm.includes("tiktok")) return "TikTok";
  if (utm.includes("twitter") || utm.includes("x.com")) return "Twitter";
  if (utm.includes("youtube")) return "YouTube";
  if (utm.includes("linkedin")) return "LinkedIn";
  if (utm.includes("snapchat")) return "Snapchat";
  if (utm.includes("pinterest")) return "Pinterest";
  if (utm.includes("telegram")) return "Telegram";
  if (utm.includes("email") || utm.includes("mail")) return "E_Mail";
  return "Andere";
}

const VisitorTracker = () => {
  const location = useLocation();
  const visitIdRef = useRef<string | null>(null);

  useEffect(() => {
    const sessionId = getSessionId();
    const referrer = document.referrer;
    // Priority: click IDs > UTM params > referrer
    const source = detectSourceFromClickIds() || detectSourceFromUrl() || detectSource(referrer);

    const trackVisit = async () => {
      const { data } = await supabase
        .from("page_visits")
        .insert({
          session_id: sessionId,
          page_url: window.location.href,
          referrer: referrer || null,
          referrer_source: source,
          user_agent: navigator.userAgent,
        })
        .select("id")
        .single();
      if (data) visitIdRef.current = data.id;
    };

    trackVisit();

    const handleUnload = () => {
      if (visitIdRef.current) {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_visits?id=eq.${visitIdRef.current}`;
        navigator.sendBeacon(url);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [location.pathname]);

  return null;
};

export default VisitorTracker;
