export type UserRole = 'manager' | 'admin' | 'chairman' | 'vice_chairman' | 'member';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  room?: string;
  isFrozen?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}