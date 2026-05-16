import Anthropic from "@anthropic-ai/sdk";
import { type MessageStream } from "@anthropic-ai/sdk/lib/MessageStream.mjs";
import { type MessageStreamParams } from "@anthropic-ai/sdk/resources";

const apiKey = process.env.ANTHROPIC_API_KEY;
const client = new Anthropic({ apiKey });
export const model = "claude-sonnet-4-6";

export function createStreamAnthropic({
  system,
  messages,
  max_tokens,
  model,
}: MessageStreamParams): MessageStream {
  const response = client.messages.stream({
    model,
    system,
    messages,
    max_tokens,
  });
  return response;
}
