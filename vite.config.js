import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import vue from "@vitejs/plugin-vue";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf-8"));

export default defineConfig({
  base: "./",
  define: {
    __VERSION__: JSON.stringify(version)
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          preserveWhitespace: false
        }
      }
    }),
    Components({
      // Project components are registered explicitly; only Element Plus is auto-imported
      dirs: [],
      dts: false,
      resolvers: [
        ElementPlusResolver({
          importStyle: "css"
        })
      ]
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  server: {
    port: 3001
  }
});
