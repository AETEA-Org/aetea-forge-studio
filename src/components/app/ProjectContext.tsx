import { createContext, useContext, ReactNode } from "react";

interface ProjectContextType {
  activeTab: string;
  selectedTaskId: string | null;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({
  children,
  activeTab,
  selectedTaskId,
}: {
  children: ReactNode;
  activeTab: string;
  selectedTaskId: string | null;
}) {
  return (
    <ProjectContext.Provider value={{ activeTab, selectedTaskId }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  return context; // Return undefined if not in provider (for compatibility)
}
