import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, Settings, FolderOpen, ChevronLeft, ChevronRight, MessageCircleQuestion, ArrowDown } from "lucide-react";
import { CreditsPill } from "@/components/app/billing/CreditsPill";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSupport } from "@/components/support/SupportContext";
import { SidebarChatList } from "./SidebarChatList";
import { settingsNavigation } from "@/components/app/settingsNavigation";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  showOnboardingCue?: boolean;
  previewOnboarding?: boolean;
}

export function Sidebar({ collapsed, onToggle, showOnboardingCue = false, previewOnboarding = false }: SidebarProps) {
  const { open: openSupport } = useSupport();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/app">
            <img src="/favicon.png" alt="AETEA" className="h-6" />
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={() => navigate("/app")}
          className={cn(
            "w-full justify-start gap-2",
            collapsed && "justify-center px-2"
          )}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New Project</span>}
        </Button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <SidebarChatList collapsed={collapsed} />
      </div>

      {/* Credits, then Settings. The balance sits directly above the way to
          top it up, so noticing it and acting on it are one movement. */}
      <div className="relative border-t border-sidebar-border p-3 pb-0">
        {showOnboardingCue && (
          <ArrowDown
            aria-hidden="true"
            strokeWidth={4}
            className={cn(
              "pointer-events-none absolute top-0 z-[92] h-11 w-11 animate-bounce text-primary drop-shadow-[0_0_14px_rgba(48,145,255,1)] motion-reduce:animate-none",
              collapsed ? "left-1/2 -translate-x-1/2" : "left-8",
            )}
          />
        )}
        <div className={cn("relative mb-2 flex", collapsed ? "justify-center" : "justify-start")}>
          <CreditsPill preview={previewOnboarding} />
        </div>
      </div>

      <div className="p-3 pt-0">
        <Button
          variant="ghost"
          onClick={() => navigate(...settingsNavigation(location))}
          className={cn(
            "w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-2",
            location.pathname === "/app/settings" && "bg-sidebar-accent text-sidebar-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span>Settings</span>}
        </Button>

        {/* Support lives here rather than in a floating bubble: every chat
            surface already owns its bottom-right corner. */}
        <Button
          variant="ghost"
          onClick={openSupport}
          className={cn(
            "w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Contact support" : undefined}
        >
          <MessageCircleQuestion className="h-4 w-4" />
          {!collapsed && <span>Support</span>}
        </Button>
      </div>
    </aside>
  );
}
