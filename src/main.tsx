import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary.tsx";
import "./index.css";

declare global {
  interface Window {
    __APP_BOOT_DONE__?: () => void;
    __APP_BOOT_FAIL__?: (msg?: string) => void;
    __APP_MOUNTED__?: boolean;
  }
}

// Never let an async/native error kill the app shell in the native webview.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    console.warn("Unhandled promise rejection", e.reason);
  });
}

try {
  const container = document.getElementById("root");
  if (!container) throw new Error("Root-Element fehlt");

  createRoot(container).render(
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );

  // Remove the boot screen only once the first frame is actually painted.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => window.__APP_BOOT_DONE__?.());
  });
} catch (e) {
  console.error("App bootstrap failed", e);
  window.__APP_BOOT_FAIL__?.(e instanceof Error ? e.message : String(e));
}
