import type { Location, NavigateOptions, To } from "react-router-dom";

/** Where Settings sends you when you leave it, if it was opened from nowhere. */
const HOME = "/app";

/**
 * Open Settings, and remember the screen it was opened from.
 *
 * Settings is a page rather than a dialog, so opening it replaces whatever you
 * were looking at. From the chat list that costs nothing — the list is still
 * there in the sidebar to click back into. From a deliverable canvas it costs
 * a lot: the canvas is not in that list, so the way back is the browser's back
 * button and nothing on the page says so.
 *
 * Carrying the address in router state fixes both halves at once: the back
 * control inside Settings knows where to return to, and it returns to the
 * canvas rather than to the campaign the canvas belongs to. State is lost on a
 * reload, which is why `settingsReturn` has a fallback rather than trusting it.
 *
 * Spread into `navigate`: `navigate(...settingsNavigation(location))`.
 */
export function settingsNavigation(
  location: Pick<Location, "pathname" | "search">,
  tab?: string,
): [To, NavigateOptions] {
  return [
    { pathname: "/app/settings", search: tab ? `?tab=${tab}` : "" },
    { state: { from: `${location.pathname}${location.search}` } },
  ];
}

/** The screen Settings should return to. */
export function settingsReturn(location: Pick<Location, "state">): To {
  const from = (location.state as { from?: unknown } | null)?.from;
  // Only ever a path within the app. A value from anywhere else — a stale
  // state, or an address someone put there — is not somewhere to send anyone.
  if (typeof from === "string" && from.startsWith("/app")) return from;
  return HOME;
}
