/**
 * The headers every backend request carries.
 *
 * Two of them, doing two different jobs:
 *
 * - `Authorization` belongs to **Hugging Face**. The backend runs as a private
 *   Space, and HF's gate validates this header at its own proxy — anything else
 *   in it is a 404 before our code is reached. It proves the request came from
 *   the app; it says nothing about who is using the app.
 * - `X-AETEA-Auth` carries the **user's Supabase session**, and is what the
 *   backend derives identity from.
 *
 * Which is why the session token cannot simply go in `Authorization`, and why
 * this is not the arrangement it looks like at first glance.
 */
import { supabase } from "@/integrations/supabase/client";
import { API_TOKEN } from "@/services/config";

/** The caller is not signed in, so there is no request worth sending. */
export class NotSignedInError extends Error {
  constructor() {
    super("Your session has ended. Sign in again to continue.");
    this.name = "NotSignedInError";
  }
}

/**
 * Headers for an endpoint that takes no session: `/health` and `/`.
 *
 * Only the Hugging Face gate token, so these work before anyone has signed in.
 * Everything else uses `backendHeaders`.
 */
export function gateOnlyHeaders(): Record<string, string> {
  return API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {};
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
  if (API_TOKEN) headers["Authorization"] = `Bearer ${API_TOKEN}`;
  if (contentType) headers["Content-Type"] = contentType;
  return headers;
}
