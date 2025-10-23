import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { User, UserPosition } from '@/types/auth';
import { getPositionName } from '@/utils/positions';

interface Task {
  id: number;
  title: string;
  description: string;
  assignedToUsers: string[];
  assignedToPositions: UserPosition[];
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

interface CouncilTasksPanelProps {
  canManage: boolean;
  userName: string;
  councilMembers: User[];
}

const STORAGE_KEY = 'council_tasks';

export const CouncilTasksPanel = ({ canManage, userName, councilMembers }: CouncilTasksPanelProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToUsers, setAssignedToUsers] = useState<string[]>([]);
  const [assignedToPositions, setAssignedToPositions] = useState<UserPosition[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const { toast } = useToast();

  const allPositions: UserPosition[] = ['chairman', 'vice_chairman', 'cultural_organizer', 'sports_organizer', 'media_manager', 'treasurer', 'general_member'];

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTasks(JSON.parse(stored));
    }
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !dueDate) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и срок выполнения',
        variant: 'destructive',
      });
      return;
    }

    if (assignedToUsers.length === 0 && assignedToPositions.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Укажите хотя бы одного исполнителя или должность',
        variant: 'destructive',
      });
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      title,
      description,
      assignedToUsers,
      assignedToPositions,
      status: 'pending',
      priority,
      dueDate,
      createdBy: userName,
      createdAt: new Date().toISOString(),
    };

    saveTasks([newTask, ...tasks]);
    
    const assignees = [...assignedToUsers, ...assignedToPositions.map(p => getPositionName(p))].join(', ');
    toast({
      title: 'Успешно!',
      description: `Задача создана. Исполнители: ${assignees}`,
    });

    resetForm();
  };

  const handleEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTask || !title.trim() || !dueDate) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и срок выполнения',
        variant: 'destructive',
      });
      return;
    }

    if (assignedToUsers.length === 0 && assignedToPositions.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Укажите хотя бы одного исполнителя или должность',
        variant: 'destructive',
      });
      return;
    }

    const updatedTasks = tasks.map(t => 
      t.id === editingTask.id 
        ? { ...t, title, description, assignedToUsers, assignedToPositions, priority, dueDate }
        : t
    );

    saveTasks(updatedTasks);
    
    toast({
      title: 'Обновлено!',
      description: 'Задача успешно изменена',
    });

    resetForm();
  };

  const handleDeleteTask = () => {
    if (deleteTaskId === null) return;

    const updatedTasks = tasks.filter(t => t.id !== deleteTaskId);
    saveTasks(updatedTasks);
    
    toast({
      title: 'Удалено',
      description: 'Задача удалена',
    });

    setDeleteTaskId(null);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedToUsers([]);
    setAssignedToPositions([]);
    setPriority('medium');
    setDueDate('');
    setOpen(false);
    setEditingTask(null);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setAssignedToUsers(task.assignedToUsers || []);
    setAssignedToPositions(task.assignedToPositions || []);
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setOpen(true);
  };

  const handleStatusChange = (taskId: number, newStatus: Task['status']) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, status: newStatus };
        if (newStatus === 'completed' && !t.completedAt) {
          updated.completedAt = new Date().toISOString();
        }
        return updated;
      }
      return t;
    });

    saveTasks(updatedTasks);
    
    toast({
      title: 'Статус обновлён',
      description: 'Статус задачи изменён',
    });
  };

  const getStatusColor = (status: Task['status']) => {
    if (status === 'completed') return 'default';
    if (status === 'in_progress') return 'secondary';
    return 'outline';
  };

  const getPriorityColor = (priority: Task['priority']) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'secondary';
    return 'outline';
  };

  const getStatusName = (status: Task['status']) => {
    const names = {
      pending: 'Ожидает',
      in_progress: 'В работе',
      completed: 'Выполнено',
    };
    return names[status];
  };

  const getPriorityName = (priority: Task['priority']) => {
    const names = {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
    };
    return names[priority];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Задачи студсовета</h3>
          <p className="text-sm text-muted-foreground">
            Управление задачами и поручениями
          </p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Icon name="Plus" size={18} />
                Создать задачу
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>{editingTask ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
                <DialogDescription>
                  {editingTask ? 'Изменение существующей задачи' : 'Создайте задачу для члена студсовета'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingTask ? handleEditTask : handleCreateTask}>
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
                      <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {councilMembers.length > 0 ? (
                          councilMembers.map(member => (
                            <div key={member.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`user-${member.id}`}
                                checked={assignedToUsers.includes(member.name)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setAssignedToUsers([...assignedToUsers, member.name]);
                                  } else {
                                    setAssignedToUsers(assignedToUsers.filter(n => n !== member.name));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`user-${member.id}`}
                                className="text-sm cursor-pointer flex-1"
                              >
                                {member.name} ({member.email})
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">Нет членов студсовета</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-normal">Должности</Label>
                      <div className="grid gap-2 border rounded-md p-3">
                        {allPositions.map(position => (
                          <div key={position} className="flex items-center space-x-2">
                            <Checkbox
                              id={`pos-${position}`}
                              checked={assignedToPositions.includes(position)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAssignedToPositions([...assignedToPositions, position]);
                                } else {
                                  setAssignedToPositions(assignedToPositions.filter(p => p !== position));
                                }
                              }}
                            />
                            <label
                              htmlFor={`pos-${position}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {getPositionName(position)}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-priority">Приоритет</Label>
                      <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
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
        )}
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Icon name="ListTodo" size={48} className="mx-auto mb-4 opacity-20" />
              <p>Задач пока нет</p>
            </CardContent>
          </Card>
        )}

        {tasks.map((task, index) => (
          <Card key={task.id} className="hover:shadow-lg transition-shadow animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  <CardDescription className="mt-2">{task.description}</CardDescription>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                    <div className="flex flex-col gap-1">
                      {task.assignedToUsers && task.assignedToUsers.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Icon name="User" size={14} />
                          {task.assignedToUsers.join(', ')}
                        </div>
                      )}
                      {task.assignedToPositions && task.assignedToPositions.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Icon name="Briefcase" size={14} />
                          {task.assignedToPositions.map(p => getPositionName(p)).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Calendar" size={14} />
                      {formatDate(task.dueDate)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="UserCheck" size={14} />
                      {task.createdBy}
                    </div>
                    {task.completedAt && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Icon name="CheckCircle" size={14} />
                        Завершено {formatDate(task.completedAt)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={getPriorityColor(task.priority)}>
                    {getPriorityName(task.priority)}
                  </Badge>
                  <Badge variant={getStatusColor(task.status)}>
                    {getStatusName(task.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {task.status !== 'completed' && (
                  <>
                    {task.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="gap-2"
                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                      >
                        <Icon name="Play" size={14} />
                        Начать работу
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        variant="default"
                        className="gap-2"
                        onClick={() => handleStatusChange(task.id, 'completed')}
                      >
                        <Icon name="CheckCircle" size={14} />
                        Завершить
                      </Button>
                    )}
                  </>
                )}
                {canManage && (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="gap-2"
                      onClick={() => openEditDialog(task)}
                    >
                      <Icon name="Edit" size={14} />
                      Редактировать
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      className="gap-2"
                      onClick={() => setDeleteTaskId(task.id)}
                    >
                      <Icon name="Trash2" size={14} />
                      Удалить
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteTaskId !== null} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Задача будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};