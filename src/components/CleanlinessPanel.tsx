import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

interface CleanlinessSettings {
  rooms: RoomsList;
  workingDays: WorkingDays;
  defaultNonWorkingDays: number[];
}

interface CleanlinesPanelProps {
  currentUser: User;
  users: User[];
}

type ViewMode = 'week' | 'month';

const STORAGE_KEY = 'cleanliness_data';
const SETTINGS_KEY = 'cleanliness_settings';

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
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

const formatDate = (dateString: string): string => {
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
  const { toast } = useToast();

  const [settings, setSettings] = useState<CleanlinessSettings>({
    rooms: {
      '2': getDefaultRooms(2),
      '3': getDefaultRooms(3),
      '4': getDefaultRooms(4),
      '5': getDefaultRooms(5),
    },
    workingDays: {},
    defaultNonWorkingDays: [5, 6, 7],
  });

  const userFloor = currentUser.room ? getFloorFromRoom(currentUser.room) : null;

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setData(JSON.parse(stored));
    }
    
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  useEffect(() => {
    if (userFloor && !canViewAllFloors()) {
      setSelectedFloor(userFloor);
    }
  }, [userFloor]);

  const saveData = (newData: CleanlinessData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const saveSettings = (newSettings: CleanlinessSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const canManageSettings = (): boolean => {
    return ['manager', 'admin', 'chairman', 'vice_chairman'].includes(currentUser.role);
  };

  const canEditAnyFloor = (): boolean => {
    return canManageSettings();
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

  const dates = viewMode === 'week' ? getWeekDates(periodOffset) : getMonthDates(periodOffset);
  const workingDates = dates.filter(date => isWorkingDay(date, settings));
  
  const availableFloors = canViewAllFloors() 
    ? [2, 3, 4, 5] 
    : userFloor ? [userFloor] : [];

  const rooms = selectedFloor ? (settings.rooms[selectedFloor] || getDefaultRooms(selectedFloor)) : [];
  const canEdit = selectedFloor ? canEditFloor(selectedFloor) : false;
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
                      return (
                        <th key={date} className={`border p-2 text-center font-semibold min-w-[80px] ${!working ? 'bg-gray-200' : ''}`}>
                          <div className="whitespace-pre-line text-xs leading-tight">
                            {formatDate(date)}
                          </div>
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
                          
                          if (!working) {
                            return (
                              <td key={date} className="border p-1 bg-gray-100">
                                <div className="h-12 flex items-center justify-center">
                                  <Icon name="X" size={16} className="text-gray-400" />
                                </div>
                              </td>
                            );
                          }
                          
                          return (
                            <td key={date} className="border p-1">
                              {editMode ? (
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
    </div>
  );
};