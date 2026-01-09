import { useState } from "react";
import { Loader2, Trash2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChats, useDeleteChat } from "@/hooks/useChats";
import { useToast } from "@/hooks/use-toast";

interface ChatHistoryDialogProps {
  projectId: string;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatHistoryDialog({
  projectId,
  activeChatId,
  onSelectChat,
  open,
  onOpenChange,
}: ChatHistoryDialogProps) {
  const { data, isLoading } = useChats(projectId);
  const deleteChatMutation = useDeleteChat();
  const { toast } = useToast();
  const [chatToDelete, setChatToDelete] = useState<{ id: string; title: string } | null>(null);

  const chats = data?.chats || [];

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    onOpenChange(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, chatId: string, chatTitle: string) => {
    e.stopPropagation();
    setChatToDelete({ id: chatId, title: chatTitle });
  };

  const handleDeleteConfirm = async () => {
    if (!chatToDelete) return;
    
    try {
      await deleteChatMutation.mutateAsync({ 
        chatId: chatToDelete.id, 
        projectId 
      });
      
      toast({
        title: "Chat deleted",
        description: `"${chatToDelete.title}" has been deleted.`,
      });
      
      // If deleted chat was active, clear selection
      if (activeChatId === chatToDelete.id) {
        onSelectChat('');
      }
    } catch (err) {
      toast({
        title: "Failed to delete chat",
        description: err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setChatToDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
            <DialogDescription>
              View and manage your previous conversations
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chat history yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-2">
                {chats.map((chat) => (
                  <div
                    key={chat.chat_id}
                    className={`relative group rounded-lg border p-3 cursor-pointer transition-colors ${
                      activeChatId === chat.chat_id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                    onClick={() => handleSelectChat(chat.chat_id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <h4 className="text-sm font-medium truncate">
                            {chat.title}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(chat.last_modified), { 
                            addSuffix: true 
                          })}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteClick(e, chat.chat_id, chat.title)}
                        disabled={deleteChatMutation.isPending}
                      >
                        {deleteChatMutation.isPending && 
                         deleteChatMutation.variables?.chatId === chat.chat_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog 
        open={!!chatToDelete} 
        onOpenChange={(open) => !open && setChatToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{chatToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteChatMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteChatMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteChatMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
