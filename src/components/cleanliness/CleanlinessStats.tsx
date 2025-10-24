import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { CleanlinessSettings } from './types';
import { getRoomScores, getCleanlinessData, calculateAverageScore, formatDate } from './utils';

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

const getDailyAverages = (date: string): { floor: number; avgScore: number; rooms: string[] }[] => {
  const data = getCleanlinessData();
  const results: { floor: number; avgScore: number; rooms: string[] }[] = [];
  
  Object.entries(data).forEach(([floorStr, floorData]) => {
    const floor = parseInt(floorStr);
    const dateData = floorData[date];
    
    if (dateData) {
      const scores = Object.values(dateData).map(s => s.score);
      const rooms = Object.keys(dateData);
      
      if (scores.length > 0) {
        const avgScore = Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
        results.push({ floor, avgScore, rooms });
      }
    }
  });
  
  return results.sort((a, b) => a.floor - b.floor);
};

const getRoomAverages = (period: 'week' | 'month' | 'all', floor?: number): { room: string; avgScore: number; count: number }[] => {
  const data = getCleanlinessData();
  const roomStats: Record<string, { sum: number; count: number }> = {};
  
  const now = new Date();
  
  Object.entries(data).forEach(([floorStr, floorData]) => {
    if (floor && parseInt(floorStr) !== floor) return;
    
    Object.entries(floorData).forEach(([date, rooms]) => {
      const scoreDate = new Date(date);
      const daysDiff = Math.floor((now.getTime() - scoreDate.getTime()) / (1000 * 60 * 60 * 24));
      
      let include = false;
      if (period === 'week' && daysDiff <= 7) include = true;
      if (period === 'month' && daysDiff <= 30) include = true;
      if (period === 'all') include = true;
      
      if (include) {
        Object.entries(rooms).forEach(([room, scoreData]) => {
          if (!roomStats[room]) {
            roomStats[room] = { sum: 0, count: 0 };
          }
          roomStats[room].sum += scoreData.score;
          roomStats[room].count += 1;
        });
      }
    });
  });
  
  return Object.entries(roomStats)
    .map(([room, stats]) => ({
      room,
      avgScore: Math.round((stats.sum / stats.count) * 10) / 10,
      count: stats.count,
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
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

  const today = new Date().toISOString().split('T')[0];
  const dailyAverages = getDailyAverages(today);
  const roomAverages = getRoomAverages(statsPeriod);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon name="BarChart3" size={20} />
          Статистика
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="daily">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">За сегодня</TabsTrigger>
            <TabsTrigger value="period">За период</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">Средний балл по этажам за сегодня</p>
              {dailyAverages.length > 0 ? (
                <div className="space-y-2">
                  {dailyAverages.map(({ floor, avgScore, rooms }) => (
                    <div key={floor} className="flex items-center justify-between p-3 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{floor} этаж</span>
                        <span className="text-xs text-muted-foreground">({rooms.length} комнат)</span>
                      </div>
                      <Badge className={`${getScoreColor(Math.round(avgScore))} px-3 py-1`}>
                        {avgScore}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="BarChart3" size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Нет данных за сегодня</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="period" className="space-y-4">
            <div className="flex flex-col gap-4">
              <div>
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

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">Средний балл по комнатам</p>
              {roomAverages.length > 0 ? (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {roomAverages.map(({ room, avgScore, count }) => (
                    <div key={room} className="flex items-center justify-between p-3 rounded bg-muted/30">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{room}</span>
                        <span className="text-xs text-muted-foreground">({count} оценок)</span>
                      </div>
                      <Badge className={`${getScoreColor(Math.round(avgScore))} px-3 py-1`}>
                        {avgScore}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Icon name="BarChart3" size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Нет данных за выбранный период</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
