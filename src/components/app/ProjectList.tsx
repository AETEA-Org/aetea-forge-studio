import { useNavigate, useParams } from "react-router-dom";
import { FolderOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useProjects } from "@/hooks/useProjects";

interface ProjectListProps {
  collapsed: boolean;
}

export function ProjectList({ collapsed }: ProjectListProps) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { data, isLoading, error } = useProjects();
  
  const projects = data?.projects || [];

  if (collapsed) {
    return (
      <div className="p-2 space-y-1">
        {projects.map((project) => (
          <button
            key={project.project_id}
            onClick={() => navigate(`/app/project/${project.project_id}`)}
            className={cn(
              "w-full p-2 rounded-md flex items-center justify-center",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              projectId === project.project_id && "bg-sidebar-accent text-sidebar-foreground"
            )}
            title={project.title}
          >
            <FolderOpen className="h-4 w-4" />
          </button>
        ))}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-destructive">Failed to load projects</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">No projects yet</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1">
      {projects.map((project) => (
        <button
          key={project.project_id}
          onClick={() => navigate(`/app/project/${project.project_id}`)}
          className={cn(
            "w-full p-3 rounded-md text-left",
            "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            "transition-colors",
            projectId === project.project_id && "bg-sidebar-accent text-sidebar-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium truncate">{project.title}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            {formatDistanceToNow(new Date(project.last_modified), { addSuffix: true })}
          </p>
        </button>
      ))}
    </div>
  );
}
