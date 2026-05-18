import Anthropic from "@anthropic-ai/sdk";

import { executeTool, tools } from "./tools";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (text: string) =>
        controller.enqueue(new TextEncoder().encode(text));

      try {
        const conversationMessages = [...messages];

        while (true) {
          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            system: `You are a knowledgeable laptop advisor with access to a 
real product database. Help users find, compare, and choose laptops.

Tool use philosophy:
- Always query the database for real data — never guess specs or prices
- Use search_laptops for browsing and vague requirements
- Use get_laptop_details when a specific laptop is mentioned by name
- Use compare_laptops when the user wants a direct comparison
- Use get_recommendation when the user describes their needs or use case
- After getting data, give a clear, opinionated recommendation — don't just list facts
- If stock is low (≤ 2), mention it proactively
- Always mention price clearly

When recommending:
- Be direct — say "I recommend X because..."
- Highlight the 2-3 most relevant specs for their use case
- Acknowledge tradeoffs honestly`,
            tools,
            messages: conversationMessages,
          });

          // Add assistant response to history once
          conversationMessages.push({
            role: "assistant",
            content: response.content,
          });

          const toolResults = [];

          for (const block of response.content) {
            if (block.type === "text" && block.text) {
              encode(block.text);
            }

            if (block.type === "tool_use") {
              encode(`\n\n*Checking database...*\n\n`);

              const result = await executeTool(
                block.name,
                block.input as Record<string, unknown>,
              );

              toolResults.push({
                type: "tool_result" as const,
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

          if (response.stop_reason === "end_turn") break;
          if (response.stop_reason !== "tool_use") break;
        }

        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        encode(`\nError: ${message}`);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
