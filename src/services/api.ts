import { supabase } from "@/integrations/supabase/client";
import { readErrorMessage } from "@/services/errorDetail";
import type {
  ChatListResponse,
  SectionResponse,
  TasksResponse,
  HealthResponse,
  OverviewModel,
  BriefModel,
  ResearchModel,
  StrategyModel,
  SectionName,
  SSEMessage,
  StreamAssetHint,
  ChatRenderableAsset,
  ChatMessagesResponse,
  DeleteChatResponse,
  AssetListResponse,
  AssetEditResponse,
  Asset,
  CreativeState,
  StyleCardsResponse,
  Character,
  CharactersResponse,
  CampaignTasksResponse,
  CampaignTask,
  DeliverableObjectsResponse,
  DeliverableObject,
  AssetFoldersResponse,
} from "@/types/api";

// Direct API base URL (bypassing Supabase Edge Function)
import { API_BASE_URL } from '@/services/config';
import { backendHeaders } from '@/services/authHeaders';

// Helper to build URL with params
function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, API_BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

// Headers for a backend call: the user's session token. Async because a fresh
// session token is what identifies the caller — see services/authHeaders.ts.
const getHeaders = backendHeaders;

// Fetch a legacy project section used by the overview screen.
export async function getProjectSection<T>(
  projectId: string,
  section: SectionName,
): Promise<SectionResponse<T>> {
  const response = await fetch(buildUrl(`/projects/${projectId}/section/${section}`), {
    headers: await getHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, `Failed to fetch ${section}`));
  }
  return response.json();
}

// Health check. Deliberately unauthenticated: it is one of the three open
// endpoints, and it has to work before anyone has signed in.
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(buildUrl('/health'));
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

/** How much intelligence to apply. Names and copy come from the backend so a
 *  model id can never reach the product through a hardcoded list here. */
export interface TierOption {
  code: string;
  display_name: string;
  description: string;
}

/** GET /ai/tiers — the options the picker shows, cheapest first after Auto. */
export async function listTiers(): Promise<TierOption[]> {
  const response = await fetch(buildUrl('/ai/tiers'), {
    headers: await getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch tiers');
  }
  const data = await response.json();
  return (data.tiers ?? []) as TierOption[];
}

// List all chats for a user
export async function listAllChats(): Promise<ChatListResponse> {
  const response = await fetch(buildUrl('/chats'), {
    headers: await getHeaders(),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch chats'));
  }
  return response.json();
}

// Create a new chat
export async function createChat(
  mode: 'brainstorm' | 'campaign' = 'brainstorm'
): Promise<{ chat_id: string; title: string; last_modified: string }> {
  const response = await fetch(buildUrl('/chats'), {
    method: 'POST',
    headers: await getHeaders('application/json'),
    body: JSON.stringify({ mode }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to create chat'));
  }
  return response.json();
}

// Get a single chat
export async function getChat(
  chatId: string
): Promise<{ chat_id: string; title: string; last_modified: string; mode: string; tier: string; campaign_id: string | null }> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}`),
    {
      headers: await getHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch chat'));
  }
  
  return response.json();
}

/** PATCH /chats/{chat_id} — rename and/or change mode (see API_REFERENCE.md). */
export async function patchChat(
  chatId: string,
  body: { title?: string; mode?: 'brainstorm' | 'campaign'; tier?: string }
): Promise<{
  chat_id: string;
  title: string;
  last_modified: string;
  mode: string;
  campaign_id: string | null;
}> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}`),
    {
      method: 'PATCH',
      headers: {
        ...await getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to update chat'));
  }

  return response.json();
}

// Get campaign by chat_id
export async function getCampaignByChatId(
  chatId: string
): Promise<{
  campaign: {
    id: string;
    chat_id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
  };
  sections: {
    brief: BriefModel;
    research: ResearchModel;
    strategy: StrategyModel;
  };
}> {
  const response = await fetch(
    buildUrl('/campaigns', { chat_id: chatId }),
    {
      headers: await getHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch campaign'));
  }
  
  return response.json();
}

// Get campaign by campaign_id
export async function getCampaignById(
  campaignId: string
): Promise<{
  campaign: {
    id: string;
    chat_id: string;
    user_id: string;
    title: string;
    created_at: string;
    updated_at: string;
  };
  sections: {
    brief: BriefModel;
    research: ResearchModel;
    strategy: StrategyModel;
  };
}> {
  const response = await fetch(
    buildUrl(`/campaigns/${campaignId}`),
    {
      headers: await getHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch campaign'));
  }
  
  return response.json();
}

export async function selectCreativeTerritory(
  campaignId: string,
  territoryId: string
): Promise<StrategyModel> {
  const response = await fetch(
    buildUrl(`/campaigns/${campaignId}/strategy/selected-territory`, {
    }),
    {
      method: 'PATCH',
      headers: await getHeaders('application/json'),
      body: JSON.stringify({ territory_id: territoryId }),
    }
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to select creative territory'));
  }

  return response.json();
}

// Create campaign via AETEA chat (SSE streaming)
/**
 * Ask the agent to build a campaign in a new conversation.
 *
 * Progress comes from the campaign lifecycle rather than from matching text in
 * the reply: "creating" means the build has begun, "created" means it is done.
 * Named steps replace the old percentage, which had to guess.
 */
export async function createCampaignViaChat(
  chatId: string,
  message: string,
  files?: File[],
  onProgress?: (step: { step_id: string; label: string; state: string }) => void,
  onStarted?: () => void,
  onComplete?: () => void,
  onError?: (message: string) => void,
  /** How much intelligence to apply. A campaign build is the most expensive
   *  thing in the product, so the choice has to reach it. */
  tier?: string
): Promise<void> {
  const { runTurn } = await import('@/services/agentRun');
  await runTurn(
    { chatId, message, mode: 'campaign', files, tier },
    {
      onProgress: (step) => onProgress?.(step),
      onCampaign: (_id, state) => {
        if (state === 'creating') onStarted?.();
      },
      onComplete: () => onComplete?.(),
      onError: (detail) => onError?.(detail),
    }
  );
}

export async function deleteChatById(chatId: string): Promise<DeleteChatResponse> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}`),
    {
      method: 'DELETE',
      headers: await getHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to delete chat'));
  }
  
  return response.json();
}

// Get assets by chat
export async function getAssets(
  chatId: string,
  folderPath?: string
): Promise<AssetListResponse> {
  const params: Record<string, string> = { chat_id: chatId };
  
  if (folderPath) {
    params.folder_path = folderPath;
  }
  
  const response = await fetch(buildUrl('/assets', params), {
    headers: await getHeaders(),
  });
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch assets'));
  }
  
  return response.json();
}

// Refresh asset URLs (GET /assets/{id}/ returns view_url and download_url)
export async function refreshAssetUrls(
  assetId: string
): Promise<{ view_url: string; download_url: string }> {
  const response = await fetch(
    buildUrl(`/assets/${assetId}`),
    {
      headers: await getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to refresh asset URLs'));
  }

  return response.json();
}

/** Fetch raw asset bytes (same-origin) for the Fabric image editor. */
export async function fetchAssetContentBlob(
  assetId: string
): Promise<Blob> {
  const response = await fetch(
    buildUrl(`/assets/${assetId}/content`),
    { headers: await getHeaders() }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to load asset content"));
  }
  return response.blob();
}

/** Rename an asset (PATCH /assets/{id}) — metadata only; storage path unchanged. */
export async function renameAsset(
  assetId: string,
  fileName: string
): Promise<Asset> {
  const response = await fetch(buildUrl(`/assets/${assetId}`), {
    method: "PATCH",
    headers: await getHeaders(),
    body: JSON.stringify({ file_name: fileName }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to rename asset"));
  }
  return response.json();
}

/** Delete an asset (DELETE /assets/{id}). */
export async function deleteAsset(
  assetId: string
): Promise<void> {
  const response = await fetch(
    buildUrl(`/assets/${assetId}`),
    {
      method: "DELETE",
      headers: await getHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to delete asset"));
  }
}

/** Save / Save As an edited image over an existing asset (POST /assets/{id}/edit). */
export async function editAsset(
  assetId: string,
  mode: "save" | "save_as",
  file: Blob,
  options?: {
    fileName?: string;
    campaignId?: string;
    mimeType?: "image/png" | "image/jpeg";
  }
): Promise<AssetEditResponse> {
  const mimeType = options?.mimeType ?? "image/png";
  const defaultName =
    mimeType === "image/jpeg" ? "edited.jpg" : "edited.png";
  const formData = new FormData();
  formData.append("mode", mode);
  formData.append("mime_type", mimeType);
  formData.append("file", file, options?.fileName || defaultName);
  if (mode === "save_as" && options?.fileName) {
    formData.append("file_name", options.fileName);
  }
  if (options?.campaignId) {
    formData.append("campaign_id", options.campaignId);
  }

  const response = await fetch(buildUrl(`/assets/${assetId}/edit`), {
    method: "POST",
    headers: await getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Failed to save edited image"));
  }

  return response.json();
}

// Get creative state
export async function getCreativeState(
  campaignId: string
): Promise<CreativeState> {
  const response = await fetch(
    buildUrl(`/campaigns/${campaignId}/creative`),
    {
      headers: await getHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch creative state'));
  }
  
  return response.json();
}

// Update creative state
export async function updateCreativeState(
  campaignId: string,
  updates: {
    selected_style_id?: string | null;
    creative_truth?: CreativeState['creative_truth'] | null;
    creative_tone?: CreativeState['creative_tone'] | null;
    key_visual_asset_id?: string | null;
  }
): Promise<CreativeState> {
  const response = await fetch(
    buildUrl(`/campaigns/${campaignId}/creative`),
    {
      method: 'PATCH',
      headers: await getHeaders('application/json'),
      body: JSON.stringify(updates),
    }
  );
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to update creative state'));
  }
  
  return response.json();
}

// Get campaign tasks
export async function getCampaignTasks(
  campaignId: string
): Promise<CampaignTasksResponse> {
  const response = await fetch(
    buildUrl(`/campaigns/${campaignId}/tasks`),
    { headers: await getHeaders() }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch tasks'));
  }
  return response.json();
}

// Get single campaign task
export async function getCampaignTask(
  taskId: string
): Promise<CampaignTask> {
  const response = await fetch(
    buildUrl(`/campaigns/tasks/${taskId}`),
    { headers: await getHeaders() }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch task'));
  }
  return response.json();
}

// Update campaign task (e.g. status to done)
export async function patchCampaignTask(
  taskId: string,
  body: { status?: CampaignTask['status']; body_copy?: string | null }
): Promise<CampaignTask> {
  const response = await fetch(
    buildUrl(`/campaigns/tasks/${taskId}`),
    {
      method: 'PATCH',
      headers: await getHeaders('application/json'),
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to update task'));
  }
  return response.json();
}

// Get assets for a task (review page)
export async function getCampaignTaskAssets(
  taskId: string
): Promise<AssetListResponse> {
  const response = await fetch(
    buildUrl(`/campaigns/tasks/${taskId}/assets`),
    { headers: await getHeaders() }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch task assets'));
  }
  return response.json();
}

// Get style cards
export async function getStyleCards(
  limit: number = 30,
  offset: number = 0
): Promise<StyleCardsResponse> {
  const response = await fetch(
    buildUrl('/campaigns/style-cards', { limit: String(limit), offset: String(offset) }),
    {
      headers: await getHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch style cards'));
  }
  
  return response.json();
}

// Characters (GET /characters) — reusable subject identities for video
export async function getCharacters(): Promise<CharactersResponse> {
  const response = await fetch(
    buildUrl('/characters'),
    {
      headers: await getHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch characters'));
  }

  return response.json();
}

// Create a character (POST /characters)
export async function createCharacter(
  payload: {
    name: string;
    description: string;
    frontal_asset_id: string;
    angle_asset_ids?: string[];
  }
): Promise<Character> {
  const response = await fetch(buildUrl('/characters'), {
    method: 'POST',
    headers: { ...await getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to create character'));
  }

  return response.json();
}

function parseSSEAssetPayload(content: string): StreamAssetHint[] {
  try {
    const parsed = JSON.parse(content) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is { id: string; mime_type?: string } =>
          x !== null &&
          typeof x === 'object' &&
          typeof (x as { id?: unknown }).id === 'string'
      )
      .map((x) => ({
        id: x.id,
        mime_type:
          typeof x.mime_type === 'string' ? x.mime_type : 'application/octet-stream',
      }));
  } catch {
    return [];
  }
}

/** Resolve SSE asset hints to signed URLs via GET /assets/{id}. Dedupes by id. */
export async function resolveStreamAssetHints(
  hints: StreamAssetHint[]
): Promise<ChatRenderableAsset[]> {
  const seen = new Set<string>();
  const unique = hints.filter((h) => {
    if (seen.has(h.id)) return false;
    seen.add(h.id);
    return true;
  });
  const results = await Promise.all(
    unique.map(async (h) => {
      try {
        const urls = await refreshAssetUrls(h.id);
        return {
          id: h.id,
          mime_type: h.mime_type,
          view_url: urls.view_url,
          download_url: urls.download_url,
        } satisfies ChatRenderableAsset;
      } catch {
        return {
          id: h.id,
          mime_type: h.mime_type,
          view_url: '',
          download_url: '',
        } satisfies ChatRenderableAsset;
      }
    })
  );
  return results;
}

// Chat functions
export async function listChats(
  projectId: string
): Promise<ChatListResponse> {
  const response = await fetch(
    buildUrl('/chats', { project_id: projectId }),
    {
      headers: await getHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch chats'));
  }
  
  return response.json();
}

// Get messages for a chat
export async function getChatMessages(
  chatId: string,
  branchId: string = 'main'
): Promise<ChatMessagesResponse> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}/messages`, { branch_id: branchId }),
    {
      headers: await getHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch messages'));
  }
  
  return response.json();
}

export async function getCampaignTaskDeliverables(
  taskId: string
): Promise<DeliverableObjectsResponse> {
  const response = await fetch(
    buildUrl(`/campaigns/tasks/${taskId}/deliverable-objects`),
    { headers: await getHeaders() }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch deliverable objects'));
  }
  return response.json();
}

/**
 * The campaign's own finished work — everything not made against a task.
 *
 * A key visual, or anything asked for in the conversation rather than for a
 * piece of work, is filed against the chat. Until this existed those were
 * saved and then shown on no canvas at all.
 */
export async function getChatDeliverables(
  chatId: string
): Promise<DeliverableObjectsResponse> {
  const response = await fetch(
    buildUrl(`/campaigns/chats/${chatId}/deliverable-objects`),
    { headers: await getHeaders() }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch deliverable objects'));
  }
  return response.json();
}

/** PATCH a deliverable object's canvas placement (drag/resize). */
/**
 * Which canvas an object lives on: a piece of work, or the campaign itself.
 *
 * Everything made outside a task is filed against the chat, so the routes come
 * in both shapes and callers say which one they mean.
 */
export type CanvasScope = { taskId: string } | { chatId: string };

function canvasPath(scope: CanvasScope): string {
  return "taskId" in scope
    ? `/campaigns/tasks/${scope.taskId}/deliverable-objects`
    : `/campaigns/chats/${scope.chatId}/deliverable-objects`;
}

export async function patchDeliverableObjectPosition(
  scope: CanvasScope,
  objectId: string,
  position: {
    canvas_x?: number;
    canvas_y?: number;
    canvas_width?: number;
    canvas_height?: number;
    canvas_z_index?: number;
  }
): Promise<DeliverableObject> {
  const response = await fetch(
    buildUrl(`${canvasPath(scope)}/${objectId}/position`),
    {
      method: 'PATCH',
      headers: await getHeaders('application/json'),
      body: JSON.stringify(position),
    }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to update deliverable position'));
  }
  return response.json();
}

/** PATCH to approve a deliverable object (user-only). */
export async function approveDeliverableObject(
  scope: CanvasScope,
  objectId: string
): Promise<DeliverableObject> {
  const response = await fetch(
    buildUrl(`${canvasPath(scope)}/${objectId}/approve`),
    {
      method: 'PATCH',
      headers: await getHeaders(),
    }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to approve deliverable object'));
  }
  return response.json();
}

/** GET the full flat folder list for a chat (client builds the tree). */
export async function getAssetFolders(
  chatId: string
): Promise<AssetFoldersResponse> {
  const response = await fetch(
    buildUrl('/assets/folders', { chat_id: chatId }),
    { headers: await getHeaders() }
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to fetch asset folders'));
  }
  return response.json();
}

// Delete a chat
export async function deleteChat(
  chatId: string,
  projectId: string
): Promise<DeleteChatResponse> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}`, { project_id: projectId }),
    {
      method: 'DELETE',
      headers: await getHeaders(),
    }
  );
  
  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to delete chat'));
  }
  
  return response.json();
}
