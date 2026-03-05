import { useEffect } from "react";

interface SeoMetaProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  jsonLd?: Record<string, unknown>;
}

/**
 * Dynamically sets <title>, meta description, canonical, OG tags, and JSON-LD
 * for SPA pages. Cleans up on unmount.
 */
export function useSeoMeta({ title, description, canonical, ogImage, ogType = "website", jsonLd }: SeoMetaProps) {
  useEffect(() => {
    // Title
    const prevTitle = document.title;
    document.title = title;

    // Helper to set/create a meta tag
    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      return el;
    };

    const metas: HTMLMetaElement[] = [];
    metas.push(setMeta("name", "description", description));
    metas.push(setMeta("property", "og:title", title));
    metas.push(setMeta("property", "og:description", description));
    metas.push(setMeta("property", "og:type", ogType));
    metas.push(setMeta("name", "twitter:title", title));
    metas.push(setMeta("name", "twitter:description", description));

    if (ogImage) {
      metas.push(setMeta("property", "og:image", ogImage));
      metas.push(setMeta("name", "twitter:image", ogImage));
      metas.push(setMeta("name", "twitter:card", "summary_large_image"));
    }

    if (canonical) {
      metas.push(setMeta("property", "og:url", canonical));
    }

    // Canonical link
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const createdCanonical = !canonicalEl;
    if (canonical) {
      if (!canonicalEl) {
        canonicalEl = document.createElement("link");
        canonicalEl.setAttribute("rel", "canonical");
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute("href", canonical);
    }

    // JSON-LD
    let scriptEl: HTMLScriptElement | null = null;
    if (jsonLd) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(scriptEl);
    }

    return () => {
      document.title = prevTitle;
      if (scriptEl) scriptEl.remove();
      if (createdCanonical && canonicalEl) canonicalEl.remove();
    };
  }, [title, description, canonical, ogImage, ogType, jsonLd]);
}
