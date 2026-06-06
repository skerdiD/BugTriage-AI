export const DEMO_USER_EMAIL = "demo@bugtriage.ai";
export const DEMO_USER_PASSWORD = "Demo1234!";
export const DEMO_READ_ONLY_MESSAGE =
  "The shared demo account is read-only. Demo data may be reset at any time.";

export function isDemoUser(user: { email?: string | null }) {
  return user.email?.trim().toLowerCase() === DEMO_USER_EMAIL;
}

export function isDemoTicketCode(ticketCode: string) {
  return ticketCode.trim().toUpperCase().startsWith("DEMO-");
}
