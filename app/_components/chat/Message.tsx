"use client";

import clsx from "clsx";
import { type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

import type { ChatMessage } from "@/models/chat";

export default function Message({ role, content }: ChatMessage) {
  return (
    <div
      className={clsx(
        "flex w-full",
        role === "assistant" ? "justify-start" : "justify-end",
      )}
    >
      <div
        className={clsx(
          "p-3 rounded-md text-white max-w-[80%] prose prose-invert",
          role === "assistant" ? "bg-taupe-900" : "bg-teal-900",
        )}
      >
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
              return <ul className="list-disc list-inside mb-2">{children}</ul>;
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
                <td className="border border-gray-400 px-3 py-2">{children}</td>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
