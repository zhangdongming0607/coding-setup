/**
 * api.ts — 前端跟后端通信的函数
 *
 * 这个文件里的每个函数都会发一个 HTTP 请求到后端。
 * 你可以在 Chrome DevTools 的 Network 面板里看到这些请求。
 */

/** 消息的数据结构 */
export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * 获取欢迎消息
 * 页面打开时调用，发一个 GET 请求到 /api/welcome
 */
export async function fetchWelcome(): Promise<string> {
  console.log("[前端] 正在获取欢迎消息...");

  const response = await fetch("/api/welcome");
  const data = (await response.json()) as { message: string };

  console.log("[前端] 收到欢迎消息:", data.message);
  return data.message;
}

/**
 * 发送消息并获取回复
 * 用户点"发送"时调用，发一个 POST 请求到 /api/chat
 */
export async function sendMessage(message: string): Promise<{ reply: string; timestamp: string }> {
  console.log("[前端] 发送消息:", message);

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { error?: string };
    const errorText = errorData.error ?? `请求失败 (${response.status})`;
    throw new Error(errorText);
  }

  const data = (await response.json()) as { reply: string; timestamp: string };

  console.log("[前端] 收到回复:", data.reply);
  return data;
}

/**
 * 获取聊天历史
 * 发一个 GET 请求到 /api/history
 */
export async function fetchHistory(): Promise<Message[]> {
  console.log("[前端] 正在获取聊天历史...");

  const response = await fetch("/api/history");
  const data = (await response.json()) as { messages: Message[] };

  console.log(`[前端] 收到 ${data.messages.length} 条历史消息`);
  return data.messages;
}
