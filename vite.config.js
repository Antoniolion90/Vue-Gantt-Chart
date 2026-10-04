import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: "./",
  plugins: [
    vue({
      template: {
        compilerOptions: {
          preserveWhitespace: false,
        },
      },
    }),
    Components({
      // Project components are registered explicitly; only Element Plus is auto-imported
      dirs: [],
      resolvers: [
        ElementPlusResolver({
          importStyle: "css"
        }),
      ]
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3001,
  },
})
