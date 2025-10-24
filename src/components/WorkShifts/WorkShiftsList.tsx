import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { WorkShift } from '@/types/workShifts';

interface WorkShiftsListProps {
  shifts: WorkShift[];
  expandedUsers: Set<string>;
  setExpandedUsers: (users: Set<string>) => void;
  canComplete: boolean;
  canDelete: boolean;
  onComplete: (shiftId: number) => void;
  onDelete: (shiftId: number) => void;
  formatDate: (dateStr: string) => string;
  getUserTotalDays: (userId: string) => { remaining: number; completed: number };
}

export const WorkShiftsList = ({
  shifts,
  expandedUsers,
  setExpandedUsers,
  canComplete,
  canDelete,
  onComplete,
  onDelete,
  formatDate,
  getUserTotalDays
}: WorkShiftsListProps) => {
  const groupedByUser = shifts.reduce((acc, shift) => {
    if (!acc[shift.userId]) {
      acc[shift.userId] = {
        userName: shift.userName,
        userId: shift.userId,
        shifts: []
      };
    }
    acc[shift.userId].shifts.push(shift);
    return acc;
  }, {} as Record<string, { userName: string; userId: string; shifts: WorkShift[] }>);

  return (
    <div className="space-y-3">
      {Object.values(groupedByUser).map(({ userName, userId, shifts: userShifts }) => {
        const activeShifts = userShifts.filter(s => s.completedDays < s.days);
        const completedShifts = userShifts.filter(s => s.completedDays >= s.days);
        const uTotals = getUserTotalDays(userId);
        const isExpanded = expandedUsers.has(userId);

        return (
          <Card key={userId}>
            <CardHeader className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base break-words">{userName}</CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <Badge variant={uTotals.remaining > 0 ? 'destructive' : 'default'} className="text-nowrap">
                    Осталось: {uTotals.remaining} дн.
                  </Badge>
                  <Badge variant="secondary" className="text-nowrap">
                    Отработано: {uTotals.completed} дн.
                  </Badge>
                </div>
              </div>
            </CardHeader>
            {userShifts.length > 0 && (
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {activeShifts.map(s => (
                    <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 bg-muted rounded-lg">
                      <div className="flex-1 text-sm min-w-0">
                        <div className="font-medium break-words">{s.days} дн. • {s.reason}</div>
                        <div className="text-xs text-muted-foreground break-all">
                          {formatDate(s.assignedAt)} • Отработано: {s.completedDays}/{s.days}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {canComplete && (
                          <Button variant="ghost" size="icon" onClick={() => onComplete(s.id)}>
                            <Icon name="CheckCircle" size={16} className="text-green-600" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)}>
                            <Icon name="Trash2" size={16} className="text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {completedShifts.length > 0 && (
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newExpanded = new Set(expandedUsers);
                          if (isExpanded) {
                            newExpanded.delete(userId);
                          } else {
                            newExpanded.add(userId);
                          }
                          setExpandedUsers(newExpanded);
                        }}
                        className="w-full justify-between"
                      >
                        <span className="text-xs text-muted-foreground">
                          Выполненные отработки ({completedShifts.length})
                        </span>
                        <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
                      </Button>

                      {isExpanded && (
                        <div className="space-y-2 mt-2">
                          {completedShifts.map(s => (
                            <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg">
                              <div className="flex-1 text-sm min-w-0">
                                <div className="font-medium break-words flex items-center gap-2">
                                  {s.days} дн. • {s.reason}
                                  <Badge variant="default" className="text-xs">Выполнено</Badge>
                                </div>
                                <div className="text-xs text-muted-foreground break-all">
                                  {formatDate(s.assignedAt)} • Отработано: {s.completedDays}/{s.days}
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                {canDelete && (
                                  <Button variant="ghost" size="icon" onClick={() => onDelete(s.id)}>
                                    <Icon name="Trash2" size={16} className="text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
