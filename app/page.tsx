import Link from "next/link";
import { ArrowRight, ClipboardCheck, FolderOpen, MessageSquare, ScrollText, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: ScrollText,
    title: "Protocols you can query",
    body: "Ask how your clinic handles a procedure, a consent form or an escalation. Answers quote your own protocols and name the document and page they came from.",
    status: null,
  },
  {
    icon: FolderOpen,
    title: "One home for every document",
    body: "Keep SOPs, policies, forms and scanned paperwork in separate workspaces per clinic or department. Delete a file and everything derived from it goes with it.",
    status: null,
  },
  {
    icon: ClipboardCheck,
    title: "Proofchecking",
    body: "Check a new or updated document against your existing protocols and flag conflicts, gaps and outdated wording before it goes live.",
    status: "Coming soon",
  },
];

const STEPS = [
  { n: "1", title: "Upload", body: "Add your PDFs and scans. Scanned pages are read automatically." },
  { n: "2", title: "Ask", body: "Question your documents in plain language, the way staff actually ask." },
  { n: "3", title: "Verify", body: "Every answer links back to the source passage, so nothing is taken on trust." },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-5 py-5 sm:px-10">
        <span className="font-brand text-xl text-foreground">
          Doc-Vision-<span style={{ color: "var(--primary)" }}>1</span>
        </span>
        <Link
          href="/platform/home"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Open App
        </Link>
      </header>

      <section className="mx-auto flex max-w-3xl flex-col items-center px-5 py-16 text-center sm:px-10 sm:py-24">
        <p className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          Documentation and protocol management for clinics
        </p>
        <h1 className="mt-5 font-display text-4xl leading-tight text-foreground sm:text-6xl">
          Every protocol, <span style={{ color: "var(--primary)" }}>one question away</span>.
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Doc-Vision-1 keeps your clinic&apos;s protocols and documentation organised, searchable and
          checkable. Staff get answers grounded in your own documents, with the source one click away.
        </p>
        <Link
          href="/platform/home"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-5 sm:grid-cols-3 sm:px-10">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <f.icon className="h-5 w-5 text-primary" />
              {f.status && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                  {f.status}
                </span>
              )}
            </div>
            <h3 className="mt-3 font-display text-lg text-foreground">{f.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-10">
        <h2 className="text-center font-display text-2xl text-foreground sm:text-3xl">How it works</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary font-display text-primary">
                {s.n}
              </span>
              <div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-16 flex w-full max-w-5xl flex-col gap-3 px-5 sm:flex-row sm:px-10">
        <div className="flex flex-1 items-start gap-3 rounded-xl border border-border bg-card p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            Answers come only from the documents you upload. If your protocols do not cover a question,
            Doc-Vision-1 says so instead of guessing.
          </p>
        </div>
        <div className="flex flex-1 items-start gap-3 rounded-xl border border-border bg-card p-5">
          <MessageSquare className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            It supports staff with documentation. It does not replace clinical judgement or your
            organisation&apos;s approval process.
          </p>
        </div>
      </section>
    </main>
  );
}
