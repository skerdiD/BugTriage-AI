export const DEMO_USER_EMAIL = "demo@bugtriage.ai";
export const DEMO_USER_PASSWORD = "Demo1234!";
export const DEMO_READ_ONLY_MESSAGE =
  "The demo workspace is read-only. Changes and uploads are disabled.";

export function isDemoUser(user: { email?: string | null }) {
  return user.email?.trim().toLowerCase() === DEMO_USER_EMAIL;
}

export function isDemoTicketCode(ticketCode: string) {
  return ticketCode.trim().toUpperCase().startsWith("DEMO-");
}
