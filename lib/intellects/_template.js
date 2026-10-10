// TEMPLATE for a new intellect. Copy this file, rename it (e.g. rit.js),
// fill in every field, then register it in lib/intellects/index.js.
//
// Everything here is plain text the AI reads as expert knowledge about
// the document type. Write it the way you would brief a new compliance
// lead. More specific is better: real field names, real thresholds,
// real wording surveyors use. Empty fields are skipped, so you can
// start small and grow an intellect over time.
//
// Add any extra field you like under `extra`, it is rendered as a
// titled section automatically.

export const TEMPLATE = {
  // Short unique id. Stored in the database, so never change it once used.
  key: "template",
  name: "Document Name",
  abbreviation: "DOC",
  // Bump when you change the content (shown in check results).
  version: 1,

  // What the document IS: its identity, who writes it, who reads it, how often it changes.
  identity: "",

  // WHY it exists: the legal, regulatory or care reason behind it.
  purpose: "",

  // How it affects the business: funding, billing, licensure, liability, staffing.
  businessImpact: "",

  // Risk when specific values change. One entry per field or value that matters.
  valueChangeRisks: [
    // { field: "Level of supervision", risk: "Changing this without a team review is a rights and safety issue." },
  ],

  // How strict the information is. level: "strict" | "moderate" | "flexible"
  strictness: {
    level: "moderate",
    notes: "",
  },

  // How licensors / regulators see this document and what they look for first.
  licensorView: "",

  // How a citation (deficiency) is written for this document: the shape,
  // the wording, what evidence a surveyor needs to cite it.
  citationView: "",

  // Known ways this document gets cited. severity: "critical" | "major" | "minor"
  commonCitations: [
    // { issue: "Plan not reviewed by due date", whyCited: "Required review window missed.", severity: "major" },
  ],

  // Elements that must be present for the document to be complete.
  requiredElements: [],

  // Relationships to OTHER document types. Used when several intellects
  // are equipped. `with` is the other intellect's key.
  crossChecks: [
    // { with: "isp", rule: "Every restriction named here must appear in the ISP with the same wording." },
  ],

  // Renewal rules. Each rule says how often this document must be renewed;
  // the Due dates tab finds the anchor date in the uploaded file and
  // adds the interval to get the deadline. Leave empty if there is no
  // recurring requirement (a due date written in the file is still picked up).
  deadlineRules: [
    // {
    //   key: "annual-review",                  // unique within this intellect
    //   label: "Annual review",                // shown in the app
    //   every: { months: 12 },                 // or { days: 90 }
    //   anchor: "The effective date, or the latest review date if recorded.",  // tells the AI which date to measure from
    //   statedKinds: ["review_due"],           // date kinds in the file that count as the stated due date
    // },
  ],

  // Rules for how the AI should answer questions about this document type.
  answerGuidance: "",

  // Free-form extra sections: { "Title": "text or [list]" }
  extra: {},
};
