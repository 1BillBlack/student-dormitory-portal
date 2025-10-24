import React, { createContext, useContext, useState, useEffect } from 'react';

const LOGS_STORAGE_KEY = 'dormitory_logs';

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
  | 'position_removed';

export interface Log {
  id: number;
  timestamp: string;
  action: LogAction;
  userId: string;
  userName: string;
  details: string;
  targetUserId?: string;
  targetUserName?: string;
}

interface LogsContextType {
  logs: Log[];
  addLog: (log: Omit<Log, 'id' | 'timestamp'>) => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export const LogsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<Log[]>(() => {
    const saved = localStorage.getItem(LOGS_STORAGE_KEY);
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
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  const addLog = (log: Omit<Log, 'id' | 'timestamp'>) => {
    const newLog: Log = {
      ...log,
      id: Date.now(),
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
  };

  return (
    <LogsContext.Provider value={{ logs, addLog }}>
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
