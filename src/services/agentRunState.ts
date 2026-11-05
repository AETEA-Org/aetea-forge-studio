import type { CampaignProposal, ExecutionSnapshot, StartTurnRequest } from "./agentRun";

/**
 * One store per (conversation, scope): navigation changes the subscriber, not the run.
 *
 * **Keyed by scope, not by chat.** A chat runs several things at once (#111) —
 * the conversation, and one run per deliverable — so a single entry per chat
 * meant opening a second deliverable's canvas inherited the first one's run id,
 * execution snapshot and pending request. The scope defaults to the
 * conversation, so every caller that does not know about scopes behaves exactly
 * as it did.
 */
export interface AgentRunState {
  runId?: string;
  execution?: ExecutionSnapshot;
  proposal?: CampaignProposal;
  modeOffer?: { offer_id: string; rationale: string; status: string };
  tier?: string;
  request?: StartTurnRequest;
  startVersion?: number;
}

/** The ordinary conversation. Mirrors `CONVERSATION_SCOPE` in the backend. */
export const CONVERSATION_SCOPE = "conversation";

const states = new Map<string, AgentRunState>();
const listeners = new Map<string, Set<() => void>>();
const empty: AgentRunState = {};

/** The store key. A deliverable's scope is its task id. */
function keyFor(chatId: string, scope?: string): string {
  return `${chatId}:${scope || CONVERSATION_SCOPE}`;
}

export function readRunState(chatId: string, scope?: string): AgentRunState {
  return states.get(keyFor(chatId, scope)) ?? empty;
}
export function subscribeRunState(chatId: string, listener: () => void, scope?: string) {
  const key = keyFor(chatId, scope);
  const group = listeners.get(key) ?? new Set();
  group.add(listener); listeners.set(key, group);
  return () => { group.delete(listener); if (!group.size) listeners.delete(key); };
}
export function updateRunState(chatId: string, patch: Partial<AgentRunState>, scope?: string) {
  const key = keyFor(chatId, scope);
  states.set(key, { ...readRunState(chatId, scope), ...patch });
  listeners.get(key)?.forEach((listener) => listener());
}
export function receiveExecution(chatId: string, snapshot: ExecutionSnapshot, scope?: string) {
  const previous = readRunState(chatId, scope);
  if (previous.runId && previous.runId !== snapshot.run_id) return;
  const terminal = new Set(["completed", "stopped", "failed"]);
  if (previous.execution && terminal.has(previous.execution.state)) {
    if (!terminal.has(snapshot.state)) return;
    if (previous.execution.reason !== "interrupted" && snapshot.state !== previous.execution.state) return;
  }
  updateRunState(chatId, { runId: snapshot.run_id, execution: snapshot,
    request: previous.request ?? snapshot.request,
  }, scope);
}
