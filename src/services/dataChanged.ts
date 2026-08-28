/**
 * Turning a `data_changed` event into the right refetches.
 *
 * The backend names what changed — `section`, `task`, `creative_state`,
 * `asset`, `chat` — precisely so the client does not have to guess. Each
 * caller was instead invalidating a couple of prefixes it happened to care
 * about, which covered most entities by accident and missed `creative_state`
 * entirely: its query key is `['creative', …]`, which `['campaign']` does not
 * match. So a new key visual or a rewritten creative direction sat on screen
 * as the old one until the page was reloaded.
 *
 * One mapping, used by every surface that follows a run.
 */
import type { QueryClient } from "@tanstack/react-query";

export interface DataChangedScope {
  chatId?: string;
  campaignId?: string;
  taskId?: string;
  userEmail?: string;
}

export function invalidateForDataChange(
  queryClient: QueryClient,
  entity: string,
  scope: DataChangedScope
): void {
  const invalidate = (queryKey: unknown[]) =>
    queryClient.invalidateQueries({ queryKey });

  switch (entity) {
    case "section":
      // Brief, research and strategy all hang off ['campaign', id, section].
      invalidate(["campaign"]);
      break;

    case "task":
      invalidate(["campaign"]);
      if (scope.taskId) {
        invalidate(["campaign-task", scope.taskId, scope.userEmail]);
        invalidate([
          "campaign-task-deliverable-objects",
          scope.taskId,
          scope.userEmail,
        ]);
      }
      break;

    case "creative_state":
      // Creative truth and tone, the selected style, and the key visual.
      invalidate(["creative"]);
      break;

    case "asset":
      invalidate(["assets"]);
      invalidate(["asset-urls"]);
      if (scope.taskId) {
        invalidate([
          "campaign-task-deliverable-objects",
          scope.taskId,
          scope.userEmail,
        ]);
      }
      // A published key visual is an asset the Creative tab renders.
      invalidate(["creative"]);
      break;

    case "chat":
      invalidate(["chats"]);
      if (scope.chatId) invalidate(["chat", scope.chatId, scope.userEmail]);
      break;

    default:
      // An entity this client does not know yet: refetch broadly rather than
      // silently ignore it, since the alternative is stale data on screen.
      invalidate(["campaign"]);
      invalidate(["creative"]);
      invalidate(["assets"]);
      break;
  }
}
