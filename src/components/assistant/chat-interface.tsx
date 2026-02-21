"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageBubble,
  TypingIndicator,
} from "@/components/assistant/message-bubble";
import { useAgent } from "@/hooks/use-agent";
import { Send, Trash2, MessageSquare } from "lucide-react";

const suggestedQuestions = [
  "What tax treatment is best for my trades?",
  "How do prediction markets get taxed?",
  "Can I deduct my trading losses?",
  "Explain my capital gains summary",
];

export function ChatInterface() {
  const { messages, isLoading, sendMessage, clearMessages, status } =
    useAgent();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  function handleSend(text?: string) {
    const content = text ?? input.trim();
    if (!content || isLoading) return;
    setInput("");
    sendMessage({ text: content });
  }

  const showSuggestions = messages.length === 0;

  // Show typing when streaming and the last assistant message has no text yet
  const showTyping =
    status === "submitted" ||
    (status === "streaming" &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant" &&
      messages[messages.length - 1].parts.filter((p) => p.type === "text")
        .length === 0);

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="size-4" />
          <span>PolyTax AI</span>
          {isLoading && (
            <span className="text-xs text-indigo-400">Thinking...</span>
          )}
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={clearMessages}
            className="text-muted-foreground"
          >
            <Trash2 className="size-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message when no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20">
              <MessageSquare className="size-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold">PolyTax AI Assistant</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              I can help you understand your Polymarket tax obligations, compare
              treatment options, and identify optimization opportunities.
            </p>
            <p className="mt-1 text-xs text-amber-400/80">
              Not a licensed tax advisor. Always consult a CPA.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        <AnimatePresence>
          {showTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested Questions */}
      {showSuggestions && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {suggestedQuestions.map((q) => (
            <Badge
              key={q}
              variant="outline"
              className="cursor-pointer border-white/10 bg-white/5 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
              onClick={() => handleSend(q)}
            >
              {q}
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your Polymarket taxes..."
            className="flex-1 bg-white/5 border-white/10"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            <Send className="size-4" />
          </Button>
        </form>
        <p className="mt-2 text-center text-[10px] text-muted-foreground/50">
          AI responses are for informational purposes only. Consult a tax
          professional for advice.
        </p>
      </div>
    </div>
  );
}
