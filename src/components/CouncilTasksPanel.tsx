import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: number;
  title: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdBy: string;
}

interface CouncilTasksPanelProps {
  canManage: boolean;
  userName: string;
}

const initialTasks: Task[] = [
  { 
    id: 1, 
    title: 'Организовать спортивное мероприятие', 
    description: 'Провести футбольный турнир между этажами',
    assignedTo: 'Елена Заместителева',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2025-11-01',
    createdBy: 'Иван Председателев'
  },
  { 
    id: 2, 
    title: 'Проверка чистоты на 3 этаже', 
    description: 'Провести еженедельную проверку состояния коридора',
    assignedTo: 'Петр Участников',
    status: 'pending',
    priority: 'medium',
    dueDate: '2025-10-28',
    createdBy: 'Мария Администраторова'
  },
];

export const CouncilTasksPanel = ({ canManage, userName }: CouncilTasksPanelProps) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const { toast } = useToast();

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !assignedTo.trim() || !dueDate) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    const newTask: Task = {
      id: tasks.length + 1,
      title,
      description,
      assignedTo,
      status: 'pending',
      priority,
      dueDate,
      createdBy: userName,
    };

    setTasks([newTask, ...tasks]);
    
    toast({
      title: 'Успешно!',
      description: 'Задача создана',
    });

    setTitle('');
    setDescription('');
    setAssignedTo('');
    setPriority('medium');
    setDueDate('');
    setOpen(false);
  };

  const handleStatusChange = (taskId: number, newStatus: Task['status']) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Icon name="Plus" size={18} />
                Создать задачу
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Новая задача</DialogTitle>
                <DialogDescription>
                  Создайте задачу для члена студсовета
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask}>
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
                  <div className="space-y-2">
                    <Label htmlFor="task-assigned">Исполнитель *</Label>
                    <Input
                      id="task-assigned"
                      placeholder="Имя исполнителя"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                    />
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
                    Создать
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {tasks.map((task, index) => (
          <Card key={task.id} className="hover:shadow-lg transition-shadow animate-slide-in" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  <CardDescription className="mt-2">{task.description}</CardDescription>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Icon name="User" size={14} />
                      {task.assignedTo}
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="Calendar" size={14} />
                      {task.dueDate}
                    </div>
                    <div className="flex items-center gap-1">
                      <Icon name="UserCheck" size={14} />
                      {task.createdBy}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant={getPriorityColor(task.priority)}>
                    {getPriorityName(task.priority)}
                  </Badge>
                  <Select 
                    value={task.status} 
                    onValueChange={(v) => handleStatusChange(task.id, v as Task['status'])}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ожидает</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="completed">Выполнено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}

        {tasks.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Icon name="CheckCircle" size={48} className="mx-auto mb-4 opacity-20" />
              <p>Нет активных задач</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
