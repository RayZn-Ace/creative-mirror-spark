import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlags {
  wrapped_enabled: boolean;
  wrapped_welcome_enabled: boolean;
}

export const defaultFeatureFlags: FeatureFlags = {
  wrapped_enabled: true,
  wrapped_welcome_enabled: true,
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(defaultFeatureFlags);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("settings")
      .select("value")
      .eq("key", "features")
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted) return;
        if (data?.value) {
          setFlags({ ...defaultFeatureFlags, ...(data.value as Partial<FeatureFlags>) });
        }
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { flags, loading };
}
