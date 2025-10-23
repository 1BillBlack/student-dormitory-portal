export type UserRole = 'manager' | 'admin' | 'chairman' | 'vice_chairman' | 'member';

export type UserPosition = 
  | 'cultural_sector'
  | 'household_sector'
  | 'sports_sector'
  | 'duty_supervisor'
  | 'floor_2_head'
  | 'floor_3_head'
  | 'floor_4_head'
  | 'floor_5_head'
  | 'floor_2_cleanliness'
  | 'floor_3_cleanliness'
  | 'floor_4_cleanliness'
  | 'floor_5_cleanliness';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  positions?: UserPosition[];
  room?: string;
  isFrozen?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}