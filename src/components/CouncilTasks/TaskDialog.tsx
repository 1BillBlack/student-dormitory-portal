import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Task } from '@/types/councilTasks';
import { User, UserPosition } from '@/types/auth';
import { getPositionName } from '@/utils/positions';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTask: Task | null;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  assignedToUsers: string[];
  setAssignedToUsers: (users: string[]) => void;
  assignedToPositions: UserPosition[];
  setAssignedToPositions: (positions: UserPosition[]) => void;
  priority: 'low' | 'medium' | 'high';
  setPriority: (priority: 'low' | 'medium' | 'high') => void;
  dueDate: string;
  setDueDate: (date: string) => void;
  councilMembers: User[];
  allPositions: UserPosition[];
  onSubmit: (e: React.FormEvent) => void;
}

export const TaskDialog = ({
  open,
  onOpenChange,
  editingTask,
  title,
  setTitle,
  description,
  setDescription,
  assignedToUsers,
  setAssignedToUsers,
  assignedToPositions,
  setAssignedToPositions,
  priority,
  setPriority,
  dueDate,
  setDueDate,
  councilMembers,
  allPositions,
  onSubmit
}: TaskDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{editingTask ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
          <DialogDescription>
            {editingTask ? 'Изменение существующей задачи' : 'Создайте задачу для члена студсовета'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Название *</Label>
              <Input
                id="task-title"
                placeholder="Введите название задачи"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Описание</Label>
              <Textarea
                id="task-description"
                placeholder="Описание задачи"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-3">
              <Label>Исполнители (укажите хотя бы одного)</Label>
              
              <div className="space-y-2">
                <Label className="text-sm font-normal">Члены студсовета</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (value && !assignedToUsers.includes(value)) {
                      setAssignedToUsers([...assignedToUsers, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите участника" />
                  </SelectTrigger>
                  <SelectContent>
                    {councilMembers.length > 0 ? (
                      councilMembers.map(member => (
                        <SelectItem key={member.id} value={member.name}>
                          {member.name} ({member.email})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Нет членов студсовета</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {assignedToUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {assignedToUsers.map(userName => (
                      <Badge key={userName} variant="secondary" className="gap-1">
                        {userName}
                        <button
                          type="button"
                          onClick={() => setAssignedToUsers(assignedToUsers.filter(n => n !== userName))}
                          className="ml-1 hover:text-destructive"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-normal">Должности</Label>
                <Select
                  value=""
                  onValueChange={(value) => {
                    const position = value as UserPosition;
                    if (position && !assignedToPositions.includes(position)) {
                      setAssignedToPositions([...assignedToPositions, position]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите должность" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPositions.map(position => (
                      <SelectItem key={position} value={position}>
                        {getPositionName(position)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignedToPositions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {assignedToPositions.map(position => (
                      <Badge key={position} variant="secondary" className="gap-1">
                        {getPositionName(position)}
                        <button
                          type="button"
                          onClick={() => setAssignedToPositions(assignedToPositions.filter(p => p !== position))}
                          className="ml-1 hover:text-destructive"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Приоритет</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as 'low' | 'medium' | 'high')}>
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">Срок *</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="gap-2">
              <Icon name="Check" size={18} />
              {editingTask ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
