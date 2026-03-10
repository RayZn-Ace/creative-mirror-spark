import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PageSection {
  title: string;
  body: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface FAQCategory {
  title: string;
  emoji: string;
  items: FAQItem[];
}

export interface PageContentData {
  sections?: PageSection[];
  categories?: FAQCategory[];
  subtitle?: string;
}

export function usePageContent(pageKey: string) {
  const [content, setContent] = useState<PageContentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("page_contents")
        .select("content")
        .eq("page_key", pageKey)
        .maybeSingle();
      if (data?.content) {
        setContent(data.content as unknown as PageContentData);
      }
      setLoading(false);
    };
    load();
  }, [pageKey]);

  return { content, loading };
}
