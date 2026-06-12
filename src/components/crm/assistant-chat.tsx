"use client";

import { useRef, useState, useTransition } from "react";
import { Send, Sparkles } from "lucide-react";
import { askAssistantAction } from "@/server/actions/assistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "How many overdue leads and activities do I have?",
  "How much have I quoted and what's my acceptance rate?",
  "What's my win rate and pipeline value?",
  "What should I focus on this week?",
];

export function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  function ask(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    start(async () => {
      const res = await askAssistantAction(q);
      const text = res.error ?? res.answer ?? "Something went wrong.";
      setMessages((m) => [...m, { role: "assistant", text }]);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    });
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col rounded-lg border bg-card">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <p className="mt-3 text-sm font-medium">Ask about your numbers</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Grounded in your live CRM data — every figure is computed, never invented.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm",
                  m.role === "user" ? "bg-accent text-accent-foreground" : "bg-muted"
                )}
              >
                {m.text}
              </div>
            </div>
          ))
        )}
        {pending && <div className="text-sm text-muted-foreground">Analyzing…</div>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 border-t p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about leads, quotes, pipeline, ratios…"
          disabled={pending}
        />
        <Button type="submit" size="icon" disabled={pending} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
