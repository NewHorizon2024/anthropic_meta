"use client";

import Chat from "../_components/chat/Chat";

export default function OperationsHome() {
  return (
    <div>
      <Chat chatTitle="Public Chat" apiUrl="/api/laptops-chat" />
    </div>
  );
}
