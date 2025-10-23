import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { User } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

interface CleanlinessScore {
  date: string;
  room: string;
  score: 2 | 3 | 4 | 5;
  inspector: string;
}

interface CleanlinessData {
  [floor: string]: {
    [date: string]: {
      [room: string]: CleanlinessScore;
    };
  };
}

interface CleanlinesPanelProps {
  currentUser: User;
  users: User[];
}

const STORAGE_KEY = 'cleanliness_data';
const DATES_COUNT = 7;

const getFloorFromRoom = (room: string): number => {
  return parseInt(room[0]);
};

const getRoomsByFloor = (floor: number): string[] => {
  const rooms: string[] = [];
  for (let i = 1; i <= 20; i++) {
    rooms.push(`${floor}${i.toString().padStart(2, '0')}`);
  }
  return rooms;
};

const getLast7Days = (): string[] => {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

export const CleanlinessPanel = ({ currentUser, users }: CleanlinesPanelProps) => {
  const [data, setData] = useState<CleanlinessData>({});
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const { toast } = useToast();

  const userFloor = currentUser.room ? getFloorFromRoom(currentUser.room) : null;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setData(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (userFloor) {
      setSelectedFloor(userFloor);
    }
  }, [userFloor]);

  const saveData = (newData: CleanlinessData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const canEditFloor = (floor: number): boolean => {
    if (!currentUser.positions) return false;

    const isFloorHead = currentUser.positions.includes(`floor_${floor}_head` as any);
    const isFloorCleanliness = currentUser.positions.includes(`floor_${floor}_cleanliness` as any);
    const isManager = ['manager', 'admin', 'chairman', 'vice_chairman'].includes(currentUser.role);

    return isFloorHead || isFloorCleanliness || isManager;
  };

  const canViewAllFloors = (): boolean => {
    return ['manager', 'admin', 'chairman', 'vice_chairman'].includes(currentUser.role);
  };

  const handleScoreChange = (floor: number, date: string, room: string, score: string) => {
    const newData = { ...data };
    
    if (!newData[floor]) {
      newData[floor] = {};
    }
    if (!newData[floor][date]) {
      newData[floor][date] = {};
    }

    const scoreNum = parseInt(score) as 2 | 3 | 4 | 5;
    
    newData[floor][date][room] = {
      date,
      room,
      score: scoreNum,
      inspector: currentUser.name,
    };

    saveData(newData);

    toast({
      title: 'Оценка сохранена',
      description: `Комната ${room}: ${score} балла`,
    });
  };

  const getScore = (floor: number, date: string, room: string): CleanlinessScore | undefined => {
    return data[floor]?.[date]?.[room];
  };

  const getScoreColor = (score: number): string => {
    if (score === 5) return 'bg-green-100 text-green-800 border-green-300';
    if (score === 4) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const dates = getLast7Days();
  const availableFloors = canViewAllFloors() 
    ? [2, 3, 4, 5] 
    : userFloor ? [userFloor] : [];

  const currentFloor = selectedFloor || userFloor || 2;
  const rooms = getRoomsByFloor(currentFloor);
  const canEdit = canEditFloor(currentFloor);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold mb-1">Оценка чистоты комнат</h3>
          <p className="text-sm text-muted-foreground">
            Таблица проверок чистоты комнат по этажам (оценка от 2 до 5 баллов)
          </p>
        </div>
        {canViewAllFloors() && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Этаж:</span>
            <Select 
              value={currentFloor.toString()} 
              onValueChange={(v) => setSelectedFloor(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableFloors.map(floor => (
                  <SelectItem key={floor} value={floor.toString()}>
                    {floor} этаж
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {!canViewAllFloors() && userFloor && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Icon name="Info" size={18} className="text-blue-600" />
              <p className="text-sm text-blue-900">
                {canEdit 
                  ? `Вы можете редактировать оценки для ${currentFloor} этажа`
                  : `Вы видите оценки для своего этажа (${currentFloor} этаж) в режиме просмотра`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-3 text-left font-semibold min-w-[100px] sticky left-0 bg-muted/50 z-10">
                    Комната
                  </th>
                  {dates.map(date => (
                    <th key={date} className="border p-3 text-center font-semibold min-w-[120px]">
                      <div className="flex flex-col gap-1">
                        <span>{formatDate(date)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room} className="hover:bg-muted/30 transition-colors">
                    <td className="border p-3 font-medium sticky left-0 bg-background z-10">
                      {room}
                    </td>
                    {dates.map(date => {
                      const scoreData = getScore(currentFloor, date, room);
                      return (
                        <td key={date} className="border p-2">
                          {canEdit ? (
                            <Select 
                              value={scoreData?.score?.toString() || ''} 
                              onValueChange={(v) => handleScoreChange(currentFloor, date, room, v)}
                            >
                              <SelectTrigger className={`w-full h-16 ${scoreData ? getScoreColor(scoreData.score) : ''}`}>
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 - Отлично</SelectItem>
                                <SelectItem value="4">4 - Хорошо</SelectItem>
                                <SelectItem value="3">3 - Удовл.</SelectItem>
                                <SelectItem value="2">2 - Плохо</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className={`h-16 flex items-center justify-center rounded-md border ${
                              scoreData ? getScoreColor(scoreData.score) : 'bg-gray-50'
                            }`}>
                              {scoreData ? (
                                <div className="text-center">
                                  <div className="text-2xl font-bold">{scoreData.score}</div>
                                  <div className="text-xs mt-1">{scoreData.inspector.split(' ')[0]}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon name="Info" size={18} />
            Система оценок
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-green-100 border-2 border-green-300 flex items-center justify-center font-bold text-green-800">
                5
              </div>
              <span className="text-sm">Отлично</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-100 border-2 border-blue-300 flex items-center justify-center font-bold text-blue-800">
                4
              </div>
              <span className="text-sm">Хорошо</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-yellow-100 border-2 border-yellow-300 flex items-center justify-center font-bold text-yellow-800">
                3
              </div>
              <span className="text-sm">Удовлетворительно</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-red-100 border-2 border-red-300 flex items-center justify-center font-bold text-red-800">
                2
              </div>
              <span className="text-sm">Плохо</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
