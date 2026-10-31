import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatMessage } from "@/types/api";

export interface Rewind {
  /** The message being rewound to, or null when no rewind is armed. */
  target: ChatMessage | null;
  /** Its id: what the thread dims from, and what the turn sends. */
  targetId: string | null;
  /** How many messages sending would replace, counting the target itself. */
  replacingCount: number;
  /** Arm a rewind: the composer takes the text, the thread dims below it. */
  arm: (message: ChatMessage) => void;
  /** Put everything back. Nothing was deleted, so nothing is restored. */
  cancel: () => void;
}

/**
 * Which message, if any, the composer is rewinding to.
 *
 * Arming is deliberately inert: it dims the thread and seeds the composer, and
 * that is all. Nothing is deleted until the turn is actually sent, so cancelling
 * costs nothing — unlike the in-bubble editor this replaced, which deleted on
 * submit with a line of small print as the only warning.
 *
 * The text itself does not live here; it goes to the composer, which is the
 * point. On the canvas the composer also holds the generation mode, its
 * pickers and the selected reference cards, so a rewound turn keeps all of them
 * by being an ordinary turn with one extra field.
 */
export function useRewind(messages: ChatMessage[]): Rewind {
  const [targetId, setTargetId] = useState<string | null>(null);

  const index = useMemo(
    () => (targetId ? messages.findIndex((m) => m.message_id === targetId) : -1),
    [messages, targetId]
  );

  // The armed message can go away underneath us — the thread refetches, or the
  // chat is switched. Staying armed to a message nobody can see would leave a
  // notice on screen offering to replace nothing.
  useEffect(() => {
    if (targetId && index === -1) setTargetId(null);
  }, [targetId, index]);

  const arm = useCallback((message: ChatMessage) => {
    setTargetId(message.message_id);
  }, []);
  const cancel = useCallback(() => setTargetId(null), []);

  return {
    target: index === -1 ? null : messages[index],
    targetId: index === -1 ? null : targetId,
    replacingCount: index === -1 ? 0 : messages.length - index,
    arm,
    cancel,
  };
}
