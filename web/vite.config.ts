import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "./src/",
  base: "./",
  define: {VITE_SET_APP_RUNNING_IN_ELECTRON: "false"},
  build: {
    // for debugging
    minify: false,
    // Required for dependency on BigInt and number literals ending in n (1n)
    target: "es2020",
    // Write output into web subdirectory of repository's /dist directory
    outDir: "../../dist/web/",
    // Always generate sourcemaps for debugging
    sourcemap: true,
  }
})
