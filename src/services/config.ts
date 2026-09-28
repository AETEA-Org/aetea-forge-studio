/**
 * Backend connection details, shared by every service module.
 *
 * `VITE_*` values are inlined by Vite at **build** time, not read at runtime,
 * so this is chosen per deployment: local points at localhost, dev at the dev
 * backend, prod at the prod one. Changing it means a rebuild, which is why it
 * lives in the deployment's settings rather than anywhere in the app.
 *
 * It was a hardcoded Hugging Face Space URL until issue #102. That single line
 * was what made a second environment impossible — a local frontend had no way
 * to reach a local backend, so it called the deployed one and got deployed
 * answers, most visibly a checkout that finished on the wrong site.
 */
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawBaseUrl) {
  // Fail here, with the name of the missing setting. Left empty, the first
  // symptom is `new URL("/billing/plan", "")` throwing somewhere in a service
  // module, which says nothing about what is actually wrong.
  throw new Error(
    "VITE_API_BASE_URL is not set. Copy .env.example to .env (local), or set " +
      "it in this deployment's environment variables."
  );
}

/** Backend origin, never with a trailing slash — callers append "/path". */
export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "");
