import { api } from '@/lib/api';

export const migrateDataFromLocalStorage = async () => {
  const migrationStatus = {
    users: false,
    workShifts: false,
    notifications: false,
    logs: false,
    errors: [] as string[],
  };

  try {
    const usersData = localStorage.getItem('dormitory_users');
    if (usersData) {
      try {
        const users = JSON.parse(usersData);
        console.log('Migrating users:', users.length);
        
        for (const user of users) {
          try {
            await api.users.register(
              user.email,
              'password123',
              user.name,
              user.room,
              user.group || undefined
            );
            
            if (user.role !== 'resident' || (user.positions && user.positions.length > 0)) {
              const registeredUser = (await api.users.getAll()).users.find(u => u.email === user.email);
              if (registeredUser) {
                await api.users.update(registeredUser.id, {
                  role: user.role,
                  positions: user.positions || [],
                });
              }
            }
          } catch (error: any) {
            if (!error.message?.includes('already exists')) {
              console.error('Failed to migrate user:', user.email, error);
              migrationStatus.errors.push(`User ${user.email}: ${error.message}`);
            }
          }
        }
        
        localStorage.removeItem('dormitory_users');
        localStorage.removeItem('last_course_update');
        migrationStatus.users = true;
        console.log('Users migrated successfully');
      } catch (error: any) {
        console.error('Failed to parse users data:', error);
        migrationStatus.errors.push(`Users parsing: ${error.message}`);
      }
    }
  } catch (error: any) {
    migrationStatus.errors.push(`Users migration: ${error.message}`);
  }

  try {
    const workShiftsData = localStorage.getItem('dormitory_work_shifts');
    if (workShiftsData) {
      try {
        const workShifts = JSON.parse(workShiftsData);
        console.log('Migrating work shifts:', workShifts.length);
        
        for (const shift of workShifts) {
          try {
            await api.workShifts.create({
              userId: shift.userId,
              userName: shift.userName,
              days: shift.days,
              assignedBy: shift.assignedBy,
              assignedByName: shift.assignedByName,
              reason: shift.reason,
            });
            
            if (shift.completedDays > 0) {
              const createdShifts = await api.workShifts.getAll(shift.userId);
              const createdShift = createdShifts.workShifts[0];
              if (createdShift) {
                await api.workShifts.complete(
                  createdShift.id,
                  shift.completedDays,
                  shift.completedBy || shift.assignedBy,
                  shift.completedByName || shift.assignedByName
                );
              }
            }
          } catch (error: any) {
            console.error('Failed to migrate work shift:', shift, error);
            migrationStatus.errors.push(`Work shift for ${shift.userName}: ${error.message}`);
          }
        }
        
        localStorage.removeItem('dormitory_work_shifts');
        migrationStatus.workShifts = true;
        console.log('Work shifts migrated successfully');
      } catch (error: any) {
        console.error('Failed to parse work shifts data:', error);
        migrationStatus.errors.push(`Work shifts parsing: ${error.message}`);
      }
    }
  } catch (error: any) {
    migrationStatus.errors.push(`Work shifts migration: ${error.message}`);
  }

  try {
    const archivedData = localStorage.getItem('dormitory_work_shifts_archive');
    if (archivedData) {
      localStorage.removeItem('dormitory_work_shifts_archive');
    }
  } catch (error) {
    console.error('Failed to remove archived work shifts:', error);
  }

  try {
    const notificationsData = localStorage.getItem('dormitory_notifications');
    if (notificationsData) {
      localStorage.removeItem('dormitory_notifications');
    }
  } catch (error) {
    console.error('Failed to remove notifications:', error);
  }

  try {
    const logsData = localStorage.getItem('dormitory_logs');
    if (logsData) {
      localStorage.removeItem('dormitory_logs');
    }
  } catch (error) {
    console.error('Failed to remove logs:', error);
  }

  localStorage.setItem('migration_completed', 'true');
  localStorage.setItem('migration_date', new Date().toISOString());
  
  return migrationStatus;
};

export const isMigrationCompleted = () => {
  return localStorage.getItem('migration_completed') === 'true';
};

export const resetMigration = () => {
  localStorage.removeItem('migration_completed');
  localStorage.removeItem('migration_date');
};
