import "server-only";

import { dispatchTicketAnalysisOutboxRecord } from "@/lib/queue/republish-ticket-analysis";
import { prepareTicketAnalysis } from "@/lib/services/ticket-analysis";

type DispatchDependencies = {
  prepare: typeof prepareTicketAnalysis;
  dispatch: typeof dispatchTicketAnalysisOutboxRecord;
};

const defaultDependencies: DispatchDependencies = {
  prepare: prepareTicketAnalysis,
  dispatch: dispatchTicketAnalysisOutboxRecord,
};

// This function deliberately never processes AI work. Redis failures leave the
// PostgreSQL outbox row pending for the standalone republisher.
export async function dispatchTicketAnalysis(
  input: { ticketId: string; requestedById?: string },
  dependencies: DispatchDependencies = defaultDependencies
) {
  const operation = await dependencies.prepare(input);
  return dependencies.dispatch({ ticketId: input.ticketId, jobId: operation.jobId });
}
