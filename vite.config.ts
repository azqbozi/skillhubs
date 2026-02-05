import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 代理 skills.sh API 解决 CORS 问题
    proxy: {
      '/api/skills-sh': {
        target: 'https://skills.sh',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/skills-sh/, ''),
        secure: true,
      },
    },
  },
})
