import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { User } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

interface FloorsPanelProps {
  users: User[];
  currentUser: User | undefined;
  onApproveRoom: (userId: string) => void;
  onRejectRoom: (userId: string) => void;
  userFloor: string | null;
}

const getFloorFromRoom = (room: string): number | null => {
  const firstChar = room.charAt(0);
  const floor = parseInt(firstChar);
  
  if (isNaN(floor) || floor < 2 || floor > 5) {
    return null;
  }
  
  return floor;
};

const canApproveForFloor = (user: User, floor: number): boolean => {
  if (['manager', 'admin', 'moderator'].includes(user.role)) {
    return true;
  }
  
  if (user.positions?.includes('chairman' as any) || user.positions?.includes('vice_chairman' as any)) {
    return true;
  }
  
  const floorHeadPosition = `floor_${floor}_head` as any;
  return user.positions?.includes(floorHeadPosition) || false;
};

export const FloorsPanel = ({ users, currentUser, onApproveRoom, onRejectRoom, userFloor }: FloorsPanelProps) => {
  const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const { toast } = useToast();

  if (!currentUser) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Загрузка данных пользователя...
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.pendingRoom && !u.roomConfirmed);

  const groupByFloor = () => {
    const floors: Record<number, User[]> = { 2: [], 3: [], 4: [], 5: [] };
    const floorNum = userFloor ? parseInt(userFloor.split('_')[0]) : null;
    
    pendingUsers.forEach(user => {
      if (!user.pendingRoom) return;
      
      const floor = getFloorFromRoom(user.pendingRoom);
      if (floor && floors[floor]) {
        if (floorNum !== null) {
          if (floor === floorNum) {
            floors[floor].push(user);
          }
        } else {
          floors[floor].push(user);
        }
      }
    });
    
    return floors;
  };

  const floorGroups = groupByFloor();
  const visibleFloors = userFloor ? [parseInt(userFloor.split('_')[0])] : [2, 3, 4, 5];

  const canApprove = (floor: number): boolean => {
    return canApproveForFloor(currentUser, floor);
  };

  const handleApprove = () => {
    if (confirmingUserId) {
      const user = users.find(u => u.id === confirmingUserId);
      onApproveRoom(confirmingUserId);
      toast({
        title: 'Комната подтверждена',
        description: `Пользователь ${user?.name} получил доступ к комнате ${user?.pendingRoom}`,
      });
      setConfirmingUserId(null);
    }
  };

  const handleReject = () => {
    if (rejectingUserId) {
      onRejectRoom(rejectingUserId);
      toast({
        title: 'Заявка отклонена',
        description: 'Заявка на смену комнаты отклонена',
        variant: 'destructive',
      });
      setRejectingUserId(null);
    }
  };

  const renderUserCard = (user: User, floor: number) => {
    const userToConfirm = users.find(u => u.id === confirmingUserId);
    const userToReject = users.find(u => u.id === rejectingUserId);
    
    return (
      <Card key={user.id}>
        <CardHeader className="p-4">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex-1 min-w-0 w-full">
              <CardTitle className="text-base flex flex-wrap items-center gap-2">
                <span className="truncate">{user.name}</span>
                <Badge variant="outline" className="shrink-0">
                  {user.room ? 'Смена комнаты' : 'Новый участник'}
                </Badge>
              </CardTitle>
              <div className="space-y-1 mt-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground break-all">
                  <Icon name="Mail" size={14} className="shrink-0" />
                  <span>{user.email}</span>
                </div>
                {user.room && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="Home" size={14} className="shrink-0" />
                    <span className="text-muted-foreground">Текущая: {user.room}</span>
                    <Icon name="ArrowRight" size={14} />
                    <span className="font-medium text-primary">Новая: {user.pendingRoom}</span>
                  </div>
                )}
                {!user.room && user.pendingRoom && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="Home" size={14} className="shrink-0" />
                    <span className="font-medium text-primary">Комната: {user.pendingRoom}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center w-full sm:w-auto">
              {canApprove(floor) ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-1 flex-1 sm:flex-initial"
                    onClick={() => setConfirmingUserId(user.id)}
                  >
                    <Icon name="Check" size={16} />
                    <span className="hidden sm:inline">Подтвердить</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1 flex-1 sm:flex-initial"
                    onClick={() => setRejectingUserId(user.id)}
                  >
                    <Icon name="X" size={16} />
                    <span className="hidden sm:inline">Отклонить</span>
                  </Button>
                </>
              ) : (
                <Badge variant="secondary">Нет прав</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  };

  const totalPendingForUser = Object.values(floorGroups).flat().length;
  const floorNumber = userFloor ? userFloor.split('_')[0] : null;
  
  if (totalPendingForUser === 0) {
    return (
      <div className="text-center py-12">
        <Icon name="Check" size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Нет заявок на проверку</h3>
        <p className="text-sm text-muted-foreground">
          {floorNumber 
            ? `Все заявки для ${floorNumber} этажа обработаны` 
            : 'Все заявки на смену комнаты обработаны'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Проверка комнат</h3>
        <p className="text-sm text-muted-foreground">
          Заявки на подтверждение комнат {floorNumber ? `(${floorNumber} этаж)` : 'по этажам'} ({totalPendingForUser})
        </p>
      </div>

      <Tabs defaultValue={visibleFloors[0].toString()} className="w-full">
        <TabsList className={`grid w-full grid-cols-${visibleFloors.length}`}>
          {visibleFloors.map(floor => (
            <TabsTrigger key={floor} value={floor.toString()} className="gap-1">
              <span className="hidden sm:inline">{floor} этаж</span>
              <span className="sm:hidden">{floor}</span>
              {floorGroups[floor].length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                  {floorGroups[floor].length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {visibleFloors.map(floor => (
          <TabsContent key={floor} value={floor.toString()} className="space-y-4">
            {floorGroups[floor].length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Check" size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Нет заявок для {floor} этажа</p>
              </div>
            ) : (
              <div className="space-y-3">
                {floorGroups[floor].map(user => renderUserCard(user, floor))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <AlertDialog open={!!confirmingUserId} onOpenChange={(open) => !open && setConfirmingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтвердить комнату</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите подтвердить комнату {users.find(u => u.id === confirmingUserId)?.pendingRoom} для пользователя {users.find(u => u.id === confirmingUserId)?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Подтвердить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rejectingUserId} onOpenChange={(open) => !open && setRejectingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить заявку</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите отклонить заявку на комнату {users.find(u => u.id === rejectingUserId)?.pendingRoom} для пользователя {users.find(u => u.id === rejectingUserId)?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Отклонить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};