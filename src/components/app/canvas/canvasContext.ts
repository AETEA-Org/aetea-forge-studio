import { createContext, useContext } from "react";
import type { ChatInputHandle } from "@/components/app/ChatInput";
import type {
  Asset,
  CampaignTask,
  ChatMessage,
  ChatRenderableAsset,
  DeliverableObject,
} from "@/types/api";

/** Everything the canvas nodes need, provided once so the node array stays stable. */
export interface CanvasContextValue {
  task: CampaignTask;
  /** Task deliverable objects — used by the object preview dialog for nav. */
  objects: DeliverableObject[];
  // Task-scoped chat (mirrors the old TaskDetailPage chat)
  messages: ChatMessage[];
  threadAssets: Asset[];
  streamingAssets: ChatRenderableAsset[];
  streamingContent: string;
  isStreaming: boolean;
  updateMessage: string | null;
  onSend: (message: string, files?: File[]) => void;
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
