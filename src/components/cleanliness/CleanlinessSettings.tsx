import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { CleanlinessSettings as Settings, ViewMode } from './types';
import { getDefaultRooms } from './utils';

interface CleanlinessSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  viewMode: ViewMode;
  dates: string[];
  selectedFloor: number | null;
}

export const CleanlinessSettings = ({
  open,
  onOpenChange,
  settings,
  onSaveSettings,
  viewMode,
  dates,
  selectedFloor,
}: CleanlinessSettingsProps) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [roomsDialogOpen, setRoomsDialogOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');

  const handleAddRoom = () => {
    if (!selectedFloor || !newRoomNumber.trim()) return;
    
    const newSettings = { ...localSettings };
    const floorKey = selectedFloor.toString();
    
    if (!newSettings.rooms[floorKey].includes(newRoomNumber)) {
      newSettings.rooms[floorKey] = [...newSettings.rooms[floorKey], newRoomNumber].sort();
      setLocalSettings(newSettings);
    }
    
    setNewRoomNumber('');
  };

  const handleRemoveRoom = (room: string) => {
    if (!selectedFloor) return;
    
    const newSettings = { ...localSettings };
    const floorKey = selectedFloor.toString();
    newSettings.rooms[floorKey] = newSettings.rooms[floorKey].filter(r => r !== room);
    setLocalSettings(newSettings);
  };

  const handleToggleWorkingDay = (date: string) => {
    const newSettings = { ...localSettings };
    const currentState = localSettings.workingDays[date];
    
    let dayOfWeek = new Date(date).getDay();
    dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    const isDefaultNonWorking = localSettings.defaultNonWorkingDays.includes(dayOfWeek);
    const defaultState = !isDefaultNonWorking;
    
    if (currentState === undefined) {
      newSettings.workingDays[date] = !defaultState;
    } else {
      if (currentState === defaultState) {
        delete newSettings.workingDays[date];
      } else {
        newSettings.workingDays[date] = !currentState;
      }
    }
    
    setLocalSettings(newSettings);
  };



  const handleSave = () => {
    onSaveSettings(localSettings);
    onOpenChange(false);
  };

  const isWorkingDay = (date: string): boolean => {
    if (localSettings.workingDays[date] !== undefined) {
      return localSettings.workingDays[date];
    }
    
    let dayOfWeek = new Date(date).getDay();
    dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    return !localSettings.defaultNonWorkingDays.includes(dayOfWeek);
  };



  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Настройки чистоты</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="rooms" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rooms">Комнаты</TabsTrigger>
              <TabsTrigger value="days">Рабочие дни</TabsTrigger>
            </TabsList>

            <TabsContent value="rooms" className="space-y-4">
              {selectedFloor && (
                <div>
                  <h3 className="font-medium mb-3">Комнаты {selectedFloor} этажа</h3>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Номер комнаты"
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
                    />
                    <Button onClick={handleAddRoom}>
                      <Icon name="Plus" size={16} className="mr-2" />
                      Добавить
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {localSettings.rooms[selectedFloor.toString()]?.map((room) => (
                      <div key={room} className="flex items-center justify-between p-2 border rounded">
                        <span>{room}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleRemoveRoom(room)}
                        >
                          <Icon name="X" size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="days" className="space-y-4">
              <div className="mb-4 p-4 border rounded">
                <Label className="text-sm font-medium mb-2 block">День генеральной уборки</Label>
                <Select
                  value={localSettings.generalCleaningDay?.toString() || '1'}
                  onValueChange={(value) => {
                    const newSettings = { ...localSettings };
                    newSettings.generalCleaningDay = parseInt(value);
                    setLocalSettings(newSettings);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Понедельник</SelectItem>
                    <SelectItem value="2">Вторник</SelectItem>
                    <SelectItem value="3">Среда</SelectItem>
                    <SelectItem value="4">Четверг</SelectItem>
                    <SelectItem value="5">Пятница</SelectItem>
                    <SelectItem value="6">Суббота</SelectItem>
                    <SelectItem value="7">Воскресенье</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Если день закрыт, генеральная уборка автоматически перенесется на следующий рабочий день
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {dates.map((date) => {
                  const working = isWorkingDay(date);
                  return (
                    <div key={date} className="flex items-center gap-2 p-2 border rounded">
                      <Checkbox
                        checked={working}
                        onCheckedChange={() => handleToggleWorkingDay(date)}
                      />
                      <label className="text-sm cursor-pointer" onClick={() => handleToggleWorkingDay(date)}>
                        {new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                      </label>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};