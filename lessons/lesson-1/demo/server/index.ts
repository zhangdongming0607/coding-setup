/**
 * 后端服务器 — 跑在你的电脑上（不是浏览器里）
 *
 * 职责：
 * 1. 接收前端发来的 HTTP 请求
 * 2. 处理业务逻辑（这里是生成模拟回复）
 * 3. 返回 JSON 数据给前端
 */

import express from "express";
import cors from "cors";
import { getReply } from "./replies.js";

const app = express();
const PORT = 3001;

// 中间件：允许跨域请求（前端和后端端口不同）
app.use(cors());
// 中间件：解析请求体中的 JSON 数据
app.use(express.json());

// ---------- 数据存储（内存数组，重启就清空） ----------

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const chatHistory: Message[] = [];

// ---------- API 路由 ----------

/**
 * GET /api/welcome
 * 页面打开时调用，返回欢迎消息
 */
app.get("/api/welcome", (_req, res) => {
  console.log("[服务器] 收到 welcome 请求");

  res.json({
    message: "你好！我是 Demo 助手，有什么可以帮你的？",
  });
});

/**
 * POST /api/chat
 * 发送消息时调用，返回模拟回复
 */
app.post("/api/chat", (req, res) => {
  const { message } = req.body as { message: string };
  console.log(`[服务器] 收到用户消息: "${message}"`);

  // 生成回复
  const reply = getReply(message);
  const now = new Date().toISOString();

  // 存到聊天历史
  chatHistory.push({ role: "user", content: message, timestamp: now });
  chatHistory.push({ role: "assistant", content: reply, timestamp: now });

  // 故意延迟 500ms，让学员在 Network 面板能看到"等待"状态
  setTimeout(() => {
    console.log(`[服务器] 返回回复: "${reply}"`);
    res.json({ reply, timestamp: now });
  }, 500);
});

/**
 * GET /api/history
 * 返回聊天历史记录
 */
app.get("/api/history", (_req, res) => {
  console.log(`[服务器] 返回聊天历史，共 ${chatHistory.length} 条消息`);
  res.json({ messages: chatHistory });
});

// ---------- 启动服务器 ----------

app.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log(`  后端服务器已启动`);
  console.log(`  地址: http://localhost:${PORT}`);
  console.log("=================================");
  console.log("");
  console.log("等待前端发来请求...");
});
