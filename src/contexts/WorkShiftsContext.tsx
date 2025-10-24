import React, { createContext, useContext, useState, useEffect } from 'react';

const WORK_SHIFTS_STORAGE_KEY = 'dormitory_work_shifts';

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
}

interface WorkShiftsContextType {
  workShifts: WorkShift[];
  addWorkShift: (shift: Omit<WorkShift, 'id' | 'assignedAt' | 'completedDays'>) => void;
  completeWorkShift: (id: number, days: number, completedBy: string, completedByName: string) => void;
  deleteWorkShift: (id: number) => void;
  getUserActiveShifts: (userId: string) => WorkShift[];
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

  useEffect(() => {
    localStorage.setItem(WORK_SHIFTS_STORAGE_KEY, JSON.stringify(workShifts));
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
      addWorkShift,
      completeWorkShift,
      deleteWorkShift,
      getUserActiveShifts,
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
