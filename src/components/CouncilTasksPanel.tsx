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
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { User, UserPosition } from '@/types/auth';
import { getPositionName, getAllPositions } from '@/utils/positions';

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
  const [filterStatus, setFilterStatus] = useState<'all' | Task['status']>('all');
  const { toast } = useToast();

  const allPositions: UserPosition[] = getAllPositions();

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

    saveTasks([...tasks, newTask]);
    
    toast({
      title: 'Задача создана',
      description: 'Новая задача успешно добавлена',
    });

    resetForm();
    setOpen(false);
  };

  const handleEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTask) return;

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

    const updatedTask: Task = {
      ...editingTask,
      title,
      description,
      assignedToUsers,
      assignedToPositions,
      priority,
      dueDate,
    };

    saveTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
    
    toast({
      title: 'Сохранено',
      description: 'Изменения успешно сохранены',
    });

    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssignedToUsers([]);
    setAssignedToPositions([]);
    setPriority('medium');
    setDueDate('');
    setEditingTask(null);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setAssignedToUsers(task.assignedToUsers);
    setAssignedToPositions(task.assignedToPositions);
    setPriority(task.priority);
    setDueDate(task.dueDate);
    setOpen(true);
  };

  const handleDeleteTask = (taskId: number) => {
    saveTasks(tasks.filter(t => t.id !== taskId));
    setDeleteTaskId(null);
    
    toast({
      title: 'Удалено',
      description: 'Задача успешно удалена',
    });
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} в ${hours}:${minutes}`;
  };

  const filteredTasks = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
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
          {filteredTasks.length} {filteredTasks.length === 1 ? 'задача' : filteredTasks.length < 5 ? 'задачи' : 'задач'}
        </span>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                Задач пока нет
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map(task => (
            <Card key={task.id}>
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
                    onValueChange={(v) => handleStatusChange(task.id, v as Task['status'])}
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
                        onClick={() => openEditDialog(task)}
                      >
                        <Icon name="Pencil" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTaskId(task.id)}
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
            <AlertDialogAction onClick={() => deleteTaskId && handleDeleteTask(deleteTaskId)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};