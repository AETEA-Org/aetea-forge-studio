import { createContext, ReactNode } from "react";

interface ModificationContextType {
  setIsModifying: (isModifying: boolean, context: string | null) => void;
}

const ModificationContext = createContext<ModificationContextType | undefined>(undefined);

export function ModificationProvider({
  children,
  setIsModifying,
}: {
  children: ReactNode;
  setIsModifying: (isModifying: boolean, context: string | null) => void;
}) {
  return (
    <ModificationContext.Provider value={{ setIsModifying }}>
      {children}
    </ModificationContext.Provider>
  );
}

export { ModificationContext };
