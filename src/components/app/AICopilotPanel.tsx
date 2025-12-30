import { Bot, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AICopilotPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AICopilotPanel({ collapsed, onToggle }: AICopilotPanelProps) {
  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-sidebar border-l border-sidebar-border transition-all duration-300",
        collapsed ? "w-12" : "w-80"
      )}
    >
      {/* Header */}
      <div className="p-3 flex items-center gap-2 border-b border-sidebar-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Copilot</span>
          </div>
        )}
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-medium text-foreground mb-2">Coming Soon</h3>
          <p className="text-sm text-muted-foreground">
            You'll be able to refine briefs, explore research insights, and manage tasks with AI assistance here.
          </p>
        </div>
      )}
    </aside>
  );
}
