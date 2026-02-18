import { createContext, ReactNode, useRef, useCallback } from "react";

export interface AutoSendOptions {
  files?: File[];
  context?: string;
  prefillMode?: "instant" | "typewriter";
  onEvent?: (eventName: string) => void;
  onComplete?: () => void;
  onError?: (msg: string) => void;
}

export type TriggerAutoSendHandler = (
  message: string,
  options?: AutoSendOptions
) => Promise<void>;

interface AutoMessageContextType {
  triggerAutoSend: (message: string, options?: AutoSendOptions) => Promise<void>;
  registerHandler: (handler: TriggerAutoSendHandler) => void;
  unregisterHandler: () => void;
}

const AutoMessageContext = createContext<AutoMessageContextType | undefined>(
  undefined
);

export function AutoMessageProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<TriggerAutoSendHandler | null>(null);

  const registerHandler = useCallback((handler: TriggerAutoSendHandler) => {
    handlerRef.current = handler;
  }, []);

  const unregisterHandler = useCallback(() => {
    handlerRef.current = null;
  }, []);

  const triggerAutoSend = useCallback(
    async (message: string, options?: AutoSendOptions) => {
      if (handlerRef.current) {
        return handlerRef.current(message, options);
      }
      return Promise.resolve();
    },
    []
  );

  return (
    <AutoMessageContext.Provider
      value={{ triggerAutoSend, registerHandler, unregisterHandler }}
    >
      {children}
    </AutoMessageContext.Provider>
  );
}

export { AutoMessageContext };
