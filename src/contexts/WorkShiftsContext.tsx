import React, { createContext, useContext, useState, useEffect } from 'react';

const WORK_SHIFTS_STORAGE_KEY = 'dormitory_work_shifts';
const WORK_SHIFTS_ARCHIVE_KEY = 'dormitory_work_shifts_archive';

export interface WorkShift {
  id: number;
  userId: string;
  userName: string;
  days: number;
  assignedBy: string;
  assignedByName: string;
  assignedAt: string;
  completedDays: number;
  completedBy?: string;
  completedByName?: string;
  completedAt?: string;
  reason: string;
  archivedAt?: string;
}

interface WorkShiftsContextType {
  workShifts: WorkShift[];
  archivedShifts: WorkShift[];
  addWorkShift: (shift: Omit<WorkShift, 'id' | 'assignedAt' | 'completedDays'>) => void;
  completeWorkShift: (id: number, days: number, completedBy: string, completedByName: string) => void;
  deleteWorkShift: (id: number) => void;
  getUserActiveShifts: (userId: string) => WorkShift[];
  getUserArchivedShifts: (userId: string) => WorkShift[];
  getUserTotalDays: (userId: string) => { remaining: number; completed: number };
}

const WorkShiftsContext = createContext<WorkShiftsContextType | undefined>(undefined);

export const WorkShiftsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workShifts, setWorkShifts] = useState<WorkShift[]>(() => {
    const saved = localStorage.getItem(WORK_SHIFTS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [archivedShifts, setArchivedShifts] = useState<WorkShift[]>(() => {
    const saved = localStorage.getItem(WORK_SHIFTS_ARCHIVE_KEY);
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
    localStorage.setItem(WORK_SHIFTS_STORAGE_KEY, JSON.stringify(workShifts));
  }, [workShifts]);

  useEffect(() => {
    localStorage.setItem(WORK_SHIFTS_ARCHIVE_KEY, JSON.stringify(archivedShifts));
  }, [archivedShifts]);

  useEffect(() => {
    const checkAndArchiveCompleted = () => {
      const completed = workShifts.filter(s => s.completedDays >= s.days);
      if (completed.length === 0) return;

      const userCompletedMap = new Map<string, WorkShift[]>();
      completed.forEach(shift => {
        if (!userCompletedMap.has(shift.userId)) {
          userCompletedMap.set(shift.userId, []);
        }
        userCompletedMap.get(shift.userId)!.push(shift);
      });

      const usersToArchive: string[] = [];
      userCompletedMap.forEach((shifts, userId) => {
        const userActiveShifts = workShifts.filter(s => s.userId === userId && s.completedDays < s.days);
        if (userActiveShifts.length === 0) {
          usersToArchive.push(userId);
        }
      });

      if (usersToArchive.length > 0) {
        const now = new Date().toISOString();
        const toArchive = workShifts.filter(s => 
          usersToArchive.includes(s.userId) && s.completedDays >= s.days
        ).map(s => ({ ...s, archivedAt: now }));

        setArchivedShifts(prev => [...toArchive, ...prev]);
        setWorkShifts(prev => prev.filter(s => 
          !usersToArchive.includes(s.userId) || s.completedDays < s.days
        ));
      }
    };

    checkAndArchiveCompleted();
  }, [workShifts]);

  const addWorkShift = (shift: Omit<WorkShift, 'id' | 'assignedAt' | 'completedDays'>) => {
    const newShift: WorkShift = {
      ...shift,
      id: Date.now(),
      assignedAt: new Date().toISOString(),
      completedDays: 0,
    };
    setWorkShifts(prev => [newShift, ...prev]);
  };

  const completeWorkShift = (id: number, days: number, completedBy: string, completedByName: string) => {
    setWorkShifts(prev => prev.map(shift => {
      if (shift.id === id) {
        const newCompletedDays = Math.min(shift.completedDays + days, shift.days);
        return {
          ...shift,
          completedDays: newCompletedDays,
          completedBy,
          completedByName,
          completedAt: new Date().toISOString(),
        };
      }
      return shift;
    }));
  };

  const deleteWorkShift = (id: number) => {
    setWorkShifts(prev => prev.filter(shift => shift.id !== id));
  };

  const getUserActiveShifts = (userId: string) => {
    return workShifts.filter(shift => 
      shift.userId === userId && shift.completedDays < shift.days
    );
  };

  const getUserArchivedShifts = (userId: string) => {
    return archivedShifts.filter(shift => shift.userId === userId);
  };

  const getUserTotalDays = (userId: string) => {
    const userShifts = workShifts.filter(shift => shift.userId === userId);
    const remaining = userShifts.reduce((sum, shift) => 
      sum + (shift.days - shift.completedDays), 0
    );
    const completed = userShifts.reduce((sum, shift) => 
      sum + shift.completedDays, 0
    );
    return { remaining, completed };
  };

  return (
    <WorkShiftsContext.Provider value={{
      workShifts,
      archivedShifts,
      addWorkShift,
      completeWorkShift,
      deleteWorkShift,
      getUserActiveShifts,
      getUserArchivedShifts,
      getUserTotalDays,
    }}>
      {children}
    </WorkShiftsContext.Provider>
  );
};

export const useWorkShifts = () => {
  const context = useContext(WorkShiftsContext);
  if (!context) {
    throw new Error('useWorkShifts must be used within WorkShiftsProvider');
  }
  return context;
};