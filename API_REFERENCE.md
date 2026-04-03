# AETEA Creative OS API Reference

Code-accurate API documentation for frontend clients and AI agents.

## Quick Facts

- **Base URL:** `http://localhost:8000` (dev) or your deployed host.
- **Auth:** no auth middleware is enforced at router level right now; almost all endpoints require `user_id` in query, form, or JSON body. **Exception:** `GET /campaigns/style-cards` takes only pagination query params (`limit`, `offset`).
- **Interactive API:** `GET /` redirects to `/docs` (Swagger UI). FastAPI also serves `/redoc` and `/openapi.json` by default.
- **Content types:**
  - `application/json` for most endpoints
  - `multipart/form-data` for `POST /ai/chat`
  - `text/event-stream` response from `POST /ai/chat`

## Conventions

- **ID fields:** `chat_id`, `campaign_id`, `task_id`, `asset_id` are UUID-like strings.
- **Mode values:** `brainstorm` or `campaign`.
- **Branch values:** `main` or `task:<task_id>`.
- **Folder values:** `User-Uploaded` or `AETEA-Generated` (see `app.core` / `normalize_asset_folder` for exact strings).
- **Error body format:** `{"detail": "..."}` for most HTTP errors.
- **Database:** Chat message persistence expects a `messages.assets` column (`jsonb`, default `[]`). Apply the migration under `supabase/migrations/` (or equivalent) before relying on `POST /ai/chat` or `GET /chats/{chat_id}/messages` with asset data.

## Endpoint Index

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Redirect to docs |
| GET | `/health` | Health probe |
| GET | `/chats` | List chats |
| POST | `/chats` | Create chat |
| GET | `/chats/{chat_id}` | Get one chat |
| PATCH | `/chats/{chat_id}` | Update chat title and/or mode |
| GET | `/chats/{chat_id}/messages` | Get branch messages |
| DELETE | `/chats/{chat_id}` | Delete chat and linked data |
| POST | `/ai/chat` | Stream orchestrated AI reply |
| GET | `/campaigns/style-cards` | Paginated style card list (no `user_id`) |
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
`ChatSummary` always includes `mode` and `campaign_id` (null when no campaign is linked).

### `POST /chats`

**Plain English:** Creates a new chat container before or during a conversation.

**Technical:**
- Body (`application/json`):
  - `user_id` (required string)
  - `mode` (optional: `brainstorm` or `campaign`, default `brainstorm`)
- Response model: `ChatCreateResponse` (`chat_id`, `title`, `last_modified`)
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

### `PATCH /chats/{chat_id}`

**Plain English:** Renames a chat and/or changes its mode (`brainstorm` vs `campaign`) without sending an AI message.

**Technical:**
- Path:
  - `chat_id` (required)
- Query:
  - `user_id` (required string)
- Body (`application/json`), `ChatPatchRequest` — include at least one field:
  - `title` (optional string)
  - `mode` (optional: `brainstorm` or `campaign`)
- Response model: `ChatResponse` (includes updated `last_modified`)
- `404` if chat not found or access denied.
- Returns `422` if the body omits both `title` and `mode`.

### `GET /chats/{chat_id}/messages`

**Plain English:** Fetches stored message history for one branch, so chat replay works for main and task branches. Each message can reference **asset ids** (user uploads or assistant-generated media); the response also includes a **deduplicated list of full asset records** (with freshly signed URLs) for all ids referenced on any message in the branch.

**Technical:**
- Path:
  - `chat_id` (required)
- Query:
  - `user_id` (required)
  - `branch_id` (optional, default `main`)
- Response model: `ChatMessagesResponse`
- `messages[]`: each `ChatMessage` includes `message_id`, `role`, `branch_id`, `content`, optional `thinking`, `assets` (array of asset id strings), and `timestamp` (ISO string from `created_at`).
- `assets` (top-level): array of `AssetResponse` — one entry per **unique** id referenced across all `messages[].assets` (order preserved by first appearance; missing or deleted ids are skipped). This is separate from each message’s `assets` id list: messages carry stable ids; this array is the joined lookup with fresh signed URLs.

**Example response (`200`) shape:**
```json
{
  "messages": [
    {
      "message_id": "...",
      "role": "user",
      "branch_id": "main",
      "content": "Hello",
      "thinking": null,
      "assets": [],
      "timestamp": "2026-04-01T12:00:00Z"
    }
  ],
  "assets": []
}
```

### `DELETE /chats/{chat_id}`

**Plain English:** Deletes a chat and all records connected to it (messages and linked campaign data) for that user scope.

**Technical:**
- Path:
  - `chat_id`
- Query:
  - `user_id` (required)
- Response model: `DeleteChatResponse` (`message`, `chat_id`)
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
5. Emits SSE `content`, `update`, `event`, `assets` (when production saves image/video), and final `complete`.
6. Saves user and assistant messages to DB (including assistant thinking transcript and per-message `assets` id lists).
7. Updates chat last-modified timestamp; generates a title on first message.

**SSE payload schema:**
```json
{
  "status": "content | update | event | assets | complete | error",
  "content": "string"
}
```

**SSE status meaning:**
- `content`: token chunk of assistant text.
- `update`: tool/progress/thinking line.
- `event`: named event for UI transitions (`content` holds the event name string).
- `assets`: JSON **string** in `content` parsing to an array of `{"id", "mime_type"}` objects for image/video assets saved during this turn (no signed URLs; use asset ids with `GET /assets` or the messages response `assets` list).
- `complete`: full final assistant response.
- `error`: stream-level failure detail.

**Common event names observed in code paths:**
- `campaign_creation_started`
- `campaign_modifying`
- `campaign_modified`

**Optional / advanced:** The stream parser can also emit extra `status=event` frames if a tool `ToolMessage` body contains a marker of the form `[AETEA_EVENTS:event_one,event_two]` (same wire format as named events). There is no guarantee tools emit this in current builds; treat as reserved for future or rare paths.

---

## Campaigns API

**Routing:** Paths `/campaigns/style-cards` and `/campaigns/tasks/...` are registered **before** `/campaigns/{campaign_id}` so they are not captured as a campaign id. Task-scoped routes live under `/campaigns/tasks/{task_id}/...` (not under `/campaigns/{campaign_id}/tasks/...`).

### `GET /campaigns/style-cards`

**Plain English:** Lists style cards used on the creative side, including signed preview URLs when available.

**Technical:**
- No `user_id` (or other auth) query parameter; style cards are global catalog rows.
- Query:
  - `limit` (optional int, default `30`, min `1`, max `100`)
  - `offset` (optional int, default `0`, min `0`)
- Response model: `StyleCardListResponse` (`style_cards`, `total`)

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
- Body (`TaskUpdateRequest` — all optional):
  - `status`
  - `title`
  - `description`
  - `deadline` (string or null; format as stored by backend)
- Response model: `TaskResponse`

### `GET /campaigns/tasks/{task_id}/assets`

**Plain English:** Lists files currently linked to that task, with signed view/download URLs.

**Technical:**
- Query: `user_id` (required)
- Response model: `AssetListResponse`

### `GET /campaigns/tasks/{task_id}/deliverables`

**Plain English:** Returns structured outputs for task completion (items and nested components), which is the render-ready task output model.

**Technical:**
- Query: `user_id`
- Response model: `DeliverableListResponse` — `{ "items": [ DeliverableItemResponse, ... ] }`
- Per deliverable item cardinality:
  - max one `image` or one `video` (never both)
  - max one `text`
  - max one `pdf`

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
  - `component_type` (required string; one of `text`, `image`, `pdf`, `video`)
  - `asset_id` (optional)
  - `text_content` (optional)
  - `order_index` (optional, default `1`)
- Response model: `DeliverableComponentResponse`
- Cardinality constraints per item:
  - only one of `image` or `video` is allowed
  - at most one `text`
  - at most one `pdf`
- Example validation errors:
  - `Deliverable item already has a text component.`
  - `Deliverable item can include image or video, not both.`

### `PATCH /campaigns/tasks/{task_id}/deliverables/{item_id}/components/{component_id}`

**Plain English:** Updates a deliverable component's linked asset/text/order.

**Technical:**
- Query: `user_id`
- Body (all optional):
  - `asset_id`
  - `text_content`
  - `order_index`
- Response model: `DeliverableComponentResponse`
- The same per-item cardinality rules are enforced on update.

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
- `status`: `content | update | event | assets | complete | error`
- `content`: payload text, event name (when `status=event`), or JSON string (when `status=assets`)

### `ChatMessage`
- `message_id`, `role` (`user` | `assistant`), `branch_id`, `content`, optional `thinking`, `assets` (list of asset id strings), `timestamp`

### `ChatMessagesResponse`
- `messages`: list of `ChatMessage`
- `assets`: deduplicated `AssetResponse` rows for ids referenced in `messages` (top-level key; not the same field as per-message id lists)

### `ChatResponse` / `ChatSummary`
- `chat_id`, `title`, `last_modified`, `mode`, `campaign_id` (nullable on `ChatResponse` and `ChatSummary`)

### `ChatListResponse` / `ChatCreateResponse` / `DeleteChatResponse`
- `ChatListResponse`: `{ "chats": [ ChatSummary, ... ] }`
- `ChatCreateResponse`: `chat_id`, `title`, `last_modified`
- `DeleteChatResponse`: `message`, `chat_id`

### `TaskResponse`
- `id`, `campaign_id`, `type`, optional `subtype`, `title`, `description`, `status`, optional `deadline`, `created_at`, `updated_at`

### `TaskListResponse`
- `{ "tasks": [ TaskResponse, ... ] }`

### `AssetResponse`
- `id`, `user_id`, optional `chat_id`, optional `task_id`, `folder_path`, `file_name`, optional `description`, optional `view_url`, optional `download_url`, `mime_type`, `created_at`

### `AssetListResponse`
- `{ "assets": [ AssetResponse, ... ] }`

### `CampaignResponse` / `CampaignWithSectionsResponse`
- `CampaignResponse`: `id`, `chat_id`, `user_id`, `title`, `created_at`, `updated_at`
- `CampaignWithSectionsResponse`: `campaign` (`CampaignResponse`), `sections` (dict keyed by section name, values are section content objects)

### `CreativeStateResponse`
- `id`, `campaign_id`, `creative_truth`, `creative_tone`, optional `selected_style_id`, optional `key_visual_asset_id`, `created_at`, `updated_at`

### `StyleCardListResponse` / `StyleCardResponse`
- `StyleCardListResponse`: `style_cards`, `total` (total count for pagination)
- `StyleCardResponse`: `id`, `name`, `storage_path`, optional `thumbnail_path`, optional `preview_url`

### `DeliverableListResponse` / `DeliverableItemResponse` / `DeliverableComponentResponse`
- `DeliverableListResponse`: `items` (not `deliverables`)
- `DeliverableItemResponse`: `id`, `task_id`, `item_index`, optional `title`, `status`, `components`, timestamps
- `DeliverableComponentResponse`: `id`, `deliverable_item_id`, `component_type`, optional `asset_id` / `text_content`, `order_index`, optional enriched fields (`file_name`, `description`, `mime_type`, `view_url`, `download_url`), timestamps

---

## Error Handling

- `400`: `DocumentLoadError` and similar app-mapped failures (`{"detail": "..."}`).
- `404`: resource not found (chat, campaign, task, asset, deliverable item/component).
- `422`: request validation (FastAPI/Pydantic), e.g. `ChatPatchRequest` with both fields omitted.
- `500`: `DatabaseError`, `ChainExecutionError`, `SearchError`, and other server failures (`{"detail": "..."}`).
- SSE route (`POST /ai/chat`) may stream a final `status=error` frame instead of returning a different HTTP status.

---

## Integration Notes for AI Agents and Clients

1. **`POST /ai/chat` is multipart + SSE:** do not use `EventSource` for this POST flow; use streamed `fetch`.
2. **Persisted chat state is branch-aware:** pass `branch_id` when replaying task branches.
3. **Campaign mode gating exists in agent tools:** if not in campaign mode, delegated campaign operations return guard text rather than mutating state.
4. **Asset URLs are signed and temporary:** refresh by calling `GET /assets`, `GET /assets/{asset_id}`, `GET /chats/{chat_id}/messages`, or task asset/deliverable endpoints again if links expire.
5. **Useful refetch moments:** after SSE `event` values like `campaign_modified`, after SSE `assets` (new media saved), and after SSE `complete`.
6. **Supabase schema:** ensure `messages.assets` exists (see Conventions) so new chats persist message rows with asset id lists.
7. **CORS:** the app enables permissive CORS for development (`allow_origins=["*"]` in `app/main.py`); tighten for production deployments.

---

**Last updated:** 2026-04-04  
**Source of truth:** `app/main.py`, router modules under `app/router/`, and schemas under `app/schemas/` (including `app/schemas/api_models.py` and `app/schemas/chat.py`).
