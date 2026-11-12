import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const { version } = JSON.parse(readFileSync(new URL("package.json", import.meta.url), "utf8"));
const [, versionCode] = readFileSync(new URL("android/app/build.gradle", import.meta.url), "utf8").match(/^\s*versionCode (\d+)/m);
const appVersions = JSON.parse(readFileSync(new URL("android/app-versions.json", import.meta.url), "utf8"));

const EMOJI_DATA = ["data.json", "messages.json"];
const emojiFile = (name) => readFileSync(new URL(`node_modules/emojibase-data/en/${name}`, import.meta.url));

// the emoji picker's data is served by the app itself, so it works offline in the Android app and nothing goes to a CDN
const emojiData = () => ({
  name: "emoji-data",
  configureServer(server) {
    server.middlewares.use("/emojibase/en", (request, response, next) => {
      const name = request.url.slice(1);
      if (!EMOJI_DATA.includes(name)) return next();
      response.setHeader("Content-Type", "application/json");
      response.end(emojiFile(name));
    });
  },
  generateBundle() {
    EMOJI_DATA.forEach((name) => this.emitFile({ type: "asset", fileName: `emojibase/en/${name}`, source: emojiFile(name) }));
  },
});

const GOOGLE_SIGN_IN = "https://accounts.google.com/gsi/";
const RECAPTCHA = ["https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"];
const ANALYTICS = ["https://www.googletagmanager.com", "https://*.google-analytics.com", "https://*.analytics.google.com"];
// pictures people sign up with stay on the provider that hosts them
const AVATAR_HOSTS = ["https://*.googleusercontent.com", "https://avatars.githubusercontent.com", "https://media.licdn.com"];

const originOf = (url) => (url ? new URL(url).origin : null);

// what the app may load, built from the same settings the app is built with, so a script injected into it has nowhere to come from
const policyFor = (env) => {
  const api = originOf(env.REACT_APP_API_ORIGIN || "http://localhost:8000/api");
  const socket = api.replace(/^http/, "ws");
  const errorReports = originOf(env.REACT_APP_SENTRY_DSN);
  const analytics = env.REACT_APP_GA_ID ? ANALYTICS : [];
  const directives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", GOOGLE_SIGN_IN, ...RECAPTCHA, ...analytics],
    // MUI writes its styles into the page as it renders, so style tags it adds have to be allowed
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", GOOGLE_SIGN_IN],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com", ...AVATAR_HOSTS, ...analytics],
    "media-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
    // blob: because saving a decrypted photo or file fetches it back from the address it was decrypted to
    "connect-src": ["'self'", "blob:", api, socket, "https://res.cloudinary.com", GOOGLE_SIGN_IN, errorReports, ...analytics].filter(Boolean),
    "frame-src": [GOOGLE_SIGN_IN, ...RECAPTCHA, "https://recaptcha.google.com/recaptcha/"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };
  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(" ")}`)
    .join("; ");
};

// in the page for the website and the app alike, and as a Netlify header too, since only a header can stop other sites framing Whisprl
const contentSecurity = (env) => ({
  name: "content-security",
  apply: "build",
  // right after the charset, which browsers look for in the first kilobyte, and before anything the policy governs
  transformIndexHtml: (html) =>
    html.replace(/(<meta charset="utf-8" \/>)/, `$1\n    <meta http-equiv="Content-Security-Policy" content="${policyFor(env)}" />`),
  generateBundle() {
    const headers = ["/*", `  Content-Security-Policy: ${policyFor(env)}; frame-ancestors 'none'`, "  X-Content-Type-Options: nosniff", ""].join("\n");
    this.emitFile({ type: "asset", fileName: "_headers", source: headers });
  },
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), emojiData(), contentSecurity(loadEnv(mode, process.cwd(), "REACT_APP_"))],
  resolve: {
    alias: { "@": fileURLToPath(new URL("src", import.meta.url)) },
  },
  // the prefix the variables set on Netlify and in CI carry
  envPrefix: "REACT_APP_",
  define: {
    // the version the build reports, so an installed app can tell whether a live update is newer
    "import.meta.env.REACT_APP_VERSION": JSON.stringify(version),
    // the Android app built alongside, so the admin page can say which version code is newest
    "import.meta.env.REACT_APP_VERSION_CODE": JSON.stringify(Number(versionCode)),
    // the versions an installed app is reminded of, kept by hand beside versionCode and carried by every live update
    "import.meta.env.REACT_APP_RECOMMENDED_VERSION_CODE": JSON.stringify(appVersions.recommended),
    "import.meta.env.REACT_APP_REQUIRED_VERSION_CODE": JSON.stringify(appVersions.required),
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
}));
