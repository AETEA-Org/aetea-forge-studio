import { API_BASE_URL } from "./config";
import { supabase } from "@/integrations/supabase/client";
import { detailToMessage } from "./errorDetail";

export class RegistrationError extends Error {
  constructor(message: string, public code?: string) { super(message); }
}
export async function registrationRequest<T>(path: string, payload: unknown = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/registration/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => undefined);
  if (!response.ok || !body) throw new RegistrationError(detailToMessage(body) ?? "Could not complete sign-in. Please try again.", body?.detail?.code);
  return body;
}
export async function restoreRegistrationSession(result: { session: { access_token: string; refresh_token: string } | null }) {
  if (!result.session) return;
  const { error } = await supabase.auth.setSession(result.session);
  if (error) throw error;
}
