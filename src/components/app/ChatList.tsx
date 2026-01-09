import { Loader2, MessageSquare, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useChats, useDeleteChat } from "@/hooks/useChats";
import type { ChatListItem } from "@/types/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface ChatListProps {
  projectId: string;
  activeChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatList({ projectId, activeChatId, onChatSelect, onNewChat }: ChatListProps) {
  const { data, isLoading, error } = useChats(projectId);
  const deleteChat = useDeleteChat();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const chats = data?.chats || [];

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this chat?")) {
      return;
    }

    setDeletingId(chatId);
    try {
      await deleteChat.mutateAsync({ chatId, projectId });
      // If deleting active chat, create new one
      if (chatId === activeChatId) {
        onNewChat();
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
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

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-3 border-b border-sidebar-border">
        <Button
          onClick={onNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
          size="sm"
        >
          <MessageSquare className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chats.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">No chats yet</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.chat_id}
              className={cn(
                "relative group rounded-md",
                activeChatId === chat.chat_id && "bg-sidebar-accent"
              )}
            >
              <button
                onClick={() => onChatSelect(chat.chat_id)}
                className={cn(
                  "w-full p-3 rounded-md text-left pr-10",
                  "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                  "transition-colors",
                  activeChatId === chat.chat_id && "bg-sidebar-accent text-sidebar-foreground"
                )}
                disabled={deletingId === chat.chat_id}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium truncate">{chat.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  {formatDistanceToNow(new Date(chat.last_modified), { addSuffix: true })}
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
                        onClick={(e) => handleDelete(e, chat.chat_id)}
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
          ))
        )}
      </div>
    </div>
  );
}
