import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest } from "next/server";

const apiKey = process.env.ANTHROPIC_API_KEY;

const client = new Anthropic({ apiKey });
export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const res = client.messages.stream({
          system: "You are a helpful assistant.",
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          messages,
        });

        for await (const chunk of res) {
          console.log(chunk);
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        console.error(error);
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
