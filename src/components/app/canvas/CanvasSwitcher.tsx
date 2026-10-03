import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, LayoutGrid, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useActiveRuns } from "@/hooks/useActiveRuns";
import { getCampaignTasks } from "@/services/api";
import { CHIP_CLASSES, deliverableState } from "@/lib/deliverableState";
import type { CampaignTask } from "@/types/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CanvasSwitcherProps {
  chatId: string;
  campaignId: string | undefined;
  /** The open task, or undefined on the campaign's own canvas. */
  currentTaskId?: string;
  currentTitle: string;
}

export function CanvasSwitcher({
  chatId,
  campaignId,
  currentTaskId,
  currentTitle,
}: CanvasSwitcherProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["campaign-tasks", campaignId, user?.email],
    queryFn: () => getCampaignTasks(campaignId!),
    enabled: !!campaignId && !!user?.email,
  });
  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const { runs } = useActiveRuns(chatId);
  const runByScope = useMemo(
    () => new Map(runs.map((run) => [run.scope, run])),
    [runs]
  );

  // Deliverables, each followed by the work inside it. Assembled the same way
  // the Creative tab does it, and for the same reason: the API returns a flat
  // list with each row naming its parent. A row whose parent is missing is
  // shown as a deliverable rather than dropped — a canvas you cannot reach is
  // a canvas you cannot fix.
  const rows = useMemo(() => {
    const ids = new Set(tasks.map((task) => task.id));
    const byParent = new Map<string, CampaignTask[]>();
    for (const task of tasks) {
      if (!task.parent_task_id || !ids.has(task.parent_task_id)) continue;
      const group = byParent.get(task.parent_task_id) ?? [];
      group.push(task);
      byParent.set(task.parent_task_id, group);
    }
    const out: Array<{ task: CampaignTask; child: boolean }> = [];
    for (const task of tasks) {
      if (task.parent_task_id && ids.has(task.parent_task_id)) continue;
      out.push({ task, child: false });
      for (const sub of byParent.get(task.id) ?? []) out.push({ task: sub, child: true });
    }
    return out;
  }, [tasks]);

  /**
   * Creation order, never sorted by state.
   *
   * Sorting running-first reads better for one glance and is wrong for this
   * control: it is a navigation menu first, and a list that reorders itself
   * while someone is reaching for an item is a list that gets misclicked. The
   * chips carry the same information without moving anything.
   */
  const anyRunning = runs.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="shadow-md border border-border max-w-[280px]"
        >
          <LayoutGrid className="h-4 w-4 mr-2 shrink-0" />
          <span className="truncate">{currentTitle}</span>
          {/* Work elsewhere in this campaign is worth knowing about without
              opening the menu — otherwise the only way to find out that two
              other deliverables are going is to go looking. */}
          {anyRunning && (
            <Loader2
              aria-label={`${runs.length} running elsewhere`}
              className="h-3.5 w-3.5 ml-2 shrink-0 animate-spin text-primary motion-reduce:animate-none"
            />
          )}
          <ChevronsUpDown className="h-4 w-4 ml-2 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top" className="w-72 max-h-[60vh] overflow-y-auto">
        <DropdownMenuLabel>Switch deliverable canvas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Work made outside any task — key visuals, one-offs from the
            conversation — lives here rather than on no canvas at all. */}
        <DropdownMenuItem
          onSelect={() => {
            if (currentTaskId) navigate(`/app/chat/${chatId}/canvas`);
          }}
          className="gap-2"
        >
          <Check
            className={cn(
              "h-4 w-4 shrink-0",
              currentTaskId ? "opacity-0" : "opacity-100"
            )}
          />
          <span className="truncate">Campaign</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {rows.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No tasks</div>
        ) : (
          rows.map(({ task, child }) => {
            const state = deliverableState(
              task.status,
              runByScope.get(task.id)?.execution
            );
            /**
             * Work inside a deliverable is shown but not selectable, because a
             * child has no canvas of its own — its work happens on its
             * parent's. A plain row rather than a disabled menu item: the
             * keyboard skips both, but "disabled" tells a screen reader this
             * is an action that exists and is unavailable, which is the wrong
             * thing to say about a line that was only ever information.
             * `DropdownMenuLabel` is a plain element inside this same menu for
             * the same reason.
             */
            if (child) {
              return (
                <div
                  key={task.id}
                  role="presentation"
                  className="flex items-center gap-2 py-1.5 pl-9 pr-2 text-sm text-muted-foreground"
                >
                  <span className="min-w-0 flex-1 truncate">{task.title}</span>
                  <span className="shrink-0 text-xs">{state.label}</span>
                </div>
              );
            }
            return (
              <DropdownMenuItem
                key={task.id}
                onSelect={() => {
                  if (task.id !== currentTaskId) {
                    navigate(`/app/chat/${chatId}/task/${task.id}`);
                  }
                }}
                className="gap-2"
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    task.id === currentTaskId ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="min-w-0 flex-1 truncate">{task.title}</span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                    CHIP_CLASSES[state.chip]
                  )}
                >
                  {state.label}
                </span>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
