import React, { useState } from "react";
import { SendHorizontal } from "lucide-react";

const ChatInput = ({ onSend }) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;

    onSend(text);
    setText("");
  };

  return (
    <div className="p-4 border-t border-[#4E342E] bg-[#140D09]">

      {/* Hidden Accessibility Label */}
      <label
        htmlFor="chat-message"
        className="hidden"
      >
        Chat Message
      </label>

      <div className="flex items-center gap-3 bg-[#2A1B16] border border-[#4E342E] rounded-2xl px-3 py-2">

        <input
          id="chat-message"
          name="chat-message"
          type="text"
          placeholder="Ask something..."
          autoComplete="off"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          className="flex-1 bg-transparent text-white placeholder:text-gray-500 outline-none text-sm"
        />

        <button
          type="button"
          onClick={handleSend}
          className="w-10 h-10 rounded-xl bg-green-600 hover:bg-green-700 transition flex items-center justify-center"
        >
          <SendHorizontal className="text-white w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;