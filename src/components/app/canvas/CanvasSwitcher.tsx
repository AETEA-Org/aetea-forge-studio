import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, LayoutGrid } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getCampaignTasks } from "@/services/api";
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
  currentTaskId: string;
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
    queryFn: () => getCampaignTasks(campaignId!, user!.email!),
    enabled: !!campaignId && !!user?.email,
  });
  const tasks = data?.tasks ?? [];

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
          <ChevronsUpDown className="h-4 w-4 ml-2 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="top" className="w-72">
        <DropdownMenuLabel>Switch deliverable canvas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tasks.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No tasks</div>
        ) : (
          tasks.map((task) => (
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
              <span className="truncate">{task.title}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
