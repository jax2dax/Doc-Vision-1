// STARTER CONTENT. Generic and jurisdiction-neutral. Replace with your
// own risk categories, review triggers and citation patterns.

export const safetyPlan = {
  key: "safety-plan",
  name: "Safety Plan",
  abbreviation: "SAFE",
  version: 1,

  identity:
    "An individual's plan for a specific known risk, such as elopement, choking, seizures, falls, self-injury or fire evacuation. It names the risk, the warning signs, what staff do to prevent it, and exactly what to do if it happens, including who to call. It is short, practical and written to be followed in a crisis.",

  purpose:
    "It exists so every staff member responds to a known risk the same safe way, without having to improvise, and so the provider can show it identified and planned for the risk.",

  businessImpact:
    "A foreseeable harm with no plan, or a plan staff did not follow, is a serious liability and a critical citation. Safety plans are also the first thing reviewed after a serious incident.",

  valueChangeRisks: [
    { field: "Risk description and triggers", risk: "If wrong or outdated, staff watch for the wrong things." },
    { field: "Emergency steps and their order", risk: "Staff act from these in a crisis. A wrong or reordered step can cause harm." },
    { field: "Emergency contacts and numbers", risk: "A wrong number during an emergency delays help." },
    { field: "Level of supervision required", risk: "Must agree with the ISP and with actual staffing." },
    { field: "Review date and trigger events", risk: "A plan not updated after an incident or change in condition is no longer reliable." },
  ],

  strictness: {
    level: "strict",
    notes:
      "Steps, contacts and supervision requirements must be exact, current and consistent with other documents. Language must be plain enough to follow under stress.",
  },

  licensorView:
    "Reviewers check that every known risk has a plan, the plan is specific and current, staff are trained on it, and that incidents show it being followed. After an incident they ask whether the plan existed and worked.",

  citationView:
    "Citations state the identified risk, note the missing, outdated or unfollowed plan, and tie it to a date or incident: for example, a known elopement risk with no plan in place, or an incident where staff did not follow the written steps.",

  commonCitations: [
    { issue: "Known risk with no written safety plan", whyCited: "A foreseeable risk was documented elsewhere but no plan exists.", severity: "critical" },
    { issue: "Plan not followed during an incident", whyCited: "Incident report shows steps different from the plan.", severity: "critical" },
    { issue: "Plan not reviewed after an incident or change in condition", whyCited: "Review date passed or no update followed a relevant event.", severity: "major" },
    { issue: "Steps vague or missing emergency contacts", whyCited: "Staff cannot follow it in a crisis.", severity: "major" },
    { issue: "Staff not trained on the plan", whyCited: "No training record for staff supporting the individual.", severity: "major" },
  ],

  requiredElements: [
    "Individual's name and plan dates",
    "Specific risk and how it shows up",
    "Triggers and early warning signs",
    "Preventive actions and supervision level",
    "Step-by-step emergency response",
    "Emergency contacts with numbers",
    "Who must be notified afterwards",
    "Review date and events that trigger a review",
  ],

  deadlineRules: [
    // STARTER VALUE: set the review interval your program requires.
    {
      key: "safety-plan-review",
      label: "Safety plan review",
      every: { months: 12 },
      anchor: "The plan effective date, or the most recent review date if recorded (use the later).",
      statedKinds: ["review_due"],
    },
  ],

  crossChecks: [
    { with: "isp", rule: "Risks and supervision in the safety plan must match the ISP's health and safety section." },
    { with: "incident-report", rule: "Staff response in an incident must match the plan's steps, and a relevant incident should trigger a plan review." },
    { with: "training-record", rule: "Staff supporting this person need documented training on the plan." },
  ],

  answerGuidance:
    "Quote emergency steps in order and contacts exactly. In urgent situations lead with the steps. If the plan does not cover the situation described, say so plainly rather than inventing steps.",

  extra: {},
};
