import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Plus, Settings, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProjectList } from "./ProjectList";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
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
          {!collapsed && <span>New Chat</span>}
        </Button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ProjectList collapsed={collapsed} />
      </div>

      {/* Settings */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={() => navigate("/app/settings")}
          className={cn(
            "w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed && "justify-center px-2",
            location.pathname === "/app/settings" && "bg-sidebar-accent text-sidebar-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span>Settings</span>}
        </Button>
      </div>
    </aside>
  );
}
