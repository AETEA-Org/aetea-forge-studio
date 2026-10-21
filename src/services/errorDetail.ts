/**
 * Turning an error body from the API into a sentence a person can read.
 *
 * FastAPI's `detail` is not always a string. A raised `HTTPException` puts one
 * there, but a **422 validation error** puts a list of objects there instead —
 * `[{loc, msg, type}, ...]`. Passing that straight to `new Error(...)` gave the
 * user a toast reading `[object Object]`, because that is what an array of
 * objects becomes when a string was wanted.
 */

/**
 * What a 403 asking for legal acceptance becomes.
 *
 * Exported so the toast layer can recognise it without matching on prose. It
 * is not a failure — the policies changed and need reading — so it must not
 * arrive wearing the red treatment that real faults get.
 */
export const LEGAL_REQUIRED_MESSAGE = "Review the current policies before continuing.";

/**
 * Whether a fetch rejected because the server could not be reached at all.
 *
 * `fetch` throws a `TypeError` when the request never left, which is a
 * different thing from a request that arrived and failed: nothing happened,
 * nothing was charged, and the answer is to check the connection rather than
 * to report a bug. Each browser words it differently — Chrome "Failed to
 * fetch", Safari "Load failed", Firefox "NetworkError when attempting to fetch
 * resource" — so the type is the signal and the wording is only a backstop.
 */
export function isUnreachable(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("networkerror")
  );
}

/** A non-null object. Arrays pass too, which every caller here checks first. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * The readable part of an error body, or undefined when there is none.
 *
 * Undefined rather than a generic string on purpose: the caller has a sentence
 * written for its own operation ("Couldn't rename that file"), and that is
 * better than anything this could invent from a shape it did not recognise.
 */
export function detailToMessage(body: unknown): string | undefined {
  if (!isRecord(body)) return undefined;
  const { detail } = body;
  if (isRecord(detail) && detail.code === "LEGAL_ACCEPTANCE_REQUIRED") {
    window.dispatchEvent(new Event("aetea:legal-required"));
    return LEGAL_REQUIRED_MESSAGE;
  }

  if (typeof detail === "string") {
    return detail.trim() || undefined;
  }

  if (Array.isArray(detail)) {
    // Each `msg` is already a sentence ("field required", "value is not a
    // valid integer"). `loc` is the path that failed — useful in a log, noise
    // in a toast — so only the messages are kept.
    const messages = detail
      .map((item: unknown) => (isRecord(item) ? item.msg : item))
      .filter((msg): msg is string => typeof msg === "string" && msg.trim() !== "");
    return messages.length > 0 ? messages.join("; ") : undefined;
  }

  if (isRecord(detail) && typeof detail.msg === "string") {
    return detail.msg.trim() || undefined;
  }

  return undefined;
}

/**
 * Read a failed response and say what went wrong, in one call.
 *
 * `fallback` is used whenever the body cannot be parsed or carries nothing
 * readable — which includes an HTML error page from a proxy, where
 * `response.json()` throws rather than returning anything.
 */
export async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const body = await response.json().catch(() => undefined);
  return detailToMessage(body) ?? fallback;
}
