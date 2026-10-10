// Shared by the server (to validate) and the browser (to render buttons).
export const CHECK_TYPES = [
  {
    key: "review",
    label: "Document review",
    description:
      "Checks the document against what its type requires: missing elements, unclear or inconsistent values, and risky wording. Also compares it with your other equipped documents.",
  },
  {
    key: "citation_test",
    label: "Simulated citation test",
    description:
      "Plays a licensor reviewing this document. Lists what would likely be cited, written the way a citation is written, with severity and how to fix it.",
  },
];

export const SEVERITY_ORDER = ["critical", "major", "minor", "observation"];
