/**
 * Talking to the AETEA agent.
 *
 * A turn is started, followed, and stopped through separate requests. The run
 * belongs to the server, so refreshing the page or closing the tab does not
 * cancel it — reconnecting resumes from the last event seen instead of losing
 * the answer.
 */
import { API_BASE_URL } from "@/services/config";
import { backendHeaders } from "@/services/authHeaders";
import { readErrorMessage } from "@/services/errorDetail";

export type RunConnectionState = "idle" | "connected" | "reconnecting" | "interrupted" | "stopping";

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
  change_lines: string[];
  content_hash: string;
}

export interface AssetHint {
  id: string;
  file_name?: string;
  mime_type?: string;
}

/** Everything a caller can react to while a turn runs. */
export interface AgentTurnHandlers {
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

export interface RunStatus {
  active: boolean;
  run_id?: string;
  last_event_id?: number;
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

export async function startTurn(req: StartTurnRequest): Promise<{ run_id: string }> {
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
    throw new Error(message);
  }
  return response.json();
}

/** Whether a run is in progress, and how far its events have got. */
export async function getRunStatus(chatId: string): Promise<RunStatus> {
  const response = await fetch(
    url(`/ai/chats/${chatId}/run`),
    { headers: await authHeaders() }
  );
  if (!response.ok) throw new Error(await readErrorMessage(response, "Could not check the run"));
  return response.json();
}

/** Stop the run in progress. Whatever it already produced is kept. */
export async function cancelRun(chatId: string): Promise<void> {
  const form = new FormData();
  const response = await fetch(url(`/ai/chats/${chatId}/cancel`), {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  if (!response.ok) throw new Error(await readErrorMessage(response, "Could not stop the run"));
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
  if (!response.ok) return [];
  const body = await response.json();
  return ((body.proposals ?? []) as Array<Record<string, unknown>>).map((row) => ({
    proposal_id: String(row.id ?? ""),
    summary: String(row.summary ?? ""),
    change_lines: (row.change_lines as string[]) ?? [],
    content_hash: String(row.content_hash ?? ""),
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
): Promise<{ status: string }> {
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
  options: { signal?: AbortSignal; sinceEventId?: number } = {}
): Promise<void> {
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
        url(`/ai/chats/${chatId}/stream`),
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

        let split = buffer.indexOf("\n\n");
        while (split !== -1) {
          const raw = buffer.slice(0, split);
          buffer = buffer.slice(split + 2);
          split = buffer.indexOf("\n\n");

          const frame = parseFrame(raw);
          if (frame.id) lastEventId = Number(frame.id) || lastEventId;
          if (!frame.data) continue;

          let payload: { type?: string; data?: Record<string, unknown> };
          try {
            payload = JSON.parse(frame.data);
          } catch {
            continue;
          }
          const type = payload.type ?? frame.event ?? "";
          if (type) attempts = 0;
          const data = payload.data ?? {};

          if (TERMINAL.has(type)) handlers.onConnectionState?.("idle");
          switch (type) {
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
              handlers.onModeProposal?.(String(data.rationale ?? ""));
              break;
            case "campaign_proposal":
              handlers.onCampaignProposal?.({
                proposal_id: String(data.proposal_id ?? ""),
                summary: String(data.summary ?? ""),
                change_lines: (data.change_lines as string[]) ?? [],
                content_hash: String(data.content_hash ?? ""),
              });
              break;
            case "cancelled":
              handlers.onCancelled?.();
              break;
            case "complete":
              handlers.onComplete?.(answer);
              break;
            case "error":
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
  await startTurn(req);
  await followRun(req.chatId, handlers, { signal });
}
