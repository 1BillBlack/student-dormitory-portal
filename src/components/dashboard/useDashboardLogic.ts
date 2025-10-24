import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUsers } from '@/contexts/UsersContext';
import { useAnnouncements } from '@/contexts/AnnouncementsContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useLogs } from '@/contexts/LogsContext';
import { useToast } from '@/hooks/use-toast';
import { UserPosition } from '@/types/auth';
import { getPositionName } from '@/utils/positions';

type TabType = 'home' | 'notifications' | 'profile' | 'duties' | 'cleanliness' | 'admin' | 'council' | 'workshifts';

export const useDashboardLogic = () => {
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

  const canSeeAnnouncement = (announcement: any) => {
    if (['manager', 'admin', 'moderator'].includes(user?.role || '')) return true;
    
    const isLeadership = user?.positions?.some(p => 
      ['chairman', 'vice_chairman', 'secretary'].includes(p)
    );
    if (isLeadership) return true;
    
    if (announcement.createdBy === user?.id) return true;
    
    if (announcement.audience === 'all') return true;
    
    if (announcement.audience === 'council') {
      return hasCouncilAccess;
    }
    
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

  return {
    activeTab,
    setActiveTab,
    editingAnnouncement,
    setEditingAnnouncement,
    deletingId,
    setDeletingId,
    deletingUserId,
    setDeletingUserId,
    statsPeriod,
    setStatsPeriod,
    user,
    logout,
    users,
    announcements: filteredAnnouncements,
    canCreateAnnouncements,
    canManageUsers,
    hasCouncilAccess,
    canSeeCleanlinessTab,
    canSeeAdminPanel,
    isFloorManager,
    canViewLogs,
    userFloor,
    pendingRoomsCount,
    confirmDeleteUser,
    handleUpdateUser,
    handleUpdatePositions,
    handleChangeRoom,
    handleApproveRoom,
    handleRejectRoom,
    handleAddAnnouncement,
    handleEditAnnouncement,
    handleDeleteAnnouncement,
    canEditAnnouncement,
    getAvailableAudiences,
    createUser,
  };
};
