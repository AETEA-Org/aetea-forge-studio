import { useLocation } from "react-router-dom";
import { MessageCircleQuestion } from "lucide-react";
import { useSupport } from "./SupportContext";

/**
 * The floating bubble, on the public pages only.
 *
 * Inside /app it is deliberately absent: every chat surface puts something at
 * the bottom-right — the brainstorm composer's send button, the whole copilot
 * panel, a draggable canvas node — so the trigger there lives in the Sidebar
 * footer and the canvas chrome instead.
 */
export function SupportLauncher() {
  const { open } = useSupport();
  const { pathname } = useLocation();
  if (pathname === "/app" || pathname.startsWith("/app/")) return null;

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Contact support"
      title="Contact support"
      className="fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full
                 bg-primary text-primary-foreground shadow-lg transition-transform
                 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2
                 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                 motion-reduce:transition-none"
    >
      <MessageCircleQuestion className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
