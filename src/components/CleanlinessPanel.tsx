import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

type ViewMode = 'week' | 'month';

const STORAGE_KEY = 'cleanliness_data';

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

const getWeekDates = (weekOffset: number = 0): string[] => {
  const dates: string[] = [];
  const today = new Date();
  today.setDate(today.getDate() + (weekOffset * 7));
  
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

const getMonthDates = (monthOffset: number = 0): string[] => {
  const dates: string[] = [];
  const today = new Date();
  const targetDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('ru-RU', { month: 'short' });
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' });
  return `${day} ${month}\n${weekday}`;
};

const getPeriodLabel = (dates: string[], viewMode: ViewMode): string => {
  if (dates.length === 0) return '';
  
  const firstDate = new Date(dates[0]);
  const lastDate = new Date(dates[dates.length - 1]);
  
  if (viewMode === 'week') {
    const firstDay = firstDate.getDate();
    const lastDay = lastDate.getDate();
    const month = firstDate.toLocaleDateString('ru-RU', { month: 'long' });
    const year = firstDate.getFullYear();
    
    if (firstDate.getMonth() === lastDate.getMonth()) {
      return `${firstDay}-${lastDay} ${month} ${year}`;
    } else {
      const firstMonth = firstDate.toLocaleDateString('ru-RU', { month: 'short' });
      const lastMonth = lastDate.toLocaleDateString('ru-RU', { month: 'short' });
      return `${firstDay} ${firstMonth} - ${lastDay} ${lastMonth} ${year}`;
    }
  } else {
    const month = firstDate.toLocaleDateString('ru-RU', { month: 'long' });
    const year = firstDate.getFullYear();
    return `${month} ${year}`;
  }
};

export const CleanlinessPanel = ({ currentUser, users }: CleanlinesPanelProps) => {
  const [data, setData] = useState<CleanlinessData>({});
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [editMode, setEditMode] = useState(false);
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

  const canEditAnyFloor = (): boolean => {
    return ['manager', 'admin', 'chairman', 'vice_chairman'].includes(currentUser.role);
  };

  const canEditFloor = (floor: number): boolean => {
    if (canEditAnyFloor()) return true;
    if (!currentUser.positions) return false;

    const isFloorHead = currentUser.positions.includes(`floor_${floor}_head` as any);
    const isFloorCleanliness = currentUser.positions.includes(`floor_${floor}_cleanliness` as any);

    return isFloorHead || isFloorCleanliness;
  };

  const canViewAllFloors = (): boolean => {
    return canEditAnyFloor();
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

  const dates = viewMode === 'week' ? getWeekDates(periodOffset) : getMonthDates(periodOffset);
  const availableFloors = canViewAllFloors() 
    ? [2, 3, 4, 5] 
    : userFloor ? [userFloor] : [];

  const currentFloor = selectedFloor || userFloor || 2;
  const rooms = getRoomsByFloor(currentFloor);
  const canEdit = canEditFloor(currentFloor);
  const showEditButton = canEdit && !editMode;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Оценка чистоты комнат</h3>
          <p className="text-sm text-muted-foreground">
            Таблица проверок чистоты комнат по этажам
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canViewAllFloors() && (
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
          )}
          {showEditButton && (
            <Button onClick={() => setEditMode(true)} className="gap-2">
              <Icon name="Edit" size={16} />
              Редактировать
            </Button>
          )}
          {editMode && (
            <Button onClick={() => setEditMode(false)} variant="outline" className="gap-2">
              <Icon name="Check" size={16} />
              Готово
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={viewMode} onValueChange={(v) => {
          setViewMode(v as ViewMode);
          setPeriodOffset(0);
        }}>
          <TabsList>
            <TabsTrigger value="week">Неделя</TabsTrigger>
            <TabsTrigger value="month">Месяц</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setPeriodOffset(periodOffset - 1)}
          >
            <Icon name="ChevronLeft" size={18} />
          </Button>
          <div className="text-sm font-medium min-w-[200px] text-center">
            {getPeriodLabel(dates, viewMode)}
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setPeriodOffset(periodOffset + 1)}
            disabled={periodOffset >= 0}
          >
            <Icon name="ChevronRight" size={18} />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border p-2 text-left font-semibold min-w-[70px] sticky left-0 bg-muted/50 z-10">
                    Комната
                  </th>
                  {dates.map(date => (
                    <th key={date} className="border p-2 text-center font-semibold min-w-[80px]">
                      <div className="whitespace-pre-line text-xs leading-tight">
                        {formatDate(date)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room} className="hover:bg-muted/30 transition-colors">
                    <td className="border p-2 font-medium sticky left-0 bg-background z-10 text-center">
                      {room}
                    </td>
                    {dates.map(date => {
                      const scoreData = getScore(currentFloor, date, room);
                      return (
                        <td key={date} className="border p-1">
                          {editMode ? (
                            <Select 
                              value={scoreData?.score?.toString() || ''} 
                              onValueChange={(v) => handleScoreChange(currentFloor, date, room, v)}
                            >
                              <SelectTrigger className={`w-full h-12 text-xs ${scoreData ? getScoreColor(scoreData.score) : ''}`}>
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className={`h-12 flex items-center justify-center rounded border ${
                              scoreData ? getScoreColor(scoreData.score) : 'bg-gray-50'
                            }`}>
                              {scoreData ? (
                                <div className="text-center">
                                  <div className="text-lg font-bold">{scoreData.score}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
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
