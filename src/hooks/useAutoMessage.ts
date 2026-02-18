import { useContext } from "react";
import { AutoMessageContext } from "@/contexts/AutoMessageContext";

export function useAutoMessage() {
  const context = useContext(AutoMessageContext);
  if (context === undefined) {
    return {
      triggerAutoSend: async () => {
        // No-op when outside AutoMessageProvider (e.g., brainstorm-only chat)
      },
      registerHandler: () => {},
      unregisterHandler: () => {},
    };
  }
  return context;
}
