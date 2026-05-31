import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest } from "next/server";

import { executeTool, tools } from "@/app/api/laptops-chat/tools";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const { messages } = await request.json();
  const conversationMessages = [...messages];

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (text: string) =>
        controller.enqueue(new TextEncoder().encode(text));
      while (true) {
        const response = await client.messages.create({
          system:
            "You are a laptops advisor - based on our database provide possible information to the user.",
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages: conversationMessages,
          tools,
        });

        conversationMessages.push({
          role: "assistant",
          content: response.content, // ← the full content array, not just text
        });

        const toolResults = [];
        for (const block of response.content) {
          if (block.type === "text" && block.text) {
            encode(JSON.stringify({ type: "text", text: block.text }) + "\n");
          }
          console.log(block);

          if (block.type === "tool_use") {
            // encode(`\n\n* checking database..*\n\n`);
            encode(
              JSON.stringify({
                type: "tool_use",
                text: "Using tool",
                tool: block.name,
              }) + "\n",
            );

            const result = await executeTool(
              block.name,
              block.input as Record<string, unknown>,
            );

            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: result,
            });
          }
        }

        if (toolResults.length > 0) {
          conversationMessages.push({
            role: "user",
            content: toolResults,
          });
        }

        if (response.stop_reason === "end_turn") {
          encode(JSON.stringify({ type: "end" }) + "\n");
          break;
        }
        if (response.stop_reason !== "tool_use") break;
        // encode(JSON.stringify(response));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
