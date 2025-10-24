import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { WorkShift } from '@/contexts/WorkShiftsContext';
import { User } from '@/types/auth';

interface WorkShiftsArchiveProps {
  archivedShifts: WorkShift[];
  users: User[];
  currentUserId: string;
  canViewAll: boolean;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

export const WorkShiftsArchive = ({ archivedShifts, users, currentUserId, canViewAll }: WorkShiftsArchiveProps) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'reason'>('date');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const toggleUser = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const userShiftsMap = new Map<string, WorkShift[]>();
  archivedShifts.forEach(shift => {
    if (!userShiftsMap.has(shift.userId)) {
      userShiftsMap.set(shift.userId, []);
    }
    userShiftsMap.get(shift.userId)!.push(shift);
  });

  const usersWithArchive = Array.from(userShiftsMap.keys())
    .map(userId => {
      const user = users.find(u => u.id === userId);
      const shifts = userShiftsMap.get(userId) || [];
      return { userId, user, shifts };
    })
    .filter(({ user, userId }) => {
      if (!canViewAll && userId !== currentUserId) return false;
      if (!user) return false;
      
      const matchesSearch = 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        (user.room && user.room.includes(search)) ||
        (user.group && user.group.toLowerCase().includes(search.toLowerCase()));
      
      return matchesSearch;
    })
    .map(({ userId, user, shifts }) => {
      const sortedShifts = [...shifts].sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.archivedAt || b.assignedAt).getTime() - new Date(a.archivedAt || a.assignedAt).getTime();
        }
        return a.reason.localeCompare(b.reason);
      });
      
      return { userId, user, shifts: sortedShifts };
    });

  if (usersWithArchive.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icon name="Archive" size={48} className="mx-auto mb-4 opacity-50" />
        <p>Архив пуст</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder="Поиск по имени, комнате, группе..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">По дате</SelectItem>
            <SelectItem value="reason">По причине</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {usersWithArchive.map(({ userId, user, shifts }) => {
          if (!user) return null;
          const isExpanded = expandedUsers.has(userId);
          const totalCompleted = shifts.reduce((sum, s) => sum + s.completedDays, 0);

          return (
            <Card key={userId}>
              <CardHeader className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base break-words">{user.name}</CardTitle>
                    <CardDescription className="break-all">
                      {user.room && `Комната ${user.room}`}
                      {user.group && ` • Группа ${user.group}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-nowrap">
                      Отработано: {totalCompleted} дн.
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleUser(userId)}
                    >
                      <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={20} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {shifts.map(shift => (
                      <div key={shift.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                          <div className="font-medium">{shift.days} дн. • {shift.reason}</div>
                          <Badge variant="default">Выполнено</Badge>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>Назначено: {formatDate(shift.assignedAt)} ({shift.assignedByName})</div>
                          {shift.completedAt && (
                            <div>Завершено: {formatDate(shift.completedAt)} ({shift.completedByName})</div>
                          )}
                          {shift.archivedAt && (
                            <div>Архивировано: {formatDate(shift.archivedAt)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
