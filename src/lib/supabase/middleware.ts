import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

const protectedRoutes = [
  "/dashboard",
  "/submit-bug",
  "/tickets",
  "/analytics",
  "/team",
  "/profile",
  "/settings",
];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Public pages, especially login and signup, must stay available when the
  // external Auth service is degraded. Session verification is only needed at
  // the protected-route boundary.
  if (!isProtectedRoute(pathname)) {
    return supabaseResponse;
  }

  let supabaseUrl: string;
  let supabaseAnonKey: string;

  try {
    supabaseUrl = getSupabaseUrl();
    supabaseAnonKey = getSupabasePublishableKey();
  } catch {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let hasValidSession = false;

  try {
    // getClaims verifies the JWT signature and caches asymmetric signing keys,
    // avoiding a Supabase Auth network round-trip on most navigations.
    const { data, error } = await supabase.auth.getClaims();
    hasValidSession = Boolean(data?.claims.sub && !error);
  } catch {
    hasValidSession = false;
  }

  if (!hasValidSession) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
