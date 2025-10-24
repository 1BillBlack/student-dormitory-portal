import { User } from '@/types/auth';

export const getCourseFromGroup = (group: string): number | null => {
  const firstChar = group.charAt(0);
  const course = parseInt(firstChar);
  
  if (isNaN(course)) {
    return null;
  }
  
  return course;
};

export const updateGroupCourse = (group: string, newCourse: number): string => {
  return newCourse + group.slice(1);
};

export const shouldDeleteUser = (user: User): boolean => {
  if (!user.group || !user.studyYears || !user.registeredAt) {
    return false;
  }

  const currentCourse = getCourseFromGroup(user.group);
  if (currentCourse === null) {
    return false;
  }

  const registrationDate = new Date(user.registeredAt);
  const currentDate = new Date();
  
  const yearsSinceRegistration = currentDate.getFullYear() - registrationDate.getFullYear();
  const isAfterAugust31 = currentDate.getMonth() > 7 || (currentDate.getMonth() === 7 && currentDate.getDate() >= 31);
  
  const adjustedYears = isAfterAugust31 ? yearsSinceRegistration : yearsSinceRegistration - 1;
  
  return adjustedYears >= user.studyYears;
};

export const shouldUpdateCourse = (user: User): boolean => {
  if (!user.group || !user.studyYears || !user.registeredAt) {
    return false;
  }

  const currentCourse = getCourseFromGroup(user.group);
  if (currentCourse === null) {
    return false;
  }

  const registrationDate = new Date(user.registeredAt);
  const currentDate = new Date();
  
  const yearsSinceRegistration = currentDate.getFullYear() - registrationDate.getFullYear();
  const isAfterAugust31 = currentDate.getMonth() > 7 || (currentDate.getMonth() === 7 && currentDate.getDate() >= 31);
  
  const adjustedYears = isAfterAugust31 ? yearsSinceRegistration : yearsSinceRegistration - 1;
  
  return adjustedYears < user.studyYears && adjustedYears > 0;
};

export const getUpdatedUser = (user: User): User | null => {
  if (shouldDeleteUser(user)) {
    return null;
  }

  if (!shouldUpdateCourse(user) || !user.group || !user.registeredAt) {
    return user;
  }

  const currentCourse = getCourseFromGroup(user.group);
  if (currentCourse === null) {
    return user;
  }

  const registrationDate = new Date(user.registeredAt);
  const currentDate = new Date();
  
  const yearsSinceRegistration = currentDate.getFullYear() - registrationDate.getFullYear();
  const isAfterAugust31 = currentDate.getMonth() > 7 || (currentDate.getMonth() === 7 && currentDate.getDate() >= 31);
  
  const adjustedYears = isAfterAugust31 ? yearsSinceRegistration : yearsSinceRegistration - 1;
  
  const newCourse = currentCourse + adjustedYears;
  
  if (newCourse > user.studyYears!) {
    return null;
  }

  return {
    ...user,
    group: updateGroupCourse(user.group, newCourse),
  };
};

export const processAllUsers = (users: User[]): { 
  updatedUsers: User[]; 
  deletedUserIds: string[] 
} => {
  const updatedUsers: User[] = [];
  const deletedUserIds: string[] = [];

  users.forEach(user => {
    const result = getUpdatedUser(user);
    
    if (result === null) {
      deletedUserIds.push(user.id);
    } else {
      updatedUsers.push(result);
    }
  });

  return { updatedUsers, deletedUserIds };
};
