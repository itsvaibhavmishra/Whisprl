import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const { version } = JSON.parse(readFileSync(new URL("package.json", import.meta.url), "utf8"));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("src", import.meta.url)) },
  },
  // the prefix the variables set on Netlify and in CI carry
  envPrefix: "REACT_APP_",
  define: {
    // the version the build reports, so an installed app can tell whether a live update is newer
    "import.meta.env.REACT_APP_VERSION": JSON.stringify(version),
  },
  server: { port: 3200 },
  build: {
    // Capacitor, the live update and the release workflow all read the build from here
    outDir: "build",
    // old enough for the WebViews the app supports; Safari 14 because the media editor ships BigInt literals
    target: ["chrome87", "edge87", "firefox78", "safari14"],
    sourcemap: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
