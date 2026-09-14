import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * WKWebView (Capacitor iOS) serves the app from the custom `capacitor://localhost`
 * scheme. `crossorigin` on the entry <script>/<link> makes that request a CORS
 * request, which the custom scheme can reject -> bundle never loads -> black
 * screen. Same-origin web hosting does not need the attribute either.
 */
const stripCrossorigin = (): Plugin => ({
  name: "strip-crossorigin",
  enforce: "post",
  transformIndexHtml(html) {
    return html.replace(/\s+crossorigin(?==|\s|>)/g, "");
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), stripCrossorigin()].filter(
    Boolean
  ),
  build: {
    target: "es2018",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
