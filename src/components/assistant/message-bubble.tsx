"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Message } from "@/hooks/use-agent";

function getMessageText(message: Message): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
}

function renderMarkdown(text: string): ReactNode[] {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <pre
          key={`code-${i}`}
          className="my-2 rounded-lg bg-black/30 p-3 text-xs font-mono overflow-x-auto"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Unordered list items
    if (/^[-*] /.test(line)) {
      elements.push(
        <li key={`li-${i}`} className="ml-4 list-disc">
          {renderInline(line.replace(/^[-*] /, ""))}
        </li>
      );
      i++;
      continue;
    }

    // Numbered list items
    if (/^\d+\. /.test(line)) {
      elements.push(
        <li key={`ol-${i}`} className="ml-4 list-decimal">
          {renderInline(line.replace(/^\d+\. /, ""))}
        </li>
      );
      i++;
      continue;
    }

    // Empty lines
    if (line.trim() === "") {
      elements.push(<br key={`br-${i}`} />);
      i++;
      continue;
    }

    // Regular text
    elements.push(
      <span key={`text-${i}`}>
        {renderInline(line)}
        {i < lines.length - 1 && <br />}
      </span>
    );
    i++;
  }

  return elements;
}

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={`b-${match.index}`}>{token.slice(2, -2)}</strong>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={`c-${match.index}`}
          className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const text = getMessageText(message);

  async function copyContent() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? "bg-gradient-to-br from-indigo-500 to-violet-500"
            : "bg-white/10 backdrop-blur-sm border border-white/10"
        }`}
      >
        {isUser ? (
          <User className="size-4 text-white" />
        ) : (
          <Bot className="size-4 text-white" />
        )}
      </div>

      <div className={`max-w-[80%] space-y-1 ${isUser ? "items-end" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-tr-sm"
              : "bg-white/5 backdrop-blur-xl border border-white/10 text-white/90 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{text}</p>
          ) : text ? (
            <div className="prose prose-invert prose-sm max-w-none [&_strong]:text-white [&_code]:text-indigo-300">
              {renderMarkdown(text)}
            </div>
          ) : null}
        </div>

        <div
          className={`flex items-center gap-2 px-1 ${
            isUser ? "justify-end" : ""
          }`}
        >
          <span className="text-[10px] text-muted-foreground">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {!isUser && text && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={copyContent}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              {copied ? (
                <Check className="size-3 text-green-400" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
        <Bot className="size-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-3">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="size-2 rounded-full bg-white/40"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
