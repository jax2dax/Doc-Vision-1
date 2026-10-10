// STARTER CONTENT. Generic and jurisdiction-neutral. Replace with your
// own required courses, renewal periods and citation patterns.

export const trainingRecord = {
  key: "training-record",
  name: "Staff Training Record",
  abbreviation: "TR",
  version: 1,

  identity:
    "A per-employee record of required and completed training: course, date, hours, trainer or source, and expiry or renewal date. It is kept with the personnel file and used to show staff were qualified for the work they did on any given day.",

  purpose:
    "It exists to prove staff were trained before doing tasks that need training (medication, behavior supports, first aid, rights, individual-specific plans) and that renewals stayed current.",

  businessImpact:
    "Training gaps are among the most frequent and easiest-to-prove citations. They can also invalidate the work: a dose given or an intervention used by untrained staff becomes a larger violation. Gaps affect staffing because untrained staff may not be allowed to work alone.",

  valueChangeRisks: [
    { field: "Completion and expiry dates", risk: "These decide whether the staff member was qualified on a given shift." },
    { field: "Course name and hours", risk: "Must match what the requirement specifies. Near-equivalents are often not accepted." },
    { field: "Individual-specific training", risk: "Training on a person's plan must come before implementing it, not after." },
  ],

  strictness: {
    level: "strict",
    notes:
      "Dates and hours must be exact and supported by a certificate or sign-in. Expired training counts as no training.",
  },

  licensorView:
    "Reviewers pick staff who worked specific shifts or performed specific tasks, then check the record for current, relevant training on that date. They also check orientation timing and individual-specific training.",

  citationView:
    "Citations name the employee (by identifier), the required training, and the date it was missing or expired, usually tied to a task performed. They often cite per employee and per course.",

  commonCitations: [
    { issue: "Required training missing or expired on the date work was performed", whyCited: "Record shows no current completion for the task.", severity: "major" },
    { issue: "Training not completed before first unsupervised shift", whyCited: "Completion date is after the hire or first shift date.", severity: "major" },
    { issue: "No individual-specific training on a plan staff implement", whyCited: "No record of training on that person's plan.", severity: "major" },
    { issue: "Hours below the required minimum", whyCited: "Recorded hours do not meet the standard.", severity: "minor" },
    { issue: "No supporting certificate or sign-in", whyCited: "Entry cannot be verified.", severity: "minor" },
  ],

  requiredElements: [
    "Employee name, role and hire date",
    "Each required course with completion date and hours",
    "Trainer or source",
    "Expiry or renewal due date",
    "Individual-specific trainings with dates",
    "Supporting certificate or sign-in reference",
  ],

  crossChecks: [
    { with: "mar", rule: "Staff initialling the MAR need current medication training." },
    { with: "bsp", rule: "Staff implementing a BSP need documented training on that plan first." },
    { with: "incident-report", rule: "Staff involved in an incident should hold the training for any intervention they used." },
  ],

  answerGuidance:
    "State dates exactly and say whether training was current on a stated date. If a course has no entry, say it is not recorded rather than assuming it was done.",

  extra: {},
};
