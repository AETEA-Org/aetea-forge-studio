/**
 * Talking to the AETEA agent.
 *
 * A turn is started, followed, and stopped through separate requests. The run
 * belongs to the server, so refreshing the page or closing the tab does not
 * cancel it — reconnecting resumes from the last event seen instead of losing
 * the answer.
 */
import {
  CONVERSATION_SCOPE,
  readRunState,
  receiveExecution,
  updateRunState,
} from "./agentRunState";
import { API_BASE_URL } from "@/services/config";
import { backendHeaders } from "@/services/authHeaders";
import { readErrorMessage } from "@/services/errorDetail";

export type RunConnectionState = "idle" | "connected" | "reconnecting" | "interrupted" | "stopping";

export interface ExecutionSnapshot {
  run_id: string;
  request?: StartTurnRequest;
  state: "working" | "queued" | "waiting" | "retrying" | "stopping" | "stopped" | "failed" | "completed";
  phase: string;
  reason: string;
  meaningful_activity_at: string;
  state_changed_at: string;
  active_steps: ProgressStep[];
  pending_decision?: { kind: string; proposal_id?: string; offer_id?: string; rationale?: string; status?: string } | null;
  committed_generation?: boolean;
}

export interface ProposalOutcome {
  status: string;
  result?: { applied?: string[]; failed?: string[]; reason?: string };
}

export type ProgressState = "started" | "done" | "failed";
export type CampaignState = "creating" | "section_written" | "created" | "updated";

export interface ProgressStep {
  step_id: string;
  label: string;
  state: ProgressState;
}

/**
 * A campaign change waiting on the user.
 *
 * The id is what matters: the decision is a row on the server, not a card in
 * this tab. A page reloaded an hour later fetches the same proposal and
 * decides on it, and approving applies the payload that was stored when the
 * card was raised — never anything this client sends.
 */
export interface CampaignProposal {
  proposal_id: string;
  summary: string;
  content_hash: string;
  status?: string;
  result?: ProposalOutcome["result"];
}

export interface AssetHint {
  id: string;
  file_name?: string;
  mime_type?: string;
}

/** Everything a caller can react to while a turn runs. */
export interface AgentTurnHandlers {
  onExecutionStatus?: (snapshot: ExecutionSnapshot) => void;
  onTier?: (tier: string) => void;
  onModeDecision?: (status: string) => void;
  onConnectionState?: (state: RunConnectionState) => void;
  onToken?: (delta: string, accumulated: string) => void;
  onThinking?: (delta: string, accumulated: string) => void;
  onProgress?: (step: ProgressStep) => void;
  onAssets?: (assets: AssetHint[]) => void;
  onDataChanged?: (entity: string, ids: string[]) => void;
  onCampaign?: (campaignId: string, state: CampaignState, section?: string) => void;
  onModeProposal?: (rationale: string) => void;
  onCampaignProposal?: (proposal: CampaignProposal) => void;
  onCancelled?: () => void;
  onComplete?: (answer: string) => void;
  onError?: (message: string) => void;
}

export interface StartTurnRequest {
  chatId: string;
  message: string;
  mode: string;
  branchId?: string;
  activeTaskId?: string;
  files?: File[];
  /** Canvas cards the user selected as references for this message. */
  referenceAssetIds?: string[];
  /** Task-canvas pickers: which kind of output, and the settings chosen for it. */
  generationMode?: string;
  generationOptions?: Record<string, unknown>;
  /** How much intelligence to apply: a tier code, or "auto" to let AETEA pick.
   *  Omitted falls back to whatever the chat is set to. */
  tier?: string;
  /**
   * Rewrite history rather than continue it: this message and everything after
   * it are replaced by this turn, in the transcript and in what the agent
   * remembers.
   *
   * It rides on an ordinary turn on purpose. A rewound turn needs everything an
   * ordinary one needs — the task, the branch, the cards picked as references,
   * the generation settings — and the composer is where all of that already
   * lives. The endpoint this replaced carried none of it, which is why the
   * canvas could never rewrite a message.
   */
  rewindToMessageId?: string;
}

/**
 * Which run slot a turn will land in, as this client can work it out.
 *
 * Mirrors the backend's rule exactly: the **branch** decides, never the
 * selected task, because a scope is one message thread. The server has the
 * last word — it also folds nested work into its parent deliverable, which
 * needs a lookup — and every call returns the scope it resolved, which is what
 * subsequent calls and the local store use.
 */
export function scopeFromBranch(branchId?: string): string {
  const match = /^task:(.+)$/.exec((branchId ?? "").trim());
  return match ? match[1] : CONVERSATION_SCOPE;
}

export interface ActiveRun {
  scope: string;
  run_id: string;
  last_event_id: number;
  execution?: ExecutionSnapshot;
}

export interface RunStatus {
  active: boolean;
  run_id?: string;
  /** What the server resolved the requested scope to. */
  scope?: string;
  last_event_id?: number;
  execution?: ExecutionSnapshot;
  recoverable?: boolean;
}

const TERMINAL = new Set(["complete", "cancelled", "error"]);

function url(path: string, params?: Record<string, string>): string {
  const built = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => built.searchParams.set(k, v));
  }
  return built.toString();
}

/**
 * Headers for a backend call, with a fresh session token.
 *
 * Called per request rather than once per run: `followRun` reconnects, and a
 * reconnect minutes into a long answer needs the token as it is by then. That
 * is also why an expiring token cannot kill a run in flight — the backend
 * checks each HTTP request, and the next one simply carries a newer token.
 */
async function authHeaders(extra?: HeadersInit): Promise<Record<string, string>> {
  return { ...(await backendHeaders()), ...(extra as Record<string, string>) };
}

/** Begin a turn. Returns as soon as the run is accepted, not when it finishes. */
/**
 * The chat is busy with the previous turn.
 *
 * Its own class so a surface can offer to stop that turn instead of showing a
 * red failure — being told you cannot send is not the same as something going
 * wrong, and it used to arrive as the server's internal sentence naming the
 * chat by uuid.
 */
export class ChatBusyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatBusyError";
  }
}

/**
 * The account has no credits left.
 *
 * `402`, and the backend chose that status deliberately: the request is valid
 * and the caller is who they say they are, they simply cannot pay for it. It
 * gets its own error type so the UI can offer a way forward rather than treat
 * it as a fault.
 */
export class OutOfCreditsError extends Error {
  constructor(message?: string) {
    super(message || "You're out of credits.");
    this.name = "OutOfCreditsError";
  }
}

export async function startTurn(
  req: StartTurnRequest
): Promise<{ run_id: string; scope?: string }> {
  // Optimistically under the branch-derived scope, because the authoritative
  // one does not exist until the server answers. The two differ only for a
  // canvas opened on nested work, where the server folds it into its parent;
  // the entry left behind then holds a request nothing reads.
  const asked = scopeFromBranch(req.branchId);
  updateRunState(req.chatId, { runId: undefined, execution: undefined, modeOffer: undefined, request: req, startVersion: (readRunState(req.chatId, asked).startVersion ?? 0) + 1 }, asked);
  const form = new FormData();
  form.append("chat_id", req.chatId);
  form.append("message", req.message);
  form.append("mode", req.mode);
  form.append("branch_id", req.branchId ?? "main");
  if (req.activeTaskId) form.append("active_task_id", req.activeTaskId);
  (req.referenceAssetIds ?? []).forEach((id) =>
    form.append("reference_asset_ids", id)
  );
  if (req.tier) form.append("tier", req.tier);
  if (req.generationMode) form.append("generation_mode", req.generationMode);
  if (req.generationOptions && Object.keys(req.generationOptions).length > 0) {
    form.append("generation_options", JSON.stringify(req.generationOptions));
  }
  if (req.rewindToMessageId) {
    form.append("rewind_to_message_id", req.rewindToMessageId);
  }
  (req.files ?? []).forEach((file) => form.append("files", file));

  const response = await fetch(url("/ai/chat"), {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  if (!response.ok) {
    const message = await readErrorMessage(response, "Could not start the message");
    if (response.status === 409) throw new ChatBusyError(message);
    if (response.status === 402) throw new OutOfCreditsError(message);
    updateRunState(req.chatId, { execution: {
      run_id: "submission", state: "failed", phase: "submission", reason: "start_failed",
      meaningful_activity_at: new Date().toISOString(), state_changed_at: new Date().toISOString(), active_steps: [],
    } }, asked);
    throw new Error(message);
  }
  const accepted = await response.json();
  const scope = String(accepted.scope || asked);
  updateRunState(req.chatId, { runId: accepted.run_id, execution: undefined, modeOffer: undefined, request: req }, scope);
  return { ...accepted, scope };
}

/**
 * Whether a run is in progress for one scope, and how far its events have got.
 *
 * `scope` is a deliverable's task id; omitted means the conversation. A chat
 * runs several things at once (#111), so a deliverable canvas has to say which
 * one it is asking about or it is told about whatever the chat did last.
 */
export async function getRunStatus(chatId: string, scope?: string): Promise<RunStatus> {
  const before = readRunState(chatId, scope).runId;
  const beforeVersion = readRunState(chatId, scope).startVersion;
  const response = await fetch(
    url(`/ai/chats/${chatId}/run`, scope ? { scope } : undefined),
    { headers: await authHeaders() }
  );
  if (!response.ok) throw new Error(await readErrorMessage(response, "Could not check the run"));
  const status: RunStatus = await response.json();
  // The server's answer, not the request: it folds nested work into its parent
  // deliverable, so storing under what we asked for would split one run across
  // two store entries.
  const key = status.scope || scope;
  const previous = readRunState(chatId, key);
  // A delayed status response must not overwrite a request accepted meanwhile.
  if (previous.runId === before && previous.startVersion === beforeVersion) {
    if (previous.runId !== status.run_id) updateRunState(chatId, { execution: undefined, modeOffer: undefined, request: undefined }, key);
    updateRunState(chatId, { runId: status.run_id }, key);
    if (status.execution) receiveExecution(chatId, status.execution, key);
    const offer = status.execution?.pending_decision;
    if (status.active && offer?.kind === "mode" && offer.offer_id) {
      updateRunState(chatId, { modeOffer: { offer_id: offer.offer_id, rationale: offer.rationale ?? "", status: offer.status ?? "pending" } }, key);
    }
  }
  return status;
}

/**
 * Stop one run. Whatever it already produced is kept.
 *
 * One scope only, so stopping a deliverable leaves the rest running. Omitting
 * `scope` stops the conversation turn, which is what every surface but the
 * deliverable canvas means.
 */
export async function cancelRun(chatId: string, scope?: string): Promise<boolean> {
  const form = new FormData();
  if (scope) form.append("scope", scope);
  const response = await fetch(url(`/ai/chats/${chatId}/cancel`), {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "Could not stop the run"));
  const outcome = await response.json();
  const key = outcome.scope || scope;
  const previous = readRunState(chatId, key).execution;
  if (outcome.cancelled === true && previous) receiveExecution(chatId, { ...previous, state: "stopped", reason: "stopped" }, key);
  if (outcome.cancelled !== true) await getRunStatus(chatId, scope);
  return outcome.cancelled === true;
}

/**
 * Everything running in this chat right now, by scope.
 *
 * One call for every deliverable rather than one subscription each. #111 asks
 * that the interface make clear which deliverables are active and what each is
 * doing, and a client cannot ask per scope about a deliverable it has not got
 * on screen. `limit` is the server's concurrency ceiling, so a surface can say
 * "2 of 2 running" without hardcoding the number.
 *
 * Live runs only. A finished deliverable is read from its own task status.
 */
export async function listActiveRuns(
  chatId: string
): Promise<{ runs: ActiveRun[]; limit: number }> {
  const response = await fetch(url(`/ai/chats/${chatId}/runs`), {
    headers: await authHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Could not check what is running"));
  }
  const body = await response.json();
  return { runs: (body.runs ?? []) as ActiveRun[], limit: Number(body.limit ?? 0) };
}

/** Accept the agent's offer to turn this conversation into a campaign. */
export async function acceptCampaignMode(chatId: string): Promise<void> {
  const form = new FormData();
  form.append("mode", "campaign");
  const response = await fetch(url(`/ai/chats/${chatId}/mode`), {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  if (!response.ok) throw new Error("Could not switch to campaign mode");
}

/**
 * Campaign changes still waiting on a decision in this conversation.
 *
 * Asked for on load, because a run that ended while the person was away left
 * nothing on screen — and a change nobody ever decides on is a change that
 * silently never happens.
 */
export async function listProposals(chatId: string): Promise<CampaignProposal[]> {
  const response = await fetch(url(`/ai/chats/${chatId}/proposals`), {
    headers: await authHeaders(),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "Could not check suggestions"));
  const body = await response.json();
  return ((body.proposals ?? []) as Array<Record<string, unknown>>).map((row) => ({
    proposal_id: String(row.id ?? ""),
    summary: String(row.summary ?? ""),
    content_hash: String(row.content_hash ?? ""),
    status: String(row.status ?? "pending"),
    result: row.result as ProposalOutcome["result"],
  }));
}

/**
 * Approve or decline a proposed campaign change.
 *
 * `expectedHash` is the hash this card was rendered from. The server refuses
 * the decision when it no longer matches what is stored, so a stale tab cannot
 * approve a change other than the one it is showing.
 */
export async function decideProposal(
  chatId: string,
  proposalId: string,
  decision: "approve" | "decline",
  expectedHash?: string
): Promise<ProposalOutcome> {
  const response = await fetch(
    url(`/ai/chats/${chatId}/proposals/${proposalId}/decision`),
    {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ decision, expected_hash: expectedHash }),
    }
  );
  if (!response.ok) {
    throw new Error(
      await readErrorMessage(response, "Could not record that decision")
    );
  }
  return response.json();
}

interface ParsedFrame {
  id?: string;
  event?: string;
  data?: string;
}

function parseFrame(raw: string): ParsedFrame {
  const frame: ParsedFrame = {};
  for (const line of raw.split("\n")) {
    if (line.startsWith("id:")) frame.id = line.slice(3).trim();
    else if (line.startsWith("event:")) frame.event = line.slice(6).trim();
    else if (line.startsWith("data:")) frame.data = (frame.data ?? "") + line.slice(5).trim();
  }
  return frame;
}

/**
 * Follow a run to its end.
 *
 * Reconnects on a dropped connection, passing the last event id so the server
 * replays what was missed. Resolves when the run reaches a terminal event.
 */
export async function followRun(
  chatId: string,
  handlers: AgentTurnHandlers,
  options: {
    signal?: AbortSignal;
    sinceEventId?: number;
    runId?: string;
    /** Which of the chat's runs to follow: a deliverable's task id, or the
     *  conversation when omitted. */
    scope?: string;
  } = {}
): Promise<void> {
  // Every read here is scoped. An unscoped one sends a deliverable canvas
  // after the *conversation's* run id, and because the server then cannot
  // match it, replays the conversation's recorded events onto that canvas —
  // a wrong answer that looks like a working one.
  const runId =
    options.runId ??
    readRunState(chatId, options.scope).runId ??
    (await getRunStatus(chatId, options.scope)).run_id;
  let lastEventId = options.sinceEventId ?? 0;
  let answer = "";
  let thinking = "";
  let attempts = 0;

  while (!options.signal?.aborted) {
    const connection = new AbortController();
    const abort = () => connection.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    // Heartbeats count as activity. Silence means a lost connection, not proof
    // that a slow provider stopped; reconnect without starting another turn.
    let silenceTimer = setTimeout(abort, 45_000);
    const touch = () => {
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(abort, 45_000);
    };
    try {
      const response = await fetch(
        url(`/ai/chats/${chatId}/stream`, {
          ...(runId ? { run_id: runId } : {}),
          ...(options.scope ? { scope: options.scope } : {}),
        }),
        {
          headers: await authHeaders(
            lastEventId ? { "Last-Event-ID": String(lastEventId) } : undefined
          ),
          signal: connection.signal,
        }
      );
      if (response.status === 404) {
        // No run to attach to. Either it finished and was forgotten, or the
        // server restarted under it. Either way the caller has to be told:
        // returning quietly leaves a "thinking" state that never resolves.
        handlers.onError?.(
          "That run is no longer available. Reload the conversation to see " +
          "where it got to."
        );
        return;
      }
      if (!response.ok) throw new Error(`Stream returned ${response.status}`);
      if (!response.body) throw new Error("No response body");
      handlers.onConnectionState?.("connected");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (options.signal?.aborted) return;
        touch();
        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        let split = buffer.indexOf("\n\n");
        while (split !== -1) {
          const raw = buffer.slice(0, split);
          buffer = buffer.slice(split + 2);
          split = buffer.indexOf("\n\n");

          const frame = parseFrame(raw);
          if (!frame.data) continue;

          let payload: { type?: string; data?: Record<string, unknown> };
          try {
            payload = JSON.parse(frame.data);
          } catch {
            continue;
          }
          const type = payload.type ?? frame.event ?? "";
          const data = payload.data;
          if (!data || typeof data !== "object" || Array.isArray(data)) continue;
          const known = new Set(["token", "thinking", "progress", "asset", "data_changed", "campaign", "tier", "mode_proposal", "campaign_proposal", "cancelled", "complete", "error", "execution_status", "mode_proposal_decision"]);
          if (!known.has(type) || !validEvent(type, data)) continue;
          const seq = Number(frame.id);
          if (!Number.isSafeInteger(seq) || seq <= lastEventId) continue;
          if (type === "execution_status" && data.run_id !== runId) continue;
          lastEventId = seq;
          attempts = 0;
          if (readRunState(chatId, options.scope).runId !== runId) return;

          if (TERMINAL.has(type)) handlers.onConnectionState?.("idle");
          switch (type) {
            case "execution_status": {
              const snapshot = data as unknown as ExecutionSnapshot;
              receiveExecution(chatId, snapshot, options.scope);
              handlers.onExecutionStatus?.(snapshot);
              break;
            }
            case "tier":
              updateRunState(chatId, { tier: String(data.display_name ?? data.tier ?? "") }, options.scope);
              handlers.onTier?.(String(data.tier ?? ""));
              break;
            case "mode_proposal_decision":
              updateRunState(chatId, { modeOffer: undefined }, options.scope);
              handlers.onModeDecision?.(String(data.status ?? ""));
              break;
            case "token": {
              const delta = String(data.text ?? "");
              answer += delta;
              handlers.onToken?.(delta, answer);
              break;
            }
            case "thinking": {
              const delta = String(data.text ?? "");
              thinking += delta;
              handlers.onThinking?.(delta, thinking);
              break;
            }
            case "progress":
              handlers.onProgress?.(data as unknown as ProgressStep);
              break;
            case "asset":
              handlers.onAssets?.((data.assets as AssetHint[]) ?? []);
              break;
            case "data_changed":
              handlers.onDataChanged?.(
                String(data.entity ?? ""),
                (data.ids as string[]) ?? []
              );
              break;
            case "campaign":
              handlers.onCampaign?.(
                String(data.campaign_id ?? ""),
                data.state as CampaignState,
                data.section as string | undefined
              );
              break;
            case "mode_proposal":
              updateRunState(chatId, { modeOffer: { offer_id: String(data.offer_id ?? ""), rationale: String(data.rationale ?? ""), status: "pending" } }, options.scope);
              handlers.onModeProposal?.(String(data.rationale ?? ""));
              break;
            case "campaign_proposal": {
              const proposal: CampaignProposal = {
                proposal_id: String(data.proposal_id ?? ""),
                summary: String(data.summary ?? ""),
                content_hash: String(data.content_hash ?? ""), status: "pending",
              };
              updateRunState(chatId, { proposal });  // conversation-keyed; see useCampaignProposal
              handlers.onCampaignProposal?.(proposal);
              break;
            }
            case "cancelled":
              updateRunState(chatId, { modeOffer: undefined }, options.scope);
              handlers.onCancelled?.();
              break;
            case "complete":
              updateRunState(chatId, { modeOffer: undefined }, options.scope);
              handlers.onComplete?.(answer);
              break;
            case "error":
              updateRunState(chatId, { modeOffer: undefined }, options.scope);
              handlers.onError?.(
                String(data.user_message ?? "Something went wrong.")
              );
              break;
            default:
              break;
          }
          if (TERMINAL.has(type)) return;
        }
      }

      // EOF without a terminal event also consumes a reconnect attempt.
    } catch {
      if (options.signal?.aborted) return;
    } finally {
      clearTimeout(silenceTimer);
      options.signal?.removeEventListener("abort", abort);
      connection.abort();
    }
    if (options.signal?.aborted) return;
    attempts += 1;
    if (attempts >= 4) {
      if (handlers.onConnectionState) handlers.onConnectionState("interrupted");
      else handlers.onError?.("Lost connection to the response. Refresh to catch up.");
      return;
    }
    handlers.onConnectionState?.("reconnecting");
    await new Promise((resolve) => setTimeout(resolve, 400 * attempts));
  }
}

/** Start a turn and follow it to the end. */
export async function runTurn(
  req: StartTurnRequest,
  handlers: AgentTurnHandlers,
  signal?: AbortSignal
): Promise<void> {
  const accepted = await startTurn(req);
  await followRun(req.chatId, handlers, {
    signal, runId: accepted.run_id, scope: accepted.scope,
  });
}


export async function declineCampaignMode(chatId: string, offerId: string): Promise<void> {
  const response = await fetch(url(`/ai/chats/${chatId}/mode-offers/${offerId}/decline`), {
    method: "POST", headers: await authHeaders(),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "Could not record your answer"));
  updateRunState(chatId, { modeOffer: undefined });
}

export async function getProposal(chatId: string, proposalId: string): Promise<CampaignProposal> {
  const response = await fetch(url(`/ai/chats/${chatId}/proposals/${proposalId}`), { headers: await authHeaders() });
  if (!response.ok) throw new Error(await readErrorMessage(response, "Could not check that suggestion"));
  const row = await response.json();
  return { ...row, proposal_id: String(row.id) };
}


/** Validate known frames before advancing the cursor or touching UI state. */
function validEvent(type: string, data: Record<string, unknown>): boolean {
  const strings = (value: unknown) => Array.isArray(value) && value.every(item => typeof item === "string");
  const step = (value: unknown) => {
    if (!value || typeof value !== "object") return false;
    const item = value as Record<string, unknown>;
    return typeof item.step_id === "string" && typeof item.label === "string" && ["started", "done", "failed"].includes(String(item.state));
  };
  switch (type) {
    case "token": case "thinking": return typeof data.text === "string";
    case "progress": return step(data);
    case "asset": return Array.isArray(data.assets) && data.assets.every(item => item && typeof item.id === "string");
    case "data_changed": return typeof data.entity === "string" && strings(data.ids);
    case "campaign": return typeof data.campaign_id === "string" && ["creating", "section_written", "created", "updated"].includes(String(data.state));
    case "tier": return typeof data.tier === "string" && typeof data.display_name === "string";
    case "mode_proposal": return typeof data.rationale === "string" && typeof data.offer_id === "string";
    case "mode_proposal_decision": return typeof data.offer_id === "string" && ["accepted", "declined", "expired"].includes(String(data.status));
    case "campaign_proposal": return typeof data.proposal_id === "string" && typeof data.summary === "string" && typeof data.content_hash === "string";
    case "execution_status": return typeof data.run_id === "string" && ["working", "queued", "waiting", "retrying", "stopping", "stopped", "failed", "completed"].includes(String(data.state)) && typeof data.reason === "string" && typeof data.phase === "string" && Number.isFinite(Date.parse(String(data.meaningful_activity_at))) && Number.isFinite(Date.parse(String(data.state_changed_at))) && Array.isArray(data.active_steps) && data.active_steps.every(step);
    case "error": return typeof data.user_message === "string";
    case "complete": return typeof data.message_id === "string";
    case "cancelled": return true;
    default: return false;
  }
}
