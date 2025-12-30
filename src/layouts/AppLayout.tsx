import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/app/Sidebar";
import { AICopilotPanel } from "@/components/app/AICopilotPanel";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copilotCollapsed, setCopilotCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Right AI Panel */}
      <AICopilotPanel 
        collapsed={copilotCollapsed} 
        onToggle={() => setCopilotCollapsed(!copilotCollapsed)} 
      />
    </div>
  );
}
