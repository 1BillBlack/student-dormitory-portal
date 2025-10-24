import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  canCloseFloors: boolean;
}

export const CleanlinessSettings = ({
  open,
  onOpenChange,
  settings,
  onSaveSettings,
  viewMode,
  dates,
  selectedFloor,
  canCloseFloors,
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

  const handleToggleRoomClosed = (date: string, room: string) => {
    const newSettings = { ...localSettings };
    if (!newSettings.closedRooms[date]) {
      newSettings.closedRooms[date] = [];
    }
    
    const index = newSettings.closedRooms[date].indexOf(room);
    if (index > -1) {
      newSettings.closedRooms[date] = newSettings.closedRooms[date].filter(r => r !== room);
      if (newSettings.closedRooms[date].length === 0) {
        delete newSettings.closedRooms[date];
      }
    } else {
      newSettings.closedRooms[date].push(room);
    }
    
    setLocalSettings(newSettings);
  };

  const handleToggleFloorClosed = (date: string, floor: number) => {
    const newSettings = { ...localSettings };
    if (!newSettings.closedFloors[date]) {
      newSettings.closedFloors[date] = [];
    }
    
    const index = newSettings.closedFloors[date].indexOf(floor);
    if (index > -1) {
      newSettings.closedFloors[date] = newSettings.closedFloors[date].filter(f => f !== floor);
      if (newSettings.closedFloors[date].length === 0) {
        delete newSettings.closedFloors[date];
      }
    } else {
      newSettings.closedFloors[date].push(floor);
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

  const isRoomClosed = (date: string, room: string): boolean => {
    return localSettings.closedRooms[date]?.includes(room) || false;
  };

  const isFloorClosed = (date: string, floor: number): boolean => {
    return localSettings.closedFloors[date]?.includes(floor) || false;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Настройки чистоты</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="rooms" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="rooms">Комнаты</TabsTrigger>
              <TabsTrigger value="days">Рабочие дни</TabsTrigger>
              {canCloseFloors && <TabsTrigger value="closed">Закрытия</TabsTrigger>}
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

            {canCloseFloors && (
              <TabsContent value="closed" className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Закрытые этажи</h3>
                  <div className="space-y-2">
                    {dates.map((date) => (
                      <div key={date} className="border rounded p-3">
                        <div className="font-medium text-sm mb-2">
                          {new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })}
                        </div>
                        <div className="flex gap-2">
                          {[2, 3, 4, 5].map((floor) => (
                            <div key={floor} className="flex items-center gap-2">
                              <Checkbox
                                checked={isFloorClosed(date, floor)}
                                onCheckedChange={() => handleToggleFloorClosed(date, floor)}
                              />
                              <label className="text-sm cursor-pointer" onClick={() => handleToggleFloorClosed(date, floor)}>
                                {floor} этаж
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedFloor && (
                  <div>
                    <h3 className="font-medium mb-3">Закрытые комнаты ({selectedFloor} этаж)</h3>
                    <div className="space-y-2">
                      {dates.map((date) => (
                        <div key={date} className="border rounded p-3">
                          <div className="font-medium text-sm mb-2">
                            {new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {localSettings.rooms[selectedFloor.toString()]?.map((room) => (
                              <div key={room} className="flex items-center gap-2">
                                <Checkbox
                                  checked={isRoomClosed(date, room)}
                                  onCheckedChange={() => handleToggleRoomClosed(date, room)}
                                />
                                <label className="text-sm cursor-pointer" onClick={() => handleToggleRoomClosed(date, room)}>
                                  {room}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            )}
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
