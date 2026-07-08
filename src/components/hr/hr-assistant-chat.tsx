"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { useEveAgent } from "eve/react";
import { Bot, Loader2, RotateCcw, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SUGGESTED_PROMPTS = [
  "What needs my attention right now?",
  "Who is at risk this month and why?",
  "Summarize attendance for the last 30 days.",
  "Draft a coaching note for an employee scoring below 70.",
] as const;

function renderMessageText(
  parts: ReadonlyArray<{ type: string; text?: string }>
): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n");
}

function linkifyAdminPaths(text: string): ReactNode[] {
  const pattern = /(\/admin(?:\/[a-z0-9\-[\]]+)*)/gi;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const href = match[0];
    const index = match.index ?? 0;
    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }
    nodes.push(
      <Link
        key={`${href}-${index}`}
        href={href}
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        {href}
      </Link>
    );
    lastIndex = index + href.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

type HrAssistantChatProps = {
  eveAccessToken: string;
};

async function refreshEveAccessToken(): Promise<string> {
  const response = await fetch("/api/eve/token", {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text();
    let message = "Could not refresh Eve access.";
    try {
      const parsed = JSON.parse(body) as { error?: string };
      if (typeof parsed.error === "string") {
        message = parsed.error;
      }
    } catch {
      if (body.trim()) {
        message = body.trim();
      }
    }
    throw new Error(message);
  }
  return response.text();
}

export function HrAssistantChat({ eveAccessToken }: HrAssistantChatProps) {
  const accessTokenRef = useRef(eveAccessToken);
  const agent = useEveAgent({
    auth: {
      bearer: async () => {
        if (!accessTokenRef.current) {
          accessTokenRef.current = await refreshEveAccessToken();
        }
        return accessTokenRef.current;
      },
    },
    onError: (error) => {
      if ("status" in error && error.status === 401) {
        accessTokenRef.current = "";
      }
    },
  });
  const formRef = useRef<HTMLFormElement>(null);
  const isBusy = agent.status === "submitted" || agent.status === "streaming";

  const submitMessage = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || isBusy) return;
    void agent.send({ message: trimmed });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <Card className="flex min-h-[560px] flex-col">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="size-4 text-[var(--color-ink-muted)]" aria-hidden="true" />
                HR assistant
              </CardTitle>
              <CardDescription>
                Ask about alerts, employee performance, attendance, and drafts. Read-only
                except for text you copy into forms.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => agent.reset()}
              disabled={isBusy || agent.data.messages.length === 0}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              New chat
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pt-4">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {agent.data.messages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-sm text-[var(--color-ink-muted)]">
                Start with a suggested prompt, or ask a question in plain language. The
                assistant uses live HR data from this workspace.
              </div>
            ) : null}

            {agent.data.messages.map((message) => {
              const text = renderMessageText(message.parts);
              if (!text) return null;

              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={cn("flex", isUser ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-foreground"
                    )}
                  >
                    {isUser ? text : linkifyAdminPaths(text)}
                  </div>
                </div>
              );
            })}

            {isBusy ? (
              <div className="flex items-center gap-2 text-sm text-[var(--color-ink-muted)]">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Thinking…
              </div>
            ) : null}

            {agent.error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <p>{agent.error.message}</p>
                {"status" in agent.error && typeof agent.error.status === "number" ? (
                  <p className="mt-1 text-xs text-destructive/80">
                    Request failed with status {agent.error.status}.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <form
            ref={formRef}
            className="flex flex-col gap-2 border-t border-border pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const message = String(new FormData(form).get("message") ?? "").trim();
              if (!message) return;
              submitMessage(message);
              form.reset();
            }}
          >
            <Textarea
              name="message"
              placeholder="Ask about alerts, employees, attendance, or request a draft…"
              rows={3}
              disabled={isBusy}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
            />
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-[var(--color-ink-muted)]">
                Enter to send · Shift+Enter for a new line
              </p>
              <Button type="submit" disabled={isBusy}>
                {isBusy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                Send
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Suggested prompts</CardTitle>
            <CardDescription>Quick starts grounded in your HR data.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                variant="outline"
                size="sm"
                className="h-auto justify-start px-3 py-2 text-left whitespace-normal"
                disabled={isBusy}
                onClick={() => submitMessage(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>What it can do</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[var(--color-ink-muted)]">
            <p>Triage needs-attention alerts and at-risk employees.</p>
            <p>Look up employee performance profiles and recommendations.</p>
            <p>Summarize attendance and search employees, KPIs, and tasks.</p>
            <p>Draft coaching notes and growth plan text for manual entry.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
