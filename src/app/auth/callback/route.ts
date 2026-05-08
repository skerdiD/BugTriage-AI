import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

import {
  authCallbackProtection,
  getArcjetDeniedMessage,
  logArcjetError,
} from "@/lib/security/arcjet";
import { getSafeRedirectPath } from "@/lib/security/urls";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const arcjetDecision = await authCallbackProtection.protect(request);

  logArcjetError("auth-callback", arcjetDecision);

  if (arcjetDecision.isDenied()) {
    return NextResponse.json(
      {
        error: getArcjetDeniedMessage(
          arcjetDecision,
          "Authentication callback blocked by application security."
        ),
      },
      {
        status: arcjetDecision.reason.isRateLimit() ? 429 : 403,
      }
    );
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createServerSupabaseClient();
    const exchangeResult = await supabase.auth.exchangeCodeForSession(code);
    const error = exchangeResult?.error;

    if (error) {
      Sentry.captureException(error, {
        tags: {
          area: "auth",
          action: "exchange-code-for-session",
        },
        extra: {
          hasCode: true,
          hasNextParam: requestUrl.searchParams.has("next"),
        },
      });
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
