import { useContext } from "react";
import { ModificationContext } from "@/components/app/ModificationContext";

export function useModification() {
  const context = useContext(ModificationContext);
  // Return a no-op function if context is not available (e.g., when outside Project component)
  if (context === undefined) {
    return {
      setIsModifying: () => {
        // No-op: modification state is only relevant when viewing a project
      },
    };
  }
  return context;
}
