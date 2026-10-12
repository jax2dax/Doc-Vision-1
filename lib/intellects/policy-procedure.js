// STARTER CONTENT. Generic and jurisdiction-neutral. Replace with your
// own approval, review and citation rules.

export const policyProcedure = {
  key: "policy-procedure",
  name: "Policy and Procedure",
  abbreviation: "P&P",
  version: 1,

  identity:
    "An organisation-level document that states what the provider commits to (the policy) and exactly how staff carry it out (the procedure). It applies to everyone, not one individual, and is versioned, approved and reviewed on a schedule.",

  contains: {
    summary: "One policy and its procedure: what the home commits to and exactly how staff carry it out.",
    fields: ["Title", "Version", "Effective date", "Approved by", "Scope", "Procedure steps", "Review date"],
    dates: [
      { name: "Effective date", meaning: "When this version took effect." },
      { name: "Last reviewed or revised", meaning: "The most recent review. If present, renewal is counted from it." },
      { name: "Review due date", meaning: "When the policy must next be reviewed." },
    ],
  },

  purpose:
    "It exists so practice is consistent, lawful and defensible, so staff know what to do, and so the provider can show regulators what it said it would do. It is what individual documents are measured against.",

  businessImpact:
    "Regulators often cite a provider for not following its own policy, which is easier to prove than failing an external rule. Out-of-date or contradictory policies weaken every other defence. Policies also anchor training and discipline.",

  valueChangeRisks: [
    { field: "Timeframes and thresholds (e.g. report within N hours)", risk: "Staff practice and audits are all judged against these numbers." },
    { field: "Who is responsible", risk: "Unclear ownership leads to tasks not being done." },
    { field: "Effective date and version", risk: "Staff must be trained on the version in force; an old version in use is a finding." },
    { field: "Required steps", risk: "Removing or reordering steps changes what counts as compliant practice." },
  ],

  strictness: {
    level: "moderate",
    notes:
      "Commitments, timeframes and responsibilities must be specific and achievable, because they become the standard. Explanatory text can be flexible.",
  },

  licensorView:
    "Reviewers check the policy exists, is current and approved, matches the regulation, is specific enough to follow, and that real practice and records follow it.",

  citationView:
    "Citations compare the provider's own wording to what happened: the policy states X within a timeframe, the record shows Y. Vague policies are cited as inadequate, and unmet commitments as failure to follow policy.",

  commonCitations: [
    { issue: "Provider did not follow its own policy", whyCited: "Records show practice differs from the written procedure.", severity: "major" },
    { issue: "Policy missing a required topic", whyCited: "A regulated subject has no written policy.", severity: "major" },
    { issue: "Policy outdated or not reviewed on schedule", whyCited: "Review or effective date is past due.", severity: "minor" },
    { issue: "Policy too vague to guide staff", whyCited: "No steps, owners or timeframes.", severity: "minor" },
    { issue: "Staff not trained on the current version", whyCited: "No record of training on the version in force.", severity: "major" },
  ],

  requiredElements: [
    "Title, version and effective date",
    "Approval by the responsible person or body",
    "Scope: who and what it applies to",
    "Policy statement",
    "Step-by-step procedure with responsible roles",
    "Timeframes and thresholds",
    "Related documents and forms",
    "Review date",
  ],

  crossChecks: [
    { with: "training-record", rule: "Staff should have recorded training on policies that apply to their role." },
  ],

  // STARTER VALUE: set the review interval your policy requires.
  deadlineRules: [
    {
      key: "policy-review",
      label: "Policy review",
      every: { months: 12 },
      anchor: "The effective date, or the most recent review or revision date if recorded (use the later).",
      statedKinds: ["review_due"],
    },
  ],

  answerGuidance:
    "Quote timeframes, thresholds and step order exactly. Say which policy and version a statement comes from. If two policies conflict, name both rather than choosing one.",

  extra: {},
};
