import { useNavigate, useParams } from "react-router-dom";
import { FolderOpen, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceFromUTC } from "@/lib/dateUtils";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { deleteChatById } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { DeleteProjectDialog } from "@/components/app/DeleteProjectDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectListProps {
  collapsed: boolean;
}

export function ProjectList({ collapsed }: ProjectListProps) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { data, isLoading, error } = useProjects();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);
  
  const chats = data?.chats || [];

  const handleDeleteClick = (e: React.MouseEvent, projectId: string, projectTitle: string) => {
    e.stopPropagation();
    setProjectToDelete({ id: projectId, title: projectTitle });
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete || !user?.email) return;

    setDeletingId(projectToDelete.id);
    try {
      await deleteChatById(projectToDelete.id, user.email);
      
      // Invalidate chats query to refetch list
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      
      // If currently viewing the deleted chat, redirect to /app
      if (projectId === projectToDelete.id) {
        navigate('/app');
      }
      
      toast({
        title: "Chat deleted",
        description: `"${projectToDelete.title}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error('Delete chat error:', error);
      toast({
        title: "Failed to delete chat",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setProjectToDelete(null);
    }
  };

  if (collapsed) {
    return (
      <>
        <div className="p-2 space-y-1">
          {chats.map((chat) => (
            <button
              key={chat.chat_id}
              onClick={() => navigate(`/app/chat/${chat.chat_id}`)}
              className={cn(
                "w-full p-2 rounded-md flex items-center justify-center",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                projectId === chat.chat_id && "bg-sidebar-accent text-sidebar-foreground"
              )}
              title={chat.title}
            >
              <FolderOpen className="h-4 w-4" />
            </button>
          ))}
        </div>
        <DeleteProjectDialog
          open={!!projectToDelete}
          onOpenChange={(open) => !open && setProjectToDelete(null)}
          projectTitle={projectToDelete?.title || ''}
          onConfirm={handleDeleteConfirm}
          isDeleting={!!deletingId}
        />
      </>
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
        <p className="text-xs text-destructive">Failed to load chats</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">No chats yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-2 space-y-1">
        {chats.map((chat) => (
          <div
            key={chat.chat_id}
            className={cn(
              "relative group rounded-md",
              projectId === chat.chat_id && "bg-sidebar-accent"
            )}
          >
            <button
              onClick={() => navigate(`/app/chat/${chat.chat_id}`)}
              className={cn(
                "w-full p-3 rounded-md text-left pr-10",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                "transition-colors",
                projectId === chat.chat_id && "bg-sidebar-accent text-sidebar-foreground"
              )}
              disabled={deletingId === chat.chat_id}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium truncate">{chat.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                {formatDistanceFromUTC(chat.last_modified, { addSuffix: true })}
              </p>
            </button>
            
            {/* Delete button */}
            <div className="absolute right-2 top-3">
              {deletingId === chat.chat_id ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1 rounded hover:bg-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => handleDeleteClick(e, chat.chat_id, chat.title)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <DeleteProjectDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        projectTitle={projectToDelete?.title || ''}
        onConfirm={handleDeleteConfirm}
        isDeleting={!!deletingId}
      />
    </>
  );
}
