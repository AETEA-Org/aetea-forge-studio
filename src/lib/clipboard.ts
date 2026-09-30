/**
 * Put text on the clipboard, saying whether it worked.
 *
 * What chat messages hand this is `message.content`, which is already markdown
 * — the backend stores it that way and the bubble renders it with
 * react-markdown. So there is nothing to convert, and nothing to scrape out of
 * the DOM: what is copied cannot pick up a timestamp, a button label or the
 * message underneath, because none of those are in the string.
 *
 * `navigator.clipboard` is undefined on an insecure origin and can be refused
 * outright, so this never throws — the caller shows the failure instead of the
 * console swallowing it.
 */
export async function copyMarkdown(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
