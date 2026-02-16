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
  AgentStreamMessage,
  ChatMessagesResponse,
  DeleteChatResponse,
  AssetListResponse,
  CreativeState,
  StyleCardsResponse,
  CampaignTasksResponse,
  CampaignTask,
} from "@/types/api";

// Direct API base URL (bypassing Supabase Edge Function)
const API_BASE_URL = 'https://m-abdur2024-aetea-ai.hf.space';
const API_TOKEN = import.meta.env.VITE_AETEA_API_TOKEN;

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

// Create campaign via AI chat (SSE streaming)
export async function createCampaignViaChat(
  userEmail: string,
  chatId: string,
  message: string,
  files?: File[],
  onUpdate?: (content: string) => void,
  onEvent?: (eventName: string) => void,
  onComplete?: () => void,
  onError?: (message: string) => void
): Promise<void> {
  const formData = new FormData();
  formData.append('user_id', userEmail);
  formData.append('chat_id', chatId);
  formData.append('message', message);
  formData.append('mode', 'campaign');
  
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const url = buildUrl('/ai/chat');
  
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(), // Don't set Content-Type for FormData, browser will set it with boundary
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Campaign creation failed');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    
    // Keep the last incomplete line in buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data: AgentStreamMessage = JSON.parse(line.slice(6));
          
          if (data.status === 'update') {
            onUpdate?.(data.content);
          } else if (data.status === 'event') {
            onEvent?.(data.content);
          } else if (data.status === 'complete') {
            onComplete?.();
          } else if (data.status === 'error') {
            onError?.(data.content);
          }
        } catch (e) {
          console.error('Failed to parse SSE message:', line, e);
        }
      }
    }
  }
}

// Delete chat
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

// Refresh asset download URL (returns JSON with download_url)
export async function refreshAssetDownloadUrl(
  assetId: string,
  userEmail: string
): Promise<{ download_url: string }> {
  const response = await fetch(
    buildUrl(`/assets/${assetId}/download`, { user_id: userEmail }),
    {
      headers: getHeaders(),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to refresh asset URL');
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
    visual_direction?: { reference_image_ids: string[] } | null;
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

// Chat functions
export async function sendChatMessage(
  userEmail: string,
  chatId: string,
  message: string,
  mode: string,
  context?: string,
  files?: File[],
  onUpdate?: (content: string) => void,
  onContent?: (content: string) => void,
  onEvent?: (eventName: string) => void,
  onComplete?: (content: string) => void,
  onError?: (message: string) => void
): Promise<void> {
  const url = buildUrl('/ai/chat');
  
  const formData = new FormData();
  formData.append('user_id', userEmail);
  formData.append('chat_id', chatId);
  formData.append('message', message);
  formData.append('mode', mode);
  
  if (context) {
    formData.append('context', context);
  }
  
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(), // Don't set Content-Type for FormData, browser will set it with boundary
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Chat message failed');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let accumulatedContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    
    // Keep the last incomplete line in buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data: AgentStreamMessage = JSON.parse(line.slice(6));
          
          if (data.status === 'update') {
            onUpdate?.(data.content);
          } else if (data.status === 'content') {
            accumulatedContent += data.content;
            onContent?.(accumulatedContent);
          } else if (data.status === 'event') {
            onEvent?.(data.content);
          } else if (data.status === 'complete') {
            onComplete?.(accumulatedContent || data.content);
          } else if (data.status === 'error') {
            onError?.(data.content);
          }
        } catch (e) {
          console.error('Failed to parse SSE message:', line, e);
        }
      }
    }
  }
}

// List chats for a project
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
  userEmail: string
): Promise<ChatMessagesResponse> {
  const response = await fetch(
    buildUrl(`/chats/${chatId}/messages`, { user_id: userEmail }),
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
