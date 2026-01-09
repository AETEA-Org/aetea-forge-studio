import { cn } from "@/lib/utils";

interface ModificationOverlayProps {
  isActive: boolean;
  message?: string;
}

export function ModificationOverlay({ isActive, message = "AI is modifying this section..." }: ModificationOverlayProps) {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 flex items-center justify-center",
        "backdrop-blur-md bg-background/60",
        "transition-all duration-300",
        isActive ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10 text-center space-y-4 px-6">
        {/* Animated spinner/icon */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          </div>
        </div>
        
        {/* Message */}
        <p className="text-sm font-medium text-foreground/80">
          {message}
        </p>
      </div>
    </div>
  );
}
