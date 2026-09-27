import { ToastAction } from "@/components/ui/toast";
import { cancelRun, ChatBusyError, OutOfCreditsError } from "@/services/agentRun";

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
 * Running out of credits is not a failure either. It is the product working as
 * sold, and the answer is a way to buy more — so it gets its own calm wording
 * and a button that goes there. Red-banner treatment would make an ordinary
 * commercial moment look like a fault, and the first thing someone does with a
 * product that looks broken is stop trusting it with their work.
 *
 * Anything else keeps the red treatment, because anything else really is wrong.
 */
export function reportSendFailure(
  error: unknown,
  opts: {
    toast: ToastFn;
    chatId?: string;
    userEmail?: string;
    onStopped?: () => void;
    /** Show the out-of-credits state in place of the answer. */
    onOutOfCredits?: () => void;
  }
): void {
  const { toast, chatId, userEmail, onStopped, onOutOfCredits } = opts;

  if (error instanceof OutOfCreditsError) {
    // The surface handles it inline where the answer would have been. Falling
    // through to a toast as well would say the same thing twice, once calmly
    // and once in red.
    if (onOutOfCredits) {
      onOutOfCredits();
      return;
    }
    toast({
      title: "You're out of credits",
      description: "Everything you've made is saved. Add credits to carry on.",
      action: (
        <ToastAction
          altText="Add credits"
          onClick={() => {
            window.location.href = "/app/settings?tab=billing";
          }}
        >
          Add credits
        </ToastAction>
      ),
    });
    return;
  }

  if (error instanceof ChatBusyError) {
    toast({
      title: "Still working on your last message",
      description: error.message,
      action:
        chatId && userEmail ? (
          <ToastAction
            altText="Stop the current turn"
            onClick={() => {
              cancelRun(chatId)
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
