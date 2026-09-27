/**
 * Stripe webhook relay.
 *
 * The AETEA backend runs as a **private** Hugging Face Space. Stripe's webhook
 * POSTs are unauthenticated by construction, so Hugging Face rejects them
 * before the signature is ever checked. This function sits in front: Stripe
 * delivers here, and this forwards to the Space with the HF token attached.
 *
 * ## It must not touch the body
 *
 * Stripe's signature covers the **exact bytes** it sent. Parsing the JSON and
 * re-serialising it — even into something that looks identical — changes key
 * order, whitespace or number formatting, and every signature then fails to
 * verify. So the body is read as an ArrayBuffer and passed straight through,
 * never as JSON and never as text that gets re-encoded.
 *
 * That is also why this is a separate function rather than a change to
 * `api-proxy`, which parses and re-stringifies everything it handles.
 *
 * ## It verifies nothing
 *
 * The signing secret stays in the backend, which is the only place that checks
 * the signature. This function is a pipe: it adds the HF token and forwards the
 * `Stripe-Signature` header verbatim. If it were to verify, there would be two
 * places holding the secret and two places to get it wrong.
 *
 * Deploy:
 *   supabase functions deploy stripe-webhook --project-ref <ref> --no-verify-jwt
 *   supabase secrets set AETEA_API_TOKEN=<hf token> --project-ref <ref>
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Overridable so the relay can be run against a local backend
// (`supabase functions serve`) and the byte-for-byte forwarding actually
// proven, rather than assumed. Production sets nothing and gets the Space.
const AETEA_API_URL = Deno.env.get("AETEA_API_URL") ??
  "https://m-abdur2024-aetea.hf.space";
const WEBHOOK_PATH = "/billing/webhook";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    // Stripe only ever POSTs here. Anything else is a probe or a health check.
    return new Response("Method not allowed", { status: 405 });
  }

  const hfToken = Deno.env.get("AETEA_API_TOKEN");
  if (!hfToken) {
    // 500 so Stripe retries: this is our misconfiguration, and the event is
    // still deliverable once it is fixed.
    console.error("AETEA_API_TOKEN is not set; cannot reach the backend");
    return new Response("Relay is not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    // Not from Stripe, or mangled in transit. The backend would reject it
    // anyway; refusing here saves a round trip and keeps the logs honest.
    return new Response("Missing Stripe-Signature", { status: 400 });
  }

  // The exact bytes Stripe signed. Never `await req.json()` here.
  const body = await req.arrayBuffer();

  try {
    const upstream = await fetch(`${AETEA_API_URL}${WEBHOOK_PATH}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Stripe-Signature": signature,
        "Content-Type": req.headers.get("content-type") ?? "application/json",
      },
      body,
    });

    // The backend's status is passed back unchanged, because Stripe reads it to
    // decide whether to retry. Turning a 500 into a 200 here would silently
    // drop an event the backend failed to record.
    const text = await upstream.text();
    console.log(`Relayed to backend: ${upstream.status}`);
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // The Space is asleep, restarting or unreachable. A 500 is right: Stripe
    // retries with backoff, and the event is not lost.
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Could not reach the backend: ${message}`);
    return new Response("Backend unreachable", { status: 500 });
  }
});
