import { ToastAction } from "@/components/ui/toast";
import { cancelRun, ChatBusyError } from "@/services/agentRun";

type ToastFn = (opts: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactElement;
}) => void;

/**
 * Explain why a message could not be sent, and offer the way out.
 *
 * Being told the chat is busy is not a failure — it is a normal thing to run
 * into while a turn is still going, and it was arriving as a red banner
 * carrying the server's internal sentence, chat uuid and all. It gets its own
 * wording and a Stop button, so the answer to "it says something is running" is
 * one click away rather than a hunt for the stop control.
 *
 * Anything else keeps the red treatment, because anything else really is wrong.
 */
export function reportSendFailure(
  error: unknown,
  opts: { toast: ToastFn; chatId?: string; userEmail?: string; onStopped?: () => void }
): void {
  const { toast, chatId, userEmail, onStopped } = opts;

  if (error instanceof ChatBusyError) {
    toast({
      title: "Still working on your last message",
      description: error.message,
      action:
        chatId && userEmail ? (
          <ToastAction
            altText="Stop the current turn"
            onClick={() => {
              cancelRun(chatId, userEmail)
                .then(() => onStopped?.())
                .catch(() => {});
            }}
          >
            Stop it
          </ToastAction>
        ) : undefined,
    });
    return;
  }

  toast({
    title: "Something went wrong",
    description: error instanceof Error ? error.message : "Could not send that message",
    variant: "destructive",
  });
}
