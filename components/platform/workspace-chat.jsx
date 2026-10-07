"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, MessageSquare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXAMPLES = ["Summarise the key points of these documents", "What review dates or deadlines are mentioned?"];

export function WorkspaceChat({ onAsk, hasReadyFiles }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  async function send(text) {
    const question = text.trim();
    if (!question || pending) return;
    setDraft("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setPending(true);
    try {
      const result = await onAsk(question);
      setMessages((m) => [...m, { role: "assistant", content: result.answer, result }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", content: err.message, failed: true }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-4 py-12 text-center">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Ask about your protocols</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                {hasReadyFiles
                  ? "Answers come only from your uploaded documents, with citations back to the source passage."
                  : "Upload a file first. Answers come only from this workspace's files."}
              </p>
            </div>
            {hasReadyFiles && (
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((ex) => (
                  <Button key={ex} variant="outline" size="sm" onClick={() => send(ex)}>
                    {ex}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            </div>
          ) : (
            <AssistantMessage key={i} message={msg} />
          )
        )}

        {pending && (
          <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <span className="flex gap-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
            Reading your files…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="sticky bottom-0 -mx-4 border-t border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6"
      >
        <div className="flex items-end gap-2 rounded-xl border border-input bg-card px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
          <textarea
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(draft);
              }
            }}
            placeholder="Ask about a protocol or document…"
            aria-label="Question"
            className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-sm text-foreground outline-none [field-sizing:content] placeholder:text-muted-foreground"
          />
          <Button type="submit" size="icon" disabled={pending || !draft.trim()} aria-label="Send">
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function AssistantMessage({ message }) {
  const { result, failed } = message;

  if (failed) {
    return (
      <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
        {message.content}
      </div>
    );
  }

  return (
    <div className="flex max-w-[92%] flex-col gap-2">
      <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-sm leading-relaxed text-foreground">
        <FormattedAnswer text={message.content} />
      </div>

      {result?.sources?.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {result.sources.map((s) => (
            <details key={s.ref} className="group rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-xs">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-muted-foreground">
                <span className="rounded bg-secondary px-1.5 font-mono text-[10px] text-primary">{s.ref}</span>
                <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate font-medium text-foreground">{s.filename}</span>
                {s.page && <span className="flex-shrink-0">· p. {s.page}</span>}
              </summary>
              <p className="mt-2 whitespace-pre-wrap break-words text-muted-foreground">{s.excerpt}</p>
            </details>
          ))}
        </div>
      )}

      {result?.searches?.length > 0 && (
        <details className="px-1 text-xs text-muted-foreground">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 hover:text-foreground">
            <Search className="h-3 w-3" />
            Ran {result.searches.length} search{result.searches.length === 1 ? "" : "es"}
          </summary>
          <ul className="mt-1.5 flex flex-col gap-1 pl-4">
            {result.searches.map((s, i) => (
              <li key={i}>
                “{s.query}” <span className="opacity-70">in {s.filename ?? "all files"}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

// Minimal rendering for what Gemini actually emits: paragraphs,
// "-"/"*" bullets, **bold**, and [n] citations.
function FormattedAnswer({ text }) {
  const blocks = [];
  for (const line of text.split("\n")) {
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const last = blocks[blocks.length - 1];
    if (bullet) {
      if (last?.type === "list") last.items.push(bullet[1]);
      else blocks.push({ type: "list", items: [bullet[1]] });
    } else if (line.trim()) {
      blocks.push({ type: "p", text: line });
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {blocks.map((b, i) =>
        b.type === "list" ? (
          <ul key={i} className="flex list-disc flex-col gap-1 pl-5">
            {b.items.map((item, j) => (
              <li key={j}>
                <Inline text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Inline text={b.text} />
          </p>
        )
      )}
    </div>
  );
}

function Inline({ text }) {
  return text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (/^\[\d+\]$/.test(part)) {
      return (
        <sup key={i} className="mx-0.5 rounded bg-secondary px-1 font-mono text-[10px] text-primary">
          {part.slice(1, -1)}
        </sup>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
