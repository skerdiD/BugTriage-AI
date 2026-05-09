import { redactSensitiveText } from "@/lib/security/redaction";

function normalizeMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "";
  }

  return redactSensitiveText(error.message).toLowerCase();
}

export function getSafeAuthClientErrorMessage(
  error: unknown,
  action: "login" | "signup"
) {
  const message = normalizeMessage(error);

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return "Invalid email or password.";
  }

  if (message.includes("email not confirmed")) {
    return "Check your email and confirm your account before signing in.";
  }

  if (message.includes("user already registered")) {
    return "An account with that email already exists. Try signing in instead.";
  }

  if (
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("over_email_send_rate_limit")
  ) {
    return action === "signup"
      ? "Too many signup attempts right now. Please wait a moment and try again."
      : "Too many sign-in attempts right now. Please wait a moment and try again.";
  }

  if (action === "signup") {
    return "Something went wrong while creating your account.";
  }

  return "Something went wrong while signing in.";
}
