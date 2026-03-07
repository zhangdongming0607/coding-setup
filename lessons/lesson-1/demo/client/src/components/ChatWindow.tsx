/**
 * ChatWindow — 聊天窗口，显示所有消息
 */

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "../api";

interface ChatWindowProps {
  messages: Message[];
  loading: boolean;
}

export function ChatWindow({ messages, loading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 新消息出现时，自动滚到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-window">
      {messages.map((msg, index) => (
        <MessageBubble key={index} message={msg} />
      ))}
      {loading && (
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
