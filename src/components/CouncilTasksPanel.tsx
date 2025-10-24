import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { User, UserPosition } from '@/types/auth';
import { Task } from '@/types/councilTasks';
import { getAllPositions } from '@/utils/positions';
import { TaskCard } from '@/components/CouncilTasks/TaskCard';
import { TaskDialog } from '@/components/CouncilTasks/TaskDialog';
import { DeleteTaskDialog } from '@/components/CouncilTasks/DeleteTaskDialog';
import { TaskFilters } from '@/components/CouncilTasks/TaskFilters';

interface CouncilTasksPanelProps {
  canManage: boolean;
  userName: string;
  councilMembers: User[];
  onTaskCreated?: (taskTitle: string) => void;
  onTaskUpdated?: (taskTitle: string) => void;
  onTaskDeleted?: (taskTitle: string) => void;
}

const STORAGE_KEY = 'council_tasks';

export const CouncilTasksPanel = ({ 
  canManage, 
  userName, 
  councilMembers, 
  onTaskCreated, 
  onTaskUpdated, 
  onTaskDeleted 
}: CouncilTasksPanelProps) => {
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
    
    onTaskCreated?.(newTask.title);
    
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
    
    onTaskUpdated?.(updatedTask.title);
    
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
    const task = tasks.find(t => t.id === taskId);
    saveTasks(tasks.filter(t => t.id !== taskId));
    setDeleteTaskId(null);
    
    if (task) {
      onTaskDeleted?.(task.title);
    }
    
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

  const getStatusColor = (status: Task['status']): 'default' | 'secondary' | 'outline' => {
    if (status === 'completed') return 'default';
    if (status === 'in_progress') return 'secondary';
    return 'outline';
  };

  const getPriorityColor = (priority: Task['priority']): 'destructive' | 'secondary' | 'outline' => {
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
          <>
            <Button className="gap-2" onClick={() => setOpen(true)}>
              <Icon name="Plus" size={18} />
              Создать задачу
            </Button>
            <TaskDialog
              open={open}
              onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) resetForm();
              }}
              editingTask={editingTask}
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              assignedToUsers={assignedToUsers}
              setAssignedToUsers={setAssignedToUsers}
              assignedToPositions={assignedToPositions}
              setAssignedToPositions={setAssignedToPositions}
              priority={priority}
              setPriority={setPriority}
              dueDate={dueDate}
              setDueDate={setDueDate}
              councilMembers={councilMembers}
              allPositions={allPositions}
              onSubmit={editingTask ? handleEditTask : handleCreateTask}
            />
          </>
        )}
      </div>

      <TaskFilters
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        tasksCount={filteredTasks.length}
      />

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
            <TaskCard
              key={task.id}
              task={task}
              canManage={canManage}
              onStatusChange={handleStatusChange}
              onEdit={openEditDialog}
              onDelete={setDeleteTaskId}
              formatDate={formatDate}
              formatDateTime={formatDateTime}
              getStatusColor={getStatusColor}
              getPriorityColor={getPriorityColor}
              getStatusName={getStatusName}
              getPriorityName={getPriorityName}
            />
          ))
        )}
      </div>

      <DeleteTaskDialog
        open={deleteTaskId !== null}
        onOpenChange={(open) => !open && setDeleteTaskId(null)}
        onConfirm={() => deleteTaskId && handleDeleteTask(deleteTaskId)}
      />
    </div>
  );
};