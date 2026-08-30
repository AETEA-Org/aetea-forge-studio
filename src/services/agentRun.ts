/**
 * Talking to the AETEA agent.
 *
 * A turn is started, followed, and stopped through separate requests. The run
 * belongs to the server, so refreshing the page or closing the tab does not
 * cancel it — reconnecting resumes from the last event seen instead of losing
 * the answer.
 */
import { API_BASE_URL, API_TOKEN } from "@/services/config";

export type ProgressState = "started" | "done" | "failed";
export type CampaignState = "creating" | "section_written" | "created" | "updated";

export interface ProgressStep {
  step_id: string;
  label: string;
  state: ProgressState;
}

export interface AssetHint {
  id: string;
  file_name?: string;
  mime_type?: string;
}

/** Everything a caller can react to while a turn runs. */
export interface AgentTurnHandlers {
  onToken?: (delta: string, accumulated: string) => void;
  onThinking?: (delta: string, accumulated: string) => void;
  onProgress?: (step: ProgressStep) => void;
  onAssets?: (assets: AssetHint[]) => void;
  onDataChanged?: (entity: string, ids: string[]) => void;
  onCampaign?: (campaignId: string, state: CampaignState, section?: string) => void;
  onModeProposal?: (rationale: string) => void;
  onCancelled?: () => void;
  onComplete?: (answer: string) => void;
  onError?: (message: string) => void;
}

export interface StartTurnRequest {
  userEmail: string;
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

function authHeaders(extra?: HeadersInit): HeadersInit {
  const headers: Record<string, string> = { ...(extra as Record<string, string>) };
  if (API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`;
  return headers;
}

/** Begin a turn. Returns as soon as the run is accepted, not when it finishes. */
export async function startTurn(req: StartTurnRequest): Promise<{ run_id: string }> {
  const form = new FormData();
  form.append("user_id", req.userEmail);
  form.append("chat_id", req.chatId);
  form.append("message", req.message);
  form.append("mode", req.mode);
  form.append("branch_id", req.branchId ?? "main");
  if (req.activeTaskId) form.append("active_task_id", req.activeTaskId);
  (req.referenceAssetIds ?? []).forEach((id) =>
    form.append("reference_asset_ids", id)
  );
  if (req.generationMode) form.append("generation_mode", req.generationMode);
  if (req.generationOptions && Object.keys(req.generationOptions).length > 0) {
    form.append("generation_options", JSON.stringify(req.generationOptions));
  }
  (req.files ?? []).forEach((file) => form.append("files", file));

  const response = await fetch(url("/ai/chat"), {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail || "Could not start the message");
  }
  return response.json();
}

/** Whether a run is in progress, and how far its events have got. */
export async function getRunStatus(
  chatId: string,
  userEmail: string
): Promise<RunStatus> {
  const response = await fetch(
    url(`/ai/chats/${chatId}/run`, { user_id: userEmail }),
    { headers: authHeaders() }
  );
  if (!response.ok) return { active: false };
  return response.json();
}

/** Stop the run in progress. Whatever it already produced is kept. */
export async function cancelRun(chatId: string, userEmail: string): Promise<void> {
  const form = new FormData();
  form.append("user_id", userEmail);
  await fetch(url(`/ai/chats/${chatId}/cancel`), {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
}

/**
 * Rewrite one of your messages and answer it again.
 *
 * Everything said from that message onward is replaced, in the transcript and
 * in what the agent remembers. Returns as soon as the run is accepted; the new
 * answer arrives on the stream like any other turn.
 */
export async function editTurn(
  chatId: string,
  messageId: string,
  req: { userEmail: string; message: string; mode: string; branchId?: string }
): Promise<{ run_id: string }> {
  const form = new FormData();
  form.append("user_id", req.userEmail);
  form.append("message", req.message);
  form.append("mode", req.mode);
  form.append("branch_id", req.branchId ?? "main");

  const response = await fetch(
    url(`/ai/chats/${chatId}/messages/${messageId}/edit`),
    { method: "POST", headers: authHeaders(), body: form }
  );
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(detail.detail || "Could not edit that message");
  }
  return response.json();
}

/** Accept the agent's offer to turn this conversation into a campaign. */
export async function acceptCampaignMode(
  chatId: string,
  userEmail: string
): Promise<void> {
  const form = new FormData();
  form.append("user_id", userEmail);
  form.append("mode", "campaign");
  const response = await fetch(url(`/ai/chats/${chatId}/mode`), {
    method: "POST",
    headers: authHeaders(),
    body: form,
  });
  if (!response.ok) throw new Error("Could not switch to campaign mode");
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
  userEmail: string,
  handlers: AgentTurnHandlers,
  options: { signal?: AbortSignal; sinceEventId?: number } = {}
): Promise<void> {
  let lastEventId = options.sinceEventId ?? 0;
  let answer = "";
  let thinking = "";
  let attempts = 0;

  while (!options.signal?.aborted) {
    try {
      const response = await fetch(
        url(`/ai/chats/${chatId}/stream`, { user_id: userEmail }),
        {
          headers: authHeaders(
            lastEventId ? { "Last-Event-ID": String(lastEventId) } : undefined
          ),
          signal: options.signal,
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
      if (!response.body) throw new Error("No response body");

      attempts = 0;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
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
          const data = payload.data ?? {};

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

      // The stream ended without a terminal event: the connection dropped
      // rather than the run finishing, so reconnect and replay from here.
    } catch (error) {
      if (options.signal?.aborted) return;
      attempts += 1;
      if (attempts >= 4) {
        handlers.onError?.("Lost connection to the response. Refresh to catch up.");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * attempts));
    }
  }
}

/** Start a turn and follow it to the end. */
export async function runTurn(
  req: StartTurnRequest,
  handlers: AgentTurnHandlers,
  signal?: AbortSignal
): Promise<void> {
  await startTurn(req);
  await followRun(req.chatId, req.userEmail, handlers, { signal });
}
