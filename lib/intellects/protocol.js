// STARTER CONTENT. Generic and jurisdiction-neutral. Replace with your
// own protocols, approval rules and citation patterns.

export const protocol = {
  key: "protocol",
  name: "Clinical or Care Protocol",
  abbreviation: "PROT",
  version: 1,

  identity:
    "A step-by-step standard procedure for a specific task or situation, such as a medication protocol, seizure response, infection control, transport or a health procedure. It applies to everyone who does the task, states who may do it, and is owned, versioned and reviewed.",

  contains: {
    summary: "A step-by-step standard procedure for one task, who may do it, and when to escalate.",
    fields: ["Title", "Version", "Effective date", "Approved by", "Who may perform it", "Steps", "Review date"],
    dates: [
      { name: "Effective date", meaning: "When this version took effect." },
      { name: "Last reviewed or revised", meaning: "The most recent review. If present, renewal is counted from it." },
      { name: "Review due date", meaning: "When the protocol must next be reviewed." },
    ],
  },

  purpose:
    "It exists so a task is done the same safe way every time, by people qualified to do it, and so staff and reviewers have one authoritative description of correct practice.",

  businessImpact:
    "Protocols are the standard practice is judged against. Steps staff skip, or protocols that are outdated or conflict with a person's plan, lead to harm, findings and liability. Clear protocols also speed onboarding and reduce errors.",

  valueChangeRisks: [
    { field: "Step order and content", risk: "Changing a step changes what safe practice is. Staff must be retrained on any change." },
    { field: "Who may perform the task", risk: "Qualification limits protect people. Loosening them without authority is a violation." },
    { field: "Thresholds and timeframes", risk: "Numbers such as when to call for help are applied literally in practice." },
    { field: "Version, approval and review date", risk: "Staff must follow the current approved version." },
  ],

  strictness: {
    level: "strict",
    notes:
      "Steps, thresholds, roles and equipment must be exact and unambiguous. Background explanation can be flexible, but the steps themselves cannot be.",
  },

  licensorView:
    "Reviewers check the protocol exists for every regulated task, is current and approved, is specific enough to follow, matches the person's own plans, and that staff are trained and actually follow it.",

  citationView:
    "Citations compare the protocol's wording with what happened or what is missing: the protocol requires a step, the record shows it was not done, or no protocol exists for a task staff routinely perform.",

  commonCitations: [
    { issue: "No protocol for a task staff routinely perform", whyCited: "A regulated or high-risk task has no written standard.", severity: "major" },
    { issue: "Protocol not followed", whyCited: "Records or observation show steps skipped or reordered.", severity: "major" },
    { issue: "Protocol outdated or review overdue", whyCited: "Effective or review date is past due.", severity: "minor" },
    { issue: "Protocol conflicts with another policy or protocol", whyCited: "Steps or limits differ between two documents in force.", severity: "major" },
    { issue: "Staff not trained on the current version", whyCited: "No training record for the version in force.", severity: "major" },
  ],

  requiredElements: [
    "Title, version and effective date",
    "Approval by the responsible person",
    "Purpose and scope",
    "Who may perform it and required training",
    "Equipment or materials",
    "Numbered steps in order",
    "When to stop and escalate, with contacts",
    "Documentation required afterwards",
    "Review date",
  ],

  deadlineRules: [
    // STARTER VALUE: set the review interval your program requires.
    {
      key: "protocol-review",
      label: "Protocol review",
      every: { months: 12 },
      anchor: "The effective date, or the most recent review or revision date if recorded (use the later).",
      statedKinds: ["review_due"],
    },
  ],

  crossChecks: [
    { with: "training-record", rule: "Staff performing the task need training on the current version recorded before they perform it." },
  ],

  answerGuidance:
    "Give steps as a numbered list in their exact order. State the version and effective date of the protocol you are quoting. If two protocols disagree, name both and do not choose one.",

  extra: {},
};
