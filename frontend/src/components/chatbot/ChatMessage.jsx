/* =========================
   ChatMessage.jsx
========================= */

import React from "react";
import { Bot, User } from "lucide-react";

const ChatMessage = ({ message }) => {
  const isUser = message.sender === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`flex gap-3 max-w-[85%] ${
          isUser ? "flex-row-reverse" : ""
        }`}
      >
        {/* AVATAR */}
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            isUser
              ? "bg-green-600"
              : "bg-[#3E2723]"
          }`}
        >
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-green-400" />
          )}
        </div>

        {/* MESSAGE */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg ${
            isUser
              ? "bg-green-600 text-white rounded-br-sm"
              : "bg-[#2A1B16] border border-[#4E342E] text-gray-200 rounded-bl-sm"
          }`}
        >
          {message.text}

          <div
            className={`text-[10px] mt-2 ${
              isUser
                ? "text-green-100"
                : "text-gray-500"
            }`}
          >
            {new Date(message.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;