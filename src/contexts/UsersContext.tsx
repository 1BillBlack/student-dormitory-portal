import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserPosition } from '@/types/auth';
import { api } from '@/lib/api';

interface UsersContextType {
  users: User[];
  loading: boolean;
  getUserById: (id: string) => User | undefined;
  getUserByEmail: (email: string) => User | undefined;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  createUser: (user: User) => void;
  updateUserPositions: (userId: string, positions: UserPosition[]) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export const UsersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { users: loadedUsers } = await api.users.getAll();
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const getUserById = (id: string) => users.find(u => u.id === id);
  
  const getUserByEmail = (email: string) => users.find(u => u.email === email);

  const updateUser = async (updatedUser: User) => {
    try {
      await api.users.update(updatedUser.id, {
        name: updatedUser.name,
        room: updatedUser.room,
        group: updatedUser.group,
        role: updatedUser.role,
        positions: updatedUser.positions,
      });
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.users.delete(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  };

  const createUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const updateUserPositions = async (userId: string, positions: UserPosition[]) => {
    try {
      await api.users.update(userId, { positions });
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, positions } : u
      ));
    } catch (error) {
      console.error('Failed to update user positions:', error);
      throw error;
    }
  };

  const refreshUsers = async () => {
    await loadUsers();
  };

  return (
    <UsersContext.Provider value={{
      users,
      loading,
      getUserById,
      getUserByEmail,
      updateUser,
      deleteUser,
      createUser,
      updateUserPositions,
      refreshUsers,
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