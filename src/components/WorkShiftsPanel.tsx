import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useWorkShifts } from '@/contexts/WorkShiftsContext';
import { useUsers } from '@/contexts/UsersContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useLogs } from '@/contexts/LogsContext';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/auth';
import { WorkShiftsArchive } from '@/components/WorkShiftsArchive';
import { WorkShiftsList } from '@/components/WorkShifts/WorkShiftsList';
import { MyWorkShifts } from '@/components/WorkShifts/MyWorkShifts';
import { AssignWorkShiftDialog } from '@/components/WorkShifts/AssignWorkShiftDialog';
import { CompleteWorkShiftDialog } from '@/components/WorkShifts/CompleteWorkShiftDialog';
import { DeleteWorkShiftDialog } from '@/components/WorkShifts/DeleteWorkShiftDialog';
import { WorkShiftsFilters } from '@/components/WorkShifts/WorkShiftsFilters';

interface WorkShiftsPanelProps {
  currentUser?: User;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

export const WorkShiftsPanel = ({ currentUser: propCurrentUser }: WorkShiftsPanelProps) => {
  const { workShifts, addWorkShift, completeWorkShift, deleteWorkShift, getUserTotalDays } = useWorkShifts();
  const { users } = useUsers();
  const { addNotification } = useNotifications();
  const { addLog } = useLogs();
  const { toast } = useToast();
  
  const currentUser = propCurrentUser;
  
  if (!currentUser) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4 opacity-20" />
          <p>Необходима авторизация</p>
        </CardContent>
      </Card>
    );
  }

  const [assignOpen, setAssignOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [assignType, setAssignType] = useState<'user' | 'room'>('user');
  const [days, setDays] = useState('');
  const [reason, setReason] = useState('');
  const [completeDays, setCompleteDays] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'room' | 'group' | 'floor'>('name');
  const [userSearch, setUserSearch] = useState('');
  const [userSortBy, setUserSortBy] = useState<'name' | 'room' | 'group' | 'position'>('name');
  const [showArchive, setShowArchive] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const canManage = ['manager', 'admin', 'moderator'].includes(currentUser.role) || 
    currentUser.positions?.some(p => ['chairman', 'vice_chairman', 'secretary'].includes(p));
  
  const canDelete = ['manager', 'admin', 'moderator'].includes(currentUser.role);
  const canComplete = canManage || currentUser.positions?.includes('household_sector');
  const isFloorHead = currentUser.positions?.some(p => p.startsWith('floor_'));
  const userFloor = currentUser.room ? currentUser.room.charAt(0) : null;

  const myShifts = workShifts.filter(s => s.userId === currentUser.id);
  const myTotals = getUserTotalDays(currentUser.id);

  const filtered = users.filter(u => {
    if (!canManage && !isFloorHead) return false;
    if (isFloorHead && !canManage) {
      const floor = u.room ? u.room.charAt(0) : null;
      if (floor !== userFloor) return false;
    }
    
    if (['manager', 'admin'].includes(u.role)) return false;
    
    const uTotals = getUserTotalDays(u.id);
    if (uTotals.remaining === 0 && uTotals.completed === 0) return false;
    
    const match = u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.room && u.room.includes(search)) ||
      (u.group && u.group.toLowerCase().includes(search.toLowerCase()));
    return match;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'room') return (a.room || '').localeCompare(b.room || '');
    if (sortBy === 'group') return (a.group || '').localeCompare(b.group || '');
    const aF = a.room ? a.room[0] : '';
    const bF = b.room ? b.room[0] : '';
    return aF.localeCompare(bF);
  });

  const assignableUsers = users.filter(u => {
    if (!canManage && !isFloorHead) return false;
    if (isFloorHead && !canManage) {
      const floor = u.room ? u.room.charAt(0) : null;
      if (floor !== userFloor) return false;
    }
    
    if (['manager', 'admin'].includes(u.role)) return false;
    
    const match = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.room && u.room.includes(userSearch)) ||
      (u.group && u.group.toLowerCase().includes(userSearch.toLowerCase()));
    return match;
  }).sort((a, b) => {
    if (userSortBy === 'name') return a.name.localeCompare(b.name);
    if (userSortBy === 'room') return (a.room || '').localeCompare(b.room || '');
    if (userSortBy === 'group') return (a.group || '').localeCompare(b.group || '');
    if (userSortBy === 'position') {
      const aPos = a.positions && a.positions.length > 0 ? a.positions[0] : 'zzz';
      const bPos = b.positions && b.positions.length > 0 ? b.positions[0] : 'zzz';
      return aPos.localeCompare(bPos);
    }
    return 0;
  });

  const handleAssign = () => {
    if (!days || !reason) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    const d = parseInt(days);
    if (isNaN(d) || d <= 0) {
      toast({ title: 'Ошибка', description: 'Некорректное количество дней', variant: 'destructive' });
      return;
    }

    if (assignType === 'user') {
      if (!selectedUserId) {
        toast({ title: 'Ошибка', description: 'Выберите пользователя', variant: 'destructive' });
        return;
      }
      const u = users.find(x => x.id === selectedUserId);
      if (!u) return;
      
      if (['manager', 'admin'].includes(u.role)) {
        toast({ title: 'Ошибка', description: 'Нельзя назначить отработки администраторам и менеджерам', variant: 'destructive' });
        return;
      }

      addWorkShift({ userId: u.id, userName: u.name, days: d, assignedBy: currentUser.id, assignedByName: currentUser.name, reason });
      addNotification({ type: 'work_shift_assigned', title: 'Назначены отработки', message: `Вам назначено ${d} дн. отработок. Причина: ${reason}`, userId: u.id });
      addLog({ action: 'work_shift_assigned', userId: currentUser.id, userName: currentUser.name, details: `Назначил ${d} дн. отработок. Причина: ${reason}`, targetUserId: u.id, targetUserName: u.name });
      toast({ title: 'Успешно', description: `Отработки назначены ${u.name}` });
    } else {
      if (!selectedRoom) {
        toast({ title: 'Ошибка', description: 'Укажите комнату', variant: 'destructive' });
        return;
      }
      const roomUsers = users.filter(x => x.room === selectedRoom && !['manager', 'admin'].includes(x.role));
      if (!roomUsers.length) {
        toast({ title: 'Ошибка', description: 'В комнате нет жильцов', variant: 'destructive' });
        return;
      }
      roomUsers.forEach(u => {
        addWorkShift({ userId: u.id, userName: u.name, days: d, assignedBy: currentUser.id, assignedByName: currentUser.name, reason });
        addNotification({ type: 'work_shift_assigned', title: 'Назначены отработки', message: `Вам назначено ${d} дн. отработок. Причина: ${reason}`, userId: u.id });
        addLog({ action: 'work_shift_assigned', userId: currentUser.id, userName: currentUser.name, details: `Назначил ${d} дн. отработок комнате ${selectedRoom}. Причина: ${reason}`, targetUserId: u.id, targetUserName: u.name });
      });
      toast({ title: 'Успешно', description: `Отработки назначены комнате ${selectedRoom} (${roomUsers.length} чел.)` });
    }

    setAssignOpen(false);
    setSelectedUserId('');
    setSelectedRoom('');
    setDays('');
    setReason('');
  };

  const handleComplete = () => {
    if (!selectedShiftId || !completeDays) {
      toast({ title: 'Ошибка', description: 'Укажите количество дней', variant: 'destructive' });
      return;
    }
    const d = parseInt(completeDays);
    if (isNaN(d) || d <= 0) {
      toast({ title: 'Ошибка', description: 'Некорректное количество дней', variant: 'destructive' });
      return;
    }
    const shift = workShifts.find(s => s.id === selectedShiftId);
    if (!shift) return;
    if (d > shift.days - shift.completedDays) {
      toast({ title: 'Ошибка', description: 'Указано больше дней, чем осталось', variant: 'destructive' });
      return;
    }
    completeWorkShift(selectedShiftId, d, currentUser.id, currentUser.name);
    addNotification({ type: 'work_shift_completed', title: 'Списаны отработки', message: `Списано ${d} дн. отработок`, userId: shift.userId });
    addLog({ action: 'work_shift_completed', userId: currentUser.id, userName: currentUser.name, details: `Списал ${d} дн. отработок`, targetUserId: shift.userId, targetUserName: shift.userName });
    toast({ title: 'Успешно', description: `Списано ${d} дн.` });
    setCompleteOpen(false);
    setSelectedShiftId(null);
    setCompleteDays('');
  };

  const handleDelete = () => {
    if (!selectedShiftId) return;
    const shift = workShifts.find(s => s.id === selectedShiftId);
    if (!shift) return;
    deleteWorkShift(selectedShiftId);
    addNotification({ type: 'work_shift_deleted', title: 'Удалены отработки', message: 'Ваши отработки были удалены', userId: shift.userId });
    addLog({ action: 'work_shift_deleted', userId: currentUser.id, userName: currentUser.name, details: `Удалил отработки (${shift.days} дн., причина: ${shift.reason})`, targetUserId: shift.userId, targetUserName: shift.userName });
    toast({ title: 'Успешно', description: 'Отработки удалены' });
    setDeleteOpen(false);
    setSelectedShiftId(null);
  };

  if (showArchive) {
    return <WorkShiftsArchive currentUser={currentUser} onBack={() => setShowArchive(false)} />;
  }

  if (!canManage && !isFloorHead) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Мои отработки</CardTitle>
            <CardDescription>Просмотр назначенных отработок</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant={myTotals.remaining > 0 ? 'destructive' : 'default'} className="text-base px-4 py-2">
                Осталось: {myTotals.remaining} дн.
              </Badge>
              <Badge variant="secondary" className="text-base px-4 py-2">
                Отработано: {myTotals.completed} дн.
              </Badge>
            </div>
          </CardContent>
        </Card>
        <MyWorkShifts 
          shifts={myShifts}
          expandedUsers={expandedUsers}
          setExpandedUsers={setExpandedUsers}
          currentUserId={currentUser.id}
          formatDate={formatDate}
        />
      </div>
    );
  }

  const filteredShifts = workShifts.filter(s => {
    const u = users.find(x => x.id === s.userId);
    if (!u) return false;
    return filtered.some(f => f.id === u.id);
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div>
              <CardTitle>Отработки</CardTitle>
              <CardDescription>Управление отработками пользователей</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowArchive(true)} variant="outline" size="sm">
                <Icon name="Archive" size={16} className="mr-2" />
                Архив
              </Button>
              <Button onClick={() => setAssignOpen(true)} size="sm">
                <Icon name="Plus" size={16} className="mr-2" />
                Назначить
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Активные</TabsTrigger>
          <TabsTrigger value="my">Мои отработки</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Фильтры</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkShiftsFilters
                search={search}
                setSearch={setSearch}
                sortBy={sortBy}
                setSortBy={setSortBy}
              />
            </CardContent>
          </Card>

          {!filteredShifts.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Нет пользователей с отработками</p>
            </div>
          ) : (
            <WorkShiftsList
              shifts={filteredShifts}
              expandedUsers={expandedUsers}
              setExpandedUsers={setExpandedUsers}
              canComplete={canComplete}
              canDelete={canDelete}
              onComplete={(id) => {
                setSelectedShiftId(id);
                setCompleteOpen(true);
              }}
              onDelete={(id) => {
                setSelectedShiftId(id);
                setDeleteOpen(true);
              }}
              formatDate={formatDate}
              getUserTotalDays={getUserTotalDays}
            />
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Мои отработки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Badge variant={myTotals.remaining > 0 ? 'destructive' : 'default'} className="text-base px-4 py-2">
                  Осталось: {myTotals.remaining} дн.
                </Badge>
                <Badge variant="secondary" className="text-base px-4 py-2">
                  Отработано: {myTotals.completed} дн.
                </Badge>
              </div>
            </CardContent>
          </Card>
          <MyWorkShifts 
            shifts={myShifts}
            expandedUsers={expandedUsers}
            setExpandedUsers={setExpandedUsers}
            currentUserId={currentUser.id}
            formatDate={formatDate}
          />
        </TabsContent>
      </Tabs>

      <AssignWorkShiftDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        assignableUsers={assignableUsers}
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        userSortBy={userSortBy}
        setUserSortBy={setUserSortBy}
        assignType={assignType}
        setAssignType={setAssignType}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        selectedRoom={selectedRoom}
        setSelectedRoom={setSelectedRoom}
        days={days}
        setDays={setDays}
        reason={reason}
        setReason={setReason}
        onAssign={handleAssign}
      />

      <CompleteWorkShiftDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        completeDays={completeDays}
        setCompleteDays={setCompleteDays}
        onComplete={handleComplete}
      />

      <DeleteWorkShiftDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDelete={handleDelete}
      />
    </div>
  );
};