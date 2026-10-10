// STARTER CONTENT. Generic and jurisdiction-neutral. Replace with your
// own drill frequencies, timing standards and citation patterns.

export const drillLog = {
  key: "drill-log",
  name: "Emergency Drill Log",
  abbreviation: "DRILL",
  version: 1,

  identity:
    "A record of emergency drills (fire evacuation, severe weather, other required scenarios): date, time, shift, who took part, how long evacuation took, problems found and corrective action. Usually one entry per drill, kept for a set retention period.",

  purpose:
    "It exists to prove the home practises emergency response regularly, across shifts and conditions, and that problems found were fixed.",

  businessImpact:
    "Missed or poorly documented drills are easy citations and, in a real emergency, a life-safety and liability issue. Repeated failures can lead to restricted occupancy or licence action.",

  valueChangeRisks: [
    { field: "Drill date and time", risk: "Frequency and shift rotation are checked from these. A wrong date can create a gap that was not real, or hide one that was." },
    { field: "Evacuation time", risk: "Compared with the standard. Understating it is a serious accuracy problem." },
    { field: "Participants", risk: "Individuals and staff present must be listed, including anyone who did not take part and why." },
    { field: "Problems and corrective action", risk: "A problem with no recorded fix is cited as a failure to correct." },
  ],

  strictness: {
    level: "moderate",
    notes:
      "Dates, times and durations must be exact and plausible. Narrative fields can be brief but must name actual problems and actual fixes.",
  },

  licensorView:
    "Reviewers check required frequency, that drills rotate across shifts and times including sleeping hours, that every resident was accounted for, that times are reasonable, and that issues were corrected.",

  citationView:
    "Citations state the required frequency, list the period reviewed, and identify the missed drill or shift: for example, no drill documented on the overnight shift during a quarter. They are factual and countable.",

  commonCitations: [
    { issue: "Required drills not conducted at the required frequency", whyCited: "Dates show gaps longer than the standard.", severity: "major" },
    { issue: "Drills not rotated across shifts or times of day", whyCited: "All drills fall on the same shift.", severity: "minor" },
    { issue: "Problem found with no corrective action recorded", whyCited: "Issue noted but not resolved.", severity: "major" },
    { issue: "Individuals or staff not accounted for", whyCited: "Participant list incomplete or missing.", severity: "major" },
    { issue: "Evacuation time exceeds the standard without follow-up", whyCited: "Recorded time is too long and no action followed.", severity: "major" },
  ],

  requiredElements: [
    "Date, time and shift",
    "Type of drill",
    "Participants: individuals and staff",
    "Evacuation or response time",
    "Problems observed",
    "Corrective action and date",
    "Name and signature of person who ran the drill",
  ],

  crossChecks: [],

  // STARTER VALUE: set the drill frequency your license requires.
  deadlineRules: [
    {
      key: "next-drill",
      label: "Next emergency drill",
      every: { months: 3 },
      anchor: "The date of the most recent drill recorded in the log (the latest drill date).",
      statedKinds: [],
    },
  ],

  answerGuidance:
    "When asked about compliance, count the drills and state the gaps between dates. Do not assume a drill happened if there is no entry.",

  extra: {},
};
