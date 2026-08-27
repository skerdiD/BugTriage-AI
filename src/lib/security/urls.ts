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

export function getSafeGitHubIssueUrl(
  candidate: string | null | undefined,
  expectedIssueNumber?: number | null
) {
  if (!candidate) {
    return null;
  }

  try {
    const url = new URL(candidate.trim());
    const issuePath = url.pathname.match(/^\/[^/]+\/[^/]+\/issues\/(\d+)$/i);
    const issueNumber = issuePath ? Number(issuePath[1]) : Number.NaN;

    if (
      url.protocol !== "https:" ||
      url.hostname.toLowerCase() !== "github.com" ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !Number.isSafeInteger(issueNumber) ||
      issueNumber < 1 ||
      (expectedIssueNumber != null && issueNumber !== expectedIssueNumber)
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}
