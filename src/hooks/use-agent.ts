"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";

export type Message = UIMessage;

export function useAgent() {
  const {
    messages,
    sendMessage,
    status,
    stop,
    setMessages,
    error,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
    onError(error) {
      console.error("Agent error:", error);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  function clearMessages() {
    stop();
    setMessages([]);
  }

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    status,
    error,
  };
}
