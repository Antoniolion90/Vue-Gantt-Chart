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
      resolvers: [
        ElementPlusResolver({
          importStyle: false
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('element-plus')) {
              return 'element-plus';
            }
            if (id.includes('@faker-js')) {
              return 'faker';
            }
            if (id.includes('lodash')) {
              return 'lodash';
            }
            return 'vendor';
          }
        }
      }
    }
  }
})
