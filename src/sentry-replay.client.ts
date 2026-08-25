import { addIntegration, replayIntegration } from "@sentry/nextjs";

let isReplayEnabled = false;

export function enableSentryReplay() {
  if (isReplayEnabled) return;

  isReplayEnabled = true;
  addIntegration(
    replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    })
  );
}
