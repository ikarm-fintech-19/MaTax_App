// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Deploy target selection:
//   - In the Lovable sandbox the wrapper forces the `cloudflare-module` Nitro preset.
//   - Outside the sandbox we run Nitro explicitly with the `netlify` preset so the
//     production build emits Netlify Functions + a static publish dir (default `dist`).
//     Without this, `vite build` only produces `dist/client` / `dist/server/server.js`
//     and Netlify serves "Page not found" because there is no `index.html` to publish.
//   - Set `DEPLOY_TARGET=netlify_edge` (or `cloudflare-module`, etc.) to override.
const deployPreset = process.env.DEPLOY_TARGET ?? "netlify";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: { preset: deployPreset },
});
