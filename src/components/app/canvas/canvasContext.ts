import { createContext, useContext } from "react";
import type { ChatInputHandle, ChatSendMeta } from "@/components/app/ChatInput";
import type {
  Asset,
  CampaignTask,
  ChatMessage,
  ChatRenderableAsset,
  DeliverableObject,
} from "@/types/api";

/** Everything the canvas nodes need, provided once so the node array stays stable. */
export interface CanvasContextValue {
  /**
   * The piece of work this canvas is for, or null on the campaign's own canvas
   * — work made outside any task still needs somewhere to live.
   */
  task: CampaignTask | null;
  /** The canvas's deliverable objects — the preview dialog uses them for nav. */
  objects: DeliverableObject[];
  chatId: string;
  /** Which canvas this is: a task id, or `chat:<id>` for the campaign's own. */
  canvasKey: string;
  campaignId?: string;
  userEmail: string;
  // Task-scoped chat (mirrors the old TaskDetailPage chat)
  messages: ChatMessage[];
  threadAssets: Asset[];
  streamingAssets: ChatRenderableAsset[];
  streamingContent: string;
  isStreaming: boolean;
  updateMessage: string | null;
  onSend: (message: string, files?: File[], meta?: ChatSendMeta) => void;
  chatInputRef: React.RefObject<ChatInputHandle>;
  /** Count of selected cards attached as references to the next message. */
  referenceCount: number;
  // Approval (user-only)
  onApprove: (objectId: string) => void;
  approvingIds: Set<string>;
}

export const CanvasContext = createContext<CanvasContextValue | null>(null);

export function useCanvas(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) {
    throw new Error("useCanvas must be used within a CanvasContext provider");
  }
  return ctx;
}
