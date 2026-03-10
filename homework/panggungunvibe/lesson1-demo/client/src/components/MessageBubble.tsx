/**
 * MessageBubble — 单条消息气泡
 *
 * 根据 role 决定显示在左边（assistant）还是右边（user）
 */

import type { Message } from "../api";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "message-row-user" : "message-row-assistant"}`}>
      {!isUser && <div className="avatar avatar-assistant">AI</div>}
      <div className={`bubble ${isUser ? "bubble-user" : "bubble-assistant"}`}>
        {message.content}
      </div>
      {isUser && <div className="avatar avatar-user">我</div>}
    </div>
  );
}
