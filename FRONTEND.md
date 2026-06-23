# AETEA Creative OS -- Frontend Integration Guide

This document describes how **Brainstorm** and **Campaign** modes work end-to-end, and exactly how the frontend should interact with the backend at each step.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Mode 1: Brainstorm](#mode-1-brainstorm)
- [Mode 2: Campaign](#mode-2-campaign)
  - [Phase A: Initial Landing (No Campaign)](#phase-a-initial-landing-no-campaign)
  - [Phase B: Campaign Creation](#phase-b-campaign-creation)
  - [Phase C: Campaign Dashboard](#phase-c-campaign-dashboard)
  - [Phase D: Creative Tab](#phase-d-creative-tab)
  - [Phase E: Key Visual Generation](#phase-e-key-visual-generation)
  - [Phase F: Task Management](#phase-f-task-management)
  - [Phase G: Task Completion](#phase-g-task-completion)
  - [Phase H: Task Review](#phase-h-task-review)
  - [Phase I: Campaign Modifications via Chat](#phase-i-campaign-modifications-via-chat)
- [AI Chat Panel](#ai-chat-panel)
- [SSE Stream Handling](#sse-stream-handling)
- [State Management Notes](#state-management-notes)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Frontend (React / Next.js)                         │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Chat Panel  │  │ Main Content │  │ Loading   │  │
│  │ (always     │  │ (varies by   │  │ Screens   │  │
│  │  visible)   │  │  page/tab)   │  │           │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘  │
│         │                │                │         │
└─────────┼────────────────┼────────────────┼─────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────┐
│  Backend API                                        │
│  POST /ai/chat (SSE)  │  REST endpoints             │
│  ─ Brainstorm agent    │  /chats, /campaigns,       │
│  ─ Campaign agent      │  /assets                   │
└─────────────────────────────────────────────────────┘
```

**Key principle:** The chat panel is the primary interface for AI interaction. It is visible on every page. REST endpoints are used for fetching/displaying data and simple updates (e.g. marking a task as done). All AI-driven actions go through `POST /ai/chat`.

---

## Mode 1: Brainstorm

### What It Is

A simple chat interface for free-form conversation with AETEA. No campaign structure. The AI can search the web, generate images/videos/copy, and discuss ideas.

### Page Layout

```
┌──────────────────────────────────────┐
│  Full-width Chat Interface           │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  Message history             │    │
│  │  ...                         │    │
│  │  ...                         │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  Chat input + file dropzone  │    │
│  │  [Analyze Brief] [Brainstorm]│    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### User Flow

1. **User opens app** -> sees chat box with file drop area and two mode buttons: "Analyze Brief" and "Start Brainstorming".
2. **User selects "Start Brainstorming"** -> mode is set to `brainstorm`.
3. **User types a message and/or uploads files** -> frontend sends:
   ```
   POST /ai/chat
   FormData:
     user_id: "user@example.com"
     chat_id: "<generated-uuid>"
     message: "Help me brainstorm ideas for a Nike summer campaign"
     mode: "brainstorm"
     files: [optional]
   ```
4. **Frontend reads SSE stream:**
   - `status: "update"` -> show as a subtle status indicator (e.g. "Searching the web...").
   - `status: "content"` -> append tokens to assistant message bubble.
   - `status: "complete"` -> mark message as complete, enable input.
   - `status: "error"` -> show error toast.

5. **Conversation continues** -> user can keep chatting, AI can generate media, etc.

6. **Switching to campaign mode:** If user wants to create a campaign:
   - AI will tell them to switch to campaign mode.
   - Frontend switches the mode button to "Analyze Brief" and updates `mode` to `"campaign"` for subsequent messages.

### Backend Calls

| Action | Endpoint | When |
|---|---|---|
| Create chat | `POST /chats` | On first message if chat doesn't exist (or let `/ai/chat` auto-create) |
| Send message | `POST /ai/chat` (mode=brainstorm) | User presses enter |
| Load history | `GET /chats/{id}/messages` | On page load / chat switch |
| List chats | `GET /chats?user_id=...` | Sidebar chat list |
| View assets | `GET /assets?chat_id=...&user_id=...` | If showing asset panel |

---

## Mode 2: Campaign

### Phase A: Initial Landing (No Campaign)

Same landing page as brainstorm, but with "Analyze Brief" button selected.

```
┌──────────────────────────────────────┐
│  Chat Interface                      │
│                                      │
│  "Upload your brief documents and    │
│   provide campaign details"          │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  📁 Drop brief files here    │    │
│  │  (PDF, DOCX, PPTX)          │    │
│  └──────────────────────────────┘    │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  Chat input                  │    │
│  │  [Analyze Brief✓] [Brainstorm]│   │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

User uploads files and/or types brief details, then presses enter.

### Phase B: Campaign Creation

**Frontend prepends** a short prefix to the message:
```
"Create a campaign for me using the following details: {user_typed_message}"
```

**Frontend sends:**
```
POST /ai/chat
FormData:
  user_id: "user@example.com"
  chat_id: "<uuid>"
  message: "Create a campaign for me using the following details: We need a summer campaign for Nike targeting Gen Z..."
  mode: "campaign"
  files: [brief.pdf, guidelines.docx]
```

**SSE stream handling:**

```
1. [status=event, content="campaign_creation_started"]
   → SWITCH TO LOADING SCREEN

2. [status=update, content="Analyzing your brief documents"]
   → Update loading text: "Analyzing your brief documents..."

3. [status=update, content="Researching market trends and competitors"]
   → Update loading text

4. [status=update, content="Developing campaign strategy"]
   → Update loading text

5. [status=update, content="Planning creative tasks"]
   → Update loading text

6. [status=update, content="Setting up creative direction"]
   → Update loading text

7. [status=update, content="Finalizing your campaign"]
   → Update loading text

8. [status=content, content="Your campaign has been created..."]
   → Accumulate AI response text

9. [status=complete, content="full response"]
   → EXIT LOADING SCREEN
   → Fetch campaign: GET /campaigns?chat_id=<chat_id>&user_id=...
   → Navigate to campaign dashboard
```

**Loading screen design:**
```
┌──────────────────────────────────────┐
│                                      │
│           ✨ AETEA                   │
│                                      │
│     Creating your campaign...        │
│                                      │
│  ┌──────────────────────────────┐    │
│  │  ░░░░░░░░░░░░░░░░░░░░░░░░░  │    │  ← Progress bar (cosmetic)
│  └──────────────────────────────┘    │
│                                      │
│     "Researching market trends       │
│      and competitors..."             │  ← Update text from SSE
│                                      │
└──────────────────────────────────────┘
```

### Phase C: Campaign Dashboard

After campaign creation (or when loading an existing campaign chat), the layout changes:

```
┌──────────────────────────────────────────────────────────┐
│  Campaign Title: "Nike Summer 2026"                      │
│                                                          │
│  [Brief] [Assets] [Research] [Strategy] [Creative]       │
│  [Analytics🔒] [Settings🔒]                              │
│                                                          │
│  ┌────────────────────────────────┬──────────────────┐   │
│  │                                │                  │   │
│  │   Tab Content Area             │   AI Chat Panel  │   │
│  │   (varies by selected tab)     │   (always visible│   │
│  │                                │    on right side)│   │
│  │                                │                  │   │
│  └────────────────────────────────┴──────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

**On page load:**
```javascript
// 1. Get chat details (for campaign_id)
const chat = await fetch(`/chats/${chatId}?user_id=${userId}`);
const { campaign_id, mode } = chat;

// 2. If campaign exists, fetch campaign data
if (campaign_id) {
  const campaign = await fetch(`/campaigns/${campaign_id}?user_id=${userId}`);
  // campaign.sections contains brief, research, strategy
}

// 3. Fetch messages for chat panel
const messages = await fetch(`/chats/${chatId}/messages?user_id=${userId}`);
```

**Tab data sources:**

| Tab | Data Source | Endpoint |
|---|---|---|
| Brief | `campaign.sections.brief` | Included in `GET /campaigns/{id}` |
| Research | `campaign.sections.research` | Included in `GET /campaigns/{id}` |
| Strategy | `campaign.sections.strategy` | Included in `GET /campaigns/{id}` |
| Assets | Asset file manager | `GET /assets?chat_id=...&user_id=...` with folder filter |
| Creative | Creative state + tasks | `GET /campaigns/{id}/creative` + `GET /campaigns/{id}/tasks` |
| Analytics | Coming soon | -- |
| Settings | Coming soon | -- |

**Assets tab:**

```
┌────────────────────────────────────┐
│  📁 Uploaded                       │
│  📁 AETEA Generated               │
│  📁 Key visual                     │
│  📁 Completed tasks                │
└────────────────────────────────────┘
```

When user clicks a folder:
```javascript
const assets = await fetch(
  `/assets?chat_id=${chatId}&user_id=${userId}&folder_path=${folderName}`
);
```

Each asset shows two buttons:
- **View** -> opens `download_url` in new tab or modal
- **Download** -> redirects to `GET /assets/{asset_id}/download?user_id=...`

### Phase D: Creative Tab

The creative tab has a unique card-based layout:

```
┌──────────────────────────────────────────────────┐
│  CREATIVE                                        │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐    │
│  │ Creative     │  │                        │    │
│  │ Truth        │  │   Visual Direction     │    │
│  │  (flip card) │  │   (flip card)          │    │
│  ├──────────────┤  │                        │    │
│  │ Creative     │  │   Shows style card     │    │
│  │ Tone & Voice │  │   grid + reference     │    │
│  │  (flip card) │  │   image upload         │    │
│  └──────────────┘  └────────────────────────┘    │
│                                                  │
│  [✨ Generate Key Visual]                        │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  Key Visual (if exists)                  │    │
│  │  Shows the generated key visual image    │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  Tasks                                   │    │
│  │  ┌─────────────────────┐                 │    │
│  │  │ Task 1 - todo       │                 │    │
│  │  │ Task 2 - todo       │                 │    │
│  │  │ Task 3 - done ✓     │                 │    │
│  │  └─────────────────────┘                 │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

**Loading creative data:**
```javascript
// Creative state (truth, tone, visual direction, key visual)
const creative = await fetch(
  `/campaigns/${campaignId}/creative?user_id=${userId}`
);

// Tasks
const tasks = await fetch(
  `/campaigns/${campaignId}/tasks?user_id=${userId}`
);

// Style cards (for visual direction flip card)
const styleCards = await fetch(
  `/campaigns/style-cards?limit=100&offset=0`
);
```

**Card contents when flipped:**

| Card | Front | Back (flipped) |
|---|---|---|
| Creative Truth & Constraints | Title "Creative Truth & Constraints" | Claims/RTBs list + CTAs/Specs list + constraints list |
| Tone & Voice | Title "Creative Tone & Voice" | Concept, headline sample, body copy sample |
| Visual Direction | Title "Visual Direction" | Style card grid (100+ cards) + reference image upload (max 3) |

**Creative Foundation:** Strategy includes exactly three `creative_territories`. Each territory has a `selected` boolean; exactly one is active. The active territory controls the displayed creative direction and the suggested key visual routes.

**Changing selected territory:**
```javascript
await fetch(`/campaigns/${campaignId}/strategy/selected-territory?user_id=${userId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    territory_id: "territory_2"
  })
});
```

**Campaign DNA:** Creative tab shows quick links to Brief objectives, Strategy KPIs, Strategy audience, and Strategy creative foundation. Use stable anchors `brief-campaign-goals`, `strategy-kpis`, `strategy-audience`, and `strategy-creative-foundation`.

**Key visual routes:** The Generate Key Visual dialog displays the active territory's three `kv_routes`. Clicking a route copies that route into the additional details field only; generation still requires pressing Submit.

**Style card grid performance tip:** Load style cards in pages (30 at a time) with `limit` and `offset`. Use lazy loading / virtualization for the grid since there are 100+ cards.

**When user selects a style card:**
```javascript
await fetch(`/campaigns/${campaignId}/creative?user_id=${userId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    selected_style_id: selectedCardId
  })
});
```

**When user adds reference images:**

Reference images are assets the user previously uploaded. Store their asset IDs:
```javascript
await fetch(`/campaigns/${campaignId}/creative?user_id=${userId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    visual_direction: {
      reference_image_ids: ["asset-uuid-1", "asset-uuid-2"]
    }
  })
});
```

### Phase E: Key Visual Generation

When user clicks "Generate Key Visual":

1. **Frontend builds a message** and auto-populates the chat input:
   ```
   "Generate a key visual using the selected style. Reference images: image1.png, image2.png"
   ```
   (Include reference image file names if any were selected)

2. **Frontend sends the message:**
   ```
   POST /ai/chat
   FormData:
     user_id: "user@example.com"
     chat_id: "<uuid>"
     message: "Generate a key visual using the selected style. Reference images: image1.png, image2.png"
     mode: "campaign"
     context: "tab:creative"
   ```

3. **SSE handling:**
   ```
   [status=event, content="campaign_modifying"]
     → Blur the campaign content area
     → Show overlay: "AETEA is modifying campaign..."

   [status=update, content="Creating image"]
     → Update overlay text

   [status=content, content="..."]
     → Accumulate AI response in chat panel

   [status=event, content="campaign_modified"]
     → Refetch creative state:
       GET /campaigns/{campaignId}/creative?user_id=...
     → The new key_visual_asset_id will be set
     → Fetch the key visual image using the asset's download_url

   [status=complete, content="..."]
     → Unblur campaign content
   ```

4. **Displaying the key visual:**
   ```javascript
   if (creative.key_visual_asset_id) {
     // Get the asset's download URL from the assets list
     const assets = await fetch(
       `/assets?chat_id=${chatId}&user_id=${userId}&folder_path=Key visual`
     );
     // Display the image using the download_url
   }
   ```

### Phase F: Task Management

**Task list** appears below the key visual on the creative tab.

Each task card shows:
- Task title
- Task status badge (color-coded)
- Task type icon (text/image/video)

**Clicking a task** opens the task detail page:

```
┌──────────────────────────────────────────────────┐
│  ← Back to Creative                              │
│                                                  │
│  Task: "Instagram carousel for product launch"   │
│  Type: image | Status: todo                      │
│                                                  │
│  Description:                                    │
│  Create a 5-slide carousel showcasing...         │
│  - Aspect ratio: 1:1                             │
│  - Style: photorealistic                         │
│  - Include product shots and lifestyle imagery   │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  [✨ Complete Task]                      │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  AI Chat Panel (right side, as always)   │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────┘
```

**Loading task detail:**
```javascript
const task = await fetch(`/campaigns/tasks/${taskId}?user_id=${userId}`);
```

### Phase G: Task Completion

When user clicks "Complete Task":

1. **Button changes** to loading state: spinner + "Completing task..."

2. **Frontend populates and sends message:**
   ```
   POST /ai/chat
   FormData:
     user_id: "user@example.com"
     chat_id: "<uuid>"
     message: "Complete task"
     mode: "campaign"
     context: "task:<task_id>"
   ```

3. **SSE handling:**
   ```
   [status=event, content="campaign_modifying"]
     → Keep button in loading state

   [status=update, content="Reading task details"]
   [status=update, content="Creating image"]
     → Optional: show progress in button or chat

   [status=content, content="..."]
     → Show AI response in chat panel

   [status=event, content="campaign_modified"]
     → Refetch task: GET /campaigns/tasks/{taskId}?user_id=...

   [status=complete, content="..."]
     → Check task status:
       - If status != "todo" → change button to "View Completed Task"
       - If status == "todo" → show error: "AETEA could not complete task"
   ```

### Phase H: Task Review

When user clicks "View Completed Task", navigate to the review page:

```
┌──────────────────────────────────────────────────┐
│  ← Back to Task                                  │
│                                                  │
│  Task: "Instagram carousel for product launch"   │
│  Status: under_review                            │
│                                                  │
│  ┌──────── Body Copy ──────────────────────┐     │
│  │  (rendered markdown)                    │     │
│  │  Caption: "Step into summer with..."    │     │
│  │  #NikeSummer #JustDoIt                  │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ┌──────── Generated Assets ───────────────┐     │
│  │  🖼 hero_image.png    🖼 slide_2.png    │     │
│  │  🖼 slide_3.png       🎬 teaser.mp4    │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  ┌──────── Downloads ──────────────────────┐     │
│  │  📥 hero_image.png                      │     │
│  │  📥 slide_2.png                         │     │
│  │  📥 teaser.mp4                          │     │
│  └─────────────────────────────────────────┘     │
│                                                  │
│  [← Back to Task Details]  [✅ Mark as Complete] │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Loading review data:**
```javascript
// Get task (for body_copy and status)
const task = await fetch(`/campaigns/tasks/${taskId}?user_id=${userId}`);

// Get task assets (images, videos, files)
const assets = await fetch(
  `/campaigns/tasks/${taskId}/assets?user_id=${userId}`
);
```

**What to display:**
- `task.body_copy` -> render as markdown (could be caption, hashtags, article, etc.)
- `assets.assets` -> display images/videos inline, with download links
- At least one of body_copy or assets should be present

**Mark as Complete button:**
```javascript
await fetch(`/campaigns/tasks/${taskId}?user_id=${userId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ status: "done" })
});
// Navigate back to task details or creative tab
```

**Back to Task Details** -> navigate to task detail page (Phase F).

### Phase I: Campaign Modifications via Chat

The user can modify any part of the campaign through the chat panel at any time.

**Examples:**
- "Update the brief goals to focus more on brand awareness"
- "Change the strategy doctrine to emphasize digital-first"
- "Add a new task for a TikTok video"
- "The creative truth needs stronger CTAs"

**Frontend behavior for all modifications:**

1. Send message via `POST /ai/chat` with `mode: "campaign"`.
2. Optionally set `context` to the relevant tab (`tab:brief`, `tab:strategy`, etc.).
3. Watch for events:

```
[status=event, content="campaign_modifying"]
  → Blur current tab content
  → Show "AETEA is modifying campaign..."

[status=event, content="campaign_modified"]
  → Refetch data for current tab:
    - Brief/Research/Strategy tab: GET /campaigns/{id}?user_id=...
    - Creative tab: GET /campaigns/{id}/creative + GET /campaigns/{id}/tasks
    - Task detail: GET /campaigns/tasks/{taskId}

[status=complete]
  → Unblur content
```

---

## AI Chat Panel

The chat panel is visible on every page once a campaign exists (and always in brainstorm mode).

### Layout

In brainstorm mode: full-width chat.
In campaign mode: right-side panel.

### Sending Messages

Always use `POST /ai/chat` with current `mode`, `chat_id`, and `user_id`.

### Context Parameter

Set `context` to help the AI understand what the user is looking at:

| User is on | Context value |
|---|---|
| Brief tab | `tab:brief` |
| Research tab | `tab:research` |
| Strategy tab | `tab:strategy` |
| Creative tab | `tab:creative` |
| Task detail page | `task:<task_id>` |
| Assets tab | (none) |
| No specific tab | (none) |

### Auto-populated Messages

Some UI actions trigger an auto-send flow via `triggerAutoSend` (from `useAutoMessage`):

1. Message appears in the chat input (instant or typewriter effect)
2. After a brief display, the message is auto-sent
3. AI response streams in the chat panel
4. Overlay (blur + "AETEA is modifying campaign...") appears only when the backend sends `campaign_modifying` via SSE

| Action | Auto-populated message |
|---|---|
| Click "Generate Key Visual" | `"Generate a key visual using the selected style. Reference images: {names}"` |
| Click "Complete Task" | `"Complete task"` |
| Initial campaign creation | `"Create a campaign for me using the following details: {user_message}"` |

---

## SSE Stream Handling

### Recommended Implementation

```typescript
async function handleAIChat(formData: FormData) {
  const response = await fetch("/ai/chat", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // keep incomplete line in buffer

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = JSON.parse(line.slice(6));

      switch (data.status) {
        case "content":
          // Append token to assistant message
          appendToMessage(data.content);
          break;

        case "update":
          // Show progress indicator
          showProgress(data.content);
          break;

        case "event":
          handleEvent(data.content);
          break;

        case "complete":
          // Stream finished - full response in data.content
          finalizeMessage(data.content);
          break;

        case "error":
          showError(data.content);
          break;
      }
    }
  }
}

function handleEvent(eventName: string) {
  switch (eventName) {
    case "campaign_creation_started":
      showLoadingScreen();
      break;
    case "campaign_modifying":
      blurCampaignContent();
      showModifyingOverlay();
      break;
    case "campaign_modified":
      refetchCurrentPageData();
      break;
  }
}
```

### Important SSE Notes

1. **Don't use `EventSource`** -- it doesn't support POST with body.
2. **Buffer partial chunks** -- a single `read()` may contain partial JSON.
3. **Multiple events per chunk** -- split by `\n` and process each `data:` line.
4. **Loading screen exit** -- always exit on `complete`, not on a specific event.

---

## State Management Notes

### What to Store Client-Side

| State | Source | When to Refresh |
|---|---|---|
| Current chat | `GET /chats/{id}` | On page load |
| Chat list | `GET /chats` | On page load, after creating/deleting chat |
| Messages | `GET /chats/{id}/messages` | On page load, after stream complete |
| Campaign + sections | `GET /campaigns/{id}` | After `campaign_modified` event |
| Creative state | `GET /campaigns/{id}/creative` | After `campaign_modified` event, after PATCH |
| Tasks | `GET /campaigns/{id}/tasks` | After `campaign_modified` event |
| Single task | `GET /campaigns/tasks/{id}` | After `campaign_modified` event, on task page load |
| Task assets | `GET /campaigns/tasks/{id}/assets` | On review page load, after `campaign_modified` |
| Assets by folder | `GET /assets?chat_id=...&folder_path=...` | On assets tab load |
| Style cards | `GET /campaigns/style-cards` | On creative tab load (cache aggressively) |

### Optimistic Updates

For simple operations, you can optimistically update the UI:
- Marking a task as `done` via PATCH -> immediately update the badge.
- Selecting a style card via PATCH -> immediately highlight it.

### Campaign Existence Check

After each `POST /ai/chat` in campaign mode that returns `complete`, check if a campaign now exists:
```javascript
const chat = await fetch(`/chats/${chatId}?user_id=${userId}`);
if (chat.campaign_id && !previousCampaignId) {
  // Campaign was just created - navigate to campaign dashboard
}
```

---

## Quick Reference: Complete API Call Map

| User Action | API Call(s) |
|---|---|
| Open app | `GET /chats?user_id=...` |
| Select a chat | `GET /chats/{id}?user_id=...` + `GET /chats/{id}/messages?user_id=...` |
| Open campaign chat | Above + `GET /campaigns/{campaign_id}?user_id=...` |
| Send message | `POST /ai/chat` (SSE) |
| View creative tab | `GET /campaigns/{id}/creative` + `GET /campaigns/{id}/tasks` + `GET /campaigns/style-cards` |
| Select style card | `PATCH /campaigns/{id}/creative` |
| Add reference images | `PATCH /campaigns/{id}/creative` |
| Generate key visual | `POST /ai/chat` (message + context=tab:creative) |
| View task | `GET /campaigns/tasks/{id}` |
| Complete task | `POST /ai/chat` (message + context=task:{id}) |
| Review completed task | `GET /campaigns/tasks/{id}` + `GET /campaigns/tasks/{id}/assets` |
| Mark task done | `PATCH /campaigns/tasks/{id}` |
| View assets folder | `GET /assets?chat_id=...&folder_path=...` |
| Download asset | `GET /assets/{id}/download` (redirect) |
| Delete chat | `DELETE /chats/{id}` |

---

**Last Updated:** 2026-02-16
