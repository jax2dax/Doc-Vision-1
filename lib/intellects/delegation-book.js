// STARTER CONTENT. Generic and jurisdiction-neutral. Replace the
// intervals, column names and meanings with how YOUR delegation book works.

export const delegationBook = {
  key: "delegation-book",
  name: "Delegation Book",
  abbreviation: "DEL",
  version: 1,

  identity:
    "A tracker, usually a spreadsheet, of which staff members have been delegated which tasks (for example medication assistance or specific health tasks) and by whom. Each row is one staff member and one delegated task, with the dates it was delegated, last checked and due to be renewed. It holds staff information only, not client information.",

  contains: {
    summary:
      "One row per staff member per delegated task, with who delegated it and the dates that control whether the delegation is still valid.",
    fields: [
      "Staff member name",
      "Delegated task",
      "Delegating nurse or person",
      "Delegation date",
      "Last competency check or review date",
      "Renewal or expiry date",
      "Notes",
    ],
    dates: [
      { name: "Delegation date", meaning: "The day the task was first delegated to that staff member. Counting for renewal starts here unless a later review date exists." },
      { name: "Last review or competency check", meaning: "The most recent time the staff member was checked as still competent. If present, it replaces the delegation date as the starting point for renewal." },
      { name: "Renewal or expiry date", meaning: "The day the delegation stops being valid unless renewed. Staff must not perform the task after this date." },
    ],
  },

  purpose:
    "It exists to prove that every task needing delegation is performed only by staff who were properly delegated it, by an authorised person, and that the delegation is still current.",

  businessImpact:
    "A staff member performing a delegated task after the delegation lapsed is a compliance violation and a safety risk. Missed renewals also cause scheduling gaps when someone suddenly cannot do a task they were relied on for.",

  valueChangeRisks: [
    { field: "Renewal or expiry date", risk: "If it passes without renewal, the staff member must stop performing the task until it is renewed." },
    { field: "Delegated task", risk: "Delegation is task-specific. A new task needs its own delegation." },
    { field: "Delegating person", risk: "Must be someone authorised to delegate. A wrong or blank name weakens the record." },
    { field: "Staff name", risk: "Must match the training record for the same person." },
  ],

  strictness: {
    level: "strict",
    notes: "Names, tasks and dates must be exact. A blank date counts as no valid delegation.",
  },

  licensorView:
    "Auditors pick staff who performed a delegated task and check the book for a valid delegation on that date, then check the delegating person was authorised and the matching training exists.",

  citationView:
    "A finding names the task and the staff member, then shows the delegation date or expiry that does not cover the date the task was performed, or the missing delegation entirely.",

  commonCitations: [
    { issue: "Task performed after the delegation expired", whyCited: "Expiry date is earlier than the date the task was performed.", severity: "critical" },
    { issue: "No delegation on record for a staff member performing the task", whyCited: "Staff member is missing from the book.", severity: "critical" },
    { issue: "Delegation entry missing a date or delegating person", whyCited: "Validity cannot be shown.", severity: "major" },
    { issue: "Renewal overdue", whyCited: "Renewal date has passed with no new review recorded.", severity: "major" },
  ],

  requiredElements: [
    "Staff member name",
    "Delegated task",
    "Delegating person",
    "Delegation date",
    "Renewal or expiry date",
  ],

  deadlineRules: [
    // STARTER VALUE: set the renewal interval your program requires.
    {
      key: "delegation-renewal",
      label: "Delegation renewal",
      every: { months: 12 },
      perItem: true,
      anchor:
        "For EACH staff member and task row: the last review or competency check date if the row has one, otherwise the delegation date. Name the staff member and task in the label.",
      statedKinds: ["expiry", "review_due"],
    },
  ],

  crossChecks: [
    { with: "training-record", rule: "Every staff member with a delegation should have matching, current training recorded." },
  ],

  answerGuidance:
    "Always name the staff member, the task and the exact dates. When asked who is delegated for a task, list every matching row. If a date is blank, say it is blank rather than assuming.",

  extra: {},
};
