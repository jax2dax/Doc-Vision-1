// STARTER CONTENT. Generic and jurisdiction-neutral. Replace with your
// own documentation rules and citation patterns.

export const dailyNote = {
  key: "daily-note",
  name: "Daily Progress Note",
  abbreviation: "DPN",
  version: 1,

  identity:
    "A dated, signed record by the staff on shift of what support an individual received and how they responded: activities, goals worked on, health, mood, behavior, and anything notable. It is the day-to-day evidence that the plan is being followed.",

  purpose:
    "It exists to show services were actually delivered as planned, to track progress toward goals, and to give the next shift and the team accurate information.",

  businessImpact:
    "Billing and compliance depend on it: a service with no supporting note is hard to defend as delivered. Notes that contradict the plan or other records raise questions about care and accuracy.",

  valueChangeRisks: [
    { field: "Date, shift and author", risk: "Notes must be attributable and timely. Late entries must be labelled as such." },
    { field: "Goals addressed", risk: "Notes that never mention goals suggest the plan is not being followed." },
    { field: "Health and behavior observations", risk: "Must match incident reports and medical follow-up." },
    { field: "Corrections", risk: "Overwriting looks like concealment. Corrections must be dated additions." },
  ],

  strictness: {
    level: "moderate",
    notes:
      "Dates, authors and factual observations must be exact. Wording can be natural but should be objective, specific and free of judgement.",
  },

  licensorView:
    "Reviewers sample notes against the ISP, incidents and billing: are they present for each day, signed, specific, tied to goals, and consistent with the rest of the record.",

  citationView:
    "Citations point to dates with no note, unsigned notes, or notes that contradict other records, and state that services cannot be shown as delivered. Copy-pasted notes are cited as not individualised.",

  commonCitations: [
    { issue: "Missing notes for dates services were billed", whyCited: "No documentation supports the service on that date.", severity: "major" },
    { issue: "Notes unsigned, undated or not attributable", whyCited: "Author and timing cannot be established.", severity: "minor" },
    { issue: "Notes identical across days or people", whyCited: "Appear copied, so not individualised.", severity: "minor" },
    { issue: "Note contradicts the incident report or plan", whyCited: "Records disagree about what happened or what was done.", severity: "major" },
    { issue: "No reference to plan goals", whyCited: "Progress toward goals cannot be shown.", severity: "minor" },
  ],

  requiredElements: [
    "Individual, date and shift",
    "Staff name and signature",
    "Support provided and activities",
    "Goals worked on and response",
    "Health, mood and behavior observations",
    "Anything notable or reportable",
  ],

  crossChecks: [
    { with: "isp", rule: "Notes should show the supports and goals the ISP sets, in the amount and frequency it authorises." },
    { with: "incident-report", rule: "An incident on a date should appear consistently in that day's note." },
  ],

  answerGuidance:
    "Report only what the notes say, with dates. If a date has no note, say there is no note rather than inferring what happened.",

  extra: {},
};
