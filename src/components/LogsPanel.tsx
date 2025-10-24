import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import Icon from '@/components/ui/icon';
import { useLogs, Log, LogAction } from '@/contexts/LogsContext';
import { useToast } from '@/hooks/use-toast';

interface LogsPanelProps {
  canDelete?: boolean;
}

const getActionName = (action: Log['action']) => {
  const actions = {
    room_request_created: 'Создана заявка на комнату',
    room_request_approved: 'Одобрена заявка на комнату',
    room_request_rejected: 'Отклонена заявка на комнату',
    room_changed: 'Изменена комната',
    announcement_created: 'Создано объявление',
    announcement_deleted: 'Удалено объявление',
    announcement_updated: 'Обновлено объявление',
    task_created: 'Создана задача',
    task_deleted: 'Удалена задача',
    task_updated: 'Обновлена задача',
    role_assigned: 'Назначена роль',
    role_removed: 'Снята роль',
    position_assigned: 'Назначена должность',
    position_removed: 'Снята должность',
    work_shift_assigned: 'Назначены отработки',
    work_shift_completed: 'Списаны отработки',
    work_shift_deleted: 'Удалены отработки',
  };
  return actions[action] || action;
};

const getActionIcon = (action: Log['action']) => {
  if (action.includes('room')) return 'Home';
  if (action.includes('announcement')) return 'Bell';
  if (action.includes('task')) return 'CheckSquare';
  if (action.includes('role') || action.includes('position')) return 'UserCog';
  if (action.includes('work_shift')) return 'Briefcase';
  return 'Activity';
};

const getActionColor = (action: Log['action']) => {
  if (action.includes('created') || action.includes('approved') || action.includes('assigned')) return 'default';
  if (action.includes('deleted') || action.includes('rejected') || action.includes('removed')) return 'destructive';
  if (action.includes('updated') || action.includes('changed')) return 'secondary';
  return 'outline';
};

const formatDateTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
};

const getActionCategory = (action: LogAction): string => {
  if (action.includes('room')) return 'room';
  if (action.includes('announcement')) return 'announcement';
  if (action.includes('task')) return 'task';
  if (action.includes('role') || action.includes('position')) return 'user';
  if (action.includes('work_shift')) return 'work_shift';
  return 'other';
};

export const LogsPanel = ({ canDelete = false }: LogsPanelProps) => {
  const { logs, deleteLog, clearAllLogs } = useLogs();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deletingLogId, setDeletingLogId] = useState<number | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.targetUserName && log.targetUserName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = 
      filterCategory === 'all' || 
      getActionCategory(log.action) === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDeleteLog = () => {
    if (deletingLogId) {
      deleteLog(deletingLogId);
      toast({
        title: 'Удалено',
        description: 'Лог успешно удалён',
      });
      setDeletingLogId(null);
    }
  };

  const handleClearAll = () => {
    clearAllLogs();
    toast({
      title: 'Очищено',
      description: 'Все логи успешно удалены',
    });
    setShowClearDialog(false);
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
        <p>Логов пока нет</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Поиск по логам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Категория" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все категории</SelectItem>
            <SelectItem value="room">Комнаты</SelectItem>
            <SelectItem value="announcement">Объявления</SelectItem>
            <SelectItem value="task">Задачи</SelectItem>
            <SelectItem value="user">Пользователи</SelectItem>
            <SelectItem value="work_shift">Отработки</SelectItem>
          </SelectContent>
        </Select>
        {canDelete && (
          <Button
            variant="destructive"
            onClick={() => setShowClearDialog(true)}
            className="gap-2"
          >
            <Icon name="Trash2" size={16} />
            Очистить всё
          </Button>
        )}
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="Search" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Ничего не найдено</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <Card key={log.id}>
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      <Icon name={getActionIcon(log.action)} size={20} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base break-words">{getActionName(log.action)}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {formatDateTime(log.timestamp)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={getActionColor(log.action)}>
                      {log.action.includes('created') || log.action.includes('approved') || log.action.includes('assigned') ? 'Создание' :
                       log.action.includes('deleted') || log.action.includes('rejected') || log.action.includes('removed') ? 'Удаление' : 'Изменение'}
                    </Badge>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingLogId(log.id)}
                        className="h-8 w-8"
                      >
                        <Icon name="Trash2" size={16} className="text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Icon name="User" size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                    <span className="break-words">
                      <span className="font-medium">{log.userName}</span>
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="Info" size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground break-words">{log.details}</span>
                  </div>
                  {log.targetUserName && (
                    <div className="flex items-start gap-2">
                      <Icon name="UserCheck" size={14} className="mt-0.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground break-words">
                        Участник: <span className="font-medium text-foreground">{log.targetUserName}</span>
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletingLogId} onOpenChange={(open) => !open && setDeletingLogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить лог?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Лог будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLog} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Очистить все логи?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все логи будут удалены навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Очистить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};