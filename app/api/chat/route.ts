// import Anthropic from "@anthropic-ai/sdk";

// const apiKey = process.env.ANTHROPIC_API_KEY;
// const client = new Anthropic({ apiKey });

// export async function POST(req: Request) {
//   const { messages } = await req.json();

//   // Create a ReadableStream that we'll write LLM chunks into
//   const stream = new ReadableStream({
//     async start(controller) {
//       try {
//         const llmStream = client.messages.stream({
//           model: "claude-sonnet-4-6",
//           max_tokens: 1024,
//           system: "You are a helpful assistant.",
//           messages,
//         });

//         for await (const chunk of llmStream) {
//           if (
//             chunk.type === "content_block_delta" &&
//             chunk.delta.type === "text_delta"
//           ) {
//             // Encode text as UTF-8 bytes and push into the stream
//             controller.enqueue(
//               new TextEncoder().encode(chunk.delta.text)
//             );
//           }
//         }

//         // Signal end of stream
//         controller.close();

//       } catch (error) {
//         controller.error(error);
//       }
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/plain; charset=utf-8",
//       // This header is critical — it tells Next.js not to buffer
//       "X-Accel-Buffering": "no",
//     },
//   });
// }

import Anthropic from "@anthropic-ai/sdk";
import { tools, executeTool } from "./tools";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (text: string) =>
        controller.enqueue(new TextEncoder().encode(text));

      try {
        // We need a mutable copy of messages because
        // the tool use loop adds to it
        const conversationMessages = [...messages];

        // This loop is the agent loop —
        // it keeps running until the model stops calling tools
        while (true) {
          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system:
              "You are a helpful product assistant. " +
              "Use the available tools to answer questions " +
              "about products accurately.",
            tools,
            messages: conversationMessages,
          });

          // Add the assistant's FULL response to history ONCE
          // Do this before processing blocks — outside the for loop
          conversationMessages.push({
            role: "assistant",
            content: response.content,
          });

          // Collect all tool results from this response
          const toolResults = [];

          // Process each content block
          for (const block of response.content) {
            if (block.type === "text") {
              encode(block.text);
            }

            if (block.type === "tool_use") {
              encode(`\n[Calling tool: ${block.name}...]\n`);

              const result = executeTool(
                block.name,
                block.input as Record<string, string>,
              );

              // Collect tool results instead of pushing immediately
              toolResults.push({
                type: "tool_result" as const,
                tool_use_id: block.id,
                content: result,
              });
            }
          }

          // If there were tool calls, add ALL results in one user message
          if (toolResults.length > 0) {
            conversationMessages.push({
              role: "user",
              content: toolResults,
            });
          }

          // Break conditions
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
