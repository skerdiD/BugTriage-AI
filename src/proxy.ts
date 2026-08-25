import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/submit-bug/:path*",
    "/tickets/:path*",
    "/analytics/:path*",
    "/team/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
