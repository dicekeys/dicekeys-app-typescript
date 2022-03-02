import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "./src/",
  base: "./",
  define: {
    VITE_BUILD_VERSION: `"${process.env.npm_package_version}"`,
    VITE_BUILD_DATE: `"${new Date().toLocaleString('en-us', { year: 'numeric', month: 'short', day: 'numeric' })}"`,
    VITE_SET_APP_RUNNING_IN_ELECTRON: false
  },
  build: {
    // for debugging
    minify: false,
    // Required for dependency on BigInt and number literals ending in n (1n)
    target: "es2020",
    // Write output into web subdirectory of repository's /dist directory
    outDir: "../../dist/web/",
    // We love source maps for debugging, and since we're open source, there's no reason to hide 'em.
    sourcemap: true,
    
    // Compile the index.html file as the root (not necessary since index.html is default, but useful if this file is branched)
    rollupOptions: {
      input: {
        main: resolve(__dirname, './src/index.html'),
      }
    },
  }
})
