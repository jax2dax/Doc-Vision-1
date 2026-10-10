// STARTER CONTENT. Generic and jurisdiction-neutral. Replace with your
// own rules, approval requirements and citation patterns.

export const bsp = {
  key: "bsp",
  name: "Behavior Support Plan",
  abbreviation: "BSP",
  version: 1,

  identity:
    "A written plan for one individual that describes challenging behavior, why it happens, how to prevent it, and exactly how staff should respond. It is built from an assessment of the behavior's function and sits alongside the ISP. Anything restrictive in it is high risk and tightly controlled.",

  purpose:
    "It exists so staff respond to behavior consistently, safely and with the least restrictive method that works, and so the individual's rights are protected whenever a restriction is used. It is the authority for any intervention beyond ordinary support.",

  businessImpact:
    "Restrictive practices without a valid, approved plan are among the most serious violations: they bring sanctions, mandatory reporting and loss of trust. A good plan reduces incidents, injuries and staff turnover. Staff acting outside it create direct liability.",

  valueChangeRisks: [
    { field: "Target behavior definitions", risk: "Vague or changed definitions make data meaningless and responses inconsistent." },
    { field: "Intervention steps and their order", risk: "Staff must follow the same sequence. A change needs team and required approval before staff use it." },
    { field: "Any restrictive or emergency procedure", risk: "Needs documented justification, consent, approval, limits on duration and a review schedule. Adding one informally is a rights violation." },
    { field: "Review and approval dates", risk: "An unapproved or lapsed plan cannot authorise restrictive methods." },
    { field: "Medication used for behavior", risk: "Must match prescriber orders and be tied to review by a qualified professional." },
  ],

  strictness: {
    level: "strict",
    notes:
      "Behavior definitions, intervention steps, approvals, consent and review dates must be exact. Preventive and teaching strategies can be written more flexibly but must be individualised.",
  },

  licensorView:
    "Reviewers look for an assessment behind the plan, least-restrictive reasoning, positive and preventive strategies before reactive ones, valid consent and approval, trained staff, and data showing the plan is reviewed and working.",

  citationView:
    "Citations name the intervention or gap, state the approval or consent that should have existed, and give the date and evidence. Typical form: a restrictive procedure was used on a date without a current approved plan authorising it, or the plan lacked a required element.",

  commonCitations: [
    { issue: "Restrictive procedure used without approval or consent on file", whyCited: "Plan, approval or consent is missing, expired or does not cover the method used.", severity: "critical" },
    { issue: "Plan not based on a documented assessment of behavior function", whyCited: "No assessment, so interventions cannot be justified.", severity: "major" },
    { issue: "Reactive strategies without preventive or teaching strategies", whyCited: "Plan relies on restriction rather than supports that address the cause.", severity: "major" },
    { issue: "No data collection or review of effectiveness", whyCited: "Nothing shows whether the plan works or should change.", severity: "major" },
    { issue: "Staff not trained on the plan", whyCited: "Training records do not show staff were trained before implementing.", severity: "major" },
  ],

  requiredElements: [
    "Individual's name and plan dates",
    "Operational definition of each target behavior",
    "Assessment summary: function and triggers",
    "Preventive and environmental strategies",
    "Replacement skills being taught",
    "Step-by-step response procedures",
    "Any restrictive procedure with justification, limits and duration",
    "Consent and required approvals with dates",
    "Data collection method and review schedule",
    "Staff training requirement",
  ],

  crossChecks: [
    { with: "isp", rule: "Restrictions and supervision in the BSP must match the ISP, and the ISP must reference the BSP." },
    { with: "incident-report", rule: "Interventions described in incident reports must be ones the BSP authorises, applied in the order it sets." },
    { with: "training-record", rule: "Every staff member implementing the BSP needs training on it recorded before they implement it." },
    { with: "daily-note", rule: "Daily notes should show the plan's preventive strategies in use and record behavior data consistently with it." },
  ],

  // STARTER VALUE: set the review interval your program requires.
  deadlineRules: [
    {
      key: "bsp-review",
      label: "Behavior Support Plan review",
      every: { months: 12 },
      anchor: "The plan effective or approval date, or the most recent review date if recorded (use the later).",
      statedKinds: ["review_due"],
    },
  ],

  answerGuidance:
    "Quote intervention steps in their exact order. Never describe a restrictive method as acceptable unless the plan authorises it. If the plan is silent on a situation, say so rather than improvising a response.",

  extra: {},
};
