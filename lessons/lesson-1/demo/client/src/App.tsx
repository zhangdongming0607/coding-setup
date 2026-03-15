/**
 * App — 根组件，管理整个页面的状态和布局
 */

import { useEffect, useState } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { ChatInput } from "./components/ChatInput";
import { fetchWelcome, sendMessage } from "./api";
import type { Message } from "./api";

export function App() {
  // 消息列表（状态）——每次更新，页面会自动重新渲染
  const [messages, setMessages] = useState<Message[]>([]);
  // 是否正在等待回复
  const [loading, setLoading] = useState(false);

  // 页面首次加载时，获取欢迎消息
  useEffect(() => {
    fetchWelcome().then((welcomeText) => {
      setMessages([
        {
          role: "assistant",
          content: welcomeText,
          timestamp: new Date().toISOString(),
        },
      ]);
    });
  }, []);

  // 用户发送消息
  const handleSend = async (text: string) => {
    // 1. 先把用户消息加到列表里
    const userMsg: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // 2. 发请求给后端，等回复
      const { reply, timestamp } = await sendMessage(text);

      // 3. 把回复加到列表里
      const assistantMsg: Message = {
        role: "assistant",
        content: reply,
        timestamp,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      // 请求失败时，把错误信息显示在聊天里
      const errorMsg: Message = {
        role: "assistant",
        content: `⚠️ ${err instanceof Error ? err.message : "请求失败"}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Demo 聊天助手</h1>
      </header>
      <ChatWindow messages={messages} loading={loading} />
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}
