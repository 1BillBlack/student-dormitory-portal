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
import { useNotifications } from '@/contexts/NotificationsContext';
import { useLogs } from '@/contexts/LogsContext';
import { CreateAnnouncementDialog } from '@/components/CreateAnnouncementDialog';
import { EditAnnouncementDialog } from '@/components/EditAnnouncementDialog';
import { AdminPanel } from '@/components/AdminPanel';
import { CouncilPanel } from '@/components/CouncilPanel';
import { CleanlinessPanel } from '@/components/CleanlinessPanel';
import { WorkShiftsPanel } from '@/components/WorkShiftsPanel';
import { UserManagementDialog } from '@/components/UserManagementDialog';
import { ChangeRoomDialog } from '@/components/ChangeRoomDialog';
import { NotificationsPopover } from '@/components/NotificationsPopover';
import { useToast } from '@/hooks/use-toast';
import { UserPosition } from '@/types/auth';
import { getPositionName, sortPositionsByRank } from '@/utils/positions';
import { getTodayRoomScore, getRoomScores } from '@/components/CleanlinessPanel';

type TabType = 'home' | 'notifications' | 'profile' | 'duties' | 'cleanliness' | 'admin' | 'council' | 'workshifts';





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
  const { addNotification } = useNotifications();
  const { addLog } = useLogs();
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const canCreateAnnouncements = 
    ['manager', 'admin', 'moderator'].includes(user?.role || '') ||
    user?.positions?.some(p => 
      ['media_sector', 'sports_sector', 'cultural_sector', 'duty_sector'].includes(p) ||
      p.startsWith('floor_')
    );
  const canManageUsers = ['manager', 'admin', 'moderator'].includes(user?.role || '');
  const hasCouncilAccess = 
    ['manager', 'admin', 'moderator'].includes(user?.role || '') ||
    (user?.positions && user.positions.length > 0);
  const canSeeCleanlinessTab = 
    ['manager', 'admin', 'moderator'].includes(user?.role || '') || user?.room;

  const isFloorManager = user?.positions?.some(p => p.startsWith('floor_'));
  const canSeeAdminPanel = canManageUsers || isFloorManager;
  
  const canViewLogs = 
    ['manager', 'admin', 'moderator'].includes(user?.role || '') ||
    user?.positions?.some(p => 
      ['chairman', 'vice_chairman', 'secretary'].includes(p)
    );
  
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

  const confirmDeleteUser = async () => {
    if (!deletingUserId) return;
    
    try {
      await deleteUser(deletingUserId);
      toast({
        title: 'Удалено',
        description: 'Пользователь удалён',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить пользователя',
        variant: 'destructive',
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleUpdateUser = (updatedUser: any) => {
    const oldUser = users.find(u => u.id === updatedUser.id);
    
    if (oldUser && oldUser.role !== updatedUser.role) {
      const roleNames = {
        manager: 'Менеджер',
        admin: 'Администратор',
        moderator: 'Модератор',
        member: 'Участник',
      };
      
      const oldRoleName = roleNames[oldUser.role as keyof typeof roleNames] || oldUser.role;
      const newRoleName = roleNames[updatedUser.role as keyof typeof roleNames] || updatedUser.role;
      
      addLog({
        action: 'role_assigned',
        userId: user?.id || '',
        userName: user?.name || '',
        details: `Изменил роль с "${oldRoleName}" на "${newRoleName}"`,
        targetUserId: updatedUser.id,
        targetUserName: updatedUser.name,
      });
    }
    
    if (oldUser && oldUser.room !== updatedUser.room && updatedUser.room) {
      addLog({
        action: 'room_changed',
        userId: user?.id || '',
        userName: user?.name || '',
        details: oldUser.room 
          ? `Сменил комнату с ${oldUser.room} на ${updatedUser.room}`
          : `Назначил комнату ${updatedUser.room}`,
        targetUserId: updatedUser.id,
        targetUserName: updatedUser.name,
      });
    }
    
    updateUser(updatedUser);
  };

  const handleUpdatePositions = (userId: string, positions: UserPosition[]) => {
    const targetUser = users.find(u => u.id === userId);
    const oldPositions = targetUser?.positions || [];
    const newPositions = positions.filter(p => !oldPositions.includes(p));
    const removedPositions = oldPositions.filter(p => !positions.includes(p));
    
    updateUserPositions(userId, positions);
    toast({
      title: 'Успешно!',
      description: 'Должности обновлены',
    });
    
    if (newPositions.length > 0 && targetUser) {
      const positionNames = newPositions.map(p => getPositionName(p)).join(', ');
      addNotification({
        type: 'position_assigned',
        title: 'Новая должность',
        message: `Вам назначена новая должность: ${positionNames}`,
        userId: targetUser.id,
      });
      
      addLog({
        action: 'position_assigned',
        userId: user?.id || '',
        userName: user?.name || '',
        details: `Назначил должность: ${positionNames}`,
        targetUserId: targetUser.id,
        targetUserName: targetUser.name,
      });
    }
    
    if (removedPositions.length > 0 && targetUser) {
      const positionNames = removedPositions.map(p => getPositionName(p)).join(', ');
      
      addLog({
        action: 'position_removed',
        userId: user?.id || '',
        userName: user?.name || '',
        details: `Снял должность: ${positionNames}`,
        targetUserId: targetUser.id,
        targetUserName: targetUser.name,
      });
    }
  };

  const handleChangeRoom = (newRoom: string) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      pendingRoom: newRoom,
      roomConfirmed: false,
    };
    
    updateUser(updatedUser);
    
    addLog({
      action: 'room_request_created',
      userId: user.id,
      userName: user.name,
      details: user.room 
        ? `Запросил смену комнаты с ${user.room} на ${newRoom}`
        : `Запросил комнату ${newRoom}`,
    });
    
    const roomNumber = parseInt(newRoom);
    const floor = Math.floor(roomNumber / 100);
    
    const firstChar = newRoom.charAt(0);
    const floorNum = parseInt(firstChar);
    
    if (!isNaN(floorNum) && floorNum >= 2 && floorNum <= 5) {
      const floorHeadPosition = `floor_${floorNum}_head`;
      const floorHead = users.find(u => 
        u.positions?.includes(floorHeadPosition as any)
      );
      
      if (floorHead) {
        const notificationText = user.room 
          ? `${user.name} запросил смену комнаты с ${user.room} на ${newRoom}`
          : `Новый участник ${user.name} запросил комнату ${newRoom}`;
        
        addNotification({
          type: 'room_request',
          title: 'Новая заявка на комнату',
          message: notificationText,
          userId: floorHead.id,
        });
      }
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
    
    addLog({
      action: 'room_request_approved',
      userId: user?.id || '',
      userName: user?.name || '',
      details: `Одобрил заявку на комнату ${userToUpdate.pendingRoom}`,
      targetUserId: userToUpdate.id,
      targetUserName: userToUpdate.name,
    });
    
    addNotification({
      type: 'room_approved',
      title: 'Комната подтверждена',
      message: `Ваша заявка на комнату ${userToUpdate.pendingRoom} одобрена`,
      userId: userToUpdate.id,
    });
  };

  const handleRejectRoom = (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;
    
    const rejectedRoom = userToUpdate.pendingRoom;
    
    const updatedUser = {
      ...userToUpdate,
      pendingRoom: undefined,
      roomConfirmed: false,
    };
    
    updateUser(updatedUser);
    
    addLog({
      action: 'room_request_rejected',
      userId: user?.id || '',
      userName: user?.name || '',
      details: `Отклонил заявку на комнату ${rejectedRoom}`,
      targetUserId: userToUpdate.id,
      targetUserName: userToUpdate.name,
    });
    
    addNotification({
      type: 'room_rejected',
      title: 'Заявка отклонена',
      message: `Ваша заявка на комнату ${rejectedRoom} была отклонена`,
      userId: userToUpdate.id,
    });
  };

  const handleAddAnnouncement = (announcement: any) => {
    addAnnouncement({
      ...announcement,
      createdBy: user?.id,
    });
    
    addLog({
      action: 'announcement_created',
      userId: user?.id || '',
      userName: user?.name || '',
      details: `Создал объявление "${announcement.title}" для аудитории ${getAudienceName(announcement.audience)}`,
    });
  };

  const handleEditAnnouncement = (id: number, updatedData: any) => {
    const announcement = announcements.find(a => a.id === id);
    updateAnnouncement(id, updatedData);
    
    if (announcement) {
      addLog({
        action: 'announcement_updated',
        userId: user?.id || '',
        userName: user?.name || '',
        details: `Отредактировал объявление "${announcement.title}"`,
      });
    }
  };

  const handleDeleteAnnouncement = (id: number) => {
    const announcement = announcements.find(a => a.id === id);
    deleteAnnouncement(id);
    setDeletingId(null);
    
    if (announcement) {
      addLog({
        action: 'announcement_deleted',
        userId: user?.id || '',
        userName: user?.name || '',
        details: `Удалил объявление "${announcement.title}"`,
      });
    }
    
    toast({
      title: 'Удалено',
      description: 'Объявление успешно удалено',
    });
  };

  const getAudienceName = (audience: string) => {
    const audiences: Record<string, string> = {
      all: 'Для всех',
      floor_2: '2 этаж',
      floor_3: '3 этаж',
      floor_4: '4 этаж',
      floor_5: '5 этаж',
      council: 'Студсовет',
    };
    return audiences[audience] || 'Для всех';
  };

  const canSeeAnnouncement = (announcement: any) => {
    // Админы, модераторы и менеджеры видят всё
    if (['manager', 'admin', 'moderator'].includes(user?.role || '')) return true;
    
    // Руководство студсовета видит всё
    const isLeadership = user?.positions?.some(p => 
      ['chairman', 'vice_chairman', 'secretary'].includes(p)
    );
    if (isLeadership) return true;
    
    // Автор всегда видит своё объявление
    if (announcement.createdBy === user?.id) return true;
    
    // Для всех
    if (announcement.audience === 'all') return true;
    
    // Только студсовет
    if (announcement.audience === 'council') {
      return hasCouncilAccess;
    }
    
    // Этажи
    if (announcement.audience.startsWith('floor_')) {
      const floor = announcement.audience.split('_')[1];
      const userFloorNum = user?.room ? user.room.charAt(0) : null;
      return userFloorNum === floor;
    }
    
    return false;
  };

  const canEditAnnouncement = (announcement: any) => {
    if (['manager', 'admin', 'moderator'].includes(user?.role || '')) return true;
    return announcement.createdBy === user?.id;
  };

  const getAvailableAudiences = () => {
    if (['manager', 'admin', 'moderator'].includes(user?.role || '')) {
      return ['all', 'floor_2', 'floor_3', 'floor_4', 'floor_5', 'council'];
    }
    
    const hasSectorPosition = user?.positions?.some(p => 
      ['media_sector', 'sports_sector', 'cultural_sector', 'duty_sector'].includes(p)
    );
    
    if (hasSectorPosition) {
      return ['all', 'floor_2', 'floor_3', 'floor_4', 'floor_5'];
    }
    
    const floorPosition = user?.positions?.find(p => p.startsWith('floor_'));
    if (floorPosition) {
      const floorNum = floorPosition.split('_')[1];
      return [`floor_${floorNum}`];
    }
    
    return [];
  };

  const filteredAnnouncements = announcements.filter(canSeeAnnouncement);

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
              canSeeAdminPanel
            ].filter(Boolean).length}, minmax(0, 1fr))`
          }}>
            <TabsTrigger value="home" className="gap-2 py-3">
              <Icon name="Home" size={18} />
              <span className="hidden sm:inline">Главная</span>
            </TabsTrigger>
            {canSeeCleanlinessTab && (
              <TabsTrigger value="cleanliness" className="gap-2 py-3">
                <Icon name="Sparkles" size={18} />
                <span className="hidden sm:inline">Чистота</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="workshifts" className="gap-2 py-3">
              <Icon name="Briefcase" size={18} />
              <span className="hidden sm:inline">Отработки</span>
            </TabsTrigger>
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
                  <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center">
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
                {canCreateAnnouncements && (
                  <div className="mb-6 flex justify-end">
                    <CreateAnnouncementDialog 
                      onAdd={handleAddAnnouncement}
                      availableAudiences={getAvailableAudiences() as any}
                    />
                  </div>
                )}
                {filteredAnnouncements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="Bell" size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Нет объявлений</p>
                  </div>
                )}
                {filteredAnnouncements.map((announcement, index) => (
                  <Card key={announcement.id} className="animate-slide-in hover:shadow-lg transition-shadow" style={{ animationDelay: `${index * 100}ms` }}>
                    <CardHeader className="p-4">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 w-full">
                          <CardTitle className="text-base sm:text-lg break-words">{announcement.title}</CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                              <Icon name="Calendar" size={14} />
                              {formatDate(announcement.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon name="Users" size={14} />
                              {getAudienceName(announcement.audience)}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                          <Badge variant={getPriorityColor(announcement.priority)} className="shrink-0">
                            {announcement.priority === 'high' ? 'Важно' : 'Обычное'}
                          </Badge>
                          {canEditAnnouncement(announcement) && (
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
                            {sortPositionsByRank(user.positions).map((position) => (
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



          <TabsContent value="workshifts" className="space-y-4">
            <WorkShiftsPanel currentUser={user!} />
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
                onUpdateUser={handleUpdateUser}
                onDeleteUser={(userId) => setDeletingUserId(userId)}
                onCreateUser={createUser}
                onUpdatePositions={handleUpdatePositions}
                onApproveRoom={handleApproveRoom}
                onRejectRoom={handleRejectRoom}
                canManageUsers={canManageUsers}
                canViewLogs={canViewLogs}
                userFloor={userFloor}
              />
            </TabsContent>
          )}

          {hasCouncilAccess && (
            <TabsContent value="council" className="space-y-4">
              <CouncilPanel
                users={users}
                currentUser={user!}
                onTaskCreated={(title) => addLog({
                  action: 'task_created',
                  userId: user?.id || '',
                  userName: user?.name || '',
                  details: `Создал задачу "${title}"`,
                })}
                onTaskUpdated={(title) => addLog({
                  action: 'task_updated',
                  userId: user?.id || '',
                  userName: user?.name || '',
                  details: `Обновил задачу "${title}"`,
                })}
                onTaskDeleted={(title) => addLog({
                  action: 'task_deleted',
                  userId: user?.id || '',
                  userName: user?.name || '',
                  details: `Удалил задачу "${title}"`,
                })}
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