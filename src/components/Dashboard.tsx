import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/contexts/UsersContext';
import { useAnnouncements } from '@/contexts/AnnouncementsContext';
import { CreateAnnouncementDialog } from '@/components/CreateAnnouncementDialog';
import { EditAnnouncementDialog } from '@/components/EditAnnouncementDialog';
import { AdminPanel } from '@/components/AdminPanel';
import { CouncilPanel } from '@/components/CouncilPanel';
import { CleanlinessPanel } from '@/components/CleanlinessPanel';
import { UserManagementDialog } from '@/components/UserManagementDialog';
import { ChangeRoomDialog } from '@/components/ChangeRoomDialog';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { useToast } from '@/hooks/use-toast';
import { UserPosition } from '@/types/auth';
import { getPositionName } from '@/utils/positions';
import { getTodayRoomScore, getRoomScores } from '@/components/CleanlinessPanel';

type TabType = 'home' | 'notifications' | 'profile' | 'duties' | 'cleanliness' | 'admin' | 'council';





const mockDuties = [
  { id: 1, student: 'Иван Петров', room: '305', date: '2025-10-25', status: 'pending', task: 'Уборка коридора 3 этаж' },
  { id: 2, student: 'Мария Сидорова', room: '412', date: '2025-10-24', status: 'completed', task: 'Уборка кухни' },
  { id: 3, student: 'Алексей Иванов', room: '201', date: '2025-10-26', status: 'pending', task: 'Вынос мусора' },
];

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};


export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const savedTab = localStorage.getItem('activeTab');
    return (savedTab as TabType) || 'home';
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'all'>('week');
  const { user, logout } = useAuth();
  const { users, updateUser, deleteUser, createUser, updateUserPositions } = useUsers();
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements();
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const canManageAnnouncements = ['manager', 'admin', 'moderator'].includes(user?.role || '');
  const canManageUsers = ['manager', 'admin', 'moderator'].includes(user?.role || '');
  const hasCouncilAccess = 
    ['manager', 'admin', 'moderator'].includes(user?.role || '') ||
    (user?.positions && user.positions.length > 0);
  const canSeeCleanlinessTab = 
    ['manager', 'admin', 'moderator'].includes(user?.role || '') || user?.room;

  const isFloorManager = user?.positions?.some(p => p.startsWith('floor_'));
  const canSeeAdminPanel = canManageUsers || isFloorManager;
  
  const userFloor = isFloorManager && !canManageUsers
    ? user?.positions?.find(p => p.startsWith('floor_'))?.replace('floor_', '')
    : null;

  const pendingRoomsCount = userFloor
    ? users.filter(u => {
        if (!u.pendingRoom || u.roomConfirmed) return false;
        const firstChar = u.pendingRoom.charAt(0);
        const floor = parseInt(firstChar);
        const userFloorNum = parseInt(userFloor.split('_')[0]);
        return !isNaN(floor) && floor === userFloorNum;
      }).length
    : users.filter(u => u.pendingRoom && !u.roomConfirmed).length;

  const displayRoom = user?.room || '';
  const todayScore = displayRoom ? getTodayRoomScore(displayRoom) : undefined;
  const roomScores = displayRoom ? getRoomScores(displayRoom, statsPeriod) : [];

  const avgScore = roomScores.length > 0 
    ? Math.round((roomScores.reduce((sum, s) => sum + s.score, 0) / roomScores.length) * 10) / 10
    : null;

  const getScoreColor = (score: number): string => {
    if (score === 5) return 'bg-green-100 text-green-800 border-green-300';
    if (score === 4) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (score === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const confirmDeleteUser = () => {
    if (!deletingUserId) return;
    
    deleteUser(deletingUserId);
    toast({
      title: 'Удалено',
      description: 'Пользователь удалён',
    });
    
    setDeletingUserId(null);
  };

  const handleUpdatePositions = (userId: string, positions: UserPosition[]) => {
    updateUserPositions(userId, positions);
    toast({
      title: 'Успешно!',
      description: 'Должности обновлены',
    });
  };

  const handleChangeRoom = (newRoom: string) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      pendingRoom: newRoom,
      roomConfirmed: false,
    };
    
    updateUser(updatedUser);
    
    const roomNumber = parseInt(newRoom);
    const floor = Math.floor(roomNumber / 100);
    
    const floorHeadPosition = `floor_${floor}_head`;
    const floorHeads = users.filter(u => 
      u.positions?.includes(floorHeadPosition as any) ||
      u.positions?.includes('chairman' as any) ||
      u.positions?.includes('vice_chairman' as any) ||
      ['manager', 'admin', 'moderator'].includes(u.role)
    );
    
    if (floorHeads.length > 0) {
      const notificationText = user.room 
        ? `${user.name} запросил смену комнаты с ${user.room} на ${newRoom}`
        : `Новый участник ${user.name} запросил комнату ${newRoom}`;
      
      addAnnouncement({
        title: 'Новая заявка на комнату',
        content: notificationText,
        priority: 'high',
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleApproveRoom = (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate || !userToUpdate.pendingRoom) return;
    
    const updatedUser = {
      ...userToUpdate,
      room: userToUpdate.pendingRoom,
      pendingRoom: undefined,
      roomConfirmed: true,
    };
    
    updateUser(updatedUser);
  };

  const handleRejectRoom = (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    const updatedUser = {
      ...userToUpdate,
      pendingRoom: undefined,
      roomConfirmed: false,
    };
    
    updateUser(updatedUser);
  };

  const handleAddAnnouncement = (announcement: { title: string; content: string; priority: string; date: string }) => {
    addAnnouncement(announcement);
  };

  const handleEditAnnouncement = (id: number, updatedData: { title: string; content: string; priority: string }) => {
    updateAnnouncement(id, updatedData);
  };

  const handleDeleteAnnouncement = (id: number) => {
    deleteAnnouncement(id);
    setDeletingId(null);
    toast({
      title: 'Удалено',
      description: 'Объявление успешно удалено',
    });
  };

  const getRoleName = (role: string) => {
    const roles = {
      manager: 'Менеджер',
      admin: 'Администратор',
      moderator: 'Модератор',
      member: 'Участник',
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? 'destructive' : 'secondary';
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'default' : 'secondary';
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <Icon name="Home" size={18} className="sm:hidden text-primary-foreground" />
              <Icon name="Home" size={22} className="hidden sm:block text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold truncate">Студенческий портал</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Общежитие №5</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{getRoleName(user?.role || '')}</p>
            </div>
            <NotificationsPopover />
            <Button variant="ghost" size="icon" onClick={logout} className="shrink-0">
              <Icon name="LogOut" size={18} className="sm:hidden" />
              <Icon name="LogOut" size={20} className="hidden sm:block" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6 animate-fade-in">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Добро пожаловать, {user?.name}!</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{user?.room ? `Комната ${user.room} • ` : ''}{getRoleName(user?.role || '')}</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="animate-fade-in">
          <TabsList className={`grid w-full mb-6 h-auto p-1`} style={{
            gridTemplateColumns: `repeat(${[
              true,
              true,
              canSeeCleanlinessTab,
              hasCouncilAccess,
              canManageUsers
            ].filter(Boolean).length}, minmax(0, 1fr))`
          }}>
            <TabsTrigger value="home" className="gap-2 py-3">
              <Icon name="Home" size={18} />
              <span className="hidden sm:inline">Главная</span>
            </TabsTrigger>
            <TabsTrigger value="duties" className="gap-2 py-3">
              <Icon name="ClipboardList" size={18} />
              <span className="hidden sm:inline">Отработки</span>
            </TabsTrigger>
            {canSeeCleanlinessTab && (
              <TabsTrigger value="cleanliness" className="gap-2 py-3">
                <Icon name="Sparkles" size={18} />
                <span className="hidden sm:inline">Чистота</span>
              </TabsTrigger>
            )}
            {hasCouncilAccess && (
              <TabsTrigger value="council" className="gap-2 py-3">
                <Icon name="Award" size={18} />
                <span className="hidden sm:inline">Студсовет</span>
              </TabsTrigger>
            )}
            {canSeeAdminPanel && (
              <TabsTrigger value="admin" className="gap-2 py-3">
                <Icon name="Settings" size={18} />
                <span className="hidden sm:inline">Админ-панель</span>
                {pendingRoomsCount > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">
                    {pendingRoomsCount}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <Tabs defaultValue="notifications" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="notifications" className="gap-2">
                  <Icon name="Bell" size={18} />
                  Уведомления
                </TabsTrigger>
                <TabsTrigger value="profile" className="gap-2">
                  <Icon name="User" size={18} />
                  Профиль
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notifications" className="space-y-4">
                {canManageAnnouncements && (
                  <div className="mb-6 flex justify-end">
                    <CreateAnnouncementDialog onAdd={handleAddAnnouncement} />
                  </div>
                )}
                {announcements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="Bell" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Нет объявлений</p>
                  </div>
                )}
                {announcements.map((announcement, index) => (
                  <Card key={announcement.id} className="animate-slide-in hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 100}ms` }}>
                    <CardHeader className="p-4">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 w-full">
                          <CardTitle className="text-base sm:text-lg break-words">{announcement.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Icon name="Calendar" size={14} />
                            {formatDate(announcement.date)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center w-full sm:w-auto justify-between sm:justify-end">
                          <Badge variant={getPriorityColor(announcement.priority)} className="shrink-0">
                            {announcement.priority === 'high' ? 'Важно' : 'Обычное'}
                          </Badge>
                          {canManageAnnouncements && (
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingAnnouncement(announcement)}
                              >
                                <Icon name="Pencil" size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingId(announcement.id)}
                              >
                                <Icon name="Trash2" size={16} className="text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm sm:text-base text-muted-foreground break-words">{announcement.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Личная информация</CardTitle>
                    <CardDescription>Ваши данные в системе</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-3 sm:gap-4 text-sm">
                      <span className="text-muted-foreground">Имя:</span>
                      <span className="font-medium">{user?.name}</span>
                      
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{user?.email}</span>
                      
                      <span className="text-muted-foreground">Роль:</span>
                      <span className="font-medium">{getRoleName(user?.role || '')}</span>
                      
                      {user?.room && (
                        <>
                          <span className="text-muted-foreground">Комната:</span>
                          <span className="font-medium">{user.room}</span>
                        </>
                      )}

                      {user?.group && (
                        <>
                          <span className="text-muted-foreground">Группа:</span>
                          <span className="font-medium">{user.group}</span>
                        </>
                      )}

                      {user?.group && (
                        <>
                          <span className="text-muted-foreground">Курс:</span>
                          <span className="font-medium">{user.group.charAt(0)}</span>
                        </>
                      )}

                      {user?.studyYears && (
                        <>
                          <span className="text-muted-foreground">Срок обучения:</span>
                          <span className="font-medium">{user.studyYears} {user.studyYears === 1 ? 'год' : user.studyYears < 5 ? 'года' : 'лет'}</span>
                        </>
                      )}
                      
                      {user?.positions && user.positions.length > 0 && (
                        <>
                          <span className="text-muted-foreground">Должности:</span>
                          <div className="flex flex-wrap gap-2">
                            {user.positions.map((position) => (
                              <Badge key={position} variant="secondary">
                                {getPositionName(position)}
                              </Badge>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t mt-4">
                      <ChangeRoomDialog 
                        currentRoom={user?.room}
                        onChangeRoom={handleChangeRoom}
                      />
                      {user?.pendingRoom && !user?.roomConfirmed && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Icon name="Clock" size={16} className="text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-yellow-800 dark:text-yellow-300">Ожидает подтверждения</p>
                              <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                                Заявка на комнату {user.pendingRoom} отправлена на проверку старосте этажа
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {user?.room && (
                  <Card className="border-l-4 border-l-primary">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Icon name="Sparkles" size={20} />
                        Статистика чистоты комнаты
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          variant={statsPeriod === 'week' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatsPeriod('week')}
                        >
                          Неделя
                        </Button>
                        <Button
                          variant={statsPeriod === 'month' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatsPeriod('month')}
                        >
                          Месяц
                        </Button>
                        <Button
                          variant={statsPeriod === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStatsPeriod('all')}
                        >
                          Всё время
                        </Button>
                      </div>

                      {displayRoom && (
                        <>
                          {todayScore && (
                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                              <div>
                                <p className="text-sm font-medium mb-1">Оценка за сегодня</p>
                                <p className="text-xs text-muted-foreground">Комната {displayRoom} • {todayScore.inspector}</p>
                              </div>
                              <div className={`px-6 py-3 rounded-lg border-2 ${getScoreColor(todayScore.score)}`}>
                                <div className="text-3xl font-bold text-center">{todayScore.score}</div>
                              </div>
                            </div>
                          )}

                          {roomScores.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium">Средний балл</p>
                                  <p className="text-xs text-muted-foreground">
                                    {statsPeriod === 'week' ? 'За неделю' : statsPeriod === 'month' ? 'За месяц' : 'За всё время'}
                                  </p>
                                </div>
                                <div className={`px-6 py-3 rounded-lg border-2 ${avgScore ? getScoreColor(Math.round(avgScore)) : 'bg-gray-50'}`}>
                                  <div className="text-3xl font-bold text-center">{avgScore?.toFixed(1) || '—'}</div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <p className="text-sm font-medium">История оценок:</p>
                                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                  {roomScores.slice().reverse().map((score, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">{formatDate(score.date)}</span>
                                        <span className="text-xs text-muted-foreground">• {score.inspector}</span>
                                      </div>
                                      <Badge className={getScoreColor(score.score)}>{score.score}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {roomScores.length === 0 && !todayScore && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Нет данных за выбранный период
                            </p>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>



          <TabsContent value="duties" className="space-y-4">
            {mockDuties.map((duty, index) => (
              <Card key={duty.id} className="animate-slide-in hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{duty.task}</CardTitle>
                      <CardDescription className="mt-1">
                        {duty.student} • Комната {duty.room}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(duty.status)}>
                      {duty.status === 'completed' ? 'Выполнено' : 'В ожидании'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon name="Calendar" size={14} />
                    <span>Дата: {formatDate(duty.date)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {canSeeCleanlinessTab && (
            <TabsContent value="cleanliness" className="space-y-4">
              <CleanlinessPanel currentUser={user!} users={users} />
            </TabsContent>
          )}

          {canSeeAdminPanel && (
            <TabsContent value="admin" className="space-y-4">
              <AdminPanel
                users={users}
                currentUser={user!}
                onUpdateUser={updateUser}
                onDeleteUser={(userId) => setDeletingUserId(userId)}
                onCreateUser={createUser}
                onUpdatePositions={handleUpdatePositions}
                onApproveRoom={handleApproveRoom}
                onRejectRoom={handleRejectRoom}
                canManageUsers={canManageUsers}
                userFloor={userFloor}
              />
            </TabsContent>
          )}

          {hasCouncilAccess && (
            <TabsContent value="council" className="space-y-4">
              <CouncilPanel
                users={users}
                currentUser={user!}
              />
            </TabsContent>
          )}
        </Tabs>

        <EditAnnouncementDialog
          announcement={editingAnnouncement}
          open={!!editingAnnouncement}
          onOpenChange={(open) => !open && setEditingAnnouncement(null)}
          onEdit={handleEditAnnouncement}
        />
        
        <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Объявление будет удалено навсегда.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletingId && handleDeleteAnnouncement(deletingId)}>
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};