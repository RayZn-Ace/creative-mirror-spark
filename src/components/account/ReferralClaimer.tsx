import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Claims a pending referral code stored in localStorage after signup/login.
 * Also handles the case where the code came from OAuth user_metadata.
 */
export default function ReferralClaimer() {
  const { user } = useAuth();
  const triedRef = useRef(false);

  useEffect(() => {
    if (!user || triedRef.current) return;
    const stored = localStorage.getItem("pending_ref_code") || (user.user_metadata as any)?.ref_code;
    if (!stored) return;
    triedRef.current = true;

    (async () => {
      const { data, error } = await supabase.rpc("claim_referral", { _code: String(stored).toUpperCase() });
      localStorage.removeItem("pending_ref_code");
      if (error) return;
      const res = data as any;
      if (res?.ok) {
        toast.success("🎁 Empfehlung eingelöst! +25 Punkte für dich.");
      }
    })();
  }, [user]);

  return null;
}
