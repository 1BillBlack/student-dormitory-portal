export type UserRole = 'manager' | 'admin' | 'moderator' | 'member';

export type UserPosition = 
  | 'chairman'
  | 'vice_chairman'
  | 'cultural_sector'
  | 'household_sector'
  | 'sports_sector'
  | 'duty_supervisor'
  | 'secretary'
  | 'media_sector'
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
  group?: string;
  studyYears?: number;
  registeredAt?: string;
  pendingRoom?: string;
  roomConfirmed?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}