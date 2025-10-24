import { api } from '@/lib/api';

const DEFAULT_USERS = [
  { 
    email: 'manager@dorm.ru', 
    password: 'manager123', 
    name: 'Алексей Менеджеров', 
    role: 'manager', 
    room: '101',
    positions: [] 
  },
  { 
    email: 'admin@dorm.ru', 
    password: 'admin123', 
    name: 'Мария Администраторова', 
    role: 'admin', 
    room: '205',
    positions: [] 
  },
  { 
    email: 'moderator@dorm.ru', 
    password: 'moderator123', 
    name: 'Иван Модераторов', 
    role: 'moderator', 
    room: '310',
    positions: ['chairman', 'cultural_sector'] 
  },
  { 
    email: 'vice@dorm.ru', 
    password: 'vice123', 
    name: 'Елена Заместителева', 
    role: 'member', 
    room: '415',
    positions: ['vice_chairman', 'sports_sector'] 
  },
  { 
    email: 'member@dorm.ru', 
    password: 'member123', 
    name: 'Петр Участников', 
    role: 'member', 
    room: '520',
    positions: [] 
  },
];

export const initializeDefaultUsers = async () => {
  const results = {
    created: [] as string[],
    existing: [] as string[],
    errors: [] as string[],
  };

  for (const user of DEFAULT_USERS) {
    try {
      const { user: createdUser } = await api.users.register(
        user.email,
        user.password,
        user.name,
        user.room
      );

      if (user.role !== 'resident' || user.positions.length > 0) {
        await api.users.update(createdUser.id, {
          role: user.role,
          positions: user.positions,
        });
      }

      results.created.push(user.email);
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        results.existing.push(user.email);
      } else {
        results.errors.push(`${user.email}: ${error.message}`);
      }
    }
  }

  return results;
};

export const isFirstRun = () => {
  return !localStorage.getItem('database_initialized');
};

export const markDatabaseInitialized = () => {
  localStorage.setItem('database_initialized', 'true');
  localStorage.setItem('database_init_date', new Date().toISOString());
};
