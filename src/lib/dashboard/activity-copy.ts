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
    ? "Triage draft updated"
    : readyDraftTitles.has(title)
      ? "Triage draft ready"
      : title;

  let presentedDescription = description ?? "A ticket change was recorded.";

  if (presentedDescription.startsWith("AI ")) {
    presentedDescription = `The triage draft ${presentedDescription.slice(3)}`;
  } else if (presentedDescription === "Background AI triage completed successfully.") {
    presentedDescription = "The first triage draft is ready for review.";
  } else if (presentedDescription === "Severity classified as Critical with high confidence.") {
    presentedDescription = "The draft marked this as Critical with high confidence.";
  }

  return {
    title: presentedTitle,
    description: presentedDescription,
  };
}
