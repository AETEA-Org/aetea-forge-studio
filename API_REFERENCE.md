# AETEA Creative OS API Reference

Code-accurate API documentation for frontend clients and AI agents.

## Quick Facts

- **Base URL:** `http://localhost:8000` (dev) or your deployed host.
- **Auth:** no auth middleware is enforced at router level right now; endpoints require `user_id` in query/form/body.
- **Content types:**
  - `application/json` for most endpoints
  - `multipart/form-data` for `POST /ai/chat`
  - `text/event-stream` response from `POST /ai/chat`

## Conventions

- **ID fields:** `chat_id`, `campaign_id`, `task_id`, `asset_id` are UUID-like strings.
- **Mode values:** `brainstorm` or `campaign`.
- **Branch values:** `main` or `task:<task_id>`.
- **Folder values:** `User-Uploaded` or `AETEA-Generated`.
- **Error body format:** `{"detail": "..."}` for most HTTP errors.

## Endpoint Index

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Redirect to docs |
| GET | `/health` | Health probe |
| GET | `/chats` | List chats |
| POST | `/chats` | Create chat |
| GET | `/chats/{chat_id}` | Get one chat |
| GET | `/chats/{chat_id}/messages` | Get branch messages |
| DELETE | `/chats/{chat_id}` | Delete chat and linked data |
| POST | `/ai/chat` | Stream orchestrated AI reply |
| GET | `/campaigns/style-cards` | Paginated style card list |
| GET | `/campaigns` | Get campaign by chat |
| GET | `/campaigns/{campaign_id}` | Get campaign by id |
| GET | `/campaigns/{campaign_id}/creative` | Get creative state |
| PATCH | `/campaigns/{campaign_id}/creative` | Update creative state |
| GET | `/campaigns/{campaign_id}/tasks` | List campaign tasks |
| GET | `/campaigns/tasks/{task_id}` | Get one task |
| PATCH | `/campaigns/tasks/{task_id}` | Update task fields |
| GET | `/campaigns/tasks/{task_id}/assets` | List task-linked assets |
| GET | `/campaigns/tasks/{task_id}/deliverables` | List structured deliverables |
| POST | `/campaigns/tasks/{task_id}/deliverables` | Create deliverable item |
| PATCH | `/campaigns/tasks/{task_id}/deliverables/{item_id}` | Update deliverable item |
| DELETE | `/campaigns/tasks/{task_id}/deliverables/{item_id}` | Delete deliverable item |
| POST | `/campaigns/tasks/{task_id}/deliverables/{item_id}/components` | Create deliverable component |
| PATCH | `/campaigns/tasks/{task_id}/deliverables/{item_id}/components/{component_id}` | Update deliverable component |
| DELETE | `/campaigns/tasks/{task_id}/deliverables/{item_id}/components/{component_id}` | Delete deliverable component |
| GET | `/assets` | List assets by chat/task |
| GET | `/assets/{asset_id}` | Get signed view/download URLs |
| DELETE | `/assets/{asset_id}` | Delete asset |

---

## System Endpoints

### `GET /`

**Plain English:** Opens interactive API docs by redirecting to `/docs`.

**Technical:**
- Response: `302` redirect.

### `GET /health`

**Plain English:** Lightweight health check for uptime monitoring.

**Technical:**
- Response `200`:
```json
{ "status": "healthy" }
```

---

## Chats API

### `GET /chats`

**Plain English:** Returns all chats for one user, newest first, so the UI can render the sidebar/history.

**Technical:**
- Query:
  - `user_id` (required string)
- Response model: `ChatListResponse`
- Returns `500` on database errors.

**Example response (`200`):**
```json
{
  "chats": [
    {
      "chat_id": "f8e8f3f0-6c6d-4f68-8a76-84f2a26ad9b7",
      "title": "Summer Campaign Ideas",
      "last_modified": "2026-03-01T10:30:00Z",
      "mode": "brainstorm",
      "campaign_id": null
    }
  ]
}
```

### `POST /chats`

**Plain English:** Creates a new chat container before or during a conversation.

**Technical:**
- Body (`application/json`):
  - `user_id` (required string)
  - `mode` (optional: `brainstorm` or `campaign`, default `brainstorm`)
- Response model: `ChatCreateResponse`
- Returns `500` on database errors.

### `GET /chats/{chat_id}`

**Plain English:** Loads one chat and its mode/campaign linkage, used when opening a specific chat.

**Technical:**
- Path:
  - `chat_id` (required)
- Query:
  - `user_id` (required string)
- Response model: `ChatResponse`
- `404` if chat not found.

### `GET /chats/{chat_id}/messages`

**Plain English:** Fetches stored message history for one branch, so chat replay works for main and task branches.

**Technical:**
- Path:
  - `chat_id` (required)
- Query:
  - `user_id` (required)
  - `branch_id` (optional, default `main`)
- Response model: `ChatMessagesResponse`
- Includes assistant `thinking` field when available.

### `DELETE /chats/{chat_id}`

**Plain English:** Deletes a chat and all records connected to it (messages and linked campaign data) for that user scope.

**Technical:**
- Path:
  - `chat_id`
- Query:
  - `user_id` (required)
- Response model: `DeleteChatResponse`
- `404` if chat not found.

---

## AI Chat API (SSE)

### `POST /ai/chat`

**Plain English:** Sends a user message to the orchestrator agent. The backend streams progress updates and generated text in real time, while also handling optional file uploads and persistence.

**Technical:**
- Content-Type: `multipart/form-data`
- Form fields:
  - `user_id` (required)
  - `chat_id` (required)
  - `message` (required)
  - `mode` (optional, default `brainstorm`)
  - `branch_id` (optional, default `main`)
  - `context` (optional; campaign-only hint)
  - `files` (optional array of uploaded files)
- Response: `text/event-stream` (SSE frames as `data: <json>\n\n`)

**Context hints (`context`):**
- `tab:brief`
- `tab:research`
- `tab:strategy`
- `tab:creative`
- `task:<task_id>`

**What happens under the hood:**
1. Ensures chat exists (creates if missing).
2. Uploads files to `User-Uploaded` and creates asset rows.
3. Builds message history (up to last 16 messages for the branch).
4. Creates orchestrator + `AgentContext` and streams execution.
5. Emits SSE `content`, `update`, `event`, and final `complete`.
6. Saves user and assistant messages to DB (including assistant thinking transcript).
7. Updates chat last-modified timestamp; generates a title on first message.

**SSE payload schema:**
```json
{
  "status": "content | update | event | complete | error",
  "content": "string"
}
```

**SSE status meaning:**
- `content`: token chunk of assistant text.
- `update`: tool/progress/thinking line.
- `event`: named event for UI transitions.
- `complete`: full final assistant response.
- `error`: stream-level failure detail.

**Common event names observed in code paths:**
- `campaign_creation_started`
- `campaign_modifying`
- `campaign_modified`

---

## Campaigns API

### `GET /campaigns/style-cards`

**Plain English:** Lists style cards used on the creative side, including signed preview URLs when available.

**Technical:**
- Query:
  - `limit` (optional int, default `30`, min `1`, max `100`)
  - `offset` (optional int, default `0`, min `0`)
- Response model: `StyleCardListResponse`

### `GET /campaigns`

**Plain English:** Fetches the campaign linked to a chat, plus current section JSON (brief/research/strategy/creative state where present).

**Technical:**
- Query:
  - `chat_id` (required)
  - `user_id` (required)
- Response model: `CampaignWithSectionsResponse`
- `404` if no campaign exists for the chat.

### `GET /campaigns/{campaign_id}`

**Plain English:** Same as above, but directly by campaign id.

**Technical:**
- Path:
  - `campaign_id`
- Query:
  - `user_id`
- Response model: `CampaignWithSectionsResponse`

### `GET /campaigns/{campaign_id}/creative`

**Plain English:** Returns creative state (truth, tone, selected style, key visual). If missing, backend attempts to create an empty state first.

**Technical:**
- Path:
  - `campaign_id`
- Query:
  - `user_id`
- Response model: `CreativeStateResponse`

### `PATCH /campaigns/{campaign_id}/creative`

**Plain English:** Applies partial updates to creative state from the frontend (for example: selected style card or key visual linkage).

**Technical:**
- Path:
  - `campaign_id`
- Query:
  - `user_id`
- Body fields (all optional):
  - `selected_style_id`
  - `creative_truth`
  - `creative_tone`
  - `key_visual_asset_id`
- Response model: `CreativeStateResponse`

### `GET /campaigns/{campaign_id}/tasks`

**Plain English:** Lists all tasks in a campaign so the UI can render the campaign workboard.

**Technical:**
- Path:
  - `campaign_id`
- Query:
  - `user_id`
- Response model: `TaskListResponse`

---

## Task + Deliverables API

### `GET /campaigns/tasks/{task_id}`

**Plain English:** Fetches one task row by id.

**Technical:**
- Query: `user_id` (required)
- Response model: `TaskResponse`
- `404` when missing.

### `PATCH /campaigns/tasks/{task_id}`

**Plain English:** Updates task fields directly (usually status transitions like `todo` -> `under_review` -> `done`).

**Technical:**
- Query: `user_id` (required)
- Body (all optional):
  - `status`
  - `title`
  - `description`
- Response model: `TaskResponse`

### `GET /campaigns/tasks/{task_id}/assets`

**Plain English:** Lists files currently linked to that task, with signed view/download URLs.

**Technical:**
- Query: `user_id` (required)
- Response model: `AssetListResponse`

### `GET /campaigns/tasks/{task_id}/deliverables`

**Plain English:** Returns structured outputs for task completion (items and nested components), which is the render-ready task output model. Each component that references an asset includes **embedded asset fields** (file name, MIME type, description, and signed `view_url` / `download_url`) so clients can render previews without a separate assets list or per-asset `GET` calls.

**Technical:**
- Query: `user_id`
- Response model: `DeliverableListResponse`
- Response body shape: `{ "items": [ ... ] }` is the primary key. Some clients may also accept `deliverables` as an alias for the same array; prefer `items` when implementing new clients.

**Signed URLs:** Links are time-limited. Refresh by calling this endpoint again (or `GET /assets/{asset_id}`) when previews fail or after long-lived UI sessions—see Integration Notes #4.

#### Deliverable component constraints (per item)

The backend enforces at most:

- **One visual:** either **one** `image` **or** **one** `video` (not both); or neither.
- **One copy block:** at most **one** text component.
- **One document:** at most **one** `pdf`.

Clients should not assume arbitrary numbers of components per slot.

**Example** (`view_url` / `download_url` truncated):

```json
{
  "items": [
    {
      "id": "...",
      "task_id": "...",
      "item_index": 1,
      "title": "Example deliverable",
      "status": "active",
      "components": [
        {
          "id": "...",
          "deliverable_item_id": "...",
          "component_type": "image",
          "asset_id": "...",
          "text_content": null,
          "order_index": 1,
          "file_name": "hero.png",
          "description": "Optional caption",
          "mime_type": "image/png",
          "view_url": "https://...",
          "download_url": "https://...",
          "created_at": "2026-03-28T22:47:31.291266+00:00",
          "updated_at": "2026-03-28T22:47:31.291266+00:00"
        }
      ],
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

### `POST /campaigns/tasks/{task_id}/deliverables`

**Plain English:** Creates a new deliverable item (for example, a carousel slide entry).

**Technical:**
- Query: `user_id`
- Body:
  - `item_index` (required int)
  - `title` (optional)
  - `status` (optional, default `active`)
- Response model: `DeliverableItemResponse`

### `PATCH /campaigns/tasks/{task_id}/deliverables/{item_id}`

**Plain English:** Updates title/status for an existing deliverable item.

**Technical:**
- Query: `user_id`
- Body:
  - `title` (optional)
  - `status` (optional)
- Response model: `DeliverableItemResponse`

### `DELETE /campaigns/tasks/{task_id}/deliverables/{item_id}`

**Plain English:** Removes one deliverable item from a task.

**Technical:**
- Query: `user_id`
- Response:
```json
{
  "message": "Deliverable item deleted",
  "item_id": "..."
}
```

### `POST /campaigns/tasks/{task_id}/deliverables/{item_id}/components`

**Plain English:** Adds one component under a deliverable item. A component can be text or an asset reference.

**Technical:**
- Query: `user_id`
- Body:
  - `component_type` (required string)
  - `asset_id` (optional)
  - `text_content` (optional)
  - `order_index` (optional, default `1`)
- Response model: `DeliverableComponentResponse`

### `PATCH /campaigns/tasks/{task_id}/deliverables/{item_id}/components/{component_id}`

**Plain English:** Updates a deliverable component's linked asset/text/order.

**Technical:**
- Query: `user_id`
- Body (all optional):
  - `asset_id`
  - `text_content`
  - `order_index`
- Response model: `DeliverableComponentResponse`

### `DELETE /campaigns/tasks/{task_id}/deliverables/{item_id}/components/{component_id}`

**Plain English:** Deletes one component from a deliverable item.

**Technical:**
- Query: `user_id`
- Response:
```json
{
  "message": "Deliverable component deleted",
  "component_id": "..."
}
```

---

## Assets API

### `GET /assets`

**Plain English:** Lists assets for a chat, optionally narrowed to a folder or task.

**Technical:**
- Query:
  - `user_id` (required)
  - `chat_id` (required)
  - `folder_path` (optional: `User-Uploaded` or `AETEA-Generated`)
  - `task_id` (optional; if provided, task listing path is used)
- Response model: `AssetListResponse`

### `GET /assets/{asset_id}`

**Plain English:** Returns signed URLs for viewing and downloading one asset.

**Technical:**
- Path:
  - `asset_id`
- Query:
  - `user_id`
- Response (`200`):
```json
{
  "view_url": "https://...",
  "download_url": "https://..."
}
```

### `DELETE /assets/{asset_id}`

**Plain English:** Deletes asset metadata and the backing storage object.

**Technical:**
- Query: `user_id`
- Response (`200`):
```json
{
  "message": "Asset deleted",
  "asset_id": "..."
}
```

---

## Response Models (Important Fields)

### `AgentStreamMessage`
- `status`: `content | update | event | complete | error`
- `content`: payload text or event name

### `TaskResponse`
- `type`: free string (`text`, `image`, `video` are common)
- `status`: free string (`todo`, `in_progress`, `under_review`, `done` commonly used)
- `subtype`, `title`, `description`, `created_at`, `updated_at`

### `AssetResponse`
- includes both `view_url` and `download_url` signed links (when signing succeeds)
- includes `folder_path`, `description`, `mime_type`

### `DeliverableListResponse`
- `items`: array of deliverable item rows (see below). May also appear as `deliverables` in some responses; treat as equivalent to `items` when present.

**Deliverable item (read shape):**
- `id`, `task_id`, `item_index`, `title`, `status`, `created_at`, `updated_at`
- `components`: array of component rows (see below)

**Deliverable component (read shape):**
- Identity and structure: `id`, `deliverable_item_id`, `component_type`, `asset_id`, `text_content`, `order_index`, `created_at`, `updated_at`
- When the component references an asset, the response also includes embedded file metadata and signed URLs: `file_name`, `description`, `mime_type`, `view_url`, `download_url` (may be omitted if signing fails)

### `CampaignWithSectionsResponse`
- `campaign`: metadata (`id`, `chat_id`, `title`, timestamps)
- `sections`: arbitrary JSON keyed by section name

---

## Error Handling

- `400`: currently used by app-level exception mapping (for document load failures).
- `404`: resource not found (chat, campaign, task, asset, deliverable item/component).
- `500`: database/internal errors.
- SSE route (`POST /ai/chat`) may stream a final `status=error` frame instead of returning a different HTTP status.

---

## Integration Notes for AI Agents and Clients

1. **`POST /ai/chat` is multipart + SSE:** do not use `EventSource` for this POST flow; use streamed `fetch`.
2. **Persisted chat state is branch-aware:** pass `branch_id` when replaying task branches.
3. **Campaign mode gating exists in agent tools:** if not in campaign mode, delegated campaign operations return guard text rather than mutating state.
4. **Asset URLs are signed and temporary:** refresh by calling asset endpoints again if links expire.
5. **Useful refetch moments:** after SSE `event` values like `campaign_modified`, and after SSE `complete`.

---

**Last updated:** 2026-03-28  
**Source of truth:** router implementations under `app/router/` and schema files under `app/schemas/`.
