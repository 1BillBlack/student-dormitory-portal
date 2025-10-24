import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ChangeRoomDialog } from '@/components/ChangeRoomDialog';
import { getPositionName, sortPositionsByRank } from '@/utils/positions';
import { UserPosition } from '@/types/auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTodayRoomScore, getRoomScores } from '@/components/CleanlinessPanel';

interface ProfileTabProps {
  userName: string;
  userEmail: string;
  userRole: string;
  userRoom?: string;
  userGroup?: string;
  userPositions?: UserPosition[];
  onChangeRoom: (room: string) => void;
  statsPeriod: 'week' | 'month' | 'all';
  onStatsPeriodChange: (period: 'week' | 'month' | 'all') => void;
}

const getRoleName = (role: string) => {
  const roles = {
    manager: 'Менеджер',
    admin: 'Администратор',
    moderator: 'Модератор',
    member: 'Участник',
  };
  return roles[role as keyof typeof roles] || role;
};

const getScoreColor = (score: number): string => {
  if (score === 5) return 'bg-green-100 text-green-800 border-green-300';
  if (score === 4) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (score === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-red-100 text-red-800 border-red-300';
};

export const ProfileTab = ({
  userName,
  userEmail,
  userRole,
  userRoom,
  userGroup,
  userPositions = [],
  onChangeRoom,
  statsPeriod,
  onStatsPeriodChange,
}: ProfileTabProps) => {
  const displayRoom = userRoom || '';
  const todayScore = displayRoom ? getTodayRoomScore(displayRoom) : undefined;
  const roomScores = displayRoom ? getRoomScores(displayRoom, statsPeriod) : [];
  
  const avgScore = roomScores.length > 0 
    ? Math.round((roomScores.reduce((sum, s) => sum + s.score, 0) / roomScores.length) * 10) / 10
    : null;

  const sortedPositions = [...userPositions].sort(sortPositionsByRank);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Icon name="User" size={20} />
            Личная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Имя</p>
            <p className="font-medium text-sm sm:text-base break-words">{userName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="font-medium text-sm sm:text-base break-all">{userEmail}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Роль</p>
            <Badge variant="outline" className="text-xs sm:text-sm">{getRoleName(userRole)}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Комната</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <span className="font-medium text-sm sm:text-base">{userRoom || 'Не указана'}</span>
              <ChangeRoomDialog 
                currentRoom={userRoom}
                onChangeRoom={onChangeRoom}
              />
            </div>
          </div>
          {userGroup && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Группа</p>
              <p className="font-medium text-sm sm:text-base">{userGroup}</p>
            </div>
          )}
          {sortedPositions.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Должности</p>
              <div className="flex flex-wrap gap-2">
                {sortedPositions.map((position) => (
                  <Badge key={position} variant="secondary" className="text-xs sm:text-sm">
                    {getPositionName(position)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {displayRoom && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Icon name="BarChart3" size={20} />
                Статистика чистоты
              </CardTitle>
              <Select value={statsPeriod} onValueChange={(v) => onStatsPeriodChange(v as any)}>
                <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Неделя</SelectItem>
                  <SelectItem value="month">Месяц</SelectItem>
                  <SelectItem value="all">Всё время</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayScore !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Оценка сегодня</p>
                <Badge className={`text-lg px-3 py-1 ${getScoreColor(todayScore)}`}>
                  {todayScore} / 5
                </Badge>
              </div>
            )}
            
            {avgScore !== null && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Средний балл</p>
                <Badge className={`text-lg px-3 py-1 ${getScoreColor(Math.round(avgScore))}`}>
                  {avgScore} / 5
                </Badge>
              </div>
            )}
            
            {roomScores.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">История оценок</p>
                <div className="space-y-2">
                  {roomScores.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{entry.date}</span>
                      <Badge className={`${getScoreColor(entry.score)} px-2 py-0.5 text-xs`}>
                        {entry.score}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
