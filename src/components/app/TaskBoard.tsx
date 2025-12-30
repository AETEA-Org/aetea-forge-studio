import { TaskCard } from "./TaskCard";
import type { TaskModel, TaskStatus } from "@/types/api";

interface TaskBoardProps {
  tasks: TaskModel[];
  onTaskClick: (task: TaskModel) => void;
}

const columns: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'under_review', label: 'Under Review' },
  { id: 'done', label: 'Done' },
];

export function TaskBoard({ tasks, onTaskClick }: TaskBoardProps) {
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id);
        
        return (
          <div key={column.id} className="flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-medium text-sm">{column.label}</h3>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>
            
            <div className="flex-1 space-y-2 min-h-[200px] p-2 rounded-lg bg-muted/30">
              {columnTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No tasks
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.task_id}
                    task={task}
                    onClick={() => onTaskClick(task)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
