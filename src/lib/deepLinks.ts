// Handles Capacitor deep links (e.g. app.nightlife.app://music-callback?code=...)
import { App } from "@capacitor/app";

export function initDeepLinks(navigate: (path: string) => void) {
  try {
    App.addListener("appUrlOpen", ({ url }) => {
      if (!url) return;
      // Spotify OAuth callback
      if (url.startsWith("app.nightlife.app://music-callback")) {
        const q = url.split("?")[1] ?? "";
        navigate(`/account/music/callback?${q}`);
      }
    });
  } catch {
    // Not running in Capacitor — ignore
  }
}
