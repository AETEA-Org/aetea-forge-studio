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
 * one click away rather than a hunt for the stop control. On a deliverable it
 * says so, rather than claiming the whole conversation is blocked.
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
    /** Which run the Stop button should stop: a deliverable's task id, or the
     *  conversation when omitted. A deliverable canvas must pass its own, or
     *  Stop halts the conversation and leaves the busy deliverable running. */
    scope?: string;
    userEmail?: string;
    onStopped?: () => void;
    /** Present when the caller can put the refused message straight back on
     *  the wire after stopping. Only changes the button's wording — the
     *  caller does the resending from `onStopped`. */
    onResend?: boolean;
    /** Show the out-of-credits state in place of the answer. */
    onOutOfCredits?: () => void;
  }
): void {
  const { toast, chatId, scope, userEmail, onStopped, onResend, onOutOfCredits } = opts;

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
    // The title used to be this string for every busy error, while the
    // description carried the server's scope-aware sentence about *this
    // deliverable*. One toast said "your last message" and "this deliverable"
    // at the same time, which is what screenshot 7 of the October review
    // shows. The scope is right here; it just was not read.
    const onDeliverable = !!scope;
    toast({
      title: onDeliverable
        ? "Still working on this deliverable"
        : "Still working on your last message",
      description: onDeliverable
        ? "Your other deliverables aren't affected. Your message is back in the box."
        : "Your message is back in the box.",
      action:
        chatId && userEmail ? (
          <ToastAction
            // One action, not three steps. Stopping and then leaving someone
            // to find the composer and press send again is the same refusal
            // with extra work attached.
            altText="Stop what is running and send this instead"
            onClick={() => {
              cancelRun(chatId, scope)
                .then(() => onStopped?.())
                .catch(() => {});
            }}
          >
            {onResend ? "Stop and send" : "Stop it"}
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
