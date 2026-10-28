import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";

type SupportContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const SupportContext = createContext<SupportContextValue | undefined>(undefined);

/**
 * One dialog, opened from three places.
 *
 * The launcher cannot live in one spot: the marketing pages have room for a
 * floating bubble, the app's chat surfaces do not — their composers occupy the
 * bottom of the main column, the whole right-hand panel, and a draggable node
 * respectively. So the trigger moves per surface and the panel does not.
 */
export function SupportProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);
  return <SupportContext.Provider value={value}>{children}</SupportContext.Provider>;
}

export function useSupport() {
  const context = useContext(SupportContext);
  if (!context) throw new Error("useSupport must be used within a SupportProvider");
  return context;
}
