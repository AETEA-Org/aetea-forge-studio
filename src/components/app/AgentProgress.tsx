import { AgentThinking } from "./AgentThinking";
import { AgentSteps } from "./AgentSteps";
import type { ProgressStep, RunConnectionState } from "@/services/agentRun";

/** Shared live progress, below messages on every chat surface. Flex shrinking
 * protects the message viewport even in a 320 × 300 canvas window. */
export function AgentProgress({ thinkingText, steps, connection, onReconnect, onStop }: {
  thinkingText: string;
  steps: ProgressStep[];
  connection?: RunConnectionState;
  onReconnect?: () => void;
  onStop?: () => void;
}) {
  const interrupted = connection === "interrupted";
  const stopping = connection === "stopping";
  const reconnecting = connection === "reconnecting";
  if (!thinkingText.trim() && !steps.length && !interrupted && !reconnecting && !stopping) return null;
  return (
    <div className="chat-scrollbar nodrag nowheel min-h-0 max-h-[40%] shrink overflow-y-auto space-y-2 px-3 pb-2" aria-label="Run progress">
      {(interrupted || reconnecting || stopping) && (
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
          <p role="status">{interrupted
            ? "Connection interrupted. The work may still be running."
            : stopping ? "Stopping the run…" : "Reconnecting to the run…"}</p>
          {interrupted && (
            <div className="mt-2 flex gap-3">
              <button type="button" onClick={onReconnect} className="min-h-8 rounded text-primary underline focus-visible:outline focus-visible:outline-2">Reconnect</button>
              <button type="button" onClick={onStop} className="min-h-8 rounded text-primary underline focus-visible:outline focus-visible:outline-2">Stop</button>
            </div>
          )}
        </div>
      )}
      <AgentThinking text={thinkingText} />
      <AgentSteps steps={steps} />
    </div>
  );
}
