import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 代理配置：前端请求 /api/xxx 会自动转发到后端 localhost:3001
    // 这样前端代码里写 fetch("/api/issues") 就能访问到后端
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
