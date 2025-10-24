import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { CleanlinessData, CleanlinessScore, CleanlinessSettings } from './types';
import { formatDateHeader, isWorkingDay, getGeneralCleaningDay, calculateAverageScore } from './utils';

interface CleanlinessTableProps {
  floor: number;
  dates: string[];
  rooms: string[];
  data: CleanlinessData;
  settings: CleanlinessSettings;
  editMode: boolean;
  canEditFloor: (floor: number) => boolean;
  canEditCell: (floor: number, date: string, room: string) => boolean;
  onScoreChange: (floor: number, date: string, room: string, score: string) => void;
  onDeleteScore: (floor: number, date: string, room: string) => void;
  getScore: (floor: number, date: string, room: string) => CleanlinessScore | undefined;
  isRoomClosed: (date: string, room: string) => boolean;
  isFloorClosed: (date: string, floor: number) => boolean;
  onToggleRoomClosed: (date: string, room: string) => void;
}

export const CleanlinessTable = ({
  floor,
  dates,
  rooms,
  data,
  settings,
  editMode,
  canEditFloor,
  canEditCell,
  onScoreChange,
  onDeleteScore,
  getScore,
  isRoomClosed,
  isFloorClosed,
  onToggleRoomClosed,
}: CleanlinessTableProps) => {
  const getScoreColor = (score: number | string): string => {
    if (score === 5) return 'bg-green-100 text-green-800 border-green-300';
    if (score === 4) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (score === 2) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-600 border-gray-300';
  };

  const getCellContent = (date: string, room: string) => {
    const scoreData = getScore(floor, date, room);
    const working = isWorkingDay(date, settings);
    const roomClosed = isRoomClosed(date, room);
    const floorClosed = isFloorClosed(date, floor);
    
    if (roomClosed) {
      if (editMode && canEdit) {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onToggleRoomClosed(date, room)}
          >
            <Icon name="Lock" size={14} className="text-gray-400" />
          </Button>
        );
      }
      return <Icon name="Lock" size={14} className="text-gray-400" />;
    }
    
    if (floorClosed) {
      return <span className="text-xs text-gray-400">Этаж закрыт</span>;
    }
    
    if (!working) {
      return null;
    }
    
    const canEdit = canEditCell(floor, date, room);
    
    if (editMode && canEdit) {
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Select
              value={scoreData?.score?.toString() || ''}
              onValueChange={(value) => onScoreChange(floor, date, room, value)}
            >
              <SelectTrigger className="h-8 w-16 text-xs">
                <SelectValue placeholder="-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
            {scoreData && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onDeleteScore(floor, date, room)}
              >
                <Icon name="X" size={12} />
              </Button>
            )}
          </div>

        </div>
      );
    }
    
    if (scoreData) {
      return (
        <Badge className={`${getScoreColor(scoreData.score)} px-2 py-0.5 text-sm`}>
          {scoreData.score}
        </Badge>
      );
    }
    
    return <span className="text-gray-400">-</span>;
  };

  const generalCleaningDate = getGeneralCleaningDay(dates, settings);
  
  const getAverageScoreForRoom = (room: string): number | null => {
    const scores = filteredDates.map(date => getScore(floor, date, room));
    return calculateAverageScore(scores);
  };

  const filteredDates = dates.filter(date => {
    const working = isWorkingDay(date, settings);
    if (!working) {
      const hasAnyScore = rooms.some(room => {
        const score = getScore(floor, date, room);
        return score !== undefined;
      });
      const hasAnyClosed = rooms.some(room => isRoomClosed(date, room));
      return hasAnyScore || hasAnyClosed;
    }
    return true;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-background border border-border p-2 min-w-[80px]">
              <div className="font-medium text-sm">Комната</div>
            </th>
            {filteredDates.map((date) => {
              const working = isWorkingDay(date, settings);
              const floorClosed = isFloorClosed(date, floor);
              const isGeneralCleaning = date === generalCleaningDate;
              
              return (
                <th
                  key={date}
                  className={`border border-border p-2 min-w-[90px] text-center ${
                    !working || floorClosed ? 'bg-muted/30' : ''
                  } ${
                    isGeneralCleaning ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="text-xs whitespace-pre-line leading-tight">
                    {formatDateHeader(date)}
                    {isGeneralCleaning && (
                      <div className="text-purple-600 font-semibold mt-1">Ген. уборка</div>
                    )}
                  </div>
                </th>
              );
            })}
            <th className="border border-border p-2 min-w-[90px] text-center bg-muted/50">
              <div className="text-xs font-semibold">Средний\nбалл</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => {
            const avgScore = getAverageScoreForRoom(room);
            return (
              <tr key={room} className="hover:bg-muted/50">
                <td className="sticky left-0 z-10 bg-background border border-border p-2 font-medium text-sm">
                  {room}
                </td>
                {filteredDates.map((date) => {
                  const working = isWorkingDay(date, settings);
                  const roomClosed = isRoomClosed(date, room);
                  const floorClosed = isFloorClosed(date, floor);
                  const isGeneralCleaning = date === generalCleaningDate;
                  
                  return (
                    <td
                      key={`${room}-${date}`}
                      className={`border border-border p-2 text-center ${
                        !working || roomClosed || floorClosed ? 'bg-muted/30' : ''
                      } ${
                        isGeneralCleaning ? 'bg-purple-50' : ''
                      }`}
                    >
                      {getCellContent(date, room)}
                    </td>
                  );
                })}
                <td className="border border-border p-2 text-center bg-muted/50 font-semibold">
                  {avgScore !== null ? (
                    <span className="text-sm">{avgScore.toFixed(1)}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            );
          })}

        </tbody>
      </table>
    </div>
  );
};