"use client";

import { useEffect, useRef, useState } from "react";

import type { ChatMessage } from "@/models/chat";

import Message from "./Message";

type ChatProps = Readonly<{
  chatTitle: string;
  apiUrl: string;
}>;

export default function Chat({ chatTitle, apiUrl }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const createMessage = (message: Omit<ChatMessage, "id">): ChatMessage => ({
    ...message,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  });

  useEffect(() => {
    if (shouldAutoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    setShouldAutoScroll(isNearBottom);
  };

  async function sendMessage() {
    if (!input.trim() || isStreaming) return;

    const userMessage = createMessage({ role: "user", content: input });
    const newMessages = [...messages, userMessage];

    // Add user message and a blank assistant message to start filling
    setMessages([
      ...newMessages,
      createMessage({ role: "assistant", content: "" }),
    ]);
    setInput("");
    setIsStreaming(true);
    setShouldAutoScroll(true);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the full conversation history — this is how the model
        // maintains context across turns
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.body) throw new Error("No response body");

      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode binary chunk to text
        const text = decoder.decode(value, { stream: true });

        // Append each chunk to the last message (the assistant's)
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
    <div className="flex flex-col border gap-4 p-4 rounded-lg">
      <h1 className="text-center">{chatTitle}</h1>
      <hr />
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex flex-col max-h-[800px] overflow-y-auto break-words gap-6"
      >
        {!messages?.length && (
          <p className="text-center text-sm text-stone-500">
            Start Chat with Anthropic
          </p>
        )}
        {!!messages?.length &&
          messages.map(({ role, content, id }) => (
            <Message key={id} role={role} content={content} />
          ))}
        <div ref={bottomRef} />
      </div>

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
