// STARTER CONTENT. Generic and jurisdiction-neutral. Replace the interval
// and sections with how YOUR safety or house meetings are run and recorded.

export const safetyHouseMeeting = {
  key: "safety-house-meeting",
  name: "Safety / House Meeting",
  abbreviation: "MTG",
  version: 1,

  identity:
    "The minutes or log of the regular safety meeting or house meeting held at the home. It records when the meeting happened, who attended, what safety topics were covered, and any actions agreed. It covers the home as a whole and should not contain client information.",

  contains: {
    summary:
      "One entry per meeting: the date, attendees, topics discussed, and follow-up actions with owners and due dates.",
    fields: [
      "Meeting date",
      "Attendees (staff, sign-in)",
      "Topics covered (for example fire safety, emergency procedures, hazards)",
      "Issues or hazards raised",
      "Action items with owner and due date",
      "Name of person who ran the meeting",
    ],
    dates: [
      { name: "Meeting date", meaning: "The day the meeting took place. The next meeting is counted from the most recent one." },
      { name: "Action due date", meaning: "The day an action agreed at the meeting must be finished." },
      { name: "Sign-in date", meaning: "The date a staff member signed the attendance sheet, which should match the meeting date." },
    ],
  },

  purpose:
    "It exists to show the home regularly reviews safety, that staff are kept informed, and that problems raised are followed up and fixed.",

  businessImpact:
    "Missed meetings, missing sign-ins, or actions that never get closed are easy findings and, when a hazard stays unfixed, a real safety and liability risk.",

  valueChangeRisks: [
    { field: "Meeting date", risk: "Frequency is checked from these dates. A wrong date can hide or create a gap." },
    { field: "Attendees", risk: "Staff who missed the meeting may need to be briefed separately." },
    { field: "Action items and due dates", risk: "An action with no owner or no due date tends not to be done." },
  ],

  strictness: {
    level: "moderate",
    notes: "Dates and attendance must be exact. Topic notes can be brief but must name real topics and real actions.",
  },

  licensorView:
    "Auditors check that meetings happen at the required frequency, that attendance is recorded, that required safety topics are covered over time, and that raised issues were followed up.",

  citationView:
    "A finding states the required frequency, lists the period reviewed, and identifies the missed meeting, missing sign-ins or open action.",

  commonCitations: [
    { issue: "Meetings not held at the required frequency", whyCited: "Dates show a gap longer than the standard.", severity: "major" },
    { issue: "No attendance record", whyCited: "Who was present cannot be shown.", severity: "minor" },
    { issue: "Action item with no owner or never closed", whyCited: "A raised issue has no recorded follow-up.", severity: "major" },
    { issue: "Required safety topic never covered", whyCited: "A mandated topic does not appear in any minutes.", severity: "minor" },
  ],

  requiredElements: [
    "Meeting date",
    "Attendees with sign-in",
    "Topics covered",
    "Action items with owner and due date",
    "Who ran the meeting",
  ],

  deadlineRules: [
    // STARTER VALUE: set the meeting frequency your program requires.
    {
      key: "next-meeting",
      label: "Next safety meeting",
      every: { months: 1 },
      perItem: false,
      anchor: "The date of the most recent meeting recorded (the latest meeting date).",
      statedKinds: [],
    },
  ],

  crossChecks: [
    { with: "drill-log", rule: "Drills and emergency procedures discussed at meetings should line up with the drill log." },
    { with: "training-record", rule: "Staff who attended safety topics may have matching training recorded." },
  ],

  answerGuidance:
    "Give meeting dates exactly and say how many days ago the last one was when asked about frequency. List open actions with owner and due date. If a date is missing, say so.",

  extra: {},
};
