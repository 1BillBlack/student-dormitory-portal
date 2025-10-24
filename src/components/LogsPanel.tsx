import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useLogs, Log } from '@/contexts/LogsContext';

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
  };
  return actions[action] || action;
};

const getActionIcon = (action: Log['action']) => {
  if (action.includes('room')) return 'Home';
  if (action.includes('announcement')) return 'Bell';
  if (action.includes('task')) return 'CheckSquare';
  if (action.includes('role') || action.includes('position')) return 'UserCog';
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

export const LogsPanel = () => {
  const { logs } = useLogs();

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-50" />
        <p>Логов пока нет</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
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
              <Badge variant={getActionColor(log.action)} className="shrink-0">
                {log.action.includes('created') || log.action.includes('approved') || log.action.includes('assigned') ? 'Создание' :
                 log.action.includes('deleted') || log.action.includes('rejected') || log.action.includes('removed') ? 'Удаление' : 'Изменение'}
              </Badge>
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
  );
};
