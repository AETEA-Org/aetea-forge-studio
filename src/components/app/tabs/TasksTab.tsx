import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { TaskBoard } from "@/components/app/TaskBoard";
import { TaskModal } from "@/components/app/TaskModal";
import { ModificationOverlay } from "@/components/app/ModificationOverlay";
import type { TaskModel } from "@/types/api";

interface TasksTabProps {
  projectId: string;
  onTaskSelect?: (taskId: string | null) => void;
  isModifying?: boolean;
}

export function TasksTab({ projectId, onTaskSelect, isModifying }: TasksTabProps) {
  const { data, isLoading, error } = useProjectTasks(projectId);
  const [selectedTask, setSelectedTask] = useState<TaskModel | null>(null);
  
  // Extract tasks early so it can be used in effects
  const tasks = data?.tasks || [];

  // Notify parent when task selection changes
  useEffect(() => {
    if (onTaskSelect) {
      onTaskSelect(selectedTask?.task_id || null);
    }
  }, [selectedTask, onTaskSelect]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load tasks</p>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <ModificationOverlay isActive={isModifying || false} />
        <TaskBoard tasks={tasks} onTaskClick={setSelectedTask} />
      </div>
      
      {/* Render task modal separately with higher z-index blur overlay */}
      <TaskModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        isModifying={isModifying || false}
      />
    </>
  );
}
