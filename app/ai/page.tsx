"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const QUICK_PROMPTS = [
  "Explain what a hash map is",
  "What's the difference between BFS and DFS?",
  "Help me understand Big O notation",
  "Create a quiz on binary trees",
  "Explain recursion with an example",
  "What are dynamic programming patterns?",
];

export default function AIAssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm your DSA learning assistant. Ask me anything about data structures, algorithms, or coding problems. I can also create quizzes to test your knowledge!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please try again or check your connection.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat cleared! What would you like to learn about data structures and algorithms?",
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">🤖 AI Assistant</h1>
          <button
            onClick={clearChat}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col p-8 gap-4">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-6 p-4 bg-slate-900 rounded-xl min-h-[400px] max-h-[600px]">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 animate-fadeIn ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div className="text-3xl shrink">
                {msg.role === "user" ? "👤" : "🤖"}
              </div>
              <div className="max-w-[70%] flex flex-col gap-2">
                <div
                  className={`p-4 rounded-xl leading-relaxed whitespace-pre-wrap ${
                    msg.role === "assistant"
                      ? "bg-slate-700"
                      : "bg-blue-600"
                  }`}
                >
                  {msg.content}
                </div>
                <div
                  className="text-xs text-slate-400 px-4"
                  suppressHydrationWarning
                >
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4">
              <div className="text-3xl shrink">🤖</div>
              <div className="max-w-[70%] flex flex-col gap-2">
                <div className="p-4 bg-slate-700 rounded-xl flex gap-2">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length === 1 && (
          <div className="p-6 bg-slate-900 rounded-xl">
            <p className="mb-4 text-lg font-semibold">💡 Try asking:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(prompt)}
                  className="p-3 bg-slate-700 border border-slate-600 hover:bg-slate-600 hover:border-blue-500 hover:-translate-y-0.5 rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="flex gap-4 p-6 bg-slate-900 rounded-xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about DSA concepts, request quizzes, or get coding help..."
            className="flex-1 p-4 bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-lg text-slate-200 resize-none outline-none"
            rows={2}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
          >
            {isLoading ? "⏳" : "Send →"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-2">
          💡 AI responses may not always be accurate. Verify important
          information.
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}