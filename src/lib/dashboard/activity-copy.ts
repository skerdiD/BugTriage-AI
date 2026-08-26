const updatedDraftTitles = new Set([
  "AI analysis regenerated",
  "AI triage regenerated",
]);

const readyDraftTitles = new Set([
  "AI analysis completed",
  "AI triage completed",
]);

export function presentTicketActivityCopy(
  title: string,
  description: string | null
) {
  const presentedTitle = updatedDraftTitles.has(title)
    ? "AI triage updated"
    : readyDraftTitles.has(title)
      ? "AI triage ready"
      : title;

  let presentedDescription = description ?? "A ticket change was recorded.";

  if (presentedDescription.startsWith("AI ")) {
    presentedDescription = `AI triage ${presentedDescription.slice(3)}`;
  } else if (presentedDescription === "Background AI triage completed successfully.") {
    presentedDescription = "AI triage is ready for review.";
  } else if (presentedDescription === "Severity classified as Critical with high confidence.") {
    presentedDescription = "AI triage marked this as Critical with high confidence.";
  }

  return {
    title: presentedTitle,
    description: presentedDescription,
  };
}
