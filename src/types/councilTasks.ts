import { UserPosition } from './auth';

export interface Task {
  id: number;
  title: string;
  description: string;
  assignedToUsers: string[];
  assignedToPositions: UserPosition[];
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}
