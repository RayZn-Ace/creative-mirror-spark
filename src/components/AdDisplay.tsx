import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AdType = "banner" | "popup" | "ticker" | "interstitial" | "ticket_ad";

interface Ad {
  id: string;
  type: AdType;
  title: string;
  content: string | null;
  image_url: string | null;
  click_url: string | null;
  position: string;
  max_impressions: number | null;
  impression_count: number;
}
/* ─── Pop-up ─── */
const PopupAd = ({ ad, onClose }: { ad: Ad; onClose: () => void }) => (
  <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <motion.div className="relative w-full max-w-md rounded-2xl overflow-hidden"
      style={{ background: "hsl(220 50% 12%)", border: "1px solid hsl(0 0% 100% / 0.15)" }}
      initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 30 }}>
      <button onClick={onClose} className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: "hsl(0 0% 0% / 0.5)", color: "hsl(0 0% 100%)" }}>
        <X className="w-4 h-4" />
      </button>
      {ad.image_url && (
        <AdLink url={ad.click_url}>
          <img src={ad.image_url} alt={ad.title} className="w-full object-cover" style={{ maxHeight: "250px" }} />
        </AdLink>
      )}
      {ad.content && (
        <div className="p-5 space-y-2">
          <h3 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>{ad.title}</h3>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.7)" }}>{ad.content}</p>
          {ad.click_url && (
            <a href={ad.click_url} target="_blank" rel="noopener noreferrer"
              className="inline-block mt-2 px-5 py-2 rounded-xl text-sm font-bold"
              style={{ background: "hsl(330 80% 50%)", color: "hsl(0 0% 100%)" }}>
              Mehr erfahren
            </a>
          )}
        </div>
      )}
      {!ad.content && !ad.image_url && (
        <div className="p-5">
          <h3 className="text-lg font-bold" style={{ color: "hsl(0 0% 100%)" }}>{ad.title}</h3>
        </div>
      )}
    </motion.div>
  </motion.div>
);

/* ─── Ticker ─── */
const TickerAd = ({ ad }: { ad: Ad }) => (
  <div className="w-full overflow-hidden py-2" style={{ background: "hsl(330 80% 50% / 0.9)", color: "hsl(0 0% 100%)" }}>
    <div className="flex animate-ticker whitespace-nowrap">
      {[0, 1, 2].map(i => (
        <span key={i} className="text-xs sm:text-sm font-bold uppercase tracking-wider mx-8">
          {ad.content || ad.title}
        </span>
      ))}
    </div>
  </div>
);

/* ─── Banner ─── */
const BannerAd = ({ ad }: { ad: Ad }) => (
  <AdLink url={ad.click_url}>
    <div className="w-full rounded-xl overflow-hidden" style={{ border: "1px solid hsl(0 0% 100% / 0.15)" }}>
      {ad.image_url ? (
        <img src={ad.image_url} alt={ad.title} className="w-full object-cover" style={{ maxHeight: "180px" }} />
      ) : ad.content ? (
        <div className="px-4 py-3 text-center text-sm font-bold" style={{ background: "hsl(0 0% 100% / 0.1)", color: "hsl(0 0% 100%)" }}>
          {ad.content}
        </div>
      ) : null}
    </div>
  </AdLink>
);

/* ─── Interstitial (between sections) ─── */
const InterstitialAd = ({ ad }: { ad: Ad }) => (
  <AdLink url={ad.click_url}>
    <div className="w-full rounded-xl overflow-hidden my-4" style={{ border: "1px solid hsl(0 0% 100% / 0.12)" }}>
      {ad.image_url ? (
        <img src={ad.image_url} alt={ad.title} className="w-full object-cover" style={{ maxHeight: "200px" }} />
      ) : (
        <div className="px-5 py-4" style={{ background: "hsl(0 0% 100% / 0.06)" }}>
          <p className="text-sm font-bold" style={{ color: "hsl(0 0% 100%)" }}>{ad.title}</p>
          {ad.content && <p className="text-xs mt-1" style={{ color: "hsl(0 0% 100% / 0.6)" }}>{ad.content}</p>}
        </div>
      )}
    </div>
  </AdLink>
);

/* ─── Link wrapper ─── */
const AdLink = ({ url, children }: { url: string | null; children: React.ReactNode }) => {
  if (!url) return <>{children}</>;
  return <a href={url} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">{children}</a>;
};

/* ─── Main component ─── */
interface AdDisplayProps {
  eventId?: string;
  position?: "top" | "bottom" | "middle";
  type?: AdType;
}

export const AdDisplay = ({ eventId, position, type }: AdDisplayProps) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [dismissedPopups, setDismissedPopups] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await supabase
        .from("ad_placements")
        .select("*")
        .eq("active", true)
        .order("sort_order");

      if (!data) { setLoaded(true); return; }

      const now = new Date();
      const filtered = data.filter((ad: any) => {
        // Check impression limit
        if (ad.max_impressions && ad.impression_count >= ad.max_impressions) return false;
        // Check date range
        if (ad.start_date && new Date(ad.start_date) > now) return false;
        if (ad.end_date && new Date(ad.end_date) < now) return false;
        // Check event targeting
        if (!ad.is_global && ad.event_id && eventId && ad.event_id !== eventId) return false;
        if (!ad.is_global && ad.event_id && !eventId) return false;
        // Filter by position/type if specified
        if (position && ad.position !== position) return false;
        if (type && ad.type !== type) return false;
        return true;
      }) as Ad[];

      setAds(filtered);
      setLoaded(true);

      // Track impressions
      for (const ad of filtered) {
        supabase.from("ad_placements")
          .update({ impression_count: (ad.impression_count || 0) + 1 })
          .eq("id", ad.id)
          .then();
      }
    };
    fetchAds();
  }, [eventId, position, type]);

  if (!loaded || ads.length === 0) return null;

  const popups = ads.filter(a => a.type === "popup" && !dismissedPopups.has(a.id));
  const tickers = ads.filter(a => a.type === "ticker");
  const banners = ads.filter(a => a.type === "banner");
  const interstitials = ads.filter(a => a.type === "interstitial");

  return (
    <>
      {/* Tickers */}
      {tickers.map(ad => <TickerAd key={ad.id} ad={ad} />)}

      {/* Banners */}
      {banners.map(ad => <BannerAd key={ad.id} ad={ad} />)}

      {/* Interstitials */}
      {interstitials.map(ad => <InterstitialAd key={ad.id} ad={ad} />)}

      {/* Popups */}
      <AnimatePresence>
        {popups.map(ad => (
          <PopupAd key={ad.id} ad={ad} onClose={() => setDismissedPopups(prev => new Set([...prev, ad.id]))} />
        ))}
      </AnimatePresence>
    </>
  );
};

export default AdDisplay;
