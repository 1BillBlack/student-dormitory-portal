import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { WorkShift } from '@/types/workShifts';

interface MyWorkShiftsProps {
  shifts: WorkShift[];
  expandedUsers: Set<string>;
  setExpandedUsers: (users: Set<string>) => void;
  currentUserId: string;
  formatDate: (dateStr: string) => string;
}

export const MyWorkShifts = ({ 
  shifts, 
  expandedUsers, 
  setExpandedUsers, 
  currentUserId,
  formatDate 
}: MyWorkShiftsProps) => {
  const activeShifts = shifts.filter(s => s.completedDays < s.days);
  const completedShifts = shifts.filter(s => s.completedDays >= s.days);

  if (!shifts.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icon name="CheckCircle" size={48} className="mx-auto mb-4 opacity-50" />
        <p>У вас нет отработок</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeShifts.map(s => (
        <Card key={s.id}>
          <CardHeader className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">{s.days} дн. отработок</CardTitle>
                <CardDescription className="mt-1">
                  Назначено: {formatDate(s.assignedAt)} ({s.assignedByName})
                </CardDescription>
              </div>
              <Badge variant="destructive" className="shrink-0">
                Осталось: {s.days - s.completedDays} дн.
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Причина: </span>
                <span>{s.reason}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Отработано: </span>
                <span className="font-medium">{s.completedDays} из {s.days} дн.</span>
              </div>
              {s.completedAt && (
                <div>
                  <span className="text-muted-foreground">Последнее списание: </span>
                  <span>{formatDate(s.completedAt)} ({s.completedByName})</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {completedShifts.length > 0 && (
        <Card>
          <CardHeader className="p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newExpanded = new Set(expandedUsers);
                if (newExpanded.has(currentUserId)) {
                  newExpanded.delete(currentUserId);
                } else {
                  newExpanded.add(currentUserId);
                }
                setExpandedUsers(newExpanded);
              }}
              className="w-full justify-between"
            >
              <span className="text-sm font-medium">
                Выполненные отработки ({completedShifts.length})
              </span>
              <Icon name={expandedUsers.has(currentUserId) ? "ChevronUp" : "ChevronDown"} size={16} />
            </Button>
          </CardHeader>

          {expandedUsers.has(currentUserId) && (
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                {completedShifts.map(s => (
                  <div key={s.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="flex-1">
                        <div className="font-medium">{s.days} дн. отработок</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Назначено: {formatDate(s.assignedAt)} ({s.assignedByName})
                        </div>
                      </div>
                      <Badge variant="default" className="shrink-0">Выполнено</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Причина: </span>
                        <span>{s.reason}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Отработано: </span>
                        <span className="font-medium">{s.completedDays} из {s.days} дн.</span>
                      </div>
                      {s.completedAt && (
                        <div className="text-xs text-muted-foreground">
                          Завершено: {formatDate(s.completedAt)} ({s.completedByName})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};
