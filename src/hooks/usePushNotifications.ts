import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const isNative = () => {
  try {
    const cap = typeof window !== "undefined" ? (window as any).Capacitor : undefined;
    return !!cap?.isNativePlatform?.();
  } catch {
    return false;
  }
};

// Only touch the native plugin if it is actually registered in the binary.
const isPushPluginAvailable = () => {
  try {
    const cap = typeof window !== "undefined" ? (window as any).Capacitor : undefined;
    if (!cap?.isNativePlatform?.()) return false;
    if (typeof cap.isPluginAvailable === "function") {
      return !!cap.isPluginAvailable("PushNotifications");
    }
    return !!cap.Plugins?.PushNotifications;
  } catch {
    return false;
  }
};

const getPlatform = (): "ios" | "android" => {
  try {
    const p = (window as any).Capacitor?.getPlatform?.();
    return p === "ios" || p === "android" ? p : "android";
  } catch {
    return "android";
  }
};

export function usePushNotifications() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt" | "unsupported">(
    "prompt"
  );

  useEffect(() => {
    if (!isPushPluginAvailable()) {
      setPermission("unsupported");
      return;
    }

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    // Defer past the first paint so a failing native bridge can never block mount.
    const timer = window.setTimeout(() => {
      (async () => {
        try {
          const { PushNotifications } = await import("@capacitor/push-notifications");
          if (cancelled) return;

          try {
            const perm = await PushNotifications.checkPermissions();
            if (cancelled) return;
            if (perm.receive === "granted") {
              setPermission("granted");
              await PushNotifications.register();
            } else if (perm.receive === "denied") {
              setPermission("denied");
            }
          } catch (e) {
            console.warn("Push permission check failed", e);
          }

          const reg = await PushNotifications.addListener("registration", async (tok) => {
            try {
              setToken(tok.value);
              await supabase.from("push_tokens").upsert(
                {
                  token: tok.value,
                  user_id: user?.id || null,
                  platform: getPlatform(),
                  active: true,
                  last_seen_at: new Date().toISOString(),
                },
                { onConflict: "token" }
              );
            } catch (e) {
              console.warn("Storing push token failed", e);
            }
          });

          const err = await PushNotifications.addListener("registrationError", (e) =>
            console.warn("Push registration error", e)
          );

          const recv = await PushNotifications.addListener("pushNotificationReceived", (notif) =>
            console.log("Push received", notif)
          );

          const action = await PushNotifications.addListener(
            "pushNotificationActionPerformed",
            (notif) => {
              try {
                const link = notif.notification.data?.deep_link;
                if (link) window.location.href = link;
              } catch (e) {
                console.warn("Push deep link failed", e);
              }
            }
          );

          cleanup = () => {
            try {
              reg.remove();
              err.remove();
              recv.remove();
              action.remove();
            } catch {
              /* ignore */
            }
          };

          if (cancelled) cleanup();
        } catch (e) {
          console.warn("Push init skipped", e);
          setPermission("unsupported");
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cleanup?.();
    };
  }, [user?.id]);

  const requestPermission = async () => {
    if (!isPushPluginAvailable()) return false;
    try {
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const r = await PushNotifications.requestPermissions();
      if (r.receive === "granted") {
        setPermission("granted");
        await PushNotifications.register();
        return true;
      }
      setPermission("denied");
      return false;
    } catch (e) {
      console.warn("Push permission request failed", e);
      setPermission("unsupported");
      return false;
    }
  };

  return { token, permission, requestPermission, isNative: isNative() };
}
