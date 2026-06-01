import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("customer_favorites")
      .select("event_id")
      .eq("user_id", user.id);
    setFavorites(new Set((data || []).map((d) => d.event_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (eventId: string) => {
      if (!user) {
        toast.error("Logge dich ein, um Events zu speichern", {
          action: { label: "Login", onClick: () => (window.location.href = "/login") },
        });
        return false;
      }
      const isFav = favorites.has(eventId);
      // Optimistic
      const next = new Set(favorites);
      if (isFav) next.delete(eventId);
      else next.add(eventId);
      setFavorites(next);

      if (isFav) {
        const { error } = await supabase
          .from("customer_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", eventId);
        if (error) {
          setFavorites(favorites);
          toast.error("Fehler beim Entfernen");
          return isFav;
        }
      } else {
        const { error } = await supabase
          .from("customer_favorites")
          .insert({ user_id: user.id, event_id: eventId });
        if (error) {
          setFavorites(favorites);
          toast.error("Fehler beim Speichern");
          return isFav;
        }
        toast.success("Zu Favoriten hinzugefügt 💜");
      }
      return !isFav;
    },
    [user, favorites]
  );

  return { favorites, toggle, isFavorite: (id: string) => favorites.has(id), loading, reload: load };
}
