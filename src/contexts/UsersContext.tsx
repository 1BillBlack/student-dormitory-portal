import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserPosition } from '@/types/auth';

const USERS_STORAGE_KEY = 'dormitory_users';

const initialUsers: User[] = [
  { id: '1', email: 'manager@dorm.ru', name: 'Алексей Менеджеров', role: 'manager', room: '101', isFrozen: false, positions: [] },
  { id: '2', email: 'admin@dorm.ru', name: 'Мария Администраторова', role: 'admin', room: '205', isFrozen: false, positions: [] },
  { id: '3', email: 'chairman@dorm.ru', name: 'Иван Председателев', role: 'chairman', room: '310', isFrozen: false, positions: ['cultural_sector'] },
  { id: '4', email: 'vice@dorm.ru', name: 'Елена Заместителева', role: 'vice_chairman', room: '415', isFrozen: false, positions: ['sports_sector'] },
  { id: '5', email: 'member@dorm.ru', name: 'Петр Участников', role: 'member', room: '520', isFrozen: false, positions: [] },
];

interface UsersContextType {
  users: User[];
  getUserById: (id: string) => User | undefined;
  getUserByEmail: (email: string) => User | undefined;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  createUser: (user: User) => void;
  updateUserPositions: (userId: string, positions: UserPosition[]) => void;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialUsers;
      }
    }
    return initialUsers;
  });

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const getUserById = (id: string) => users.find(u => u.id === id);
  
  const getUserByEmail = (email: string) => users.find(u => u.email === email);

  const updateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const createUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const updateUserPositions = (userId: string, positions: UserPosition[]) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, positions } : u
    ));
  };

  return (
    <UsersContext.Provider value={{
      users,
      getUserById,
      getUserByEmail,
      updateUser,
      deleteUser,
      createUser,
      updateUserPositions,
    }}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};
