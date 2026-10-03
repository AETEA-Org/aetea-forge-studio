import type { CampaignProposal, ExecutionSnapshot, StartTurnRequest } from "./agentRun";

/** One store per conversation: navigation changes the subscriber, not the run. */
export interface AgentRunState {
  runId?: string;
  execution?: ExecutionSnapshot;
  proposal?: CampaignProposal;
  modeOffer?: { offer_id: string; rationale: string; status: string };
  tier?: string;
  request?: StartTurnRequest;
  startVersion?: number;
}
const states = new Map<string, AgentRunState>();
const listeners = new Map<string, Set<() => void>>();
const empty: AgentRunState = {};
export function readRunState(chatId: string): AgentRunState { return states.get(chatId) ?? empty; }
export function subscribeRunState(chatId: string, listener: () => void) {
  const group = listeners.get(chatId) ?? new Set();
  group.add(listener); listeners.set(chatId, group);
  return () => { group.delete(listener); if (!group.size) listeners.delete(chatId); };
}
export function updateRunState(chatId: string, patch: Partial<AgentRunState>) {
  states.set(chatId, { ...readRunState(chatId), ...patch });
  listeners.get(chatId)?.forEach((listener) => listener());
}
export function receiveExecution(chatId: string, snapshot: ExecutionSnapshot) {
  const previous = readRunState(chatId);
  if (previous.runId && previous.runId !== snapshot.run_id) return;
  const terminal = new Set(["completed", "stopped", "failed"]);
  if (previous.execution && terminal.has(previous.execution.state)) {
    if (!terminal.has(snapshot.state)) return;
    if (previous.execution.reason !== "interrupted" && snapshot.state !== previous.execution.state) return;
  }
  updateRunState(chatId, { runId: snapshot.run_id, execution: snapshot,
    request: previous.request ?? snapshot.request,
  });
}
