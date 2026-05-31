import Anthropic from "@anthropic-ai/sdk";

import { summarizeIfNeeded } from "@/lib/summarize";

import { executeTool, tools } from "./tools";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (text: string) =>
        controller.enqueue(new TextEncoder().encode(text));

      try {
        let conversationMessages = [...messages];

        while (true) {
          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 2048,
            system: `You are a knowledgeable laptop advisor...`,
            tools,
            messages: conversationMessages,
          });
          // console.log(
          //   `[Tokens] Input: ${response.usage.input_tokens} | Output: ${response.usage.output_tokens}`,
          // );
          console.log("Tokens", response);

          // Check if we need to summarize AFTER each response
          // because now we know the token count
          const { messages: updatedMessages, wasSummarized } =
            await summarizeIfNeeded(
              conversationMessages,
              response.usage.input_tokens,
            );

          if (wasSummarized) {
            conversationMessages = updatedMessages;
            // Tell the client about the summarization
            // so it can update its local message history
            encode(`\n\n[Conversation summarized to save context]\n\n`);
          }

          // Add assistant response to history

          const assistantText = response.content
            .filter((block) => block.type === "text")
            .map((block) => (block.type === "text" ? block.text : ""))
            .join("");

          conversationMessages.push({
            role: "assistant",
            content: assistantText,
          });

          // ✅ Fixed — keep full content when tools were used
          const hasToolUse = response.content.some(
            (b) => b.type === "tool_use",
          );

          conversationMessages.push({
            role: "assistant",
            // Keep full content array when tools involved, text string otherwise
            content: hasToolUse ? response.content : assistantText,
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

        // Send the final message state back to the client
        // so it can sync its local history with the summarized version
        encode(
          `\n\n__MESSAGES__${JSON.stringify(conversationMessages)}__MESSAGES__`,
        );

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
