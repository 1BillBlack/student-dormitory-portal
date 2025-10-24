import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Task } from '@/types/councilTasks';
import { getPositionName } from '@/utils/positions';

interface TaskCardProps {
  task: Task;
  canManage: boolean;
  onStatusChange: (taskId: number, newStatus: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  formatDate: (dateString: string) => string;
  formatDateTime: (dateString: string) => string;
  getStatusColor: (status: Task['status']) => 'default' | 'secondary' | 'outline';
  getPriorityColor: (priority: Task['priority']) => 'destructive' | 'secondary' | 'outline';
  getStatusName: (status: Task['status']) => string;
  getPriorityName: (priority: Task['priority']) => string;
}

export const TaskCard = ({
  task,
  canManage,
  onStatusChange,
  onEdit,
  onDelete,
  formatDate,
  formatDateTime,
  getStatusColor,
  getPriorityColor,
  getStatusName,
  getPriorityName
}: TaskCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg">{task.title}</CardTitle>
            <CardDescription className="mt-1">
              {task.description || 'Без описания'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={getPriorityColor(task.priority)}>
              {getPriorityName(task.priority)}
            </Badge>
            <Badge variant={getStatusColor(task.status)}>
              {getStatusName(task.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Icon name="Calendar" size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground">Срок:</span>
          <span>{formatDate(task.dueDate)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Icon name="Clock" size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground">Создано:</span>
          <span>{formatDateTime(task.createdAt)}</span>
        </div>
        
        {task.assignedToUsers.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Icon name="User" size={16} className="text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <span className="text-muted-foreground">Исполнители:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {task.assignedToUsers.map(userName => (
                  <Badge key={userName} variant="outline">
                    {userName}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {task.assignedToPositions.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Icon name="Briefcase" size={16} className="text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <span className="text-muted-foreground">Должности:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {task.assignedToPositions.map(position => (
                  <Badge key={position} variant="outline">
                    {getPositionName(position)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Select
            value={task.status}
            onValueChange={(v) => onStatusChange(task.id, v as Task['status'])}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Ожидает</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="completed">Выполнено</SelectItem>
            </SelectContent>
          </Select>

          {canManage && (
            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(task)}
              >
                <Icon name="Pencil" size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(task.id)}
              >
                <Icon name="Trash2" size={16} />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
