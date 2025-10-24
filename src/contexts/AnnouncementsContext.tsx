import React, { createContext, useContext, useState, useEffect } from 'react';

const ANNOUNCEMENTS_STORAGE_KEY = 'dormitory_announcements';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  date: string;
}

interface AnnouncementsContextType {
  announcements: Announcement[];
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

  useEffect(() => {
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
  }, [announcements]);

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
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AnnouncementsContext.Provider value={{
      announcements,
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
