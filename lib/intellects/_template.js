// TEMPLATE for a new document type. Copy this file, rename it, fill in the
// fields, then register it in lib/intellects/index.js.
//
// These are for documents that do NOT hold client information: trackers,
// logs, meeting minutes, training and delegation records, policies.
//
// Everything is plain text the AI reads as knowledge about the document.
// More specific is better: real column names, real date meanings, real
// intervals. Empty fields are skipped, so start small and grow it.

export const TEMPLATE = {
  // Short unique id. Stored in the database, so never change it once used.
  key: "template",
  name: "Document Name",
  abbreviation: "DOC",
  // Bump when you change the content.
  version: 1,

  // What the document IS: who keeps it, what it is used for, how it is laid out.
  identity: "",

  // What it CONTAINS and what DATES it holds. This is what lets the AI
  // find the right column or section. One entry per kind of date.
  contains: {
    summary: "",
    // Typical columns or sections, e.g. "Employee name", "Delegation date".
    fields: [],
    // { name: "Delegation date", meaning: "The day the task was delegated to the employee." }
    dates: [],
  },

  // WHY it exists: the legal, regulatory or operational reason.
  purpose: "",

  // How it affects the business: licensure, audits, staffing.
  businessImpact: "",

  // Risk when specific values change or go missing.
  valueChangeRisks: [
    // { field: "Expiry date", risk: "A missed renewal means staff can't legally do the task." },
  ],

  // How strict the information is. level: "strict" | "moderate" | "flexible"
  strictness: { level: "moderate", notes: "" },

  // How licensors / auditors look at this document.
  licensorView: "",

  // How a finding about this document is written up.
  citationView: "",

  // Known ways this document gets cited. severity: "critical" | "major" | "minor"
  commonCitations: [
    // { issue: "Renewal date passed", whyCited: "The record shows it expired.", severity: "major" },
  ],

  // Elements that must be present for the document to be complete.
  requiredElements: [],

  // Relationships to OTHER document types (used when both are equipped).
  crossChecks: [
    // { with: "training-record", rule: "Everyone listed here needs matching training." },
  ],

  // Renewal rules. The Due dates tab finds the anchor date in the file and
  // adds the interval. A due date written in the file is picked up too.
  deadlineRules: [
    // {
    //   key: "annual-renewal",            // unique within this document type
    //   label: "Annual renewal",          // shown in the app
    //   every: { months: 12 },            // or { days: 90 }
    //   perItem: false,                   // true = one deadline per person/row (spreadsheets)
    //   anchor: "The date the item was last completed or renewed.",   // tells the AI which date to measure from
    //   statedKinds: ["expiry"],          // date kinds in the file that count as the stated due date
    // },
  ],

  // Rules for how the AI answers questions about this document type.
  answerGuidance: "",

  // Free-form extra sections: { "Title": "text or [list]" }
  extra: {},
};
