import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // In dev: proxy /api to local backend.
  // In production (Vercel/Netlify): VITE_API_BASE_URL must point to the
  // deployed backend (e.g. https://aus-banking-backend.onrender.com).
  // The frontend then calls that URL directly (CORS must allow the frontend origin).
  const apiBase = process.env.VITE_API_BASE_URL ?? "http://localhost:8000";

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        "/api": {
          target: apiBase,
          changeOrigin: true,
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Expose to runtime via import.meta.env
      __DEMO_MODE__: JSON.stringify(process.env.VITE_DEMO_MODE === "true"),
    },
  };
});
