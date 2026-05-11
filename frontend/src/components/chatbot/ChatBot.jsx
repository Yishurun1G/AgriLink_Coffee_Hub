/* =========================
   ChatBot.jsx
========================= */

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  MessageCircle,
  X,
  Bot,
  Sparkles,
  Loader2,
} from "lucide-react";

import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import SuggestedQuestions from "./SuggestedQuestions";

const ChatBot = () => {
  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hello 👋 Welcome to AgriLink CoffeeHub. How can I help you today?",
      time: new Date(),
    },
  ]);

  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  /* Auto Scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* Send Message */
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/api/chatbot/",
        {
          message: text,
        }
      );

      const botMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text:
          res.data.reply ||
          "I could not understand that request.",
        time: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: "bot",
          text: "⚠️ Server connection failed.",
          time: new Date(),
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full bg-gradient-to-r from-green-600 to-green-700 shadow-[0_10px_40px_rgba(34,197,94,0.5)] flex items-center justify-center hover:scale-110 transition-all duration-300"
      >
        {open ? (
          <X className="text-white w-7 h-7" />
        ) : (
          <MessageCircle className="text-white w-7 h-7" />
        )}
      </button>

      {/* CHAT WINDOW */}
      {open && (
        <div className="fixed bottom-24 right-6 z-[9999] w-[380px] h-[650px] rounded-3xl overflow-hidden border border-[#4E342E] bg-[#1B120D]/95 backdrop-blur-2xl shadow-[0_20px_80px_rgba(0,0,0,0.8)] flex flex-col">

          {/* HEADER */}
          <div className="relative bg-gradient-to-r from-green-700 to-green-600 p-5">

            {/* Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xl">
                <Bot className="text-white w-7 h-7" />
              </div>

              <div>
                <h2 className="font-bold text-lg text-white">
                  AgriLink Assistant
                </h2>

                <div className="flex items-center gap-2 text-green-100 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-300"></span>
                  Online
                </div>
              </div>
            </div>
          </div>

          {/* CHAT BODY */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-transparent">

            {/* WELCOME CARD */}
            <div className="bg-[#2A1B16] border border-[#4E342E] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-green-400 w-5 h-5" />

                <h3 className="font-semibold text-white">
                  Smart Coffee Assistant
                </h3>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed">
                Ask anything about AgriLink CoffeeHub, registration,
                coffee management, dashboards, dealers, analytics,
                and platform support.
              </p>
            </div>

            {/* MESSAGES */}
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
              />
            ))}

            {/* LOADING */}
            {loading && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="animate-spin w-4 h-4" />
                Assistant is typing...
              </div>
            )}

            <div ref={messagesEndRef}></div>
          </div>

          {/* QUESTIONS */}
          <SuggestedQuestions onSelect={sendMessage} />

          {/* INPUT */}
          <ChatInput onSend={sendMessage} />
        </div>
      )}
    </>
  );
};

export default ChatBot;