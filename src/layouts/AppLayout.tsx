import { useState, useEffect, useCallback } from "react";
import { Outlet, useParams } from "react-router-dom";
import { Sidebar } from "@/components/app/Sidebar";
import { AICopilotPanel } from "@/components/app/AICopilotPanel";
import { ModificationProvider } from "@/components/app/ModificationContext";
import type { ProjectTab } from "@/components/app/ProjectTabs";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [copilotCollapsed, setCopilotCollapsed] = useState(false);
  const [isModifying, setIsModifyingState] = useState(false);
  const [modifyingContext, setModifyingContextState] = useState<string | null>(null);
  
  // Shared state for active tab and selected task - lifted for AI Copilot context detection
  const [activeTab, setActiveTab] = useState<ProjectTab>('overview');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const { projectId } = useParams<{ projectId?: string }>();

  // Handler that updates modification state - shared between AICopilotPanel and Project
  // Wrapped in useCallback to prevent recreating on every render
  const handleModification = useCallback((isModifying: boolean, context: string | null) => {
    setIsModifyingState(isModifying);
    setModifyingContextState(context);
  }, []); // Empty deps - this function never needs to change

  // Reset all state when project changes
  useEffect(() => {
    if (!projectId) {
      setIsModifyingState(false);
      setModifyingContextState(null);
      setActiveTab('overview');
      setSelectedTaskId(null);
    } else {
      // Reset to overview when switching projects
      setActiveTab('overview');
      setSelectedTaskId(null);
    }
  }, [projectId]);

  return (
    <ModificationProvider setIsModifying={handleModification}>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet 
            context={{
              isModifying,
              modifyingContext,
              activeTab,
              selectedTaskId,
              setActiveTab,
              setSelectedTaskId,
            }}
          />
        </main>

        {/* Right AI Panel - Only show when project is open */}
        {projectId && (
          <AICopilotPanel 
            projectId={projectId}
            activeTab={activeTab}
            selectedTaskId={selectedTaskId}
            collapsed={copilotCollapsed} 
            onToggle={() => setCopilotCollapsed(!copilotCollapsed)} 
          />
        )}
      </div>
    </ModificationProvider>
  );
}
