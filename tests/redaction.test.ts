import { describe, expect, it } from "vitest";

import { redactSensitiveText } from "@/lib/security/redaction";

describe("redactSensitiveText", () => {
  it("redacts common secrets and private keys from diagnostic text", () => {
    const input = `
      Authorization: Bearer abcdef1234567890TOKEN0987654321
      password=super-secret-password
      DATABASE_URL=postgresql://user:pass@db.example.com:5432/app
      GitHub token ghp_secret_token_value
      -----BEGIN PRIVATE KEY-----
      very-secret-private-key
      -----END PRIVATE KEY-----
    `;

    const result = redactSensitiveText(input);

    expect(result).not.toContain("super-secret-password");
    expect(result).not.toContain("postgresql://user:pass@db.example.com:5432/app");
    expect(result).not.toContain("very-secret-private-key");
    expect(result).not.toContain("ghp_secret_token_value");
    expect(result).toContain("Bearer [REDACTED]");
    expect(result).toContain("password=[REDACTED]");
    expect(result).toContain("[REDACTED_DATABASE_URL]");
    expect(result).toContain("[REDACTED_TOKEN]");
    expect(result).toContain("[REDACTED_PRIVATE_KEY]");
  });
});
