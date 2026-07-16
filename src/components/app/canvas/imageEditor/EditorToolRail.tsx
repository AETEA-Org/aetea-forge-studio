import {
  Circle,
  Crop,
  Eraser,
  Minus,
  MousePointer2,
  Pencil,
  Scaling,
  Square,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EditorTool } from "./types";

const TOOLS: { id: EditorTool; label: string; icon: React.ReactNode }[] = [
  { id: "select", label: "Select", icon: <MousePointer2 className="h-4 w-4" /> },
  { id: "draw", label: "Draw", icon: <Pencil className="h-4 w-4" /> },
  { id: "erase", label: "Eraser", icon: <Eraser className="h-4 w-4" /> },
  { id: "rect", label: "Rectangle", icon: <Square className="h-4 w-4" /> },
  { id: "ellipse", label: "Ellipse", icon: <Circle className="h-4 w-4" /> },
  { id: "line", label: "Line", icon: <Minus className="h-4 w-4" /> },
  { id: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { id: "crop", label: "Crop", icon: <Crop className="h-4 w-4" /> },
  { id: "resize", label: "Resize", icon: <Scaling className="h-4 w-4" /> },
];

interface EditorToolRailProps {
  tool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

/** Left vertical tool rail. */
export function EditorToolRail({ tool, onToolChange }: EditorToolRailProps) {
  return (
    <nav
      className="flex w-16 shrink-0 flex-col gap-1 border-r border-border bg-muted/30 py-2"
      aria-label="Editor tools"
    >
      {TOOLS.map((t) => (
        <Button
          key={t.id}
          type="button"
          variant={tool === t.id ? "default" : "ghost"}
          size="sm"
          className={cn(
            "mx-1 flex h-auto flex-col gap-0.5 px-1 py-2",
            tool === t.id && "shadow-sm"
          )}
          onClick={() => onToolChange(t.id)}
          aria-label={t.label}
          aria-pressed={tool === t.id}
        >
          {t.icon}
          <span className="text-[10px] leading-tight">{t.label}</span>
        </Button>
      ))}
    </nav>
  );
}
