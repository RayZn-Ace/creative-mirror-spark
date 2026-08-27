import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns the event series a user is explicitly assigned to (series staff).
 * Admins are not restricted – they simply have no assignments.
 */
export function useSeriesAccess() {
  const { user, loading: authLoading } = useAuth();
  const [seriesIds, setSeriesIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (authLoading) return;
    if (!user) {
      setSeriesIds([]);
      setLoading(false);
      return;
    }
    supabase
      .from("series_managers")
      .select("series_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!mounted) return;
        setSeriesIds((data ?? []).map((r: any) => r.series_id));
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user, authLoading]);

  return { seriesIds, isSeriesManager: seriesIds.length > 0, loading: loading || authLoading };
}
