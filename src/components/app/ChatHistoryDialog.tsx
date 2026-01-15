import { useState, useMemo } from "react";
import { Loader2, Trash2, MessageSquare, Pencil } from "lucide-react";
import { formatDistanceToNow, isToday, isThisWeek, differenceInWeeks } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";

interface ChatHistoryDialogProps {
  projectId: string;
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  trigger: React.ReactNode;
}

export function ChatHistoryDialog({
  projectId,
  activeChatId,
  onSelectChat,
  trigger,
}: ChatHistoryDialogProps) {
  const { data, isLoading } = useChats(projectId);
  const deleteChatMutation = useDeleteChat();
  const { toast } = useToast();
  const [chatToDelete, setChatToDelete] = useState<{ id: string; title: string } | null>(null);
  const [open, setOpen] = useState(false);

  const chats = data?.chats || [];

  // Group chats by date
  const groupedChats = useMemo(() => {
    const groups: { label: string; chats: typeof chats }[] = [];
    const today: typeof chats = [];
    const thisWeek: typeof chats = [];
    const weeksAgo: { [key: number]: typeof chats } = {};

    chats.forEach((chat) => {
      const date = new Date(chat.last_modified);
      if (isToday(date)) {
        today.push(chat);
      } else if (isThisWeek(date) && !isToday(date)) {
        thisWeek.push(chat);
      } else {
        const weeks = differenceInWeeks(new Date(), date);
        if (!weeksAgo[weeks]) {
          weeksAgo[weeks] = [];
        }
        weeksAgo[weeks].push(chat);
      }
    });

    if (today.length > 0) {
      groups.push({ label: "Today", chats: today });
    }
    if (thisWeek.length > 0) {
      groups.push({ label: "This week", chats: thisWeek });
    }
    
    // Sort weeks and add to groups
    Object.keys(weeksAgo)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((weeks) => {
        groups.push({ label: `${weeks}w ago`, chats: weeksAgo[weeks] });
      });

    return groups;
  }, [chats]);

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    setOpen(false);
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0" 
          align="end"
          side="bottom"
          sideOffset={8}
        >
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground px-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chat history yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="p-2">
                {groupedChats.map((group, groupIndex) => (
                  <div key={group.label} className={cn(groupIndex > 0 && "mt-4")}>
                    <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                      {group.label}
                    </div>
                    <div className="space-y-0.5">
                      {group.chats.map((chat) => (
                        <div
                          key={chat.chat_id}
                          className={cn(
                            "relative group rounded-md px-3 py-2 cursor-pointer transition-colors",
                            "hover:bg-accent",
                            activeChatId === chat.chat_id && "bg-accent"
                          )}
                          onClick={() => handleSelectChat(chat.chat_id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium truncate">
                                    {chat.title}
                                  </span>
                                  {activeChatId === chat.chat_id && (
                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(chat.last_modified), { 
                                    addSuffix: true 
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Edit functionality could go here
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => handleDeleteClick(e, chat.chat_id, chat.title)}
                                disabled={deleteChatMutation.isPending}
                              >
                                {deleteChatMutation.isPending && 
                                 deleteChatMutation.variables?.chatId === chat.chat_id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </PopoverContent>
      </Popover>

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
