import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const isNative = () => {
  try {
    // @ts-ignore
    return typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
};

export function usePushNotifications() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt" | "unsupported">(
    "prompt"
  );

  useEffect(() => {
    if (!isNative()) {
      setPermission("unsupported");
      return;
    }

    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { PushNotifications } = await import("@capacitor/push-notifications");

        const perm = await PushNotifications.checkPermissions();
        if (perm.receive === "granted") {
          setPermission("granted");
          await PushNotifications.register();
        } else if (perm.receive === "denied") {
          setPermission("denied");
        }

        const reg = await PushNotifications.addListener("registration", async (tok) => {
          setToken(tok.value);
          // Save to DB
          await supabase.from("push_tokens").upsert(
            {
              token: tok.value,
              user_id: user?.id || null,
              platform: (await import("@capacitor/core")).Capacitor.getPlatform() as "ios" | "android",
              active: true,
              last_seen_at: new Date().toISOString(),
            },
            { onConflict: "token" }
          );
        });

        const err = await PushNotifications.addListener("registrationError", (e) =>
          console.error("Push registration error", e)
        );

        const recv = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notif) => console.log("Push received", notif)
        );

        const action = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (notif) => {
            const link = notif.notification.data?.deep_link;
            if (link) window.location.href = link;
          }
        );

        cleanup = () => {
          reg.remove();
          err.remove();
          recv.remove();
          action.remove();
        };
      } catch (e) {
        console.error("Push init failed", e);
      }
    })();

    return () => cleanup?.();
  }, [user?.id]);

  const requestPermission = async () => {
    if (!isNative()) return false;
    const { PushNotifications } = await import("@capacitor/push-notifications");
    const r = await PushNotifications.requestPermissions();
    if (r.receive === "granted") {
      setPermission("granted");
      await PushNotifications.register();
      return true;
    }
    setPermission("denied");
    return false;
  };

  return { token, permission, requestPermission, isNative: isNative() };
}
