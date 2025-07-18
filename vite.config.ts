import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import path from "path";

const target = process.env.TARGET || "chrome";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "crypto", "util"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    webExtension({
      browser: target,
      manifest: () => {
        const manifest = readJsonFile("src/manifest.json");
        const pkg = readJsonFile("package.json");
        return {
          name: pkg.name,
          description: pkg.description,
          version: pkg.version,
          ...manifest,
        };
      },
      watchFilePaths: ["package.json", "manifest.json"],
      additionalInputs: ["public/sooho/sooho.png", "public/sooho/icon.ico"],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
