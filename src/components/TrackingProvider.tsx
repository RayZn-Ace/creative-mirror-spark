import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type TrackingPixel = {
  id: string;
  provider: string;
  pixel_id: string;
  enabled: boolean;
  test_mode: boolean;
  config: Record<string, unknown>;
};

// Inject script tag into head
const injectScript = (id: string, src: string) => {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
};

const injectInlineScript = (id: string, code: string) => {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.innerHTML = code;
  document.head.appendChild(s);
};

const logEvent = async (pixel: TrackingPixel, eventName: string, pageUrl: string) => {
  await supabase.from("tracking_event_logs").insert({
    pixel_id: pixel.id,
    provider: pixel.provider,
    event_name: eventName,
    page_url: pageUrl,
    test_mode: pixel.test_mode,
    event_data: {},
  });
};

const initPixel = (pixel: TrackingPixel) => {
  if (pixel.test_mode) return;
  const cfg = pixel.config || {};

  switch (pixel.provider) {
    case "google_analytics": {
      injectScript(`ga-${pixel.id}`, `https://www.googletagmanager.com/gtag/js?id=${pixel.pixel_id}`);
      const configParams: string[] = [];
      if (cfg.debug_mode === "true") configParams.push(`'debug_mode': true`);
      if (cfg.enhanced_measurement === "true") configParams.push(`'enhanced_measurement': true`);
      if (cfg.cross_domains) configParams.push(`'linker': {'domains': [${(cfg.cross_domains as string).split(",").map(d => `'${d.trim()}'`).join(",")}]}`);
      injectInlineScript(`ga-init-${pixel.id}`, `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${pixel.pixel_id}'${configParams.length ? `, {${configParams.join(",")}}` : ""});
      `);
      break;
    }

    case "google_tag_manager": {
      const dlName = (cfg.data_layer_name as string) || "dataLayer";
      const authParam = cfg.gtm_auth ? `+'&gtm_auth=${cfg.gtm_auth}&gtm_preview=${cfg.gtm_preview || ""}&gtm_cookies_win=x'` : "";
      injectInlineScript(`gtm-${pixel.id}`, `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl${authParam};f.parentNode.insertBefore(j,f);
        })(window,document,'script','${dlName}','${pixel.pixel_id}');
      `);
      break;
    }

    case "meta": {
      const advancedMatching = cfg.advanced_matching === "true";
      injectInlineScript(`fbp-${pixel.id}`, `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${pixel.pixel_id}'${advancedMatching ? ", {}" : ""});
        ${advancedMatching ? "fbq('set', 'autoConfig', 'true', '" + pixel.pixel_id + "');" : ""}
        fbq('track', 'PageView');
      `);
      if (cfg.domain_verification) {
        const meta = document.createElement("meta");
        meta.name = "facebook-domain-verification";
        meta.content = cfg.domain_verification as string;
        document.head.appendChild(meta);
      }
      break;
    }

    case "tiktok": {
      const ttAdvanced = cfg.advanced_matching === "true";
      injectInlineScript(`ttp-${pixel.id}`, `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t._q.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
          ttq.load('${pixel.pixel_id}'${ttAdvanced ? ", {auto_advanced_matching: true}" : ""});
          ttq.page();
        }(window, document, 'ttq');
      `);
      break;
    }

    case "snapchat": {
      const snapAdvanced = cfg.advanced_matching === "true";
      injectInlineScript(`snap-${pixel.id}`, `
        (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
        {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
        a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
        r.src=n;var u=t.getElementsByTagName(s)[0];
        u.parentNode.insertBefore(r,u);})(window,document,
        'https://sc-static.net/scevent.min.js');
        snaptr('init', '${pixel.pixel_id}', {${snapAdvanced ? "user_email: '', user_phone_number: ''" : ""}});
        snaptr('track', 'PAGE_VIEW');
      `);
      break;
    }

    case "pinterest":
      injectInlineScript(`pin-${pixel.id}`, `
        !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");
        pintrk('load', '${pixel.pixel_id}'${cfg.enhanced_match === "true" ? ", {em: ''}" : ""});
        pintrk('page');
      `);
      break;

    case "linkedin":
      injectInlineScript(`li-${pixel.id}`, `
        _linkedin_partner_id = "${pixel.pixel_id}";
        window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
        window._linkedin_data_partner_ids.push(_linkedin_partner_id);
        (function(l) {
        if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
        window.lintrk.q=[]}
        var s = document.getElementsByTagName("script")[0];
        var b = document.createElement("script");
        b.type = "text/javascript";b.async = true;
        b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
        s.parentNode.insertBefore(b, s);})(window.lintrk);
      `);
      break;

    case "twitter":
      injectInlineScript(`twt-${pixel.id}`, `
        !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
        },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
        a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
        twq('config','${pixel.pixel_id}');
      `);
      break;

    case "google_ads":
      injectScript(`gads-${pixel.id}`, `https://www.googletagmanager.com/gtag/js?id=${pixel.pixel_id}`);
      injectInlineScript(`gads-init-${pixel.id}`, `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${pixel.pixel_id}'${cfg.enhanced_conversions === "true" ? ", {allow_enhanced_conversions: true}" : ""});
      `);
      break;

    case "hotjar": {
      const sv = (cfg.snippet_version as string) || "6";
      injectInlineScript(`hj-${pixel.id}`, `
        (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${pixel.pixel_id},hjsv:${sv}};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
        })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
      `);
      break;
    }

    case "microsoft_ads":
      injectInlineScript(`msads-${pixel.id}`, `
        (function(w,d,t,r,u){var f,n,i;w[u]=w[u]||[],f=function(){var o={ti:"${pixel.pixel_id}"${cfg.enhanced_conversions === "true" ? ", enableAutoSpaTracking: true" : ""}};
        o.q=w[u],w[u]=new UET(o),w[u].push("pageLoad")},n=d.createElement(t),n.src=r,n.async=1,n.onload=n.onreadystatechange=function()
        {var s=this.readyState;s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null)},i=d.getElementsByTagName(t)[0],i.parentNode.insertBefore(n,i)
        })(window,document,"script","//bat.bing.com/bat.js","uetq");
      `);
      break;
  }
};

const firePageView = (pixel: TrackingPixel) => {
  if (pixel.test_mode) return;

  switch (pixel.provider) {
    case "google_analytics":
      if ((window as any).gtag) (window as any).gtag("event", "page_view");
      break;
    case "meta":
      if ((window as any).fbq) (window as any).fbq("track", "PageView");
      break;
    case "tiktok":
      if ((window as any).ttq) (window as any).ttq.page();
      break;
    case "snapchat":
      if ((window as any).snaptr) (window as any).snaptr("track", "PAGE_VIEW");
      break;
    case "pinterest":
      if ((window as any).pintrk) (window as any).pintrk("page");
      break;
    case "google_ads":
      if ((window as any).gtag) (window as any).gtag("event", "page_view");
      break;
    case "microsoft_ads":
      if ((window as any).uetq) (window as any).uetq.push("pageLoad");
      break;
  }
};

const TrackingProvider = () => {
  const [pixels, setPixels] = useState<TrackingPixel[]>([]);
  const location = useLocation();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("tracking_pixels")
        .select("*")
        .eq("enabled", true);
      if (data) {
        const typed = data as unknown as TrackingPixel[];
        setPixels(typed);
        typed.forEach(initPixel);
      }
    };
    load();
  }, []);

  // Fire page view on route change
  useEffect(() => {
    if (pixels.length === 0) return;
    pixels.forEach((pixel) => {
      firePageView(pixel);
      logEvent(pixel, "PageView", window.location.href);
    });
  }, [location.pathname, pixels]);

  return null; // No UI – just side effects
};

export default TrackingProvider;

// Export helper for custom events (e.g. Purchase, AddToCart)
export const trackEvent = async (eventName: string, eventData?: Record<string, unknown>) => {
  const { data: pixels } = await supabase
    .from("tracking_pixels")
    .select("*")
    .eq("enabled", true);

  if (!pixels) return;

  for (const raw of pixels) {
    const pixel = raw as unknown as TrackingPixel;
    // Log to DB
    await supabase.from("tracking_event_logs").insert([{
      pixel_id: pixel.id,
      provider: pixel.provider,
      event_name: eventName,
      event_data: (eventData || {}) as any,
      page_url: window.location.href,
      test_mode: pixel.test_mode,
    }]);

    if (pixel.test_mode) continue;

    // Fire to provider
    switch (pixel.provider) {
      case "google_analytics":
        if ((window as any).gtag) (window as any).gtag("event", eventName, eventData);
        break;
      case "meta":
        if ((window as any).fbq) (window as any).fbq("track", eventName, eventData);
        break;
      case "tiktok":
        if ((window as any).ttq) (window as any).ttq.track(eventName, eventData);
        break;
      case "snapchat":
        if ((window as any).snaptr) (window as any).snaptr("track", eventName, eventData);
        break;
      case "pinterest":
        if ((window as any).pintrk) (window as any).pintrk("track", eventName, eventData);
        break;
      case "twitter":
        if ((window as any).twq) (window as any).twq("track", eventName, eventData);
        break;
      case "google_ads":
        if ((window as any).gtag) (window as any).gtag("event", "conversion", { send_to: `${pixel.pixel_id}/${(pixel.config as any)?.conversion_label || ""}`, ...eventData });
        break;
      case "microsoft_ads":
        if ((window as any).uetq) (window as any).uetq.push("event", eventName, eventData);
        break;
    }
  }
};
