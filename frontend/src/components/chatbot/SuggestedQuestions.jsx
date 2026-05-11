/* =========================
   SuggestedQuestions.jsx
========================= */

import React from "react";

const SuggestedQuestions = ({ onSelect }) => {
  const questions = [
    "What is AgriLink CoffeeHub?",
    "How do I register?",
    "Who are coffee dealers?",
    "What analytics are available?",
  ];

  return (
    <div className="px-3 py-3 border-t border-[#4E342E] flex flex-wrap gap-2 bg-[#140D09]">
      {questions.map((question, index) => (
        <button
          key={index}
          onClick={() => onSelect(question)}
          className="text-xs px-3 py-2 rounded-full bg-[#2A1B16] border border-[#4E342E] text-gray-300 hover:bg-green-600 hover:text-white transition-all"
        >
          {question}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;