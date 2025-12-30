import { supabase } from "@/integrations/supabase/client";
import type {
  ProjectsResponse,
  SectionResponse,
  TasksResponse,
  HealthResponse,
  OverviewModel,
  BriefModel,
  ResearchModel,
  StrategyModel,
  SectionName,
  SSEMessage,
} from "@/types/api";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/api-proxy`;

// Helper to build URL with params
function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(EDGE_FUNCTION_URL);
  url.searchParams.set('path', path);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return url.toString();
}

// Health check
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(buildUrl('/health'));
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
}

// List projects
export async function listProjects(userEmail: string): Promise<ProjectsResponse> {
  const response = await fetch(buildUrl('/projects', { user_id: userEmail }));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch projects');
  }
  return response.json();
}

// Get project section
export async function getProjectSection<T>(
  projectId: string,
  section: SectionName,
  userEmail: string
): Promise<SectionResponse<T>> {
  const response = await fetch(
    buildUrl(`/projects/${projectId}/section/${section}`, { user_id: userEmail })
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || `Failed to fetch ${section}`);
  }
  return response.json();
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

// Get project tasks
export async function getProjectTasks(projectId: string, userEmail: string): Promise<TasksResponse> {
  const response = await fetch(
    buildUrl(`/projects/${projectId}/tasks`, { user_id: userEmail })
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch tasks');
  }
  return response.json();
}

// Create project with brief analysis (SSE streaming)
export async function analyzeBrief(
  userEmail: string,
  briefText?: string,
  files?: File[],
  onProgress?: (message: string) => void,
  onComplete?: (data: SSEMessage & { status: 'complete' }) => void,
  onError?: (message: string) => void
): Promise<void> {
  const formData = new FormData();
  formData.append('user_id', userEmail);
  
  if (briefText) {
    formData.append('brief_text', briefText);
  }
  
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file);
    });
  }

  const url = buildUrl('/ai/brief-analysis');
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Brief analysis failed');
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
          const data: SSEMessage = JSON.parse(line.slice(6));
          
          if (data.status === 'progress' && data.message) {
            onProgress?.(data.message);
          } else if (data.status === 'complete' && data.data) {
            onComplete?.(data as SSEMessage & { status: 'complete' });
          } else if (data.status === 'error' && data.message) {
            onError?.(data.message);
          }
        } catch (e) {
          console.error('Failed to parse SSE message:', line, e);
        }
      }
    }
  }
}
