// STARTER CONTENT. Generic and jurisdiction-neutral. Replace the course
// names, hours and renewal periods with what YOUR program requires.

export const trainingRecord = {
  key: "training-record",
  name: "Staff Training Record",
  abbreviation: "TR",
  version: 1,

  identity:
    "A record of required and completed staff training, either one sheet per employee or one tracker for the whole team. Each entry is a course, the date it was completed, and when it expires or must be renewed. It holds staff information only.",

  contains: {
    summary:
      "For each staff member, the courses they completed and the dates that show whether each is still current.",
    fields: [
      "Staff member name",
      "Role and hire date",
      "Course name",
      "Completion date",
      "Hours",
      "Trainer or source",
      "Expiry or renewal due date",
    ],
    dates: [
      { name: "Hire date", meaning: "First day of employment. Orientation training is measured from it." },
      { name: "Completion date", meaning: "The day a course was finished." },
      { name: "Expiry or renewal date", meaning: "The day the training stops counting. Expired training is treated as no training." },
    ],
  },

  purpose:
    "It exists to prove staff were trained before doing tasks that need training, and that renewals stayed current.",

  businessImpact:
    "Training gaps are among the most frequent and easiest-to-prove findings. Staff with lapsed training may not be allowed to work certain tasks or shifts alone, which creates scheduling gaps.",

  valueChangeRisks: [
    { field: "Completion and expiry dates", risk: "These decide whether the staff member was qualified on a given day." },
    { field: "Course name and hours", risk: "Must match what the requirement specifies. Near-equivalents are often not accepted." },
    { field: "Staff name", risk: "Must match the delegation book and rosters for the same person." },
  ],

  strictness: {
    level: "strict",
    notes: "Dates and hours must be exact and backed by a certificate or sign-in. Expired training counts as none.",
  },

  licensorView:
    "Auditors pick staff and shifts, then check for current, relevant training on that date, including orientation timing.",

  citationView:
    "A finding names the staff member, the required course, and the date it was missing or had expired.",

  commonCitations: [
    { issue: "Required training missing or expired on the date work was performed", whyCited: "No current completion for the task.", severity: "major" },
    { issue: "Training not completed before the first unsupervised shift", whyCited: "Completion date is after the hire date.", severity: "major" },
    { issue: "Hours below the required minimum", whyCited: "Recorded hours do not meet the standard.", severity: "minor" },
    { issue: "No expiry or renewal date recorded", whyCited: "Whether the training is current cannot be shown.", severity: "minor" },
  ],

  requiredElements: [
    "Staff member name and hire date",
    "Each required course with completion date and hours",
    "Expiry or renewal due date",
    "Trainer or source",
  ],

  // Training sheets usually state their own expiry dates, which are picked up
  // automatically. Add a rule here only if some courses carry no expiry.
  deadlineRules: [],

  crossChecks: [
    { with: "delegation-book", rule: "Staff with a delegation should have matching, current training recorded." },
  ],

  answerGuidance:
    "Name the staff member, the course and the exact dates. Say whether training was current on a stated date. If a course has no entry, say it is not recorded.",

  extra: {},
};
