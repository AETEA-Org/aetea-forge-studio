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
  /**
   * Which deliverable canvas is open, if any: a task id, or `chat:<id>` for
   * the campaign's own canvas. Only the canvas page has one.
   */
  canvasKey?: string;
  userEmail?: string;
}

export function invalidateForDataChange(
  queryClient: QueryClient,
  entity: string,
  scope: DataChangedScope
): void {
  const invalidate = (queryKey: unknown[]) =>
    queryClient.invalidateQueries({ queryKey });

  const invalidateOpenCanvas = () => {
    if (scope.canvasKey) {
      invalidate(["deliverable-objects", scope.canvasKey, scope.userEmail]);
    }
  };

  switch (entity) {
    case "section":
      // Brief, research and strategy all hang off ['campaign', id, section].
      invalidate(["campaign"]);
      break;

    case "task":
      invalidate(["campaign"]);
      // The canvas switcher reads the board under its own prefix, and
      // `['campaign']` does not match `['campaign-tasks', …]` — React Query
      // compares array elements, not string prefixes. So a turn that added
      // six pieces of work left the board showing none of them.
      invalidate(["campaign-tasks"]);
      if (scope.taskId) {
        invalidate(["campaign-task", scope.taskId, scope.userEmail]);
      }
      invalidateOpenCanvas();
      break;

    case "creative_state":
      // Creative truth and tone, the selected style, and the key visual.
      invalidate(["creative"]);
      break;

    case "asset":
      invalidate(["assets"]);
      invalidate(["asset-urls"]);
      // The folder tree is a separate read from the assets in it, so an asset
      // auto-published into a new folder used to leave the tree without the
      // folder to put it in — on every path, not only after a failure.
      invalidate(["asset-folders"]);
      invalidateOpenCanvas();
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

/**
 * A turn ended, however it ended. Repaint everything it could have changed.
 *
 * Five surfaces each had their own version of this and no two agreed. The
 * canvas invalidated four key families and not `['assets']`, which is exactly
 * why a failed turn showed an error over a board missing the posts it had just
 * saved. The copilot panel's send path invalidated nothing. Two rejoin paths
 * did the fullest version. `ChatView` tried, under a comment describing this
 * precise failure, and was three keys short. The job is to stop having five
 * recipes rather than to add a sixth.
 *
 * **No key list, deliberately**, and this is the one place it differs from
 * `invalidateForDataChange` above. A list has to stay in step with every query
 * key in the app, by hand, forever — and checking the *readers* rather than
 * the writers shows it already was not: `['asset-folders', …]`,
 * `['campaign-tasks', …]` and `['characters', …]` are all read on screen and
 * none of them was reachable from the entity mapping. `['characters']` is not
 * even in the backend's `DataEntity` union, so deriving the list from the
 * protocol would not have found it either. The next key anyone adds would join
 * them silently.
 *
 * So: `invalidateQueries()` with no filter marks every query stale and
 * refetches the active ones. `useCampaignProposal` already settled this
 * argument for the approve button, for the same reason. The cost is a handful
 * of requests, once per turn, at the moment the person is looking at the
 * screen and deciding whether their work survived — the cheapest moment in the
 * product to spend them, and it cannot miss a key, now or later.
 *
 * `data_changed` during a run keeps its targeted mapping above: those arrive
 * many times per turn, where being precise is worth the maintenance.
 */
export function invalidateForRunEnd(queryClient: QueryClient): void {
  void queryClient.invalidateQueries();
}
