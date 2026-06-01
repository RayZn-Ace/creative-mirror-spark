import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MemberGoodie {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  code: string | null;
  value: number | null;
  value_type: string | null;
  event_id: string | null;
  icon: string | null;
  color: string | null;
  expires_at: string | null;
  redeemed_at: string | null;
  status: string;
  metadata: any;
  created_at: string;
}

export function useGoodies() {
  const { user } = useAuth();
  const [goodies, setGoodies] = useState<MemberGoodie[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("member_goodies")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGoodies((data || []) as any);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const redeem = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("member_goodies")
      .update({ status: "redeemed", redeemed_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (!error) await load();
    return !error;
  }, [load]);

  const active = goodies.filter(g => g.status === "active" && (!g.expires_at || new Date(g.expires_at) > new Date()));
  const past = goodies.filter(g => g.status !== "active" || (g.expires_at && new Date(g.expires_at) <= new Date()));

  return { goodies, active, past, loading, reload: load, redeem };
}
