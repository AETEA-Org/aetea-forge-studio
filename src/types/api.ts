// Color type used across models
export interface Color {
  name: string;
  hex_code: string;
}

// Project list item
export interface ProjectListItem {
  project_id: string;
  title: string;
  last_modified: string;
}

// Overview Model
export interface BrandSnapshot {
  brand_voice_tags: string[];
  style_description: string;
  color_palette: Color[];
  typography: string[];
}

export interface StrategyHighlights {
  bullet_points: string[];
  main_platforms: string[];
  timeline: string;
}

export interface ExecutionSnapshot {
  total_tasks: number;
  todo_count: number;
  in_progress_count: number;
  under_review_count: number;
  done_count: number;
  completion_percentage: number;
}

export interface OverviewModel {
  campaign_summary: string;
  goals_and_success: string[];
  brand_snapshot: BrandSnapshot;
  strategy_highlights: StrategyHighlights;
  execution_snapshot: ExecutionSnapshot;
}

// Brief Model
export interface TargetMetric {
  metric: string;
  target: string;
  timeframe?: string;
}

export interface KeyDate {
  label: string;
  date: string;
}

export interface BriefModel {
  campaign_goals: {
    campaign_objectives: string[];
    target_metrics: TargetMetric[];
    success_criteria: string;
  };
  brand_information: {
    brand_name?: string;
    brand_voice_tags: string[];
    style_guidelines: string;
    colors: Color[];
    typography: string[];
  };
  project_brief: {
    deliverables: string[];
    start_date?: string;
    end_date?: string;
    key_dates: KeyDate[];
    budget?: string;
    constraints: string;
  };
  hashtags?: {
    hashtags_from_user: string[];
    hashtags_ai_recommended: string[];
  };
}

// Research Model
export interface Competitor {
  name: string;
  competitor_type: string;
  one_line_summary: string;
  perceived_positioning: string;
  homepage_url?: string | null;
  social_handles: string[];
}

export interface ResearchModel {
  market_category: {
    industry_trends: string[];
    market_context: string;
    consumer_insights: string[];
  };
  audience_culture: {
    demographics: string;
    psychographics: string;
    behaviour_patterns: string;
  };
  competitors_positioning: {
    competitors: Competitor[];
    gap_analysis: string[];
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

// Strategy Model
export interface CampaignPillar {
  title: string;
  core_message: string;
  value_proposition: string;
  positioning_note: string;
}

export interface KPI {
  metric: string;
  description: string;
  target: string;
  timeframe: string;
}

export interface Persona {
  name: string;
  description: string;
  channels: string[];
}

export interface JourneyMapping {
  awareness: string;
  consideration: string;
  conversion: string;
  loyalty: string;
}

export interface Channel {
  name: string;
  role: string;
  content_types: string[];
  budget_share?: number;
}

export interface ContentCalendarItem {
  date_or_phase: string;
  channel: string;
  content_type: string;
  pillar: string;
}

export interface InsightModel {
  core_cultural_insight: string;
  emotional_behavioral_tension: string;
  resolution_alignment_over_performance: string;
  brand_role: string;
  single_minded_proposition: string;
}

/** Canonical shape after client normalization (matches current API / StrategyModel). */
export interface CreativeFoundationModel {
  big_idea: string;
  key_message: string;
  tagline_or_campaign_line: string | null;
  creative_direction: string;
}

export interface StrategyModel {
  doctrine: string[];
  insight: InsightModel;
  creative_foundation?: CreativeFoundationModel;
  campaign_pillars: CampaignPillar[];
  kpis: KPI[];
  audience_mapping: {
    segments: string[];
    personas: Persona[];
    journey_mapping: JourneyMapping;
  };
  channel_strategy: {
    channels: Channel[];
    content_calendar: ContentCalendarItem[];
  };
}

// Task Model
export type TaskStatus = 'todo' | 'in_progress' | 'under_review' | 'done';

export interface TaskModel {
  task_id: string;
  title_markdown: string;
  description_markdown: string;
  category: string;
  status: TaskStatus;
  deadline: string | null;
  deliverables: string[] | null;
}

// API Response types
export interface ProjectsResponse {
  projects: ProjectListItem[];
}

export interface SectionResponse<T> {
  content: T;
}

export interface TasksResponse {
  tasks: TaskModel[];
}

export interface HealthResponse {
  status: string;
}

// SSE Message types
export interface SSEProgressMessage {
  status: 'progress';
  message: string;
  data: null;
}

export interface SSECompleteMessage {
  status: 'complete';
  message: null;
  data: {
    project_id: string;
    title: string;
    overview: OverviewModel;
  };
}

export interface SSEErrorMessage {
  status: 'error';
  message: string;
  data: null;
}

export type SSEMessage = SSEProgressMessage | SSECompleteMessage | SSEErrorMessage;

// Section types
export type SectionName = 'overview' | 'brief' | 'research' | 'strategy';

// Chat types
export interface AgentStreamMessage {
  status: 'content' | 'update' | 'event' | 'assets' | 'complete' | 'error';
  content: string;
}

/** Payload inside SSE `assets` frame (`content` is JSON string). */
export interface StreamAssetHint {
  id: string;
  mime_type: string;
}

/** Minimal asset data for inline chat previews (history or resolved stream). */
export interface ChatRenderableAsset {
  id: string;
  mime_type: string;
  view_url: string;
  download_url: string;
  file_name?: string;
}

export interface ChatListItem {
  chat_id: string;
  title: string;
  last_modified: string;
}

export interface ChatListResponse {
  chats: ChatListItem[];
}

export interface ChatMessage {
  message_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  branch_id?: string;
  thinking?: string | null;
  /** Asset ids attached to this message; resolve via top-level `assets` on the response. */
  assets?: string[];
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  /** Deduplicated full asset rows for ids referenced in messages (signed URLs). */
  assets?: Asset[];
}

export interface DeleteChatResponse {
  message: string;
  chat_id: string;
}

// Asset types
export interface Asset {
  id: string;
  user_id: string;
  chat_id: string;
  task_id: string | null;
  folder_path: string;
  file_name: string;
  view_url: string;
  download_url: string;
  mime_type: string;
  created_at: string;
}

export interface AssetListResponse {
  assets: Asset[];
}

// Creative State types
export interface CreativeState {
  id: string;
  campaign_id: string;
  creative_truth: {
    claims_rtbs: string[];
    ctas_specs: string[];
  };
  creative_tone: {
    concept: string;
    headline_sample: string;
    body_copy_sample: string;
  };
  visual_direction: {
    reference_image_ids: string[];
  };
  selected_style_id: string | null;
  key_visual_asset_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StyleCard {
  id: string;
  name: string;
  storage_path: string;
  thumbnail_path: string;
  preview_url: string | null;
}

export interface StyleCardsResponse {
  style_cards: StyleCard[];
  total: number | null;
}

// Campaign tasks (GET /campaigns/{id}/tasks)
export type CampaignTaskStatus = 'todo' | 'in_progress' | 'under_review' | 'done';
export type CampaignTaskType = 'text' | 'image' | 'video';

export interface CampaignTask {
  id: string;
  campaign_id: string;
  type: CampaignTaskType;
  subtype?: string;
  title: string;
  description: string;
  status: CampaignTaskStatus;
  body_copy: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignTasksResponse {
  tasks: CampaignTask[];
}

export interface DeliverableComponent {
  id: string;
  deliverable_item_id?: string | null;
  component_type: string;
  asset_id?: string | null;
  text_content?: string | null;
  order_index?: number;
  file_name?: string | null;
  description?: string | null;
  mime_type?: string | null;
  view_url?: string | null;
  download_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DeliverableItem {
  id: string;
  task_id?: string;
  item_index: number;
  title?: string | null;
  status?: string | null;
  components?: DeliverableComponent[];
  created_at?: string;
  updated_at?: string;
}

export interface DeliverablesResponse {
  deliverables?: DeliverableItem[];
  items?: DeliverableItem[];
}

// Creative State types
export interface CreativeState {
  id: string;
  campaign_id: string;
  creative_truth: {
    claims_rtbs: string[];
    ctas_specs: string[];
  };
  creative_tone: {
    concept: string;
    headline_sample: string;
    body_copy_sample: string;
  };
  visual_direction: {
    reference_image_ids: string[];
  };
  selected_style_id: string | null;
  key_visual_asset_id: string | null;
  created_at: string;
  updated_at: string;
}