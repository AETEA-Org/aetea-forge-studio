import { Settings } from "lucide-react";
import { ModificationOverlay } from "@/components/app/ModificationOverlay";

interface ProjectSettingsTabProps {
  isModifying?: boolean;
}

export function ProjectSettingsTab({ isModifying }: ProjectSettingsTabProps) {
  return (
    <div className="relative flex flex-col items-center justify-center py-16 text-center">
      <ModificationOverlay isActive={isModifying || false} />
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Settings className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-semibold text-lg mb-2">Project Settings Coming Soon</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        Configure auto-posting, integrations, team access, and more.
      </p>
    </div>
  );
}
