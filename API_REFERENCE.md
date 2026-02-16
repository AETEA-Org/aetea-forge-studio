# AETEA Creative OS -- API Reference

Complete API documentation for frontend developers.

**Base URL:** `http://localhost:8000` (development) or your deployed URL.

**Content Types:**
- `application/json` -- standard responses
- `multipart/form-data` -- file uploads (`POST /ai/chat`)
- `text/event-stream` -- SSE streaming (`POST /ai/chat`)

---

## Table of Contents

- [Health Check](#health-check)
- [Chats](#chats)
- [AI Chat (SSE)](#ai-chat-sse)
- [Campaigns](#campaigns)
- [Creative State](#creative-state)
- [Style Cards](#style-cards)
- [Tasks](#tasks)
- [Assets](#assets)
- [SSE Event Reference](#sse-event-reference)
- [Using AI Chat for Specific Tasks](#using-ai-chat-for-specific-tasks)
- [Error Handling](#error-handling)

---

## Health Check

### `GET /health`

Returns API health status.

**Response** `200`:
```json
{ "status": "healthy" }
```

---

## Chats

### `GET /chats`

List all chats for a user (most recent first).

| Query Param | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | Yes | User email |

**Response** `200`:
```json
{
  "chats": [
    {
      "chat_id": "uuid",
      "title": "Summer Campaign Ideas",
      "last_modified": "2026-02-15T10:30:00",
      "mode": "brainstorm",
      "campaign_id": null
    }
  ]
}
```

### `POST /chats`

Create a new chat.

**Request body** (`application/json`):
```json
{
  "user_id": "user@example.com",
  "mode": "brainstorm"
}
```

| Field | Type | Required | Values | Default |
|---|---|---|---|---|
| `user_id` | string | Yes | any email | -- |
| `mode` | string | No | `"brainstorm"`, `"campaign"` | `"brainstorm"` |

**Response** `200`:
```json
{
  "chat_id": "uuid",
  "title": "New Chat",
  "last_modified": "2026-02-15T10:30:00"
}
```

### `GET /chats/{chat_id}`

Get a single chat (useful for loading current mode and checking if campaign exists).

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

**Response** `200`:
```json
{
  "chat_id": "uuid",
  "title": "My Campaign",
  "last_modified": "2026-02-15T10:30:00",
  "mode": "campaign",
  "campaign_id": "campaign-uuid-or-null"
}
```

### `GET /chats/{chat_id}/messages`

Get all messages for a chat.

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

**Response** `200`:
```json
{
  "messages": [
    {
      "message_id": "uuid",
      "role": "user",
      "content": "Create a campaign for Nike",
      "timestamp": "2026-02-15T10:30:00"
    },
    {
      "message_id": "uuid",
      "role": "assistant",
      "content": "I'll create a campaign...",
      "timestamp": "2026-02-15T10:30:05"
    }
  ]
}
```

### `DELETE /chats/{chat_id}`

Delete a chat and all related data (messages, campaign, sections, tasks, assets).

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

**Response** `200`:
```json
{
  "message": "Chat and all related data deleted successfully",
  "chat_id": "uuid"
}
```

---

## AI Chat (SSE)

### `POST /ai/chat`

Send a message to AETEA agent. Returns Server-Sent Events stream.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | Yes | User email |
| `chat_id` | string | Yes | Chat UUID |
| `message` | string | Yes | User message |
| `mode` | string | No | `"brainstorm"` or `"campaign"` (default: `"brainstorm"`) |
| `context` | string | No | Optional context hint (campaign mode only, see below) |
| `files` | File[] | No | File uploads (PDF, DOCX, PPTX, images) |

**Context parameter** (campaign mode only):
- `tab:brief` / `tab:research` / `tab:strategy` / `tab:creative` -- tells the agent which tab the user is viewing.
- `task:<task_id>` -- tells the agent the user is viewing a specific task.

**SSE stream format:**

Each message is a JSON object prefixed by `data: ` and followed by `\n\n`.

```typescript
interface AgentStreamMessage {
  status: "content" | "update" | "event" | "complete" | "error";
  content: string;
}
```

| Status | When | Content field contains |
|---|---|---|
| `content` | Agent is generating text | Text token (append to response) |
| `update` | Tool progress | Human-readable progress message (e.g. "Creating image") |
| `event` | Named event for UI | Event name (see [SSE Event Reference](#sse-event-reference)) |
| `complete` | Stream finished successfully | Full accumulated response text |
| `error` | Stream failed | Error description |

**File uploads:**
- Uploaded files are stored in the `Uploaded` folder in Supabase Storage.
- File names are appended to the message so the agent knows about them.
- Do NOT set `Content-Type` header manually -- the browser will set it with the boundary.

---

## Campaigns

### `GET /campaigns`

Get campaign for a chat (one campaign per chat). Returns campaign metadata and all sections.

| Query Param | Type | Required |
|---|---|---|
| `chat_id` | string | Yes |
| `user_id` | string | Yes |

**Response** `200`:
```json
{
  "campaign": {
    "id": "campaign-uuid",
    "chat_id": "chat-uuid",
    "user_id": "user@example.com",
    "title": "Nike Summer 2026",
    "created_at": "2026-02-15T10:30:00",
    "updated_at": "2026-02-15T10:30:00"
  },
  "sections": {
    "brief": { "campaign_goals": {...}, "brand_information": {...}, "project_brief": {...} },
    "research": { "market_category": {...}, "audience_culture": {...}, "competitors_positioning": {...}, "swot": {...} },
    "strategy": { "doctrine": [...], "campaign_pillars": [...], "kpis": [...], "audience_mapping": {...}, "channel_strategy": {...} }
  }
}
```

### `GET /campaigns/{campaign_id}`

Get campaign by ID with sections. Same response schema as above.

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

---

## Creative State

### `GET /campaigns/{campaign_id}/creative`

Get creative state for a campaign. Auto-creates empty state if none exists.

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

**Response** `200`:
```json
{
  "id": "state-uuid",
  "campaign_id": "campaign-uuid",
  "creative_truth": {
    "claims_rtbs": ["Claim 1", "Claim 2"],
    "ctas_specs": ["CTA 1", "CTA 2"]
  },
  "creative_tone": {
    "concept": "Bold authenticity...",
    "headline_sample": "Just Own It",
    "body_copy_sample": "Every step you take..."
  },
  "visual_direction": {
    "reference_image_ids": ["asset-uuid-1"]
  },
  "selected_style_id": "style-card-uuid-or-null",
  "key_visual_asset_id": "asset-uuid-or-null",
  "created_at": "2026-02-15T10:30:00",
  "updated_at": "2026-02-15T10:30:00"
}
```

### `PATCH /campaigns/{campaign_id}/creative`

Update creative state from frontend (style selection, reference images).

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

**Request body:**
```json
{
  "selected_style_id": "style-card-uuid",
  "visual_direction": {
    "reference_image_ids": ["asset-uuid-1", "asset-uuid-2"]
  }
}
```

All fields are optional -- only provided fields are updated.

| Field | Type | Description |
|---|---|---|
| `selected_style_id` | string \| null | Style card UUID the user selected |
| `visual_direction` | object \| null | Object with `reference_image_ids` array (max 3) |

**Response** `200`: Same schema as `GET` (full creative state).

---

## Style Cards

### `GET /campaigns/style-cards`

List available style cards with pagination and preview URLs.

| Query Param | Type | Required | Default | Range |
|---|---|---|---|---|
| `limit` | int | No | 30 | 1-100 |
| `offset` | int | No | 0 | >= 0 |

**Response** `200`:
```json
{
  "style_cards": [
    {
      "id": "card-uuid",
      "name": "Photorealistic",
      "storage_path": "style_cards/photorealistic.png",
      "thumbnail_path": "style_cards/thumbs/photorealistic.png",
      "preview_url": "https://signed-url..."
    }
  ],
  "total": null
}
```

`preview_url` is a signed URL valid for 1 hour. May be `null` if signing fails.

---

## Tasks

### `GET /campaigns/{campaign_id}/tasks`

List all tasks for a campaign.

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

**Response** `200`:
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "campaign_id": "campaign-uuid",
      "type": "image",
      "subtype": "social_post",
      "title": "Instagram carousel for product launch",
      "description": "Create a 5-slide carousel...",
      "status": "todo",
      "body_copy": null,
      "created_at": "2026-02-15T10:30:00",
      "updated_at": "2026-02-15T10:30:00"
    }
  ]
}
```

**Task type values:** `"text"`, `"image"`, `"video"`

**Task status values:**

| Status | Meaning |
|---|---|
| `todo` | Not started |
| `in_progress` | Currently being worked on |
| `under_review` | AI completed, awaiting user review |
| `done` | User marked as complete |

### `GET /campaigns/tasks/{task_id}`

Get a single task by ID.

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

**Response** `200`: Single `TaskResponse` object (same schema as items in task list).

### `PATCH /campaigns/tasks/{task_id}`

Update task status and/or body_copy directly from frontend.

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

**Request body:**
```json
{
  "status": "done",
  "body_copy": null
}
```

| Field | Type | Description |
|---|---|---|
| `status` | string \| null | New status value |
| `body_copy` | string \| null | Markdown body copy |

Both fields are optional.

**Response** `200`: Updated `TaskResponse` object.

### `GET /campaigns/tasks/{task_id}/assets`

List all assets linked to a task (produced during task completion).

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

**Response** `200`:
```json
{
  "assets": [
    {
      "id": "asset-uuid",
      "user_id": "user@example.com",
      "chat_id": "chat-uuid",
      "task_id": "task-uuid",
      "folder_path": "Completed tasks",
      "file_name": "hero_image.png",
      "download_url": "https://signed-url...",
      "mime_type": "image/png",
      "created_at": "2026-02-15T10:30:00"
    }
  ]
}
```

---

## Assets

### `GET /assets`

List assets by chat. Optionally filter by folder or task.

| Query Param | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | Yes | User email |
| `chat_id` | string | Yes | Chat UUID |
| `folder_path` | string | No | Filter by folder (e.g. `"Uploaded"`, `"Key visual"`) |
| `task_id` | string | No | Filter by task UUID (overrides folder filter) |

**Folder values:** `"Uploaded"`, `"AETEA Generated"`, `"Key visual"`, `"Completed tasks"`

**Response** `200`: `AssetListResponse` (same schema as task assets above).

### `GET /assets/{asset_id}/download`

Download an asset. Redirects (302) to a signed URL.

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

### `DELETE /assets/{asset_id}`

Delete an asset (database row + storage file).

| Query Param | Type | Required |
|---|---|---|
| `user_id` | string | Yes |

**Response** `200`:
```json
{
  "message": "Asset deleted",
  "asset_id": "asset-uuid"
}
```

---

## SSE Event Reference

Events are SSE messages with `status: "event"`. The `content` field contains the event name.

| Event Name | When Emitted | Frontend Action |
|---|---|---|
| `campaign_creation_started` | Campaign creation pipeline begins | Switch to loading screen |
| `campaign_modifying` | AI is about to modify campaign/task/creative | Blur campaign UI, show "AETEA is modifying..." |
| `campaign_modified` | AI finished modifying campaign/task/creative | Refetch current page data |

**Note:** The `complete` status event (not `event` type) signals the entire AI response is finished. Use this to exit loading screens after campaign creation.

### SSE Stream Lifecycle

```
POST /ai/chat
  ↓
[status=event, content="campaign_creation_started"]  ← show loading screen
[status=update, content="Analyzing your brief..."]   ← update loading text
[status=update, content="Researching market..."]     ← update loading text
[status=update, content="Developing strategy..."]    ← update loading text
[status=content, content="Your campaign..."]         ← agent response tokens
[status=complete, content="full response"]           ← exit loading, show campaign
```

For campaign modifications:
```
POST /ai/chat (e.g. "Update the brief goals")
  ↓
[status=event, content="campaign_modifying"]    ← blur campaign
[status=update, content="Reading brief..."]     ← optional progress
[status=content, content="I've updated..."]     ← agent response
[status=event, content="campaign_modified"]     ← refetch data
[status=complete, content="full response"]      ← done
```

---

## Using AI Chat for Specific Tasks

### Creating a Campaign

1. Set `mode` to `"campaign"`.
2. Prefix user message: `"Create a campaign for me using the following details: {user_message}"`.
3. Optionally attach brief documents as `files`.
4. Listen for `campaign_creation_started` event -> show loading screen.
5. Display `update` messages as loading progress text.
6. On `complete` -> exit loading, fetch campaign data via `GET /campaigns?chat_id=...`.

### Generating a Key Visual

1. Frontend should have already set `selected_style_id` and `visual_direction` (reference images) via `PATCH /campaigns/{id}/creative`.
2. Send message like: `"Generate a key visual using the selected style. Reference images: image1.png, image2.png"`.
3. Set `context` to `"tab:creative"`.
4. Listen for `campaign_modifying` -> blur creative tab.
5. On `campaign_modified` -> refetch creative state to get `key_visual_asset_id`.
6. On `complete` -> unblur.

### Completing a Task

1. Send message: `"Complete task"`.
2. Set `context` to `"task:<task_id>"`.
3. The AI will read the task, gather campaign context, generate required assets/copy, and update the task status to `under_review`.
4. Listen for `campaign_modifying` / `campaign_modified` events.
5. On `complete` -> refetch task via `GET /campaigns/tasks/{task_id}`.
6. If `status` is `under_review`, show "Review Completed Task" button.
7. User can mark as done via `PATCH /campaigns/tasks/{task_id}` with `{"status": "done"}`.

### Re-doing a Task

1. Send feedback message like: `"The copy is too formal, make it more casual and add humor"`.
2. Set `context` to `"task:<task_id>"`.
3. AI re-reads the task, incorporates feedback, generates new content.
4. Same event flow as task completion.

### Brainstorm Conversation

1. Set `mode` to `"brainstorm"`.
2. Send any message. AI can search the web, generate media, and discuss ideas.
3. No campaign structure -- just conversation and asset generation.
4. If user wants to create a campaign, AI will suggest switching to campaign mode.

---

## Error Handling

All errors use this format:
```json
{
  "detail": "Error description"
}
```

| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | Bad request (invalid parameters) |
| `404` | Resource not found |
| `500` | Server error |

---

## Guidelines for Frontend Developers

1. **User ID:** Currently any string (typically email). Passed as query param or form field, not via auth headers.
2. **UUIDs:** All IDs (`chat_id`, `campaign_id`, `task_id`, `asset_id`) are UUIDs. Generate `chat_id` on the frontend when creating a new chat via `POST /ai/chat`.
3. **SSE parsing:** Do not use `EventSource` (doesn't support POST). Use `fetch()` with `ReadableStream`. Parse `data: {...}\n\n` format.
4. **Signed URLs:** Download URLs expire after 1 hour. Refetch if expired.
5. **CORS:** Enabled for all origins. No additional configuration needed.
6. **Markdown content:** Task descriptions, body_copy, and AI responses contain markdown. Use a renderer like `react-markdown`.
7. **Polling vs. events:** Prefer SSE events over polling. Only refetch data after receiving relevant events (`campaign_modified`, `complete`).

---

**Last Updated:** 2026-02-16
**API Version:** 1.0.0
