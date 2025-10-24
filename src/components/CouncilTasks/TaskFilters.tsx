import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Task } from '@/types/councilTasks';

interface TaskFiltersProps {
  filterStatus: 'all' | Task['status'];
  setFilterStatus: (status: 'all' | Task['status']) => void;
  tasksCount: number;
}

export const TaskFilters = ({ filterStatus, setFilterStatus, tasksCount }: TaskFiltersProps) => {
  const getTasksCountText = (count: number) => {
    if (count === 1) return 'задача';
    if (count < 5) return 'задачи';
    return 'задач';
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <Label className="text-sm">Фильтр:</Label>
      <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все задачи</SelectItem>
          <SelectItem value="pending">Ожидает</SelectItem>
          <SelectItem value="in_progress">В работе</SelectItem>
          <SelectItem value="completed">Выполнено</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-sm text-muted-foreground ml-2">
        {tasksCount} {getTasksCountText(tasksCount)}
      </span>
    </div>
  );
};
