import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Chat from "./Chat";

// Helper to create a fake reader that yields given chunks
function createFakeReader(chunks: string[]) {
  let i = 0;
  return {
    read: async () => {
      if (i >= chunks.length) return { done: true, value: undefined };
      const chunk = chunks[i++];
      return { done: false, value: new TextEncoder().encode(chunk) };
    },
  };
}

describe("Chat component", () => {
  beforeEach(() => {
    // polyfill scrollIntoView in test environment

    Element.prototype.scrollIntoView = vi.fn();

    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("sends user input to the API and displays streamed assistant content", async () => {
    const fakeReader = createFakeReader(["Hello"]);

    // Mock fetch to return an object with a body that has a getReader()
    // The Chat component uses response.body.getReader()

    globalThis.fetch = vi.fn().mockResolvedValue({
      body: {
        getReader: () => fakeReader,
      },
    });

    render(<Chat chatTitle="Test Chat" apiUrl="/api/chat" />);

    const input = screen.getByPlaceholderText("Type a message...");
    await userEvent.type(input, "Hi there");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await userEvent.click(sendButton);

    // fetch should be called with the conversation (POST)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chat",
        expect.objectContaining({ method: "POST" }),
      );
    });

    // The streamed assistant content should appear
    await waitFor(() => expect(screen.getByText(/Hello/)).toBeInTheDocument());
  });
});
