// STARTER CONTENT. This is generic, jurisdiction-neutral knowledge so
// the system works on day one. Replace it with your own: the real
// rules, wording and citation patterns for your state and program.

export const isp = {
  key: "isp",
  name: "Individual Support Plan",
  abbreviation: "ISP",
  version: 1,

  identity:
    "The ISP is the central person-centred plan for one individual receiving services. It is written by the support team with the individual (and guardian where applicable), lists their goals, needs, supports and risks, and directs what staff actually do day to day. Other documents (daily notes, incident reports, behavior plans) are expected to line up with it.",

  purpose:
    "It exists so services are authorised, planned and delivered around the individual's assessed needs and choices, and so there is a single reviewable record of what support was agreed. It is the document that justifies the services being provided and billed.",

  businessImpact:
    "Services delivered or billed outside what the current ISP authorises are a funding and audit risk. A lapsed or unsigned ISP can stop billing, trigger repayment, and put the licence at risk. It is also the first document reviewers pull for any individual.",

  valueChangeRisks: [
    { field: "Level of supervision / staffing ratio", risk: "A change affects safety, staffing cost and rights. It needs team review and documented justification, and daily practice must change with it." },
    { field: "Service type, amount, frequency", risk: "Changes can put billing out of line with what is authorised." },
    { field: "Restrictions or rights limitations", risk: "Any restriction needs documented justification, consent and review. Adding or loosening one without process is a rights violation." },
    { field: "Medical or medication supports", risk: "Must match current orders and the medication administration record. A mismatch is a health and safety risk." },
    { field: "Goals and outcomes", risk: "Goals that no longer match the person's preferences make the plan hard to defend as person-centred." },
    { field: "Review and effective dates", risk: "Dates control whether the plan is current. A missed review window is a common finding." },
  ],

  strictness: {
    level: "strict",
    notes:
      "Dates, authorised services, signatures, restrictions and health supports must be exact and internally consistent. Goal wording can be flexible, but it must be specific enough to measure.",
  },

  licensorView:
    "Reviewers check that the plan is current, signed by the right people, reviewed on time, individualised rather than copy-pasted, and actually followed in practice. They compare the plan to daily documentation, incidents and observed care.",

  citationView:
    "A citation states the requirement, then the evidence found, then the gap. Wording is factual and tied to a specific individual and date, for example: the plan in effect did not include X, or there was no documentation Y was reviewed by the required date. Evidence beats opinion: a surveyor needs to point to a page, date or missing signature.",

  commonCitations: [
    { issue: "Plan expired or not reviewed within the required period", whyCited: "Dates on the plan show the review window was missed.", severity: "major" },
    { issue: "Missing or incomplete signatures / consent", whyCited: "Required participants did not sign or date, so agreement cannot be shown.", severity: "major" },
    { issue: "Restriction applied without documented justification and review", whyCited: "A rights limitation appears in practice or other documents but not in the plan with rationale.", severity: "critical" },
    { issue: "Goals are generic or identical to another person's plan", whyCited: "No evidence the plan is individualised.", severity: "minor" },
    { issue: "Plan does not match what staff are doing", whyCited: "Daily notes or incidents show supports that differ from the plan.", severity: "major" },
    { issue: "Health or medication support missing or outdated", whyCited: "Plan conflicts with current orders or omits a known need.", severity: "critical" },
  ],

  requiredElements: [
    "Individual's name and identifying information",
    "Effective date and review/expiry date",
    "Assessed needs and preferences",
    "Measurable goals or outcomes",
    "Services and supports: type, amount, frequency, provider",
    "Health, medication and safety supports",
    "Risks and how they are managed",
    "Any restrictions, with rationale, consent and review plan",
    "Team members and required signatures with dates",
  ],

  crossChecks: [
    { with: "incident-report", rule: "Any incident that shows an unmet need, injury pattern or restriction in use should be reflected in the ISP, or the ISP should be flagged for team review." },
    { with: "incident-report", rule: "Supervision or intervention described in an incident report must match the level and methods the ISP authorises." },
    { with: "bsp", rule: "Any behavior support or restriction in the ISP must be backed by a current, approved BSP, and the BSP must not exceed what the ISP authorises." },
    { with: "mar", rule: "Medication and health supports in the ISP must match the medications and orders on the MAR." },
    { with: "daily-note", rule: "Daily notes should show the supports and goals in the ISP being delivered at the authorised amount and frequency." },
  ],

  // How often this document must be renewed. The Due dates tab computes
  // the next deadline from the date found in the file. STARTER VALUES:
  // set the interval your program actually requires.
  deadlineRules: [
    {
      key: "annual-review",
      label: "Annual ISP review",
      every: { months: 12 },
      anchor: "The plan effective date, or the most recent review date if the document records one (use the later).",
      statedKinds: ["review_due"],
    },
  ],

  answerGuidance:
    "Quote dates, amounts and supervision levels exactly. If asked what staff should do, answer from the plan and say which section it comes from. If the plan is silent, say it is silent rather than assuming. Flag anything that looks expired.",

  extra: {},
};
