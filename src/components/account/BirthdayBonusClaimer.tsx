import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Auto-claims a birthday bonus (100 loyalty points) once per year, within +/- 7 days
 * of the user's birthday. Safe to mount anywhere in the authed area.
 */
export default function BirthdayBonusClaimer() {
  const { user } = useAuth();
  const triedRef = useRef(false);

  useEffect(() => {
    if (!user || triedRef.current) return;
    triedRef.current = true;
    (async () => {
      const { data, error } = await supabase.rpc("claim_birthday_bonus", { _user_id: user.id });
      if (error) return;
      const res = data as any;
      if (res?.ok) {
        toast.success(`🎂 Happy Birthday! +${res.points} Punkte für dich!`, { duration: 8000 });
      }
    })();
  }, [user]);

  return null;
}
