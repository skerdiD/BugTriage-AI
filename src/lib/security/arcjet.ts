import arcjet, {
  detectBot,
  fixedWindow,
  shield,
  type ArcjetDecision,
} from "@arcjet/next";

const arcjetKey = process.env.ARCJET_KEY;

const arcjetMode: "LIVE" | "DRY_RUN" =
  process.env.NODE_ENV === "production" ? "LIVE" : "DRY_RUN";

type LocalProtectionDecision = {
  isDenied(): boolean;
  isErrored(): boolean;
  reason: {
    message: string;
    isRateLimit(): boolean;
    isBot(): boolean;
    isShield(): boolean;
  };
};

type ProtectionDecision = ArcjetDecision | LocalProtectionDecision;
type ProtectInput = Request | { headers?: Headers | Record<string, string | string[] | undefined> };

const localWindowStore = new Map<string, { count: number; resetAt: number }>();

function createAllowedDecision(): LocalProtectionDecision {
  return {
    isDenied: () => false,
    isErrored: () => false,
    reason: {
      message: "Allowed by local protection fallback.",
      isRateLimit: () => false,
      isBot: () => false,
      isShield: () => false,
    },
  };
}

function createDeniedDecision(message: string): LocalProtectionDecision {
  return {
    isDenied: () => true,
    isErrored: () => false,
    reason: {
      message,
      isRateLimit: () => true,
      isBot: () => false,
      isShield: () => false,
    },
  };
}

function readHeader(
  headers: ProtectInput["headers"],
  key: string
) {
  if (!headers) {
    return undefined;
  }

  if (headers instanceof Headers) {
    return headers.get(key) ?? undefined;
  }

  const value = headers[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getRequestKey(request: ProtectInput, userId?: string) {
  if (userId) {
    return `user:${userId}`;
  }

  const forwardedFor = readHeader(request.headers, "x-forwarded-for");
  const realIp = readHeader(request.headers, "x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";

  return `ip:${ip}`;
}

function protectWithLocalFixedWindow(
  request: ProtectInput,
  key: string,
  windowMs: number,
  max: number
) {
  const now = Date.now();
  const bucket = localWindowStore.get(key);

  if (!bucket || bucket.resetAt <= now) {
    localWindowStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return createAllowedDecision();
  }

  if (bucket.count >= max) {
    return createDeniedDecision("Too many requests. Please wait a few minutes and try again.");
  }

  bucket.count += 1;
  localWindowStore.set(key, bucket);

  return createAllowedDecision();
}

const arcjetAuthCallbackProtection = arcjetKey
  ? arcjet({
      key: arcjetKey,
      rules: [
        shield({
          mode: arcjetMode,
        }),
      ],
    })
  : null;

const arcjetBugSubmissionProtection = arcjetKey
  ? arcjet({
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
    })
  : null;

const arcjetGitHubIssueExportProtection = arcjetKey
  ? arcjet({
      key: arcjetKey,
      characteristics: ["userId"],
      rules: [
        shield({
          mode: arcjetMode,
        }),
        fixedWindow({
          mode: arcjetMode,
          window: "10m",
          max: 12,
        }),
      ],
    })
  : null;

export const authCallbackProtection = {
  protect: async (request: ProtectInput): Promise<ProtectionDecision> => {
    if (arcjetAuthCallbackProtection) {
      return arcjetAuthCallbackProtection.protect(request as Request);
    }

    return createAllowedDecision();
  },
};

export const bugSubmissionProtection = {
  protect: async (
    request: ProtectInput,
    details: { userId: string }
  ): Promise<ProtectionDecision> => {
    if (arcjetBugSubmissionProtection) {
      return arcjetBugSubmissionProtection.protect(request as Request, details);
    }

    return protectWithLocalFixedWindow(
      request,
      getRequestKey(request, details.userId),
      10 * 60 * 1000,
      6
    );
  },
};

export const githubIssueExportProtection = {
  protect: async (
    request: ProtectInput,
    details: { userId: string }
  ): Promise<ProtectionDecision> => {
    if (arcjetGitHubIssueExportProtection) {
      return arcjetGitHubIssueExportProtection.protect(request as Request, details);
    }

    return protectWithLocalFixedWindow(
      request,
      getRequestKey(request, details.userId),
      10 * 60 * 1000,
      12
    );
  },
};

function getDecisionMessage(decision: ProtectionDecision) {
  const maybeMessage =
    "message" in decision.reason && typeof decision.reason.message === "string"
      ? decision.reason.message
      : undefined;

  return maybeMessage ?? "Arcjet request inspection errored.";
}

export function logArcjetError(context: string, decision: ProtectionDecision) {
  if (!decision.isErrored()) {
    return;
  }

  console.error(`[arcjet:${context}] ${getDecisionMessage(decision)}`);
}

export function getArcjetDeniedMessage(
  decision: ProtectionDecision,
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
