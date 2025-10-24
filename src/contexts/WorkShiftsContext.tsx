import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

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
  loading: boolean;
  addWorkShift: (shift: Omit<WorkShift, 'id' | 'assignedAt' | 'completedDays'>) => Promise<void>;
  completeWorkShift: (id: number, days: number, completedBy: string, completedByName: string) => Promise<void>;
  deleteWorkShift: (id: number) => Promise<void>;
  getUserActiveShifts: (userId: string) => WorkShift[];
  getUserArchivedShifts: (userId: string) => WorkShift[];
  getUserTotalDays: (userId: string) => { remaining: number; completed: number };
  refreshWorkShifts: () => Promise<void>;
}

const WorkShiftsContext = createContext<WorkShiftsContextType | undefined>(undefined);

export const WorkShiftsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [archivedShifts, setArchivedShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkShifts = async () => {
    try {
      setLoading(true);
      const { workShifts: loadedShifts } = await api.workShifts.getAll();
      setWorkShifts(loadedShifts);
    } catch (error) {
      console.error('Failed to load work shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedShifts = async () => {
    try {
      const { archivedShifts: loaded } = await api.workShifts.getArchived();
      setArchivedShifts(loaded);
    } catch (error) {
      console.error('Failed to load archived shifts:', error);
    }
  };

  useEffect(() => {
    loadWorkShifts();
    loadArchivedShifts();
  }, []);

  useEffect(() => {
    const checkAndArchiveCompleted = async () => {
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
        const shiftsToArchive = workShifts.filter(s => 
          usersToArchive.includes(s.userId) && s.completedDays >= s.days
        );

        for (const shift of shiftsToArchive) {
          try {
            await api.workShifts.archive(shift.id);
          } catch (error) {
            console.error('Failed to archive shift:', error);
          }
        }

        await loadWorkShifts();
        await loadArchivedShifts();
      }
    };

    checkAndArchiveCompleted();
  }, [workShifts]);

  const addWorkShift = async (shift: Omit<WorkShift, 'id' | 'assignedAt' | 'completedDays'>) => {
    try {
      await api.workShifts.create({
        userId: shift.userId,
        userName: shift.userName,
        days: shift.days,
        assignedBy: shift.assignedBy,
        assignedByName: shift.assignedByName,
        reason: shift.reason,
      });
      await loadWorkShifts();
    } catch (error) {
      console.error('Failed to add work shift:', error);
      throw error;
    }
  };

  const completeWorkShift = async (id: number, days: number, completedBy: string, completedByName: string) => {
    try {
      await api.workShifts.complete(id, days, completedBy, completedByName);
      await loadWorkShifts();
    } catch (error) {
      console.error('Failed to complete work shift:', error);
      throw error;
    }
  };

  const deleteWorkShift = async (id: number) => {
    try {
      await api.workShifts.archive(id);
      await loadWorkShifts();
      await loadArchivedShifts();
    } catch (error) {
      console.error('Failed to delete work shift:', error);
      throw error;
    }
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

  const refreshWorkShifts = async () => {
    await loadWorkShifts();
    await loadArchivedShifts();
  };

  return (
    <WorkShiftsContext.Provider value={{
      workShifts,
      archivedShifts,
      loading,
      addWorkShift,
      completeWorkShift,
      deleteWorkShift,
      getUserActiveShifts,
      getUserArchivedShifts,
      getUserTotalDays,
      refreshWorkShifts,
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
