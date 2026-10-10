// STARTER CONTENT. Generic and jurisdiction-neutral. Replace with your
// own medication rules, error-reporting timelines and citation patterns.

export const mar = {
  key: "mar",
  name: "Medication Administration Record",
  abbreviation: "MAR",
  version: 1,

  identity:
    "The running record of every medication an individual is prescribed and every dose given, refused, missed or held. It lists drug, dose, route, time and prescriber, and each administration is initialled by the staff who gave it. It is a legal health record.",

  purpose:
    "It exists to prove the right person got the right medication, dose, route and time, and to make errors visible and correctable. It is the primary evidence of safe medication practice.",

  businessImpact:
    "Medication errors and undocumented doses are a top source of citations and harm. Gaps can mean sanctions, required corrective action, staff retraining and liability for injury. It is checked in almost every inspection.",

  valueChangeRisks: [
    { field: "Drug name, dose, route, frequency", risk: "Must match the current prescriber order exactly. A mismatch is a medication error." },
    { field: "Administration times", risk: "Doses outside the allowed window are errors even if given." },
    { field: "Initials and signature key", risk: "Blank initials mean the dose is treated as not given. Unidentified initials cannot be attributed." },
    { field: "Allergies and special instructions", risk: "Missing or wrong entries are a direct safety risk." },
    { field: "PRN reason and effect", risk: "PRN doses need the reason given and the result recorded." },
  ],

  strictness: {
    level: "strict",
    notes:
      "Every field must be exact and complete. No blank administration boxes, no overwritten entries; corrections are dated, initialled additions. Orders must match prescriber instructions word for word.",
  },

  licensorView:
    "Reviewers compare the MAR to prescriber orders and to the medication on hand, count blanks, check PRN documentation, check errors were reported and reviewed, and confirm only trained staff administered.",

  citationView:
    "Citations list specific dates and drugs: for example, a dose with no initials on a given date, or a MAR entry that differs from the order. They state the requirement, the entry found and the gap. Blank boxes are cited per occurrence.",

  commonCitations: [
    { issue: "Blank administration boxes (undocumented doses)", whyCited: "No initials, so the dose cannot be shown to have been given.", severity: "major" },
    { issue: "MAR entry does not match the prescriber order", whyCited: "Dose, route, time or frequency differs from the order.", severity: "critical" },
    { issue: "PRN given without documented reason or result", whyCited: "No evidence the PRN was appropriate or effective.", severity: "major" },
    { issue: "Medication error not reported or reviewed", whyCited: "Error appears on the MAR with no matching report or follow-up.", severity: "critical" },
    { issue: "Initials not identifiable", whyCited: "Initials do not match the signature key.", severity: "minor" },
  ],

  requiredElements: [
    "Individual's name, date of birth and allergies",
    "Each medication: name, dose, route, frequency, prescriber",
    "Start date and stop or review date",
    "Time and initials for every scheduled dose",
    "Signature key identifying each set of initials",
    "PRN reason given and effect recorded",
    "Refused, missed or held doses with reason",
  ],

  crossChecks: [
    { with: "isp", rule: "Medication and health supports in the ISP must match the MAR." },
    { with: "incident-report", rule: "Any medication error visible on the MAR must have an incident report, and vice versa." },
    { with: "training-record", rule: "Everyone initialling the MAR must have current medication administration training on record." },
  ],

  answerGuidance:
    "Treat drug names, doses, routes and times as critical facts and quote them exactly. Never suggest a dose or change. If asked whether a dose was given, answer only from the record and say if the box is blank.",

  extra: {},
};
