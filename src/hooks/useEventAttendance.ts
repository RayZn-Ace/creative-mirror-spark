import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type FriendAttendee = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function useEventAttendance(eventId?: string | null) {
  const { user } = useAuth();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [friendsGoing, setFriendsGoing] = useState<FriendAttendee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("status", "paid");
      if (!cancelled) setTotalCount(count ?? 0);

      if (user) {
        const { data } = await supabase.functions.invoke("social-lookup", {
          body: { action: "friends_at_event", event_id: eventId },
        });
        const ids = ((data as any)?.friend_user_ids ?? []) as string[];
        if (ids.length) {
          const { data: profs } = await supabase
            .from("customer_profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", ids);
          if (!cancelled) setFriendsGoing((profs ?? []) as any);
        } else {
          if (!cancelled) setFriendsGoing([]);
        }
      }

      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, user]);

  return { totalCount, friendsGoing, loading };
}
