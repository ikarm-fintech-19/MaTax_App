import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { loadEnv, mergeConfig, type UserConfig } from "vite";

const deployPreset = process.env.DEPLOY_TARGET ?? "netlify";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: { preset: deployPreset },
});

function defineConfig(options: {
  tanstackStart?: Record<string, unknown>;
  nitro?: Record<string, unknown>;
  vite?: UserConfig;
} = {}): (env: { command: string; mode: string }) => Promise<UserConfig> {
  return async (env) => {
    const { command, mode } = env;

    const internalPlugins = [
      tailwindcss(),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
        ...options.tanstackStart,
      }),
      react(),
    ];

    if (options.nitro && command === "build") {
      const { nitro } = await import("nitro/vite");
      internalPlugins.push(nitro({ preset: "cloudflare-module", ...options.nitro }));
    }

    let envDefine: Record<string, string> = {};
    const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
    for (const [key, value] of Object.entries(loadedEnv)) {
      envDefine[`import.meta.env.${key}`] = JSON.stringify(value);
    }

    let config: UserConfig = {
      define: envDefine,
      css: { transformer: "lightningcss" },
      resolve: {
        alias: { "@": `${process.cwd()}/src` },
        dedupe: [
          "react",
          "react-dom",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "@tanstack/react-query",
          "@tanstack/query-core",
        ],
      },
      plugins: [...internalPlugins, ...(options.vite?.plugins ?? [])],
      server: { host: "::", port: 8080 },
    };

    if (options.vite) {
      config = mergeConfig(config, options.vite);
    }

    return config;
  };
}
