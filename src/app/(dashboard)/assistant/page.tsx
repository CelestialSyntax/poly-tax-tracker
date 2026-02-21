"use client";

import { ChatInterface } from "@/components/assistant/chat-interface";

export default function AssistantPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">AI Tax Assistant</h2>
        <p className="text-muted-foreground">
          Ask questions about your Polymarket taxes. Powered by Claude.
        </p>
      </div>
      <ChatInterface />
    </div>
  );
}
