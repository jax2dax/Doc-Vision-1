"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const EXAMPLES = [
  "Which delegations expire in the next 30 days?",
  "When was the last safety meeting?",
  "Whose training has expired?",
];

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
    <div className="flex min-h-full max-w-3xl flex-col">
      <div className="flex flex-1 flex-col pb-4">
        {messages.length === 0 && (
          <div className="py-6">
            <p className="text-sm text-muted-foreground">
              {hasReadyFiles
                ? "Ask about anything in the uploaded files. Answers quote the file they came from."
                : "Upload a file first. Answers come only from this workspace's files."}
            </p>
            {hasReadyFiles && (
              <ul className="mt-3 flex flex-col items-start gap-1">
                {EXAMPLES.map((ex) => (
                  <li key={ex}>
                    <button onClick={() => send(ex)} className="text-sm text-foreground underline underline-offset-4 hover:text-primary">
                      {ex}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} className="border-t border-border py-4">
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Question</p>
              <p className="whitespace-pre-wrap break-words text-foreground">{msg.content}</p>
            </div>
          ) : (
            <Answer key={i} message={msg} />
          )
        )}

        {pending && <p className="border-t border-border py-4 text-sm text-muted-foreground">Looking through the files…</p>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="sticky bottom-0 -mx-4 border-t border-border bg-background px-4 py-3 sm:-mx-6 sm:px-6"
      >
        <div className="flex max-w-3xl items-end gap-2 border border-input px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
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
            placeholder="Ask a question about your files"
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

function Answer({ message }) {
  const { result, failed } = message;

  if (failed) {
    return (
      <div className="border-t border-border py-4">
        <p className="text-sm text-destructive">{message.content}</p>
      </div>
    );
  }

  return (
    <div className="border-t border-border py-4">
      <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Answer</p>
      <div className="leading-relaxed text-foreground">
        <FormattedAnswer text={message.content} />
      </div>

      {result?.sources?.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
          {result.sources.map((s) => (
            <li key={s.ref}>
              <details>
                <summary className="cursor-pointer select-none hover:text-foreground">
                  [{s.ref}] {s.filename}
                  {s.sheet ? `, sheet ${s.sheet}` : ""}
                  {s.page ? `, page ${s.page}` : ""}
                </summary>
                <p className="mt-1 whitespace-pre-wrap break-words border-l-2 border-border pl-3">{s.excerpt}</p>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Minimal rendering for what the model actually emits: paragraphs,
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
        <sup key={i} className="mx-0.5 text-[10px] text-muted-foreground">
          {part}
        </sup>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
