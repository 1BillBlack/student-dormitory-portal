import { CleanlinessData, CleanlinessScore, CleanlinessSettings, ViewMode } from './types';

export const STORAGE_KEY = 'cleanliness_data';
export const SETTINGS_KEY = 'cleanliness_settings';

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

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

export const getFloorFromRoom = (room: string): number => {
  return parseInt(room[0]);
};

export const getDefaultRooms = (floor: number): string[] => {
  const rooms: string[] = [];
  for (let i = 1; i <= 20; i++) {
    rooms.push(`${floor}${i.toString().padStart(2, '0')}`);
  }
  return rooms;
};

export const getWeekDates = (weekOffset: number = 0): string[] => {
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

export const getMonthDates = (monthOffset: number = 0): string[] => {
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

export const formatDateHeader = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayNum = date.getDate();
  const monthStr = date.toLocaleDateString('ru-RU', { month: 'short' });
  const weekday = date.toLocaleDateString('ru-RU', { weekday: 'short' });
  return `${dayNum} ${monthStr}\n${weekday}`;
};

export const getPeriodLabel = (dates: string[], viewMode: ViewMode): string => {
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

export const isWorkingDay = (date: string, settings: CleanlinessSettings): boolean => {
  if (settings.workingDays[date] !== undefined) {
    return settings.workingDays[date];
  }
  
  let dayOfWeek = new Date(date).getDay();
  dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
  return !settings.defaultNonWorkingDays.includes(dayOfWeek);
};
