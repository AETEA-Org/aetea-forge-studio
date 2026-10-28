import { API_BASE_URL } from "./config";
import { detailToMessage } from "./errorDetail";
import { supabase } from "@/integrations/supabase/client";

export class SupportError extends Error {}

/**
 * Send one support request.
 *
 * Multipart rather than JSON because of the screenshots. The session token is
 * attached when there is one, and its absence is not an error: the endpoint
 * serves signed-out visitors, which is the point of it.
 */
export async function sendSupportRequest(input: {
  email: string;
  message: string;
  page: string;
  files: File[];
}): Promise<void> {
  const body = new FormData();
  body.append("email", input.email);
  body.append("message", input.message);
  body.append("page", input.page);
  for (const file of input.files) body.append("attachments", file, file.name);

  const headers: Record<string, string> = {};
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    headers["X-AETEA-Auth"] = `Bearer ${data.session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/support/request`, {
    method: "POST",
    body,
    headers,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => undefined);
    throw new SupportError(
      detailToMessage(payload) ??
        "We could not send that just now. Please try again in a moment."
    );
  }
}
