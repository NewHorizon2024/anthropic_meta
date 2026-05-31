import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SUMMARIZE_THRESHOLD = 500;
const KEEP_RECENT = 4;

export type Message = {
  role: "user" | "assistant";
  content: string | Anthropic.ContentBlock[]; // ← allow both types
};

export async function summarizeIfNeeded(
  messages: Message[],
  currentTokenCount: number,
): Promise<{
  messages: Message[];
  wasSummarized: boolean;
}> {
  console.log(
    `[Summarize Check] tokens: ${currentTokenCount}, ` +
      `messages: ${messages.length}, ` +
      `threshold: ${SUMMARIZE_THRESHOLD}`,
  );

  if (currentTokenCount < SUMMARIZE_THRESHOLD) {
    console.log(`[Summarize] Skipped — tokens below threshold`);
    return { messages, wasSummarized: false };
  }

  if (messages.length <= KEEP_RECENT + 2) {
    console.log(`[Summarize] Skipped — not enough messages`);
    return { messages, wasSummarized: false };
  }

  // Find a safe split point — never split between a tool_use
  // and its corresponding tool_result
  const targetSplit = messages.length - KEEP_RECENT;
  let safeSplitPoint = targetSplit;

  // Walk back from the target split point to find a safe boundary
  // A safe boundary is after a plain text exchange
  // not in the middle of a tool_use/tool_result pair
  for (let i = targetSplit; i > 0; i--) {
    const msg = messages[i - 1];
    const content = msg.content;

    // If this message contains tool_use blocks it's part of a pair
    // keep walking back to find a clean boundary
    const hasToolUse =
      Array.isArray(content) &&
      content.some((b: Anthropic.ContentBlock) => b.type === "tool_use");

    const hasToolResult =
      Array.isArray(content) &&
      // Some Anthropic content block types use specific result type names
      // (e.g. "web_search_tool_result"). Detect any block whose type
      // name indicates it's a tool result.
      content.some(
        (b: Anthropic.ContentBlock) =>
          typeof b.type === "string" &&
          (b.type as string).endsWith("_tool_result"),
      );

    if (!hasToolUse && !hasToolResult) {
      safeSplitPoint = i;
      break;
    }
  }

  // Not enough clean messages to summarize safely
  if (safeSplitPoint <= 1) {
    console.log(`[Summarize] Skipped — no safe split point found`);
    return { messages, wasSummarized: false };
  }

  const oldMessages = messages.slice(0, safeSplitPoint);
  const recentMessages = messages.slice(safeSplitPoint);

  console.log(
    `[Summarize] Compressing ${oldMessages.length} messages ` +
      `at safe split point ${safeSplitPoint}, ` +
      `keeping ${recentMessages.length} recent`,
  );

  // Extract only text content for summarization
  // tool_use/tool_result content gets summarized as context
  const conversationText = oldMessages
    .map((m) => {
      const content = m.content;
      if (typeof content === "string") {
        return `${m.role.toUpperCase()}: ${content}`;
      }
      // Extract text from content blocks for the summary
      const text = (content as Anthropic.ContentBlock[])
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join(" ");
      return text ? `${m.role.toUpperCase()}: ${text}` : null;
    })
    .filter(Boolean)
    .join("\n\n");

  const summaryResponse = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      "You are a conversation summarizer. " +
      "Summarize the key points of the conversation concisely. " +
      "Preserve: important facts, user preferences, decisions made, " +
      "and any specific data that was discussed. " +
      "Be concise but complete — this summary replaces the full history.",
    messages: [
      {
        role: "user",
        content:
          "Summarize this conversation history concisely:\n\n" +
          conversationText,
      },
    ],
  });

  const summary =
    summaryResponse.content[0].type === "text"
      ? summaryResponse.content[0].text
      : "";

  const summarizedMessages: Message[] = [
    {
      role: "user",
      content: `[Previous conversation summary: ${summary}]`,
    },
    {
      role: "assistant",
      content: "Understood. I'll keep that context in mind as we continue.",
    },
    ...recentMessages,
  ];

  console.log(
    `[Summarize] Done. New message count: ${summarizedMessages.length}`,
  );

  return { messages: summarizedMessages, wasSummarized: true };
}
