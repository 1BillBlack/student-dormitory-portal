import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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

interface RoomsList {
  [floor: string]: string[];
}

interface WorkingDays {
  [date: string]: boolean;
}

interface ClosedRooms {
  [date: string]: string[];
}

interface ClosedFloors {
  [date: string]: number[];
}

interface CleanlinessSettings {
  rooms: RoomsList;
  workingDays: WorkingDays;
  closedRooms: ClosedRooms;
  closedFloors: ClosedFloors;
  defaultNonWorkingDays: number[];
}

interface CleanlinesPanelProps {
  currentUser: User;
  users: User[];
}

type ViewMode = 'week' | 'month';

const STORAGE_KEY = 'cleanliness_data';
const SETTINGS_KEY = 'cleanliness_settings';

export const getCleanlinessData = (): CleanlinessData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

export const getTodayRoomScore = (room: string): CleanlinessScore | undefined => {
  const data = getCleanlinessData();
  const today = new Date().toISOString().split('T')[0];
  const floor = Math.floor(parseInt(room) / 100);
  return data[floor]?.[today]?.[room];
};

export const getRoomScores = (room: string, period: 'week' | 'month' | 'all'): CleanlinessScore[] => {
  const data = getCleanlinessData();
  const floor = Math.floor(parseInt(room) / 100);
  const floorData = data[floor];
  
  if (!floorData) return [];
  
  const now = new Date();
  const scores: CleanlinessScore[] = [];
  
  Object.entries(floorData).forEach(([date, rooms]) => {
    const scoreDate = new Date(date);
    const daysDiff = Math.floor((now.getTime() - scoreDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let include = false;
    if (period === 'week' && daysDiff <= 7) include = true;
    if (period === 'month' && daysDiff <= 30) include = true;
    if (period === 'all') include = true;
    
    if (include && rooms[room]) {
      scores.push(rooms[room]);
    }
  });
  
  return scores.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const getFloorFromRoom = (room: string): number => {
  return parseInt(room[0]);
};

const getDefaultRooms = (floor: number): string[] => {
  const rooms: string[] = [];
  for (let i = 1; i <= 20; i++) {
    rooms.push(`${floor}${i.toString().padStart(2, '0')}`);
  }
  return rooms;
};

const getWeekDates = (weekOffset: number = 0): string[] => {
  const dates: string[] = [];
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  
  let dayOfWeek = now.getDay();
  if (dayOfWeek === 0) dayOfWeek = 7;
  
  const daysFromMonday = dayOfWeek - 1;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday + (weekOffset * 7));
  monday.setHours(12, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const date = String(day.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${date}`);
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
    date.setHours(12, 0, 0, 0);
    const yearStr = date.getFullYear();
    const monthStr = String(date.getMonth() + 1).padStart(2, '0');
    const dayStr = String(date.getDate()).padStart(2, '0');
    dates.push(`${yearStr}-${monthStr}-${dayStr}`);
  }
  return dates;
};

const formatDateHeader = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayNum = date.getDate();
  const monthStr = date.toLocaleDateString('ru-RU', { month: 'short' });
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' });
  return `${dayNum} ${monthStr}\n${weekday}`;
};

const getPeriodLabel = (dates: string[], viewMode: ViewMode): string => {
  if (dates.length === 0) return '';
  
  const firstDate = new Date(dates[0]);
  const lastDate = new Date(dates[dates.length - 1]);
  
  if (viewMode === 'week') {
    const firstDay = firstDate.getDate();
    const lastDay = lastDate.getDate();
    const year = firstDate.getFullYear();
    
    if (firstDate.getMonth() === lastDate.getMonth()) {
      const month = firstDate.toLocaleDateString('ru-RU', { month: 'long' });
      return `${firstDay}-${lastDay} ${month} ${year}`;
    } else {
      const firstMonth = firstDate.toLocaleDateString('ru-RU', { month: 'short' });
      const lastMonth = lastDate.toLocaleDateString('ru-RU', { month: 'short' });
      return `${firstDay} ${firstMonth} - ${lastDay} ${lastMonth} ${year}`;
    }
  } else {
    const targetDate = new Date(dates[Math.floor(dates.length / 2)]);
    const month = targetDate.toLocaleDateString('ru-RU', { month: 'long' });
    const year = targetDate.getFullYear();
    return `${month} ${year}`;
  }
};

const isWorkingDay = (date: string, settings: CleanlinessSettings): boolean => {
  if (settings.workingDays[date] !== undefined) {
    return settings.workingDays[date];
  }
  
  let dayOfWeek = new Date(date).getDay();
  dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
  return !settings.defaultNonWorkingDays.includes(dayOfWeek);
};

export const CleanlinessPanel = ({ currentUser, users }: CleanlinesPanelProps) => {
  const [data, setData] = useState<CleanlinessData>({});
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [roomsDialogOpen, setRoomsDialogOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [deleteScoreDialog, setDeleteScoreDialog] = useState<{floor: number, date: string, room: string} | null>(null);
  const [statsRoom, setStatsRoom] = useState<string>('');
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { toast } = useToast();

  const [settings, setSettings] = useState<CleanlinessSettings>({
    rooms: {
      '2': getDefaultRooms(2),
      '3': getDefaultRooms(3),
      '4': getDefaultRooms(4),
      '5': getDefaultRooms(5),
    },
    workingDays: {},
    closedRooms: {},
    closedFloors: {},
    defaultNonWorkingDays: [5, 6, 7],
  });

  const canEditAnyFloor = (): boolean => {
    // Проверяем роль
    if (['manager', 'admin', 'moderator'].includes(currentUser.role)) return true;
    
    // Проверяем должности
    if (!currentUser.positions) return false;
    
    return currentUser.positions.some(p => 
      p === 'director' || p === 'vice_director' || p === 'cleanliness_manager' || p === 'chairman' || p === 'vice_chairman'
    );
  };

  const canViewAllFloors = (): boolean => {
    return canEditAnyFloor();
  };

  const getUserFloorFromPosition = (): number | null => {
    if (!currentUser.positions || currentUser.positions.length === 0) return null;
    
    for (const position of currentUser.positions) {
      if (position.startsWith('floor_')) {
        const match = position.match(/floor_(\d)_/);
        if (match) {
          return parseInt(match[1]);
        }
      }
    }
    return null;
  };

  const userFloor = currentUser.room 
    ? getFloorFromRoom(currentUser.room) 
    : getUserFloorFromPosition();

  const getUserFloors = (): number[] => {
    if (canViewAllFloors()) return [2, 3, 4, 5];
    
    const floors: number[] = [];
    const validFloors = [2, 3, 4, 5];
    
    if (!currentUser.positions) {
      // Если нет должностей, но есть комната — показываем этаж комнаты (только если валидный)
      return userFloor && validFloors.includes(userFloor) ? [userFloor] : [];
    }
    
    currentUser.positions.forEach(position => {
      if (position.startsWith('floor_')) {
        const match = position.match(/floor_(\d)_/);
        if (match) {
          const floor = parseInt(match[1]);
          if (validFloors.includes(floor) && !floors.includes(floor)) {
            floors.push(floor);
          }
        }
      }
    });
    
    // Добавляем этаж комнаты, если его нет в списке (только если валидный)
    if (userFloor && validFloors.includes(userFloor) && !floors.includes(userFloor)) {
      floors.push(userFloor);
    }
    
    return floors.sort();
  };

  const userFloors = getUserFloors();
  const availableFloors = userFloors;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setData(JSON.parse(stored));
    }
    
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      const loadedSettings = JSON.parse(storedSettings);
      setSettings({
        rooms: loadedSettings.rooms || {
          '2': getDefaultRooms(2),
          '3': getDefaultRooms(3),
          '4': getDefaultRooms(4),
          '5': getDefaultRooms(5),
        },
        workingDays: loadedSettings.workingDays || {},
        closedRooms: loadedSettings.closedRooms || {},
        closedFloors: loadedSettings.closedFloors || {},
        defaultNonWorkingDays: loadedSettings.defaultNonWorkingDays || [5, 6, 7],
      });
    }
  }, []);

  useEffect(() => {
    if (!canViewAllFloors() && availableFloors.length > 0 && !selectedFloor) {
      setSelectedFloor(availableFloors[0]);
    }
  }, [availableFloors, selectedFloor]);

  const saveData = (newData: CleanlinessData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const saveSettings = (newSettings: CleanlinessSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const canManageSettings = (): boolean => {
    return ['manager', 'admin', 'moderator'].includes(currentUser.role);
  };

  const canCloseFloors = (): boolean => {
    return ['manager', 'admin', 'moderator'].includes(currentUser.role);
  };

  const canEditFloor = (floor: number): boolean => {
    if (canEditAnyFloor()) return true;
    if (!currentUser.positions) return false;

    const isFloorHead = currentUser.positions.includes(`floor_${floor}_head` as any);
    const isFloorCleanliness = currentUser.positions.includes(`floor_${floor}_cleanliness` as any);

    return isFloorHead || isFloorCleanliness;
  };

  const canEditCell = (floor: number, date: string, room: string): boolean => {
    // Администраторы могут редактировать всё
    if (canEditAnyFloor()) return true;
    
    // Проверяем права на этаж
    if (!canEditFloor(floor)) return false;
    
    const scoreData = getScore(floor, date, room);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Если оценка уже выставлена
    if (scoreData) {
      // Можно редактировать только сегодняшние оценки
      return date === today;
    }
    
    // Если оценки нет (прочерк)
    // Можно выставить только за вчера или сегодня
    return date === today || date === yesterday;
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

  const confirmScoreDelete = () => {
    if (!deleteScoreDialog) return;
    
    const { floor, date, room } = deleteScoreDialog;
    const newData = { ...data };
    
    if (newData[floor]?.[date]?.[room]) {
      delete newData[floor][date][room];
      
      if (Object.keys(newData[floor][date]).length === 0) {
        delete newData[floor][date];
      }
      if (Object.keys(newData[floor]).length === 0) {
        delete newData[floor];
      }
      
      saveData(newData);
      
      toast({
        title: 'Оценка удалена',
        description: `Комната ${room}`,
      });
    }
    
    setDeleteScoreDialog(null);
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

  const getAverageScore = (floor: number, room: string, dates: string[]): number | null => {
    const scores = dates
      .filter(date => isWorkingDay(date, settings))
      .map(date => getScore(floor, date, room))
      .filter(score => score !== undefined)
      .map(score => score!.score);
    
    if (scores.length === 0) return null;
    
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / scores.length) * 10) / 10;
  };

  const addRoom = () => {
    if (!selectedFloor || !newRoomNumber) return;
    
    const roomId = `${selectedFloor}${newRoomNumber.padStart(2, '0')}`;
    const newSettings = { ...settings };
    
    if (!newSettings.rooms[selectedFloor]) {
      newSettings.rooms[selectedFloor] = [];
    }
    
    if (!newSettings.rooms[selectedFloor].includes(roomId)) {
      newSettings.rooms[selectedFloor].push(roomId);
      newSettings.rooms[selectedFloor].sort();
      saveSettings(newSettings);
      toast({
        title: 'Комната добавлена',
        description: `Комната ${roomId} добавлена в список`,
      });
      setNewRoomNumber('');
    } else {
      toast({
        title: 'Ошибка',
        description: 'Такая комната уже есть в списке',
        variant: 'destructive',
      });
    }
  };

  const removeRoom = (floor: number, room: string) => {
    const newSettings = { ...settings };
    newSettings.rooms[floor] = newSettings.rooms[floor].filter(r => r !== room);
    saveSettings(newSettings);
    toast({
      title: 'Комната удалена',
      description: `Комната ${room} удалена из списка`,
    });
  };

  const toggleDayWorkingStatus = (date: string) => {
    const newSettings = { ...settings };
    const currentStatus = isWorkingDay(date, settings);
    newSettings.workingDays[date] = !currentStatus;
    saveSettings(newSettings);
    
    toast({
      title: currentStatus ? 'День закрыт' : 'День открыт',
      description: `${date} ${currentStatus ? 'закрыт для проверок' : 'открыт для проверок'}`,
    });
  };

  const toggleRoomClosed = (date: string, room: string) => {
    const newSettings = { ...settings };
    
    if (!newSettings.closedRooms[date]) {
      newSettings.closedRooms[date] = [];
    }
    
    const isCurrentlyClosed = newSettings.closedRooms[date].includes(room);
    
    if (isCurrentlyClosed) {
      newSettings.closedRooms[date] = newSettings.closedRooms[date].filter(r => r !== room);
      if (newSettings.closedRooms[date].length === 0) {
        delete newSettings.closedRooms[date];
      }
    } else {
      newSettings.closedRooms[date].push(room);
    }
    
    saveSettings(newSettings);
    
    toast({
      title: isCurrentlyClosed ? 'Комната открыта' : 'Комната закрыта',
      description: `Комната ${room} ${isCurrentlyClosed ? 'открыта' : 'закрыта'} для проверки ${date}`,
    });
  };

  const isRoomClosed = (date: string, room: string): boolean => {
    const floor = getFloorFromRoom(room);
    const floorClosed = settings.closedFloors[date]?.includes(floor) || false;
    return floorClosed || settings.closedRooms[date]?.includes(room) || false;
  };

  const toggleFloorClosed = (date: string, floor: number) => {
    const newSettings = { ...settings };
    
    if (!newSettings.closedFloors[date]) {
      newSettings.closedFloors[date] = [];
    }
    
    const isCurrentlyClosed = newSettings.closedFloors[date].includes(floor);
    
    if (isCurrentlyClosed) {
      newSettings.closedFloors[date] = newSettings.closedFloors[date].filter(f => f !== floor);
      if (newSettings.closedFloors[date].length === 0) {
        delete newSettings.closedFloors[date];
      }
    } else {
      newSettings.closedFloors[date].push(floor);
    }
    
    saveSettings(newSettings);
    
    toast({
      title: isCurrentlyClosed ? 'Этаж открыт' : 'Этаж закрыт',
      description: `${floor} этаж ${isCurrentlyClosed ? 'открыт' : 'закрыт'} для проверки ${date}`,
    });
  };

  const isFloorClosed = (date: string, floor: number): boolean => {
    return settings.closedFloors[date]?.includes(floor) || false;
  };

  const dates = viewMode === 'week' ? getWeekDates(periodOffset) : getMonthDates(periodOffset);
  const workingDates = dates.filter(date => isWorkingDay(date, settings));

  const rooms = selectedFloor ? (settings.rooms[selectedFloor] || getDefaultRooms(selectedFloor)) : [];
  const canEdit = selectedFloor ? canEditFloor(selectedFloor) : false;
  const showEditButton = canEdit && !editMode;

  const canViewOtherStats = canEditAnyFloor();
  const displayStatsRoom = statsRoom || '';
  const statsRoomScores = displayStatsRoom ? getRoomScores(displayStatsRoom, statsPeriod) : [];
  const todayStatsScore = displayStatsRoom ? getTodayRoomScore(displayStatsRoom) : undefined;
  const avgStatsScore = statsRoomScores.length > 0 
    ? Math.round((statsRoomScores.reduce((sum, s) => sum + s.score, 0) / statsRoomScores.length) * 10) / 10
    : null;

  return (
    <div className="space-y-4">
      {canViewOtherStats && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Icon name="Sparkles" size={20} />
              Статистика комнаты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Номер комнаты (например, 305)"
                value={statsRoom}
                onChange={(e) => setStatsRoom(e.target.value)}
                className="max-w-[200px]"
              />
              {statsRoom && (
                <Button variant="ghost" size="sm" onClick={() => setStatsRoom('')}>
                  Сбросить
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={statsPeriod === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatsPeriod('week')}
              >
                Неделя
              </Button>
              <Button
                variant={statsPeriod === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatsPeriod('month')}
              >
                Месяц
              </Button>
              <Button
                variant={statsPeriod === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatsPeriod('all')}
              >
                Всё время
              </Button>
            </div>

            {displayStatsRoom && (
              <>
                {todayStatsScore && (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium mb-1">Оценка за сегодня</p>
                      <p className="text-xs text-muted-foreground">Комната {displayStatsRoom} • {todayStatsScore.inspector}</p>
                    </div>
                    <div className={`px-6 py-3 rounded-lg border-2 ${getScoreColor(todayStatsScore.score)}`}>
                      <div className="text-3xl font-bold text-center">{todayStatsScore.score}</div>
                    </div>
                  </div>
                )}

                {statsRoomScores.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Средний балл</p>
                        <p className="text-xs text-muted-foreground">
                          {statsPeriod === 'week' ? 'За неделю' : statsPeriod === 'month' ? 'За месяц' : 'За всё время'}
                        </p>
                      </div>
                      <div className={`px-6 py-3 rounded-lg border-2 ${avgStatsScore ? getScoreColor(Math.round(avgStatsScore)) : 'bg-gray-50'}`}>
                        <div className="text-3xl font-bold text-center">{avgStatsScore?.toFixed(1) || '—'}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">История оценок:</p>
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {statsRoomScores.slice().reverse().map((score, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{formatDate(score.date)}</span>
                              <span className="text-xs text-muted-foreground">• {score.inspector}</span>
                            </div>
                            <Badge className={getScoreColor(score.score)}>{score.score}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {statsRoomScores.length === 0 && !todayStatsScore && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Нет данных за выбранный период
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Оценка чистоты комнат</h3>
          <p className="text-sm text-muted-foreground">
            Таблица проверок чистоты комнат по этажам
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(canViewAllFloors() || availableFloors.length > 1) && (
            <Select 
              value={selectedFloor?.toString() || ''} 
              onValueChange={(v) => setSelectedFloor(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Выберите этаж" />
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
          {canManageSettings() && selectedFloor && (
            <>
              <Dialog open={roomsDialogOpen} onOpenChange={setRoomsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Icon name="DoorOpen" size={16} />
                    Комнаты
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Управление комнатами ({selectedFloor} этаж)</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Номер комнаты (01-99)"
                        value={newRoomNumber}
                        onChange={(e) => setNewRoomNumber(e.target.value)}
                        maxLength={2}
                      />
                      <Button onClick={addRoom}>
                        <Icon name="Plus" size={16} />
                      </Button>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {rooms.map(room => (
                        <div key={room} className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">{room}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRoom(selectedFloor!, room)}
                          >
                            <Icon name="Trash2" size={16} className="text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Icon name="Settings" size={16} />
                    Настройки
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Настройки рабочих дней</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Отметьте дни, в которые проводятся проверки в выбранном периоде
                    </p>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {dates.map(date => {
                        const dateObj = new Date(date);
                        const dayName = dateObj.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
                        const working = isWorkingDay(date, settings);
                        
                        return (
                          <div key={date} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{dayName}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant={working ? 'default' : 'secondary'}>
                                {working ? 'Рабочий' : 'Выходной'}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleDayWorkingStatus(date)}
                              >
                                {working ? 'Закрыть' : 'Открыть'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
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

      {!selectedFloor && canViewAllFloors() ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Icon name="Home" size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Выберите этаж для просмотра таблицы проверок</p>
            </div>
          </CardContent>
        </Card>
      ) : selectedFloor ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border p-2 text-left font-semibold min-w-[70px] sticky left-0 bg-muted/50 z-10">
                      Комната
                    </th>
                    {dates.map(date => {
                      const working = isWorkingDay(date, settings);
                      const floorClosed = selectedFloor ? isFloorClosed(date, selectedFloor) : false;
                      const dateObj = new Date(date);
                      const dayOfWeek = dateObj.getDay();
                      const isMonday = dayOfWeek === 1;
                      
                      return (
                        <th key={date} className={`border p-2 text-center font-semibold min-w-[80px] relative group ${
                          !working ? 'bg-gray-200' : 
                          isMonday ? 'bg-purple-100' : ''
                        }`}>
                          <div className="whitespace-pre-line text-xs leading-tight">
                            {formatDateHeader(date)}
                            {isMonday && <div className="text-[10px] text-purple-700 font-bold mt-0.5">Ген. уборка</div>}
                          </div>
                          {canCloseFloors() && editMode && working && selectedFloor && (
                            <button
                              onClick={() => toggleFloorClosed(date, selectedFloor)}
                              className="absolute top-1 right-1 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded border shadow-sm"
                              title={floorClosed ? `Открыть ${selectedFloor} этаж` : `Закрыть ${selectedFloor} этаж`}
                            >
                              <Icon name={floorClosed ? 'Unlock' : 'Lock'} size={12} className="text-orange-600" />
                            </button>
                          )}
                          {floorClosed && (
                            <div className="absolute top-1 left-1">
                              <Icon name="Lock" size={12} className="text-orange-600" />
                            </div>
                          )}
                        </th>
                      );
                    })}
                    <th className="border p-2 text-center font-semibold min-w-[70px] bg-amber-50">
                      Ср. балл
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map(room => {
                    const avgScore = getAverageScore(selectedFloor, room, dates);
                    return (
                      <tr key={room} className="hover:bg-muted/30 transition-colors">
                        <td className="border p-2 font-medium sticky left-0 bg-background z-10 text-center">
                          {room}
                        </td>
                        {dates.map(date => {
                          const scoreData = getScore(selectedFloor, date, room);
                          const working = isWorkingDay(date, settings);
                          const roomClosed = isRoomClosed(date, room);
                          
                          if (!working) {
                            return (
                              <td key={date} className="border p-1 bg-gray-100">
                                <div className="h-12 flex items-center justify-center">
                                  <Icon name="X" size={16} className="text-gray-400" />
                                </div>
                              </td>
                            );
                          }

                          if (roomClosed) {
                            return (
                              <td key={date} className="border p-1 bg-orange-50 relative group">
                                <div className="h-12 flex items-center justify-center">
                                  <Icon name="Lock" size={16} className="text-orange-600" />
                                </div>
                                {canManageSettings() && editMode && (
                                  <button
                                    onClick={() => toggleRoomClosed(date, room)}
                                    className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Icon name="Unlock" size={12} className="text-orange-600" />
                                  </button>
                                )}
                              </td>
                            );
                          }
                          
                          const cellEditable = canEditCell(selectedFloor, date, room);
                          
                          return (
                            <td key={date} className="border p-1 relative group">
                              {editMode && cellEditable ? (
                                <>
                                  <Select 
                                    value={scoreData?.score?.toString() || ''} 
                                    onValueChange={(v) => handleScoreChange(selectedFloor, date, room, v)}
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
                                  {scoreData && (
                                    <button
                                      onClick={() => setDeleteScoreDialog({ floor: selectedFloor, date, room })}
                                      className="absolute top-0.5 right-0.5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded border shadow-sm hover:bg-red-50"
                                      title="Удалить оценку"
                                    >
                                      <Icon name="X" size={14} className="text-red-600" />
                                    </button>
                                  )}
                                  {canManageSettings() && (
                                    <button
                                      onClick={() => toggleRoomClosed(date, room)}
                                      className="absolute bottom-0.5 right-0.5 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded border shadow-sm"
                                      title="Закрыть комнату"
                                    >
                                      <Icon name="Lock" size={12} className="text-orange-600" />
                                    </button>
                                  )}
                                </>
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
                        <td className="border p-2 text-center font-bold bg-amber-50">
                          {avgScore ? (
                            <div className={`inline-flex items-center justify-center px-3 py-1 rounded ${
                              avgScore >= 4.5 ? 'bg-green-100 text-green-800' :
                              avgScore >= 3.5 ? 'bg-blue-100 text-blue-800' :
                              avgScore >= 2.5 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {avgScore}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}

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

      <AlertDialog open={!!deleteScoreDialog} onOpenChange={(open) => !open && setDeleteScoreDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить оценку?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить оценку для комнаты {deleteScoreDialog?.room}? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmScoreDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};