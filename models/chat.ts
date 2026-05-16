export type ChatMessage = Readonly<{
  role: "user" | "assistant";
  content: string;
  id?: string;
}>;
