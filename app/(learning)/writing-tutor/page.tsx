"use client";

import { useChat, type Message } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import { useRef, useEffect, useState } from "react";

export default function WritingTutorChat() {
  const [input, setInput] = useState("");

  const hasInitialized = useRef(false)
  
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput("");
    
    await sendMessage({
      text: userMessage,
    });
  };

const { messages,  } = useChat({
    api: "/api/writing-tutor-new",
    experimental_prepareRequestBody: (options) => ({
      messages: options.messages,
      chat_id: "daily-routine-writing"
    })
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  // Send initial invisible hello message to trigger dynamic greeting
  useEffect(() => {
    if (!hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true
      // Using direct fetch to send the initial message
      const sendInitialMessage = async () => {
        await fetch("/api/writing-tutor-new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "hello" }],
            chat_id: "daily-routine-writing"
          })
        });
      };
      sendInitialMessage();
    }
  }, [messages.length])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen bg-[#fdf2f8] text-gray-800 flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-pink-600 text-white px-4 py-4 shadow-xl">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Writing Tutor</h1>
          <p className="text-pink-100 text-sm">Practice German writing with Luna</p>
        </div>
      </div>

      {/* Scrollable Chat History */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
          {messages.filter((msg) => {
            // Filter out the initial hello message from user (more robust check)
            if (msg.role === "user" && msg.content === "hello" && hasInitialized.current && messages.length > 0 && msg === messages[0]) return false;
            return true;
          }).map((msg: Message) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 shadow-sm ${
                  msg.role === "user"
                    ? "bg-white text-gray-900 border-2 border-blue-500 shadow-md"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100"
                }`}
                style={
                  msg.role === "user"
                    ? { transform: "scale(0.98)", transformOrigin: "right center" }
                    : { transform: "scale(0.98)", transformOrigin: "left center" }
                }
              >
                <ReactMarkdown>{typeof msg.content === "string" ? msg.content : ""}</ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Fixed Input Footer */}
      <div className="flex-shrink-0 w-full bg-white border-t border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-4">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              className="flex-1 border rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Schreibe deine Nachricht..."
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Senden
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

