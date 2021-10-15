import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "./src/",
  build: {
    // Do not minify for Electron
    minify: false,
    // Required for dependency on BigInt and number literals ending in n (1n)
    target: "es2020",
    // Write output into electron subdirectory of repository's /dist directory
    outDir: "../../dist/electron/",
    sourcemap: true,
    
    // Compile the electron.html file as the root
    rollupOptions: {
      input: {
        main: resolve(__dirname, './src/electron.html'),
      }
    },
  }
})
