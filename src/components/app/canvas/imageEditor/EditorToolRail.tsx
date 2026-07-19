import { useState } from "react";
import {
  ArrowUpRight,
  Circle,
  Crop,
  Eraser,
  Minus,
  MousePointer2,
  Pencil,
  Scaling,
  Shapes,
  Square,
  Triangle,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { EditorTool, ShapeTool } from "./types";
import { isShapeTool } from "./types";

const PRIMARY_TOOLS: {
  id: EditorTool;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "select", label: "Select", icon: <MousePointer2 className="h-4 w-4" /> },
  { id: "draw", label: "Draw", icon: <Pencil className="h-4 w-4" /> },
  { id: "erase", label: "Eraser", icon: <Eraser className="h-4 w-4" /> },
  { id: "text", label: "Text", icon: <Type className="h-4 w-4" /> },
  { id: "crop", label: "Crop", icon: <Crop className="h-4 w-4" /> },
  { id: "resize", label: "Resize", icon: <Scaling className="h-4 w-4" /> },
];

const SHAPE_OPTIONS: {
  id: ShapeTool;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: "rect", label: "Rectangle", icon: <Square className="h-4 w-4" /> },
  { id: "ellipse", label: "Ellipse", icon: <Circle className="h-4 w-4" /> },
  { id: "line", label: "Line", icon: <Minus className="h-4 w-4" /> },
  { id: "triangle", label: "Triangle", icon: <Triangle className="h-4 w-4" /> },
  { id: "arrow", label: "Arrow", icon: <ArrowUpRight className="h-4 w-4" /> },
];

function shapeIcon(shape: ShapeTool): React.ReactNode {
  return SHAPE_OPTIONS.find((s) => s.id === shape)?.icon ?? (
    <Shapes className="h-4 w-4" />
  );
}

interface EditorToolRailProps {
  tool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
}

/** Left vertical tool rail. */
export function EditorToolRail({ tool, onToolChange }: EditorToolRailProps) {
  const [shapesOpen, setShapesOpen] = useState(false);
  const [lastShape, setLastShape] = useState<ShapeTool>("rect");
  const activeShape = isShapeTool(tool) ? tool : lastShape;
  const shapeActive = isShapeTool(tool);

  const pickShape = (shape: ShapeTool) => {
    setLastShape(shape);
    onToolChange(shape);
    setShapesOpen(false);
  };

  return (
    <nav
      className="flex w-16 shrink-0 flex-col gap-1 border-r border-border bg-muted/30 py-2"
      aria-label="Editor tools"
    >
      {PRIMARY_TOOLS.slice(0, 3).map((t) => (
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

      <Popover open={shapesOpen} onOpenChange={setShapesOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={shapeActive ? "default" : "ghost"}
            size="sm"
            className={cn(
              "mx-1 flex h-auto flex-col gap-0.5 px-1 py-2",
              shapeActive && "shadow-sm"
            )}
            aria-label="Shapes"
            aria-pressed={shapeActive}
          >
            {shapeIcon(activeShape)}
            <span className="text-[10px] leading-tight">Shapes</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="start"
          className="z-[120] w-40 p-1"
        >
          {SHAPE_OPTIONS.map((s) => (
            <Button
              key={s.id}
              type="button"
              variant={tool === s.id ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-full justify-start gap-2 px-2"
              onClick={() => pickShape(s.id)}
            >
              {s.icon}
              {s.label}
            </Button>
          ))}
        </PopoverContent>
      </Popover>

      {PRIMARY_TOOLS.slice(3).map((t) => (
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
