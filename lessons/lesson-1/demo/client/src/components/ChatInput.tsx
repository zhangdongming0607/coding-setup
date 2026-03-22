/**
 * ChatInput — 输入框 + 发送按钮
 */

import { useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="chat-input-bar">
      <input
        className="chat-input"
        type="text"
        placeholder="输入消息..."
        value={text}
        onChange={(e) => {
          console.log("用户输入:", e.target.value);
          setText(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        className="send-button"
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
      >
        发送
      </button>
    </div>
  );
}
