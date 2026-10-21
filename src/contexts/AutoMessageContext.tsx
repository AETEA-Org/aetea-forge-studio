import { createContext, ReactNode, useRef, useCallback } from "react";
import type {
  GenerationMode,
  GenerationOptions,
} from "@/components/app/ChatInput";

export interface AutoSendOptions {
  files?: File[];
  context?: string;
  prefillMode?: "instant" | "typewriter";
  /** What the caller is asking to be made, when it knows. A button labelled
   *  "Generate key visual" is asking for an image, so it says so here rather
   *  than describing the request in the message and hoping it is read. */
  generationMode?: GenerationMode;
  /** The identifiers of what the user picked - a style card, saved characters,
   *  exact frames. These are the same keys the generation tools take, so a
   *  pick travels as data and never as a sentence about itself. */
  generationOptions?: GenerationOptions;
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
