import { useState, useMemo, useEffect } from "react";
import { Loader2, Trash2, MessageSquare, Search } from "lucide-react";
import { formatDistanceFromUTC, isUTCDateToday, isUTCDateThisWeek, weeksSinceUTC } from "@/lib/dateUtils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const chats = data?.chats || [];

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) {
      return chats;
    }
    const query = searchQuery.toLowerCase().trim();
    return chats.filter((chat) =>
      chat.title.toLowerCase().includes(query)
    );
  }, [chats, searchQuery]);

  // Group filtered chats by date
  const groupedChats = useMemo(() => {
    const groups: { label: string; chats: typeof filteredChats }[] = [];
    const today: typeof filteredChats = [];
    const thisWeek: typeof filteredChats = [];
    const weeksAgo: { [key: number]: typeof filteredChats } = {};

    filteredChats.forEach((chat) => {
      if (isUTCDateToday(chat.last_modified)) {
        today.push(chat);
      } else if (isUTCDateThisWeek(chat.last_modified)) {
        thisWeek.push(chat);
      } else {
        const weeks = weeksSinceUTC(chat.last_modified);
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
  }, [filteredChats]);

  // Clear search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  const handleSelectChat = (chatId: string) => {
    onSelectChat(chatId);
    setOpen(false);
  };

  const handleDeleteClick = async (e: React.MouseEvent, chatId: string, chatTitle: string) => {
    e.stopPropagation();
    
    try {
      await deleteChatMutation.mutateAsync({ 
        chatId, 
        projectId 
      });
      
      toast({
        title: "Chat deleted",
        description: `"${chatTitle}" has been deleted.`,
      });
      
      // If deleted chat was active, clear selection
      if (activeChatId === chatId) {
        onSelectChat('');
      }
    } catch (err) {
      toast({
        title: "Failed to delete chat",
        description: err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 z-[100]" 
          align="end"
          side="bottom"
          sideOffset={8}
        >
          {/* Search Bar */}
          {!isLoading && chats.length > 0 && (
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground px-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chat history yet</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground px-4">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No chats found</p>
              <p className="text-xs mt-1">Try a different search term</p>
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
                                  {formatDistanceFromUTC(chat.last_modified, { 
                                    addSuffix: true 
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-0.5">
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
    </>
  );
}
