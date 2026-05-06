import { NextResponse } from "next/server";

import {
  authCallbackProtection,
  getArcjetDeniedMessage,
  logArcjetError,
} from "@/lib/security/arcjet";
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
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
