import { useEffect } from "react";
import { applyHead, type HeadSpec } from "./head";
import { DEFAULT_PAGE } from "./pages";

/**
 * Give a page its own <head> while it is mounted.
 *
 * On unmount it puts back the site default rather than "whatever was there
 * before": a prerendered page's starting head is its own metadata, so
 * restoring it would leak the Pricing canonical and offers into /auth.
 * React runs every unmount cleanup before the next page's mount effect, so
 * navigating Pricing -> Home applies the default, then Home's.
 */
export function usePageMetadata(spec: HeadSpec): void {
  useEffect(() => {
    applyHead(spec);
    return () => applyHead(DEFAULT_PAGE);
  }, [spec]);
}
