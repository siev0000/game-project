import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { areaMasterDevApi } from './tools/areaMasterDevApi.mjs'
import { boneMotionDevApi } from './tools/boneMotionDevApi.mjs'

export default defineConfig({
  plugins: [vue(), areaMasterDevApi(), boneMotionDevApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // ← ここをローカルIPに
        changeOrigin: true,
        secure: false
      }
    }
  }
})
