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
            system:
              "You are a travle guide specialist provding services to the customers" +
              "Use only the database to provide answer and details about covered countried" +
              "Tool use philosophy" +
              "- Always query the database for real data - never guess answers" +
              "- use get_countries for providing all countries the agent includes" +
              "- use get_country when user ask about particlar country, if country not in list don't guess just redirect the user to check the agent catalog" +
              "After getting the data and provding the user with the details play a role like customer service and ask the user for any other help",
            tools,
            messages: conversationMessages,
          });

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
              console.log("block", block);
              encode(`\n\n*Checking database...*\n\n`);

              const result = await executeTool(
                block.name,
                block.input as Record<string, unknown>,
              );

              console.log("result ", result);

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
