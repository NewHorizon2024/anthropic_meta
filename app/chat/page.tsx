"use client";

import { useEffect, useRef, useState } from "react";

// Message shape
type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new tokens arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];

    // Add user message and a blank assistant message to start filling
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/laptops-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the full conversation history — this is how the model
        // maintains context across turns
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.body) throw new Error("No response body");

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // In your page.tsx — update the streaming loop
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });

        // Check if this chunk contains the messages sync signal
        if (text.includes("__MESSAGES__")) {
          const match = text.match(/__MESSAGES__(.+)__MESSAGES__/s);
          if (match) {
            try {
              const updatedMessages = JSON.parse(match[1]);
              // Sync local state with server's summarized history
              setMessages(updatedMessages);
            } catch (e) {
              console.error("Failed to parse messages sync", e);
            }
          }
          // Don't render the sync signal as text
          const visibleText = text
            .replace(/__MESSAGES__.+__MESSAGES__/s, "")
            .trim();
          if (visibleText) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                content: last.content + visibleText,
              };
              return updated;
            });
          }
          continue;
        }

        // Normal token — append as usual
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = {
            ...last,
            content: last.content + text,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">AI Chat</h1>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center mt-20">
            Start a conversation...
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.content}
              {/* Blinking cursor while streaming this message */}
              {isStreaming &&
                i === messages.length - 1 &&
                msg.role === "assistant" && (
                  <span className="inline-block w-1.5 h-3.5 bg-gray-400 ml-0.5 animate-pulse" />
                )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type a message..."
          disabled={isStreaming}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
          onClick={sendMessage}
          disabled={isStreaming}
        >
          {isStreaming ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
