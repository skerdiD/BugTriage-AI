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

function redirectToLogin(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  const redirectedFrom = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("redirectedFrom", redirectedFrom);

  return NextResponse.redirect(redirectUrl);
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
    return redirectToLogin(request);
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
    return redirectToLogin(request);
  }

  return supabaseResponse;
}
