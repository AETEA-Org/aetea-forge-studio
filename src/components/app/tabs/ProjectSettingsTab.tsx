import { Settings } from "lucide-react";

export function ProjectSettingsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
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
