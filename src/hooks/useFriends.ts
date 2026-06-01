import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "declined" | "blocked";
  created_at: string;
};

export type FriendProfile = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
};

export type FriendWithProfile = Friendship & {
  friend: FriendProfile | null;
  direction: "incoming" | "outgoing";
};

export function useFriends() {
  const { user } = useAuth();
  const [items, setItems] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: rows } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const friendIds = (rows ?? []).map((r: any) =>
      r.requester_id === user.id ? r.addressee_id : r.requester_id
    );
    let profiles: Record<string, FriendProfile> = {};
    if (friendIds.length) {
      const { data: profs } = await supabase
        .from("customer_profiles")
        .select("user_id, display_name, avatar_url, city")
        .in("user_id", friendIds);
      (profs ?? []).forEach((p: any) => (profiles[p.user_id] = p));
    }
    const mapped: FriendWithProfile[] = (rows ?? []).map((r: any) => {
      const otherId = r.requester_id === user.id ? r.addressee_id : r.requester_id;
      return {
        ...r,
        friend: profiles[otherId] ?? { user_id: otherId, display_name: null, avatar_url: null, city: null },
        direction: r.requester_id === user.id ? "outgoing" : "incoming",
      };
    });
    setItems(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const sendRequest = useCallback(
    async (email: string): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: "Nicht eingeloggt" };
      const normalized = email.trim().toLowerCase();
      if (!normalized) return { ok: false, error: "E-Mail fehlt" };

      // Find user by email via customer_profiles join — we can't query auth.users, so use RPC pattern via profiles.
      // Workaround: profiles table has display_name but no email; we use a simple lookup via Supabase edge function would be cleanest.
      // For now: try to find a customer_profile whose display_name matches or via an Edge Function later.
      // Simpler: search profile by email-like display_name match — fallback: ask user to share their friend code.

      // Use friend_code approach: addressee_id is the user_id, requester pastes friend id.
      return { ok: false, error: "Bitte verwende den Freundes-Code (User ID) – Email-Lookup folgt." };
    },
    [user]
  );

  const sendRequestById = useCallback(
    async (addresseeUserId: string): Promise<{ ok: boolean; error?: string }> => {
      if (!user) return { ok: false, error: "Nicht eingeloggt" };
      if (addresseeUserId === user.id) return { ok: false, error: "Du kannst dich nicht selbst adden 😅" };
      const { error } = await supabase.from("friendships").insert({
        requester_id: user.id,
        addressee_id: addresseeUserId,
        status: "pending",
      });
      if (error) return { ok: false, error: error.message };
      await load();
      return { ok: true };
    },
    [user, load]
  );

  const respond = useCallback(
    async (id: string, status: "accepted" | "declined") => {
      const { error } = await supabase.from("friendships").update({ status }).eq("id", id);
      if (!error) await load();
      return !error;
    },
    [load]
  );

  const remove = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("friendships").delete().eq("id", id);
      if (!error) await load();
      return !error;
    },
    [load]
  );

  const accepted = items.filter((i) => i.status === "accepted");
  const incoming = items.filter((i) => i.status === "pending" && i.direction === "incoming");
  const outgoing = items.filter((i) => i.status === "pending" && i.direction === "outgoing");

  return { items, accepted, incoming, outgoing, loading, sendRequest, sendRequestById, respond, remove, reload: load };
}
