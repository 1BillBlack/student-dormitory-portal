import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    const mockUser: User = {
      id: '1',
      email,
      name: 'Иван Петров',
      role: 'admin',
      room: '305',
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
