// Custom document types. Pure functions: no database, no server-only, so the
// form in the browser and the API can share the same shape and limits.
//
// A "form" is what the user fills in. fromForm() turns it into the same
// shape as the built-in files in this folder, so nothing downstream
// (chat, due dates, checks) needs to know which kind it is dealing with.

export const LIMITS = {
  name: 80,
  abbreviation: 8,
  text: 1500,
  line: 200,
  lines: 40,
  dates: 30,
  rules: 10,
};

export const STRICTNESS_LEVELS = ["strict", "moderate", "flexible"];
export const DEFAULT_ANCHOR = "The most recent relevant date in the document (a completion, review or effective date).";

export function emptyForm() {
  return {
    name: "",
    abbreviation: "",
    identity: "",
    summary: "",
    fields: [],
    dates: [],
    purpose: "",
    requiredElements: [],
    strictness: "moderate",
    answerGuidance: "",
    rules: [],
  };
}

const clip = (v, n) => String(v ?? "").trim().slice(0, n);
const lines = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((x) => clip(x, LIMITS.line))
    .filter(Boolean)
    .slice(0, LIMITS.lines);

/**
 * Cleans untrusted form input. Returns the clean form plus a list of
 * problems the user needs to fix (empty list = valid).
 */
export function validateForm(input) {
  const errors = [];
  const f = input && typeof input === "object" ? input : {};

  const name = clip(f.name, LIMITS.name);
  if (!name) errors.push("Give the document type a name.");

  let abbreviation = clip(f.abbreviation, LIMITS.abbreviation).toUpperCase();
  if (!abbreviation && name) {
    abbreviation = name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, LIMITS.abbreviation)
      .toUpperCase();
  }

  const dates = (Array.isArray(f.dates) ? f.dates : [])
    .map((d) => ({ name: clip(d?.name, LIMITS.line), meaning: clip(d?.meaning, LIMITS.text) }))
    .filter((d) => d.name || d.meaning)
    .slice(0, LIMITS.dates);
  if (dates.some((d) => !d.name)) errors.push("Every date needs a name (for example 'Expiry date').");

  const rules = (Array.isArray(f.rules) ? f.rules : []).slice(0, LIMITS.rules).map((r, i) => {
    const unit = r?.unit === "days" ? "days" : "months";
    const amount = Number(r?.amount);
    const max = unit === "months" ? 120 : 3650;
    const label = clip(r?.label, LIMITS.line);
    if (!label) errors.push(`Renewal rule ${i + 1} needs a name.`);
    if (!Number.isInteger(amount) || amount < 1 || amount > max) {
      errors.push(`Renewal rule ${i + 1}: enter a whole number of ${unit} between 1 and ${max}.`);
    }
    return {
      label,
      amount: Number.isInteger(amount) ? amount : 0,
      unit,
      perItem: Boolean(r?.perItem),
      anchor: clip(r?.anchor, LIMITS.text) || DEFAULT_ANCHOR,
      stated: r?.stated !== false,
    };
  });

  const form = {
    name,
    abbreviation,
    identity: clip(f.identity, LIMITS.text),
    summary: clip(f.summary, LIMITS.text),
    fields: lines(f.fields),
    dates,
    purpose: clip(f.purpose, LIMITS.text),
    requiredElements: lines(f.requiredElements),
    strictness: STRICTNESS_LEVELS.includes(f.strictness) ? f.strictness : "moderate",
    answerGuidance: clip(f.answerGuidance, LIMITS.text),
    rules,
  };
  return { form, errors };
}

/** Form -> a document type object, same shape as the files in lib/intellects/. */
export function fromForm(form, key) {
  return {
    key,
    custom: true,
    name: form.name,
    abbreviation: form.abbreviation || "DOC",
    version: 1,
    identity: form.identity,
    contains: { summary: form.summary, fields: form.fields, dates: form.dates },
    purpose: form.purpose,
    businessImpact: "",
    valueChangeRisks: [],
    strictness: { level: form.strictness, notes: "" },
    licensorView: "",
    citationView: "",
    commonCitations: [],
    requiredElements: form.requiredElements,
    crossChecks: [],
    deadlineRules: form.rules.map((r, i) => ({
      key: `rule-${i + 1}`,
      label: r.label,
      every: r.unit === "days" ? { days: r.amount } : { months: r.amount },
      perItem: r.perItem,
      anchor: r.anchor,
      statedKinds: r.stated ? ["expiry", "review_due"] : [],
    })),
    answerGuidance: form.answerGuidance,
    extra: {},
  };
}

/** A document type object (built-in or custom) -> editable form. Used for "start from" and for editing. */
export function toForm(i) {
  return {
    name: i.name ?? "",
    abbreviation: i.abbreviation ?? "",
    identity: i.identity ?? "",
    summary: i.contains?.summary ?? "",
    fields: [...(i.contains?.fields ?? [])],
    dates: (i.contains?.dates ?? []).map((d) => ({ name: d.name, meaning: d.meaning })),
    purpose: i.purpose ?? "",
    requiredElements: [...(i.requiredElements ?? [])],
    strictness: i.strictness?.level ?? "moderate",
    answerGuidance: i.answerGuidance ?? "",
    rules: (i.deadlineRules ?? []).map((r) => ({
      label: r.label,
      amount: r.every?.months ?? r.every?.days ?? 12,
      unit: r.every?.days && !r.every?.months ? "days" : "months",
      perItem: Boolean(r.perItem),
      anchor: r.anchor ?? "",
      stated: (r.statedKinds ?? []).length > 0,
    })),
  };
}
