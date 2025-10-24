import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { useWorkShifts } from '@/contexts/WorkShiftsContext';
import { useUsers } from '@/contexts/UsersContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useLogs } from '@/contexts/LogsContext';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/auth';
import { sortPositionsByRank, getPositionName } from '@/utils/positions';
import { WorkShiftsArchive } from '@/components/WorkShiftsArchive';

interface WorkShiftsPanelProps {
  currentUser: User;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

export const WorkShiftsPanel = ({ currentUser }: WorkShiftsPanelProps) => {
  const { workShifts, archivedShifts, addWorkShift, completeWorkShift, deleteWorkShift, getUserTotalDays, getUserArchivedShifts } = useWorkShifts();
  const { users } = useUsers();
  const { addNotification } = useNotifications();
  const { addLog } = useLogs();
  const { toast } = useToast();

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
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveSortBy, setArchiveSortBy] = useState<'date' | 'reason'>('date');
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
    
    // Скрыть администраторов и менеджеров
    if (['manager', 'admin'].includes(u.role)) return false;
    
    // Скрыть пользователей без отработок
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
    
    // Не показывать администраторов и менеджеров
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
      const aPos = a.positions && a.positions.length > 0 ? sortPositionsByRank(a.positions)[0] : 'zzz';
      const bPos = b.positions && b.positions.length > 0 ? sortPositionsByRank(b.positions)[0] : 'zzz';
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
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }
    const d = parseInt(completeDays);
    if (isNaN(d) || d <= 0) {
      toast({ title: 'Ошибка', description: 'Некорректное количество дней', variant: 'destructive' });
      return;
    }
    const shift = workShifts.find(s => s.id === selectedShiftId);
    if (!shift) return;

    completeWorkShift(selectedShiftId, d, currentUser.id, currentUser.name);
    addLog({ action: 'work_shift_completed', userId: currentUser.id, userName: currentUser.name, details: `Списал ${d} дн. отработок`, targetUserId: shift.userId, targetUserName: shift.userName });
    toast({ title: 'Успешно', description: `Списано ${d} дн. отработок` });
    setCompleteOpen(false);
    setSelectedShiftId(null);
    setCompleteDays('');
  };

  const handleDelete = () => {
    if (!selectedShiftId) return;
    const shift = workShifts.find(s => s.id === selectedShiftId);
    if (!shift) return;

    deleteWorkShift(selectedShiftId);
    addLog({ action: 'work_shift_deleted', userId: currentUser.id, userName: currentUser.name, details: `Удалил отработку (${shift.days} дн.)`, targetUserId: shift.userId, targetUserName: shift.userName });
    toast({ title: 'Удалено', description: 'Отработка удалена' });
    setDeleteOpen(false);
    setSelectedShiftId(null);
  };

  if (!canManage && !isFloorHead) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Мои отработки</h3>
        <Card>
          <CardHeader><CardTitle>Статистика</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">Осталось</p><p className="text-2xl font-bold text-destructive">{myTotals.remaining} дн.</p></div>
              <div><p className="text-sm text-muted-foreground">Отработано</p><p className="text-2xl font-bold text-green-600">{myTotals.completed} дн.</p></div>
            </div>
          </CardContent>
        </Card>
        {!myShifts.length ? (
          <div className="text-center py-8 text-muted-foreground"><Icon name="CheckCircle" size={48} className="mx-auto mb-4 opacity-50" /><p>У вас нет отработок</p></div>
        ) : (
          <div className="space-y-3">
            {myShifts.filter(s => s.completedDays < s.days).map(s => (
              <Card key={s.id}>
                <CardHeader className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{s.days} дн. отработок</CardTitle>
                      <CardDescription className="mt-1">Назначено: {formatDate(s.assignedAt)} ({s.assignedByName})</CardDescription>
                    </div>
                    <Badge variant="destructive" className="shrink-0">
                      Осталось: {s.days - s.completedDays} дн.
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Причина: </span><span>{s.reason}</span></div>
                    <div><span className="text-muted-foreground">Отработано: </span><span className="font-medium">{s.completedDays} из {s.days} дн.</span></div>
                    {s.completedAt && <div><span className="text-muted-foreground">Последнее списание: </span><span>{formatDate(s.completedAt)} ({s.completedByName})</span></div>}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {myShifts.filter(s => s.completedDays >= s.days).length > 0 && (
              <Card>
                <CardHeader className="p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newExpanded = new Set(expandedUsers);
                      if (newExpanded.has(currentUser.id)) {
                        newExpanded.delete(currentUser.id);
                      } else {
                        newExpanded.add(currentUser.id);
                      }
                      setExpandedUsers(newExpanded);
                    }}
                    className="w-full justify-between"
                  >
                    <span className="text-sm font-medium">
                      Выполненные отработки ({myShifts.filter(s => s.completedDays >= s.days).length})
                    </span>
                    <Icon name={expandedUsers.has(currentUser.id) ? "ChevronUp" : "ChevronDown"} size={16} />
                  </Button>
                </CardHeader>
                
                {expandedUsers.has(currentUser.id) && (
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-3">
                      {myShifts.filter(s => s.completedDays >= s.days).map(s => (
                        <div key={s.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <div className="flex-1">
                              <div className="font-medium">{s.days} дн. отработок</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Назначено: {formatDate(s.assignedAt)} ({s.assignedByName})
                              </div>
                            </div>
                            <Badge variant="default" className="shrink-0">Выполнено</Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div><span className="text-muted-foreground">Причина: </span><span>{s.reason}</span></div>
                            <div><span className="text-muted-foreground">Отработано: </span><span className="font-medium">{s.completedDays} из {s.days} дн.</span></div>
                            {s.completedAt && <div className="text-xs text-muted-foreground">Завершено: {formatDate(s.completedAt)} ({s.completedByName})</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Icon name="Clock" size={16} />
              Активные
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              <Icon name="Archive" size={16} />
              Архив
            </TabsTrigger>
          </TabsList>
          {canManage && <Button onClick={() => setAssignOpen(true)} className="gap-2 w-full sm:w-auto"><Icon name="Plus" size={18} />Назначить отработки</Button>}
        </div>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">По имени</SelectItem>
                <SelectItem value="room">По комнате</SelectItem>
                <SelectItem value="group">По группе</SelectItem>
                <SelectItem value="floor">По этажу</SelectItem>
              </SelectContent>
            </Select>
          </div>

      {filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
          <p>Нет пользователей с отработками</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(u => {
            const uShifts = workShifts.filter(s => s.userId === u.id);
            const activeShifts = uShifts.filter(s => s.completedDays < s.days);
            const completedShifts = uShifts.filter(s => s.completedDays >= s.days);
            const uTotals = getUserTotalDays(u.id);
            const isExpanded = expandedUsers.has(u.id);
            
            return (
              <Card key={u.id}>
                <CardHeader className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base break-words">{u.name}</CardTitle>
                      <CardDescription className="break-all">{u.room && `Комната ${u.room}`}{u.group && ` • Группа ${u.group}`}</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <Badge variant={uTotals.remaining > 0 ? 'destructive' : 'default'} className="text-nowrap">Осталось: {uTotals.remaining} дн.</Badge>
                      <Badge variant="secondary" className="text-nowrap">Отработано: {uTotals.completed} дн.</Badge>
                    </div>
                  </div>
                </CardHeader>
                {uShifts.length > 0 && (
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      {activeShifts.map(s => (
                        <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 bg-muted rounded-lg">
                          <div className="flex-1 text-sm min-w-0">
                            <div className="font-medium break-words">{s.days} дн. • {s.reason}</div>
                            <div className="text-xs text-muted-foreground break-all">{formatDate(s.assignedAt)} • Отработано: {s.completedDays}/{s.days}</div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {canComplete && (
                              <Button variant="ghost" size="icon" onClick={() => { setSelectedShiftId(s.id); setCompleteOpen(true); }}>
                                <Icon name="CheckCircle" size={16} className="text-green-600" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button variant="ghost" size="icon" onClick={() => { setSelectedShiftId(s.id); setDeleteOpen(true); }}>
                                <Icon name="Trash2" size={16} className="text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {completedShifts.length > 0 && (
                        <div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newExpanded = new Set(expandedUsers);
                              if (isExpanded) {
                                newExpanded.delete(u.id);
                              } else {
                                newExpanded.add(u.id);
                              }
                              setExpandedUsers(newExpanded);
                            }}
                            className="w-full justify-between"
                          >
                            <span className="text-xs text-muted-foreground">
                              Выполненные отработки ({completedShifts.length})
                            </span>
                            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
                          </Button>
                          
                          {isExpanded && (
                            <div className="space-y-2 mt-2">
                              {completedShifts.map(s => (
                                <div key={s.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg">
                                  <div className="flex-1 text-sm min-w-0">
                                    <div className="font-medium break-words flex items-center gap-2">
                                      {s.days} дн. • {s.reason}
                                      <Badge variant="default" className="text-xs">Выполнено</Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground break-all">
                                      {formatDate(s.assignedAt)} • Отработано: {s.completedDays}/{s.days}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    {canDelete && (
                                      <Button variant="ghost" size="icon" onClick={() => { setSelectedShiftId(s.id); setDeleteOpen(true); }}>
                                        <Icon name="Trash2" size={16} className="text-destructive" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
        </TabsContent>

        <TabsContent value="archive" className="space-y-4">
          <WorkShiftsArchive 
            archivedShifts={archivedShifts}
            users={users}
            currentUserId={currentUser.id}
            canViewAll={canManage || isFloorHead}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Назначить отработки</DialogTitle>
            <DialogDescription>Назначьте отработки пользователю или комнате</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <Label>Кому назначить</Label>
              <Select value={assignType} onValueChange={(v: any) => setAssignType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Одному пользователю</SelectItem>
                  <SelectItem value="room">Всей комнате</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {assignType === 'user' ? (
              <div className="space-y-2">
                <Label>Пользователь</Label>
                <Input placeholder="Поиск пользователя..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                <Select value={userSortBy} onValueChange={(v: any) => setUserSortBy(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">По имени</SelectItem>
                    <SelectItem value="room">По комнате</SelectItem>
                    <SelectItem value="group">По группе</SelectItem>
                    <SelectItem value="position">По должности</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger><SelectValue placeholder="Выберите пользователя" /></SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {assignableUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} {u.room && `(${u.room})`} {u.group && `• ${u.group}`}
                        {u.positions && u.positions.length > 0 && ` • ${getPositionName(sortPositionsByRank(u.positions)[0])}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Номер комнаты</Label>
                <Input placeholder="Например: 305" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Количество дней</Label>
              <Input type="number" placeholder="Например: 3" value={days} onChange={(e) => setDays(e.target.value)} min="1" />
            </div>
            <div className="space-y-2">
              <Label>Причина</Label>
              <Textarea placeholder="Опишите причину" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Отмена</Button>
            <Button onClick={handleAssign}>Назначить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Списать отработки</DialogTitle>
            <DialogDescription>Укажите количество отработанных дней</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Количество дней</Label>
              <Input type="number" placeholder="Например: 1" value={completeDays} onChange={(e) => setCompleteDays(e.target.value)} min="1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>Отмена</Button>
            <Button onClick={handleComplete}>Списать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить отработку?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Удалить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};