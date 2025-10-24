import { UserRole } from '@/types/auth';

export const ROLE_HIERARCHY: UserRole[] = [
  'manager',
  'admin',
  'moderator',
  'member',
];

export const getRoleRank = (role: UserRole): number => {
  const index = ROLE_HIERARCHY.indexOf(role);
  return index === -1 ? 999 : index;
};

export const canManageUser = (currentUserRole: UserRole, targetUserRole: UserRole): boolean => {
  const currentRank = getRoleRank(currentUserRole);
  const targetRank = getRoleRank(targetUserRole);
  return currentRank < targetRank;
};

export const canManageRole = (currentUserRole: UserRole, targetRole: UserRole): boolean => {
  const currentRank = getRoleRank(currentUserRole);
  const targetRoleRank = getRoleRank(targetRole);
  return currentRank < targetRoleRank;
};
