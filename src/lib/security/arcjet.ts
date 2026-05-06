import arcjet, {
  detectBot,
  fixedWindow,
  shield,
  type ArcjetDecision,
} from "@arcjet/next";

const arcjetKey = process.env.ARCJET_KEY;

if (!arcjetKey) {
  throw new Error("Missing ARCJET_KEY.");
}

const arcjetMode: "LIVE" | "DRY_RUN" =
  process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN";

export const authCallbackProtection = arcjet({
  key: arcjetKey,
  rules: [
    shield({
      mode: arcjetMode,
    }),
  ],
});

export const bugSubmissionProtection = arcjet({
  key: arcjetKey,
  characteristics: ["userId"],
  rules: [
    shield({
      mode: arcjetMode,
    }),
    detectBot({
      mode: arcjetMode,
      allow: [],
    }),
    fixedWindow({
      mode: arcjetMode,
      window: "10m",
      max: 6,
    }),
  ],
});

export function logArcjetError(context: string, decision: ArcjetDecision) {
  if (!decision.isErrored()) {
    return;
  }

  console.error(`[arcjet:${context}] ${decision.reason.message}`);
}

export function getArcjetDeniedMessage(
  decision: ArcjetDecision,
  fallback = "Request blocked by application security."
) {
  if (decision.reason.isRateLimit()) {
    return "Too many requests. Please wait a few minutes and try again.";
  }

  if (decision.reason.isBot()) {
    return "Automated requests are not allowed for this action.";
  }

  if (decision.reason.isShield()) {
    return "Your request was blocked by the application security policy.";
  }

  return fallback;
}
