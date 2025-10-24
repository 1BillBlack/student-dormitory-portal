import { useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { CleanlinessData, CleanlinessSettings, ViewMode } from './types';
import { STORAGE_KEY, SETTINGS_KEY, getDefaultRooms, getFloorFromRoom, getWeekDates, getMonthDates } from './utils';

export const useCleanlinessLogic = (currentUser: User) => {
  const [data, setData] = useState<CleanlinessData>({});
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [periodOffset, setPeriodOffset] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    generalCleaningDay: 1,
  });

  const canEditAnyFloor = (): boolean => {
    if (['manager', 'admin', 'moderator'].includes(currentUser.role)) return true;
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
    
    if (userFloor && validFloors.includes(userFloor) && !floors.includes(userFloor)) {
      floors.push(userFloor);
    }
    
    return floors.sort();
  };

  const availableFloors = getUserFloors();

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
        generalCleaningDay: loadedSettings.generalCleaningDay || 1,
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

  const getScore = (floor: number, date: string, room: string) => {
    return data[floor]?.[date]?.[room];
  };

  const canEditCell = (floor: number, date: string, room: string): boolean => {
    if (canEditAnyFloor()) return true;
    if (!canEditFloor(floor)) return false;
    
    const scoreData = getScore(floor, date, room);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (scoreData) {
      return date === today;
    }
    
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
    
    if (score) {
      newData[floor][date][room] = {
        date,
        room,
        score: parseInt(score) as 2 | 3 | 4 | 5,
        inspector: currentUser.name,
      };
      
      toast({
        title: 'Оценка выставлена',
        description: `Комната ${room}: ${score} баллов`,
      });
    } else {
      delete newData[floor][date][room];
    }
    
    saveData(newData);
  };

  const handleDeleteScore = (floor: number, date: string, room: string) => {
    setDeleteScoreDialog({ floor, date, room });
  };

  const confirmDeleteScore = () => {
    if (!deleteScoreDialog) return;
    
    const { floor, date, room } = deleteScoreDialog;
    const newData = { ...data };
    
    if (newData[floor]?.[date]?.[room]) {
      delete newData[floor][date][room];
      
      if (Object.keys(newData[floor][date]).length === 0) {
        delete newData[floor][date];
      }
      
      saveData(newData);
      toast({
        title: 'Оценка удалена',
        description: `Оценка для комнаты ${room} удалена`,
      });
    }
    
    setDeleteScoreDialog(null);
  };

  const isRoomClosed = (date: string, room: string): boolean => {
    return settings.closedRooms[date]?.includes(room) || false;
  };

  const isFloorClosed = (date: string, floor: number): boolean => {
    return settings.closedFloors[floor.toString()] || false;
  };

  const dates = viewMode === 'week' 
    ? getWeekDates(periodOffset) 
    : getMonthDates(periodOffset);

  return {
    data,
    selectedFloor,
    setSelectedFloor,
    viewMode,
    setViewMode,
    periodOffset,
    setPeriodOffset,
    editMode,
    setEditMode,
    settingsOpen,
    setSettingsOpen,
    deleteScoreDialog,
    setDeleteScoreDialog,
    statsRoom,
    setStatsRoom,
    statsPeriod,
    setStatsPeriod,
    settings,
    saveSettings,
    availableFloors,
    canEditAnyFloor: canEditAnyFloor(),
    canViewAllFloors: canViewAllFloors(),
    canManageSettings: canManageSettings(),
    canCloseFloors: canCloseFloors(),
    canEditFloor,
    canEditCell,
    handleScoreChange,
    handleDeleteScore,
    confirmDeleteScore,
    getScore,
    isRoomClosed,
    isFloorClosed,
    dates,
  };
};