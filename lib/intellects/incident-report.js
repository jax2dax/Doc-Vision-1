// STARTER CONTENT. Generic and jurisdiction-neutral. Replace with your
// own reporting rules, timelines and citation patterns.

export const incidentReport = {
  key: "incident-report",
  name: "Incident Report",
  abbreviation: "IR",
  version: 1,

  identity:
    "A factual, time-stamped record of an unusual or reportable event involving an individual or staff: injury, medication error, behavior event, missing person, allegation, restraint, property damage. Written by the staff who witnessed or discovered it, then reviewed by a supervisor.",

  purpose:
    "It exists to show the event was responded to safely, reported to the right parties within the required time, and reviewed so it is less likely to recur. It is also the main evidence of how the provider handles risk.",

  businessImpact:
    "Late, missing or inconsistent reports are among the most serious findings: they can lead to sanctions, mandatory corrective action and loss of trust with funders and families. Patterns across reports drive licensing attention.",

  valueChangeRisks: [
    { field: "Date / time of event vs date / time reported", risk: "The gap decides whether the reporting timeline was met. Errors here can turn a compliant report into a violation." },
    { field: "Injury description and treatment", risk: "Must match any medical record or follow-up. Understating or changing it later looks like concealment." },
    { field: "Who was notified and when", risk: "Notification evidence is required. Missing entries are cited even when the notification actually happened." },
    { field: "Intervention or restraint used", risk: "Must be an authorised method per the individual's plan, with duration and rationale." },
  ],

  strictness: {
    level: "strict",
    notes:
      "Facts, times and notifications must be exact. Narrative must be objective (what was seen and done), with no speculation or blame. Corrections must be dated additions, never overwrites.",
  },

  licensorView:
    "Reviewers read incident reports to test the whole system: was the person safe, was the response proportionate, was it reported on time, was the plan updated, and was there follow-up. They cross-check against the individual's plan and daily notes.",

  citationView:
    "Citations quote the required timeline or content, then show the actual dates or missing items from the report. Typical structure: event on date A, report completed on date B, notification to X not documented. Vague narrative and missing follow-up are cited as failure to ensure safety and review.",

  commonCitations: [
    { issue: "Report completed or submitted after the required deadline", whyCited: "Event time versus report time exceeds the allowed window.", severity: "major" },
    { issue: "Required notification not documented", whyCited: "No record of guardian, case manager or authority being told.", severity: "major" },
    { issue: "Narrative is subjective, vague or missing the sequence of events", whyCited: "Cannot reconstruct what happened or whether the response was appropriate.", severity: "minor" },
    { issue: "No supervisor review or follow-up actions", whyCited: "No evidence the event was reviewed or that prevention steps followed.", severity: "major" },
    { issue: "Intervention used is not authorised in the individual's plan", whyCited: "Method described does not match the plan.", severity: "critical" },
  ],

  requiredElements: [
    "Individual involved and staff involved",
    "Date, time and location of event",
    "Objective description of what happened, in order",
    "Injuries and treatment given",
    "Immediate response and interventions used",
    "Notifications: who, when, by whom",
    "Date/time report completed and by whom",
    "Supervisor review and follow-up actions",
  ],

  crossChecks: [
    { with: "isp", rule: "Interventions and supervision described must match what the ISP authorises. Repeated incidents of one kind should prompt an ISP review." },
  ],

  answerGuidance:
    "Treat times and notifications as critical facts and quote them exactly. When asked about timeliness, compute the gap between event and report and state it. Never soften or reinterpret what the report says happened.",

  extra: {},
};
