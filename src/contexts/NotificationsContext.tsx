import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export type NotificationType = 'room_request' | 'position_assigned' | 'task_assigned' | 'room_approved' | 'room_rejected' | 'work_shift_assigned' | 'work_shift_completed' | 'work_shift_deleted';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  user_id: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  loading: boolean;
  addNotification: (notification: { type: NotificationType; title: string; message: string; userId: string }) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => void;
  unreadCount: number;
  refreshNotifications: (userId: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async (userId: string) => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { notifications: loaded } = await api.notifications.getAll(userId);
      setNotifications(loaded);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNotification = async (notification: { type: NotificationType; title: string; message: string; userId: string }) => {
    try {
      const { notification: created } = await api.notifications.create(
        notification.userId,
        notification.type,
        notification.title,
        notification.message
      );
      setNotifications(prev => [created, ...prev]);
    } catch (error) {
      console.error('Failed to add notification:', error);
      throw error;
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      for (const notification of unreadNotifications) {
        await api.notifications.markAsRead(notification.id);
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const refreshNotifications = async (userId: string) => {
    await loadNotifications(userId);
  };

  return (
    <NotificationsContext.Provider value={{
      notifications,
      loading,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      unreadCount,
      refreshNotifications,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
