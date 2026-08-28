import { supabase } from "@/integrations/supabase/client";
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
import { API_BASE_URL, API_TOKEN } from '@/services/config';

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

// Helper to get headers with authorization
function getHeaders(contentType?: string): HeadersInit {
  const headers: HeadersInit = {};
  
  if (API_TOKEN) {
    headers['Authorization'] = `Bearer ${API_TOKEN}`;
  }
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  return headers;
}

// Health check
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(buildUrl('/health'), {
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

// List all chats for a user
export async function listAllChats(userEmail: string): Promise<ChatListResponse> {
  const response = await fetch(buildUrl('/chats', { user_id: userEmail }), {
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch chats');
  }
  return response.json();
}

// Create a new chat
export async function createChat(
  userEmail: string,
  mode: 'brainstorm' | 'campaign' = 'brainstorm'
): Promise<{ chat_id: string; title: string; last_modified: string }> {
  const response = await fetch(buildUrl('/chats'), {
    method: 'POST',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ user_id: userEmail, mode }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create chat');
  }
  return response.json();
}

// Get project section
export async function getProjectSection<T>(
  projectId: string,
  section: SectionName,
  userEmail: string
): Promise<SectionResponse<T>> {
  console.log('API: Fetching section', { projectId, section, userEmail });
  
  const response = await fetch(
    buildUrl(`/projects/${projectId}/section/${section}`, { user_id: userEmail }),
    {
      headers: getHeaders(),
    }
  );
  
  console.log('API: Response status', response.status, response.ok);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API: Error response', error);
    throw new Error(error.detail || `Failed to fetch ${section}`);
  }
  
  const result = await response.json();
  console.log('API: Section data received', { section, data: result });
  
  return result;
}

// Convenience methods for specific sections
export async function getProjectOverview(projectId: string, userEmail: string) {
  return getProjectSection<OverviewModel>(projectId, 'overview', userEmail);
}

export async function getProjectBrief(projectId: string, userEmail: string) {
  return getProjectSection<BriefModel>(projectId, 'brief', userEmail);
}

export async function getProjectResearch(projectId: string, userEmail: string) {
  return getProjectSection<ResearchModel>(projectId, 'research', userEmail);
}

export async function getProjectStrategy(projectId: string, userEmail: string) {
  return getProjectSection<StrategyModel>(projectId, 'strategy', userEmail);
}

// Get a single chat
export async function getChat(
  chatId: string,
  userEmail: string
): Promise<{ chat_id: string; title: string; last_modified: string; mode: string; campaign_id: string | null }> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}`, { user_id: userEmail }),
    {
      headers: getHeaders(),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch chat');
  }
  
  return response.json();
}

/** PATCH /chats/{chat_id} — rename and/or change mode (see API_REFERENCE.md). */
export async function patchChat(
  chatId: string,
  userEmail: string,
  body: { title?: string; mode?: 'brainstorm' | 'campaign' }
): Promise<{
  chat_id: string;
  title: string;
  last_modified: string;
  mode: string;
  campaign_id: string | null;
}> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}`, { user_id: userEmail }),
    {
      method: 'PATCH',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update chat');
  }

  return response.json();
}

// Get campaign by chat_id
export async function getCampaignByChatId(
  chatId: string,
  userEmail: string
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
    brief: any;
    research: any;
    strategy: any;
  };
}> {
  const response = await fetch(
    buildUrl('/campaigns', { chat_id: chatId, user_id: userEmail }),
    {
      headers: getHeaders(),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch campaign');
  }
  
  return response.json();
}

// Get campaign by campaign_id
export async function getCampaignById(
  campaignId: string,
  userEmail: string
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
    brief: any;
    research: any;
    strategy: any;
  };
}> {
  const response = await fetch(
    buildUrl(`/campaigns/${campaignId}`, { user_id: userEmail }),
    {
      headers: getHeaders(),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch campaign');
  }
  
  return response.json();
}

export async function selectCreativeTerritory(
  campaignId: string,
  userEmail: string,
  territoryId: string
): Promise<StrategyModel> {
  const response = await fetch(
    buildUrl(`/campaigns/${campaignId}/strategy/selected-territory`, {
      user_id: userEmail,
    }),
    {
      method: 'PATCH',
      headers: getHeaders('application/json'),
      body: JSON.stringify({ territory_id: territoryId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to select creative territory');
  }

  return response.json();
}

// Get project tasks
export async function getProjectTasks(projectId: string, userEmail: string): Promise<TasksResponse> {
  const response = await fetch(
    buildUrl(`/projects/${projectId}/tasks`, { user_id: userEmail }),
    {
      headers: getHeaders(),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch tasks');
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
  userEmail: string,
  chatId: string,
  message: string,
  files?: File[],
  onProgress?: (step: { step_id: string; label: string; state: string }) => void,
  onStarted?: () => void,
  onComplete?: () => void,
  onError?: (message: string) => void
): Promise<void> {
  const { runTurn } = await import('@/services/agentRun');
  await runTurn(
    { userEmail, chatId, message, mode: 'campaign', files },
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

export async function deleteChatById(chatId: string, userEmail: string): Promise<DeleteChatResponse> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}`, { user_id: userEmail }),
    {
      method: 'DELETE',
      headers: getHeaders(),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete chat');
  }
  
  return response.json();
}

// Get assets by chat
export async function getAssets(
  chatId: string,
  userEmail: string,
  folderPath?: string
): Promise<AssetListResponse> {
  const params: Record<string, string> = {
    user_id: userEmail,
    chat_id: chatId,
  };
  
  if (folderPath) {
    params.folder_path = folderPath;
  }
  
  const response = await fetch(buildUrl('/assets', params), {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch assets');
  }
  
  return response.json();
}

// Refresh asset URLs (GET /assets/{id}/ returns view_url and download_url)
export async function refreshAssetUrls(
  assetId: string,
  userEmail: string
): Promise<{ view_url: string; download_url: string }> {
  const response = await fetch(
    buildUrl(`/assets/${assetId}`, { user_id: userEmail }),
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to refresh asset URLs');
  }

  return response.json();
}

/** Fetch raw asset bytes (same-origin) for the Fabric image editor. */
export async function fetchAssetContentBlob(
  assetId: string,
  userEmail: string
): Promise<Blob> {
  const response = await fetch(
    buildUrl(`/assets/${assetId}/content`, { user_id: userEmail }),
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { detail?: string }).detail || "Failed to load asset content"
    );
  }
  return response.blob();
}

/** Rename an asset (PATCH /assets/{id}) — metadata only; storage path unchanged. */
export async function renameAsset(
  assetId: string,
  userEmail: string,
  fileName: string
): Promise<Asset> {
  const response = await fetch(buildUrl(`/assets/${assetId}`), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ user_id: userEmail, file_name: fileName }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { detail?: string }).detail || "Failed to rename asset"
    );
  }
  return response.json();
}

/** Delete an asset (DELETE /assets/{id}). */
export async function deleteAsset(
  assetId: string,
  userEmail: string
): Promise<void> {
  const response = await fetch(
    buildUrl(`/assets/${assetId}`, { user_id: userEmail }),
    {
      method: "DELETE",
      headers: getHeaders(),
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { detail?: string }).detail || "Failed to delete asset"
    );
  }
}

/** Save / Save As an edited image over an existing asset (POST /assets/{id}/edit). */
export async function editAsset(
  assetId: string,
  userEmail: string,
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
  formData.append("user_id", userEmail);
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
    headers: getHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { detail?: string }).detail || "Failed to save edited image"
    );
  }

  return response.json();
}

// Get creative state
export async function getCreativeState(
  campaignId: string,
  userEmail: string
): Promise<CreativeState> {
  const response = await fetch(
    buildUrl(`/campaigns/${campaignId}/creative`, { user_id: userEmail }),
    {
      headers: getHeaders(),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch creative state');
  }
  
  return response.json();
}

// Update creative state
export async function updateCreativeState(
  campaignId: string,
  userEmail: string,
  updates: {
    selected_style_id?: string | null;
    creative_truth?: CreativeState['creative_truth'] | null;
    creative_tone?: CreativeState['creative_tone'] | null;
    key_visual_asset_id?: string | null;
  }
): Promise<CreativeState> {
  const response = await fetch(
    buildUrl(`/campaigns/${campaignId}/creative`, { user_id: userEmail }),
    {
      method: 'PATCH',
      headers: getHeaders('application/json'),
      body: JSON.stringify(updates),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update creative state');
  }
  
  return response.json();
}

// Get campaign tasks
export async function getCampaignTasks(
  campaignId: string,
  userEmail: string
): Promise<CampaignTasksResponse> {
  const response = await fetch(
    buildUrl(`/campaigns/${campaignId}/tasks`, { user_id: userEmail }),
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to fetch tasks');
  }
  return response.json();
}

// Get single campaign task
export async function getCampaignTask(
  taskId: string,
  userEmail: string
): Promise<CampaignTask> {
  const response = await fetch(
    buildUrl(`/campaigns/tasks/${taskId}`, { user_id: userEmail }),
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to fetch task');
  }
  return response.json();
}

// Update campaign task (e.g. status to done)
export async function patchCampaignTask(
  taskId: string,
  userEmail: string,
  body: { status?: CampaignTask['status']; body_copy?: string | null }
): Promise<CampaignTask> {
  const response = await fetch(
    buildUrl(`/campaigns/tasks/${taskId}`, { user_id: userEmail }),
    {
      method: 'PATCH',
      headers: getHeaders('application/json'),
      body: JSON.stringify(body),
    }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to update task');
  }
  return response.json();
}

// Get assets for a task (review page)
export async function getCampaignTaskAssets(
  taskId: string,
  userEmail: string
): Promise<AssetListResponse> {
  const response = await fetch(
    buildUrl(`/campaigns/tasks/${taskId}/assets`, { user_id: userEmail }),
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to fetch task assets');
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
      headers: getHeaders(),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch style cards');
  }
  
  return response.json();
}

// Characters (GET /characters) — reusable subject identities for video
export async function getCharacters(
  userEmail: string
): Promise<CharactersResponse> {
  const response = await fetch(
    buildUrl('/characters', { user_id: userEmail }),
    {
      headers: getHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch characters');
  }

  return response.json();
}

// Create a character (POST /characters)
export async function createCharacter(
  userEmail: string,
  payload: {
    name: string;
    description: string;
    frontal_asset_id: string;
    angle_asset_ids?: string[];
  }
): Promise<Character> {
  const response = await fetch(buildUrl('/characters'), {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userEmail, ...payload }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create character');
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
  userEmail: string,
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
        const urls = await refreshAssetUrls(h.id, userEmail);
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
  userEmail: string,
  projectId: string
): Promise<ChatListResponse> {
  const response = await fetch(
    buildUrl('/chats', { user_id: userEmail, project_id: projectId }),
    {
      headers: getHeaders(),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch chats');
  }
  
  return response.json();
}

// Get messages for a chat
export async function getChatMessages(
  chatId: string,
  userEmail: string,
  branchId: string = 'main'
): Promise<ChatMessagesResponse> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}/messages`, { user_id: userEmail, branch_id: branchId }),
    {
      headers: getHeaders(),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch messages');
  }
  
  return response.json();
}

export async function getCampaignTaskDeliverables(
  taskId: string,
  userEmail: string
): Promise<DeliverableObjectsResponse> {
  const response = await fetch(
    buildUrl(`/campaigns/tasks/${taskId}/deliverable-objects`, { user_id: userEmail }),
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to fetch deliverable objects');
  }
  return response.json();
}

/** PATCH a deliverable object's canvas placement (drag/resize). */
export async function patchDeliverableObjectPosition(
  taskId: string,
  objectId: string,
  userEmail: string,
  position: {
    canvas_x?: number;
    canvas_y?: number;
    canvas_width?: number;
    canvas_height?: number;
    canvas_z_index?: number;
  }
): Promise<DeliverableObject> {
  const response = await fetch(
    buildUrl(
      `/campaigns/tasks/${taskId}/deliverable-objects/${objectId}/position`,
      { user_id: userEmail }
    ),
    {
      method: 'PATCH',
      headers: getHeaders('application/json'),
      body: JSON.stringify(position),
    }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to update deliverable position');
  }
  return response.json();
}

/** PATCH to approve a deliverable object (user-only). */
export async function approveDeliverableObject(
  taskId: string,
  objectId: string,
  userEmail: string
): Promise<DeliverableObject> {
  const response = await fetch(
    buildUrl(
      `/campaigns/tasks/${taskId}/deliverable-objects/${objectId}/approve`,
      { user_id: userEmail }
    ),
    {
      method: 'PATCH',
      headers: getHeaders(),
    }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to approve deliverable object');
  }
  return response.json();
}

/** GET the full flat folder list for a chat (client builds the tree). */
export async function getAssetFolders(
  chatId: string,
  userEmail: string
): Promise<AssetFoldersResponse> {
  const response = await fetch(
    buildUrl('/assets/folders', { user_id: userEmail, chat_id: chatId }),
    { headers: getHeaders() }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to fetch asset folders');
  }
  return response.json();
}

// Delete a chat
export async function deleteChat(
  chatId: string,
  userEmail: string,
  projectId: string
): Promise<DeleteChatResponse> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}`, { user_id: userEmail, project_id: projectId }),
    {
      method: 'DELETE',
      headers: getHeaders(),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete chat');
  }
  
  return response.json();
}
