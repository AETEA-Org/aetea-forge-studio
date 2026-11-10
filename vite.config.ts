import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    // Indexing is decided by the deployment, not by a variable someone can
    // forget: only Vercel's production target (main -> aetea.studio) may be
    // indexed. dev.aetea.studio is a Preview deployment, so it never is.
    "import.meta.env.VITE_SEO_INDEXABLE": JSON.stringify(
      process.env.VERCEL_ENV === "production" ? "true" : "false",
    ),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
