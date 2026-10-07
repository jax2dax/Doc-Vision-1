import Link from "next/link";
/**@ts-ignore */
import { ArrowRight, Database, MessageSquare, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: Database,
    title: "One persistent workspace",
    body: "Upload once. Every file, connection, and extracted fact stays available — no re-uploading to ask a new question.",
  },
  {
    icon: MessageSquare,
    title: "Ask it anything",
    body: "Chat against your own data. Answers are grounded in what you've actually uploaded, not the open internet.",
  },
  {
    icon: ShieldCheck,
    title: "You control the memory",
    body: "Delete a file and everything derived from it disappears with it. Nothing lingers that you didn't put there.",
  },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-5 sm:px-10">
        <span className="font-display text-lg font-bold text-foreground">
          Arc<span style={{ color: "var(--primary)" }}>space</span>
        </span>
        <Link
          href="/platform/home"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open App
        </Link>
      </header>

      <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-10">
        <h1 className="font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
          Give your business a <span style={{ color: "var(--primary)" }}>permanent memory</span>.
        </h1>
        <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
          Upload your documents once. Arcspace builds a persistent, searchable workspace so the AI can
          answer questions about your information — accurately, every time, without re-sending a thing.
        </p>
        <Link
          href="/platform/home"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 px-5 pb-16 sm:grid-cols-3 sm:px-10">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-5">
            <f.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-display text-sm font-semibold text-foreground">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}