const structuredSecretPatterns: Array<[RegExp, string]> = [
  [/(bearer\s+)[a-z0-9\-._~+/]+=*/gi, "$1[REDACTED]"],
  [/\b(password|passwd|pwd)\b\s*[:=]\s*([^\s]+)/gi, "$1=[REDACTED]"],
  [/\b(api[_-]?key|secret|token|access[_-]?token|refresh[_-]?token)\b\s*[:=]\s*([^\s]+)/gi, "$1=[REDACTED]"],
  [/\b(?:postgres|postgresql|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"'`]+/gi, "[REDACTED_DATABASE_URL]"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
];

const querySecretPatterns: Array<[RegExp, string]> = [
  [/([?&](?:token|access_token|refresh_token|api_key|apikey|password|secret)=)[^&\s]+/gi, "$1[REDACTED]"],
];

function redactTokenLikeMatch(value: string) {
  return value.replace(/[A-Za-z0-9._-]{32,}/g, (match) => {
    const hasLetter = /[A-Za-z]/.test(match);
    const hasDigit = /\d/.test(match);

    if (!hasLetter || !hasDigit) {
      return match;
    }

    return "[REDACTED_TOKEN]";
  });
}

export function redactSensitiveText(value: string) {
  let redacted = value;

  for (const [pattern, replacement] of structuredSecretPatterns) {
    redacted = redacted.replace(pattern, replacement);
  }

  for (const [pattern, replacement] of querySecretPatterns) {
    redacted = redacted.replace(pattern, replacement);
  }

  return redactTokenLikeMatch(redacted);
}

export function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return redactSensitiveText(error.stack ?? error.message);
  }

  return "Unknown error";
}
