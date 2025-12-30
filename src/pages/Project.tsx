import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Project() {
  const { projectId } = useParams();

  // Placeholder - will fetch project data
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-5xl mx-auto">
        {/* Project Header */}
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">Projects</p>
          <h1 className="font-display text-2xl font-bold">
            Project Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Project ID: {projectId}
          </p>
        </div>

        {/* Tabs Placeholder */}
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-muted-foreground">
            Project workspace tabs will be implemented in Phase 5.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Overview • Brief • Research • Strategy • Tasks • Analytics • Settings
          </p>
        </div>
      </div>
    </div>
  );
}
