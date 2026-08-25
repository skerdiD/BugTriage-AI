export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/dashboard"
) {
  if (!candidate) {
    return fallback;
  }

  const value = candidate.trim();

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001F\u007F]/.test(value)
  ) {
    return fallback;
  }

  return value;
}

export function getAuthPageHref(
  page: "/login" | "/signup",
  redirectedFrom: string | null | undefined
) {
  const params = new URLSearchParams({
    redirectedFrom: getSafeRedirectPath(redirectedFrom),
  });

  return `${page}?${params.toString()}`;
}
