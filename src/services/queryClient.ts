import { QueryClient } from "@tanstack/react-query";

/**
 * The app's one query cache, as a module rather than a value inside `App`.
 *
 * It lives here so that code outside the React tree can invalidate a query.
 * `agentRun` needs exactly that: it is the single place every turn's stream
 * ends, on every surface, and the balance has to be refetched there. A hook
 * cannot be called from a service, and passing a client down through ten
 * terminal-event handlers would mean a new surface silently forgetting one.
 *
 * It is created once, at module load, which is what `App` did before — the
 * cache must not be rebuilt by a re-render.
 */
export const queryClient = new QueryClient();
