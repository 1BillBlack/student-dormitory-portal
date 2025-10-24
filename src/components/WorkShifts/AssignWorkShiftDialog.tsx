import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/types/auth';
import { getPositionName, sortPositionsByRank } from '@/utils/positions';

interface AssignWorkShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignableUsers: User[];
  userSearch: string;
  setUserSearch: (search: string) => void;
  userSortBy: 'name' | 'room' | 'group' | 'position';
  setUserSortBy: (sort: 'name' | 'room' | 'group' | 'position') => void;
  assignType: 'user' | 'room';
  setAssignType: (type: 'user' | 'room') => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  selectedRoom: string;
  setSelectedRoom: (room: string) => void;
  days: string;
  setDays: (days: string) => void;
  reason: string;
  setReason: (reason: string) => void;
  onAssign: () => void;
}

export const AssignWorkShiftDialog = ({
  open,
  onOpenChange,
  assignableUsers,
  userSearch,
  setUserSearch,
  userSortBy,
  setUserSortBy,
  assignType,
  setAssignType,
  selectedUserId,
  setSelectedUserId,
  selectedRoom,
  setSelectedRoom,
  days,
  setDays,
  reason,
  setReason,
  onAssign
}: AssignWorkShiftDialogProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (selectedUserId) {
      const u = assignableUsers.find(x => x.id === selectedUserId);
      setSelectedUser(u || null);
    } else {
      setSelectedUser(null);
    }
  }, [selectedUserId, assignableUsers]);

  const rooms = Array.from(new Set(assignableUsers.map(u => u.room).filter(Boolean))).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Назначить отработки</DialogTitle>
          <DialogDescription>Выберите пользователя или комнату и укажите количество дней</DialogDescription>
        </DialogHeader>
        <Tabs value={assignType} onValueChange={(v) => setAssignType(v as 'user' | 'room')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="user">Пользователю</TabsTrigger>
            <TabsTrigger value="room">Комнате</TabsTrigger>
          </TabsList>
          <TabsContent value="user" className="space-y-4">
            <div className="space-y-2">
              <Label>Поиск пользователя</Label>
              <Input 
                placeholder="Поиск по имени, комнате, группе..." 
                value={userSearch} 
                onChange={(e) => setUserSearch(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Сортировка</Label>
              <Select value={userSortBy} onValueChange={(v) => setUserSortBy(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">По имени</SelectItem>
                  <SelectItem value="room">По комнате</SelectItem>
                  <SelectItem value="group">По группе</SelectItem>
                  <SelectItem value="position">По должности</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Выберите пользователя</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите пользователя" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {assignableUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>
                        {u.room && <Badge variant="outline" className="text-xs">{u.room}</Badge>}
                        {u.group && <Badge variant="outline" className="text-xs">{u.group}</Badge>}
                        {u.positions && u.positions.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {getPositionName(sortPositionsByRank(u.positions)[0])}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedUser && (
              <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                <div className="font-medium">{selectedUser.name}</div>
                {selectedUser.room && <div className="text-muted-foreground">Комната: {selectedUser.room}</div>}
                {selectedUser.group && <div className="text-muted-foreground">Группа: {selectedUser.group}</div>}
                {selectedUser.positions && selectedUser.positions.length > 0 && (
                  <div className="text-muted-foreground">
                    Должности: {sortPositionsByRank(selectedUser.positions).map(p => getPositionName(p)).join(', ')}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="room" className="space-y-4">
            <div className="space-y-2">
              <Label>Выберите комнату</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите комнату" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(r => {
                    const count = assignableUsers.filter(u => u.room === r).length;
                    return (
                      <SelectItem key={r} value={r!}>
                        {r} ({count} чел.)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Количество дней</Label>
            <Input type="number" placeholder="Кол-во дней" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Причина</Label>
            <Textarea placeholder="Укажите причину назначения отработок" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={onAssign}>Назначить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
