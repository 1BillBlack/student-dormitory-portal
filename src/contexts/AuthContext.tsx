import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types/auth';
import { api } from '@/lib/api';

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
    
    const userToRestore = savedUser || sessionUser;
    
    if (userToRestore) {
      const parsedUser = JSON.parse(userToRestore);
      
      setAuthState({
        user: parsedUser,
        isAuthenticated: true,
      });
    }
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const { user } = await api.users.login(email, password);

      setAuthState({
        user: user,
        isAuthenticated: true,
      });

      if (rememberMe) {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_expiry', expiryDate.toISOString());
      } else {
        sessionStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error: any) {
      throw new Error(error.message || 'Неверный email или пароль');
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
