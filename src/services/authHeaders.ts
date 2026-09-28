/**
 * The headers every backend request carries.
 *
 * One header, doing one job: `X-AETEA-Auth` carries the user's Supabase session,
 * and is what the backend derives identity from.
 *
 * It sits in that header rather than `Authorization` for a reason that has now
 * expired. The backend used to run as a private Hugging Face Space whose gate
 * consumed `Authorization` at its own proxy, so a session token placed there was
 * a 404 before our code ever saw it (issue #122). Since issue #102 the backend
 * runs on Railway with no such gate — but the header is kept, because moving it
 * back would touch every call in this folder to arrive exactly where we already
 * are. The second header, an HF token shipped in the browser bundle where anyone
 * could read it, is gone with the Space that required it.
 */
import { supabase } from "@/integrations/supabase/client";

/** The caller is not signed in, so there is no request worth sending. */
export class NotSignedInError extends Error {
  constructor() {
    super("Your session has ended. Sign in again to continue.");
    this.name = "NotSignedInError";
  }
}

/**
 * Headers for a backend call, including a fresh session token.
 *
 * `getSession()` refreshes a token that is close to expiring, so asking for the
 * headers per request is the whole refresh story — there is nothing to schedule
 * and no expiry to track. That is also why this must be called inside a retry
 * loop rather than once outside it: a reconnect minutes later needs the token
 * as it is then, not as it was.
 */
export async function backendHeaders(
  contentType?: string
): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new NotSignedInError();

  const headers: Record<string, string> = {
    "X-AETEA-Auth": `Bearer ${accessToken}`,
  };
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}
