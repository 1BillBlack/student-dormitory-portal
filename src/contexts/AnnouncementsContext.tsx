import React, { createContext, useContext, useState, useEffect } from 'react';

const ANNOUNCEMENTS_STORAGE_KEY = 'dormitory_announcements';
const ARCHIVED_ANNOUNCEMENTS_STORAGE_KEY = 'dormitory_announcements_archive';

export type AnnouncementAudience = 'all' | 'floor_2' | 'floor_3' | 'floor_4' | 'floor_5' | 'council';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  date: string;
  expiresAt?: string;
  audience: AnnouncementAudience;
  createdBy?: string;
  archivedAt?: string;
}

interface AnnouncementsContextType {
  announcements: Announcement[];
  archivedAnnouncements: Announcement[];
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => void;
  updateAnnouncement: (id: number, data: Partial<Omit<Announcement, 'id'>>) => void;
  deleteAnnouncement: (id: number) => void;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

const initialAnnouncements: Announcement[] = [
  {
    id: 1,
    title: 'Добро пожаловать в студенческий портал!',
    content: 'Здесь вы можете отслеживать баллы чистоты своей комнаты, получать уведомления и многое другое.',
    priority: 'low',
    date: new Date().toISOString().split('T')[0],
    audience: 'all',
  },
];

export const AnnouncementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialAnnouncements;
      }
    }
    return initialAnnouncements;
  });

  const [archivedAnnouncements, setArchivedAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(ARCHIVED_ANNOUNCEMENTS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    const now = new Date().toISOString();
    const expired = announcements.filter(a => a.expiresAt && a.expiresAt <= now);
    const active = announcements.filter(a => !a.expiresAt || a.expiresAt > now);
    
    if (expired.length > 0) {
      const archived = expired.map(a => ({ ...a, archivedAt: now }));
      setArchivedAnnouncements(prev => [...archived, ...prev]);
      setAnnouncements(active);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString();
      setAnnouncements(prev => {
        const expired = prev.filter(a => a.expiresAt && a.expiresAt <= now);
        const active = prev.filter(a => !a.expiresAt || a.expiresAt > now);
        
        if (expired.length > 0) {
          const archived = expired.map(a => ({ ...a, archivedAt: now }));
          setArchivedAnnouncements(prevArchived => [...archived, ...prevArchived]);
        }
        
        return active;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    localStorage.setItem(ARCHIVED_ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(archivedAnnouncements));
  }, [archivedAnnouncements]);

  const addAnnouncement = (announcement: Omit<Announcement, 'id'>) => {
    const newAnnouncement = {
      id: Math.max(0, ...announcements.map(a => a.id)) + 1,
      ...announcement,
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const updateAnnouncement = (id: number, data: Partial<Omit<Announcement, 'id'>>) => {
    setAnnouncements(prev => prev.map(a => 
      a.id === id ? { ...a, ...data } : a
    ));
  };

  const deleteAnnouncement = (id: number) => {
    const announcement = announcements.find(a => a.id === id);
    if (announcement) {
      const archived = { ...announcement, archivedAt: new Date().toISOString() };
      setArchivedAnnouncements(prev => [archived, ...prev]);
    }
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AnnouncementsContext.Provider value={{
      announcements,
      archivedAnnouncements,
      addAnnouncement,
      updateAnnouncement,
      deleteAnnouncement,
    }}>
      {children}
    </AnnouncementsContext.Provider>
  );
};

export const useAnnouncements = () => {
  const context = useContext(AnnouncementsContext);
  if (context === undefined) {
    throw new Error('useAnnouncements must be used within an AnnouncementsProvider');
  }
  return context;
};