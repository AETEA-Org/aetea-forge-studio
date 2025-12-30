import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { TaskBoard } from "@/components/app/TaskBoard";
import { TaskModal } from "@/components/app/TaskModal";
import type { TaskModel } from "@/types/api";

interface TasksTabProps {
  projectId: string;
}

export function TasksTab({ projectId }: TasksTabProps) {
  const { data, isLoading, error } = useProjectTasks(projectId);
  const [selectedTask, setSelectedTask] = useState<TaskModel | null>(null);

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

  const tasks = data?.tasks || [];

  return (
    <>
      <TaskBoard tasks={tasks} onTaskClick={setSelectedTask} />
      
      <TaskModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
