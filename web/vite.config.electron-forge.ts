import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: "./src/",
  // FOR ELECTRON ONLY, set the base to empty string so that assets are read from relative path
  // IMPORTANT: never do this for the web version of the app (vite.config.ts)
  //            as that app changes the window location (eg. /E3/secret) which
  //            will break all relative paths.
  //            (may the three days of debugging in March '22 rest in peace.)
  base: "./",
  define: {
    VITE_BUILD_VERSION: `"${process.env.npm_package_version}"`,
    VITE_BUILD_DATE: `"${new Date().toLocaleString('en-us', { year: 'numeric', month: 'short', day: 'numeric' })}"`,
    VITE_SET_APP_RUNNING_IN_ELECTRON: true
  },
  build: {
    // Do not minify for Electron
    minify: false,
    // Required for dependency on BigInt and number literals ending in n (1n)
    target: "es2020",
    // Write directly into the electron subdirectory
    outDir: "../../electron-forge/electron-html/",
    // We love source maps for debugging, and since we're open source, there's no reason to hide 'em.
    sourcemap: "inline",
    
    // Compile the electron.html file as the root
    rollupOptions: {
      input: {
        main: resolve(__dirname, './src/electron.html'),
      }
    },
  }
})
