import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { CleanlinessSettings } from './types';
import { getRoomScores } from './utils';

interface CleanlinessStatsProps {
  statsRoom: string;
  onStatsRoomChange: (room: string) => void;
  statsPeriod: 'week' | 'month' | 'all';
  onStatsPeriodChange: (period: 'week' | 'month' | 'all') => void;
  settings: CleanlinessSettings;
}

const getScoreColor = (score: number): string => {
  if (score === 5) return 'bg-green-100 text-green-800 border-green-300';
  if (score === 4) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (score === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  return 'bg-red-100 text-red-800 border-red-300';
};

export const CleanlinessStats = ({
  statsRoom,
  onStatsRoomChange,
  statsPeriod,
  onStatsPeriodChange,
  settings,
}: CleanlinessStatsProps) => {
  const allRooms = Object.values(settings.rooms).flat().sort();
  const roomScores = statsRoom ? getRoomScores(statsRoom, statsPeriod) : [];
  
  const avgScore = roomScores.length > 0 
    ? Math.round((roomScores.reduce((sum, s) => sum + s.score, 0) / roomScores.length) * 10) / 10
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon name="BarChart3" size={20} />
          Статистика по комнате
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Комната</label>
            <Select value={statsRoom} onValueChange={onStatsRoomChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите комнату" />
              </SelectTrigger>
              <SelectContent>
                {allRooms.map((room) => (
                  <SelectItem key={room} value={room}>
                    {room}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Период</label>
            <Select value={statsPeriod} onValueChange={(v) => onStatsPeriodChange(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="all">Всё время</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {statsRoom && roomScores.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Средний балл</p>
              <Badge className={`text-lg px-3 py-1 ${getScoreColor(Math.round(avgScore || 0))}`}>
                {avgScore} / 5
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-2">История ({roomScores.length} оценок)</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {roomScores.slice().reverse().map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
                    <span className="text-muted-foreground">{entry.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{entry.inspector}</span>
                      <Badge className={`${getScoreColor(entry.score)} px-2 py-0.5`}>
                        {entry.score}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {statsRoom && roomScores.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Icon name="BarChart3" size={48} className="mx-auto mb-4 opacity-20" />
            <p>Нет данных за выбранный период</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
