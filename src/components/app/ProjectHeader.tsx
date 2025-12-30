import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface ProjectHeaderProps {
  title: string;
  lastModified?: string;
}

export function ProjectHeader({ title, lastModified }: ProjectHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link to="/app" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <span>/</span>
        <span className="text-foreground">{title}</span>
      </div>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      {lastModified && (
        <p className="text-sm text-muted-foreground mt-1">
          Updated {formatDistanceToNow(new Date(lastModified), { addSuffix: true })}
        </p>
      )}
    </div>
  );
}
