import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export type LogAction = 
  | 'room_request_created'
  | 'room_request_approved'
  | 'room_request_rejected'
  | 'room_changed'
  | 'announcement_created'
  | 'announcement_deleted'
  | 'announcement_updated'
  | 'task_created'
  | 'task_deleted'
  | 'task_updated'
  | 'role_assigned'
  | 'role_removed'
  | 'position_assigned'
  | 'position_removed'
  | 'work_shift_assigned'
  | 'work_shift_completed'
  | 'work_shift_deleted';

export interface Log {
  id: number;
  created_at: string;
  action: LogAction;
  user_id: string;
  user_name: string;
  details: string;
  target_user_id?: string;
  target_user_name?: string;
}

interface LogsContextType {
  logs: Log[];
  loading: boolean;
  addLog: (log: { action: LogAction; userId: string; userName: string; details: string; targetUserId?: string; targetUserName?: string }) => Promise<void>;
  deleteLog: (id: number) => void;
  clearAllLogs: () => void;
  refreshLogs: () => Promise<void>;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export const LogsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { logs: loaded } = await api.logs.getAll(100);
      setLogs(loaded);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const addLog = async (log: { action: LogAction; userId: string; userName: string; details: string; targetUserId?: string; targetUserName?: string }) => {
    try {
      const { log: created } = await api.logs.create(log);
      setLogs(prev => [created, ...prev]);
    } catch (error) {
      console.error('Failed to add log:', error);
    }
  };

  const deleteLog = (id: number) => {
    setLogs(prev => prev.filter(log => log.id !== id));
  };

  const clearAllLogs = () => {
    setLogs([]);
  };

  const refreshLogs = async () => {
    await loadLogs();
  };

  return (
    <LogsContext.Provider value={{ 
      logs, 
      loading,
      addLog, 
      deleteLog, 
      clearAllLogs,
      refreshLogs 
    }}>
      {children}
    </LogsContext.Provider>
  );
};

export const useLogs = () => {
  const context = useContext(LogsContext);
  if (!context) {
    throw new Error('useLogs must be used within LogsProvider');
  }
  return context;
};
