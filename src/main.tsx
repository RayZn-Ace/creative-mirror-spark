import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import AppErrorBoundary from "./components/AppErrorBoundary.tsx";
import "./index.css";

// Never let an async/native error kill the app shell in the native webview.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    console.warn("Unhandled promise rejection", e.reason);
  });
}

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
