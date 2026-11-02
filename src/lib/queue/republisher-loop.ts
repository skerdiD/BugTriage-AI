import { setTimeout } from "node:timers/promises";

export function getRepublishInterval(env: NodeJS.ProcessEnv = process.env) {
  const interval = Number(env.TICKET_ANALYSIS_REPUBLISH_INTERVAL_MS?.trim() || 15_000);
  if (!Number.isInteger(interval) || interval < 1_000 || interval > 300_000) {
    throw new Error("TICKET_ANALYSIS_REPUBLISH_INTERVAL_MS must be an integer between 1000 and 300000.");
  }
  return interval;
}

// Wait after each completed batch so slow database/Redis calls never overlap.
// A signal cancels the wait; an active batch finishes before resources close.
export async function runRepublisherLoop(input: {
  run: () => Promise<unknown>;
  onError: (error: unknown) => void;
  signal: AbortSignal;
  intervalMs: number;
}) {
  while (!input.signal.aborted) {
    try {
      await input.run();
    } catch (error) {
      input.onError(error);
    }

    if (input.signal.aborted) break;
    try {
      await setTimeout(input.intervalMs, undefined, { signal: input.signal });
    } catch (error) {
      if (!input.signal.aborted) throw error;
    }
  }
}
