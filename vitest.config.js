import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import vue from "@vitejs/plugin-vue";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

export default defineConfig({
  plugins: [vue()],
  define: {
    __VERSION__: JSON.stringify(version)
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  test: {
    include: ["tests/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{js,vue}"],
      reporter: ["text-summary", "html"]
    }
  }
});
