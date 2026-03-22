import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // 把前端发到 /api 的请求转发给后端服务器
    // 这样前端代码里写 fetch('/api/chat') 就能到达后端
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
