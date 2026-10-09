import { useEffect, useRef, useState } from "react";
import { registrationRequest } from "@/services/registration";

interface GoogleIdentity {
  initialize: (options: { client_id: string; nonce: string; callback: (response: { credential: string }) => void }) => void;
  renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number; text: string }) => void;
  cancel: () => void;
}
declare global { interface Window { google?: { accounts: { id: GoogleIdentity } }; } }
let sdk: Promise<void> | undefined;
function loadGoogle() {
  if (window.google?.accounts.id) return Promise.resolve();
  if (!sdk) sdk = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client"; script.async = true;
    script.onload = () => resolve(); script.onerror = () => { sdk = undefined; script.remove(); reject(new Error("Could not load Google sign-in. Try again or use email.")); };
    document.head.appendChild(script);
  });
  return sdk;
}

export function GoogleSignIn({ onCredential, disabled, attempt }: {
  onCredential: (token: string, challenge: string) => Promise<void>; disabled: boolean; attempt: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  callback.current = onCredential;
  const blocked = useRef(disabled);
  blocked.current = disabled;
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError("");
    const start = async () => {
      const challenge = await registrationRequest<{ client_id: string; challenge: string; nonce: string }>("google/challenge");
      await loadGoogle();
      const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(challenge.nonce));
      const nonce = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
      if (cancelled || !container.current || !window.google) return;
      window.google.accounts.id.initialize({ client_id: challenge.client_id, nonce, callback: (response) => {
        if (!cancelled && !blocked.current) void callback.current(response.credential, challenge.challenge);
      } });
      container.current.replaceChildren();
      window.google.accounts.id.renderButton(container.current, { theme: "outline", size: "large", width: container.current.clientWidth, text: "continue_with" });
    };
    void start().catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Google sign-in is unavailable."); });
    // A challenge expires after ten minutes. Renew it before presenting a stale button.
    const timer = window.setTimeout(() => setRetry((n) => n + 1), 9 * 60_000);
    return () => { cancelled = true; window.clearTimeout(timer); window.google?.accounts.id.cancel(); };
  }, [retry, attempt]);
  return <div aria-busy={disabled} className={disabled ? "pointer-events-none opacity-50" : ""}>
    <div ref={container} className="min-h-10" />
    {error && <p className="text-xs text-muted-foreground" role="status">{error} <button type="button" className="underline" onClick={() => setRetry((n) => n + 1)}>Retry</button></p>}
  </div>;
}
