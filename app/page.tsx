import Link from "next/link";

const WHAT_IT_HOLDS = [
  ["Delegation book", "Who is delegated which task, and when each delegation has to be renewed."],
  ["Training records", "Courses completed and when each one expires."],
  ["Safety and house meetings", "When meetings were held and what actions are still open."],
  ["Drill logs, policies and protocols", "Drill dates, and review dates for the documents that guide staff."],
];

const STEPS = [
  "Upload the Excel sheet, CSV or PDF you already keep.",
  "Pick what kind of document it is. The app knows which dates that kind holds and how often it must be renewed.",
  "See every due date in one list, with anything overdue or inside a week marked in red.",
];

export default function LandingPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between border-b border-border pb-4">
        <span className="font-brand text-xl text-foreground">Doc-Vision-1</span>
        <Link href="/platform/home" className="text-sm text-foreground underline underline-offset-4">
          Open app
        </Link>
      </header>

      <section className="py-14 sm:py-20">
        <h1 className="font-display text-4xl leading-tight text-foreground sm:text-5xl">
          Know what is due before it is late.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">
          Upload the spreadsheets and documents a group home already keeps. Doc-Vision-1 reads the dates in them, works out
          what is coming up, and lets you ask questions about the files.
        </p>
        <Link
          href="/platform/home"
          className="mt-8 inline-block bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
        >
          Get started
        </Link>
      </section>

      <section className="border-t border-border py-10">
        <h2 className="font-display text-2xl text-foreground">What it reads</h2>
        <dl className="mt-4 divide-y divide-border border-y border-border">
          {WHAT_IT_HOLDS.map(([title, body]) => (
            <div key={title} className="grid gap-1 py-3 sm:grid-cols-[14rem_1fr] sm:gap-6">
              <dt className="font-medium text-foreground">{title}</dt>
              <dd className="text-muted-foreground">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-border py-10">
        <h2 className="font-display text-2xl text-foreground">How it works</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border py-10">
        <h2 className="font-display text-2xl text-foreground">Not for client records</h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          This tool is for operational documents. Do not upload anything that identifies a client, such as support plans,
          incident reports, medication records or medical information.
        </p>
      </section>
    </main>
  );
}
