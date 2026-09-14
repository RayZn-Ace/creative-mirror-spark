import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary.tsx";
import "./index.css";

declare global {
  interface Window {
    __APP_BOOT_DONE__?: () => void;
    __APP_BOOT_FAIL__?: (msg?: string) => void;
    __APP_BOOT_STARTED__?: boolean;
    __APP_MOUNTED__?: boolean;
  }
}

// Tells the boot shell in index.html that the bundle really executed.
if (typeof window !== "undefined") {
  window.__APP_BOOT_STARTED__ = true;

  // Never let an async/native error kill the app shell in the native webview.
  window.addEventListener("unhandledrejection", (e) => {
    console.warn("Unhandled promise rejection", e.reason);
  });
}

const hideBootShell = () => window.__APP_BOOT_DONE__?.();

try {
  const container = document.getElementById("root");
  if (!container) throw new Error("Root-Element fehlt");

  createRoot(container).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );

  // Prefer the painted frame, but always hide the shell even if rAF is throttled
  // (happens in a backgrounded native webview).
  requestAnimationFrame(() => requestAnimationFrame(hideBootShell));
  setTimeout(hideBootShell, 1200);
} catch (e) {
  console.error("App bootstrap failed", e);
  window.__APP_BOOT_FAIL__?.(e instanceof Error ? e.message : String(e));
}
