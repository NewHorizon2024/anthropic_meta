"use client";

import { type ChangeEvent, ReactNode, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

const btnStyle =
  "bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors";

export default function RockOne() {
  const [value, setValue] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [toolInUse, setToolInUse] = useState<string | null>("");
  const [streaming, setStreaming] = useState<boolean>(false);
//TEST
  // async function handleStream() {
  //   const response = await fetch(
  //     "https://stream.wikimedia.org/v2/stream/recentchange",
  //   );
  //   const reader = response.body?.getReader();
  //   const decoder = new TextDecoder();
  //   let i = 0;

  //   const stream = new ReadableStream({
  //     async start(controller) {
  //       while (true) {
  //         if (reader) {
  //           const { done, value } = await reader.read(); // iterator
  //           i++;
  //           if (done) break;
  //           if (i >= 100) {
  //             controller.close();
  //             break;
  //           }
  //           controller.enqueue(value);
  //         }
  //       }
  //     },
  //   });
  // }

  async function handleClick() {
    try {
      setStreaming(true);
      const response = await fetch("/api/laptops-chat-2", {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({
          messages: [{ role: "user", content: value }],
        }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Split on newlines to get complete events
        const lines = buffer.split("\n");
        console.log(lines);

        // Last element might be incomplete — keep it in buffer
        buffer = lines.pop()!;

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line);
            console.log(event);

            switch (event.type) {
              case "text":
                setContent((prev) => prev + event.text);
                break;
              case "tool_use":
                setToolInUse(event.tool);
                break;
              case "end":
                setToolInUse(null);
                break;
            }
          } catch (e) {
            console.warn("Parse error on line:", line);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setToolInUse(null);
      setStreaming(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value);
  }

  return (
    <div className="p-4 border border-sky-900 rounded-md">
      {/* <button onClick={handleStream} className={btnStyle}>
        Stream
      </button> */}

      <div className="flex justify-between">
        <div className="flex flex-col gap-4 mt-6">
          <textarea
            className="border border-amber-500 rounded-md p-2 w-[500px]"
            value={value}
            onChange={handleChange}
          ></textarea>
          <button
            disabled={streaming}
            className={btnStyle}
            onClick={handleClick}
          >
            {streaming ? "Streaming.." : "Send"}
          </button>
        </div>
        <div className="bg-amber-100 p-4 rounded-md">
          <b>{toolInUse}</b>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({
                inline,
                className,
                children,
              }: {
                inline?: boolean;
                className?: string;
                children?: ReactNode;
              }) {
                const match = /language-(\w+)/.exec(className || "");
                const lang = match ? match[1] : "text";

                if (inline) {
                  return (
                    <code className="bg-black bg-opacity-30 px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  );
                }

                return (
                  <SyntaxHighlighter
                    style={dracula as Record<string, Record<string, string>>}
                    language={lang}
                    PreTag="div"
                    className="rounded-md text-sm my-2 overflow-x-auto"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                );
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
              ul({ children }) {
                return (
                  <ul className="list-disc list-inside mb-2">{children}</ul>
                );
              },
              ol({ children }) {
                return (
                  <ol className="list-decimal list-inside mb-2">{children}</ol>
                );
              },
              li({ children }) {
                return <li className="ml-2">{children}</li>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-blue-400 pl-3 italic my-2">
                    {children}
                  </blockquote>
                );
              },
              h1({ children }) {
                return <h1 className="text-lg font-bold my-2">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-base font-bold my-2">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-sm font-bold my-2">{children}</h3>;
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-2">
                    <table className="border-collapse border border-gray-400 w-full text-sm">
                      {children}
                    </table>
                  </div>
                );
              },
              thead({ children }) {
                return <thead className="bg-gray-700">{children}</thead>;
              },
              tbody({ children }) {
                return <tbody>{children}</tbody>;
              },
              tr({ children }) {
                return <tr className="border border-gray-400">{children}</tr>;
              },
              th({ children }) {
                return (
                  <th className="border border-gray-400 px-3 py-2 text-left font-semibold">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="border border-gray-400 px-3 py-2">
                    {children}
                  </td>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
