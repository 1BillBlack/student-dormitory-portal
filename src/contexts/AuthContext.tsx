import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types/auth';
import { useUsers } from '@/contexts/UsersContext';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProviderInner: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getUserByEmail } = useUsers();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    
    if (savedUser) {
      setAuthState({
        user: JSON.parse(savedUser),
        isAuthenticated: true,
      });
    } else if (sessionUser) {
      setAuthState({
        user: JSON.parse(sessionUser),
        isAuthenticated: true,
      });
    }
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const mockUser = getUserByEmail(email) || {
      id: Date.now().toString(),
      email,
      name: email.split('@')[0],
      role: 'member' as const,
      room: '999',
      positions: [],
      isFrozen: false,
    };

    setAuthState({
      user: mockUser,
      isAuthenticated: true,
    });

    if (rememberMe) {
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('user_expiry', expiryDate.toISOString());
    } else {
      sessionStorage.setItem('user', JSON.stringify(mockUser));
    }
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('user');
    localStorage.removeItem('user_expiry');
    sessionStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthProviderInner>{children}</AuthProviderInner>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};