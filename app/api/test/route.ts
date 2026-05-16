import { type NextRequest, NextResponse } from "next/server";
import { createStreamAnthropic, model } from "@/lib/anthropic";

/**
 * GET /api/test - Returns a streaming response from Claude AI
 * Use Server-Sent Events (SSE) to receive streaming text
 *
 * Example client-side usage:
 * const eventSource = new EventSource('/api/test');
 * eventSource.onmessage = (event) => {
 *   if (event.data === '[DONE]') {
 *     eventSource.close();
 *   } else {
 *     const data = JSON.parse(event.data);
 *     console.log(data.text);
 *   }
 * };
 */

export async function GET() {
  try {
    const response = createStreamAnthropic({
      system: "You are a helpful assistant.",
      max_tokens: 300,
      messages: [{ role: "user", content: "Tell me a short story about AI." }],
      model,
    });

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              // Send each text chunk as SSE (Server-Sent Events)
              const data = `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`;
              controller.enqueue(new TextEncoder().encode(data));
            }
          }
          // Send end signal
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in test API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = {
      message: "POST request received",
      receivedData: body,
      timestamp: new Date().toISOString(),
      method: "POST",
      success: true,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error in test API route POST:", error);
    return NextResponse.json(
      { error: "Invalid JSON or internal server error" },
      { status: 400 },
    );
  }
}
