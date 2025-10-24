# Руководство по миграции данных в PostgreSQL

## Что сделано

### 1. База данных
Созданы следующие таблицы в PostgreSQL:
- **users** - пользователи системы
- **work_shifts** - отработки студентов
- **archived_work_shifts** - архив отработок
- **notifications** - уведомления пользователей
- **action_logs** - логи действий в системе
- **council_tasks** - задачи студенческого совета
- **announcements** - объявления общежития
- **complaints** - жалобы и предложения

Миграция находится в: `db_migrations/V0001__create_initial_tables.sql`

### 2. Backend API
Создана единая API функция: `backend/api/index.py`

**URL функции:** `https://functions.poehali.dev/a9ae7227-6241-401d-b0ae-c0e7a89092dd`

**Доступные ресурсы:**
- `?resource=users` - управление пользователями
- `?resource=workShifts` - управление отработками
- `?resource=notifications` - уведомления
- `?resource=logs` - логи действий

### 3. API клиент
Создан файл `src/lib/api.ts` с готовыми методами для работы с API.

## Следующие шаги

### Шаг 1: Миграция контекстов

Нужно обновить следующие контексты для работы с API вместо localStorage:

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Заменить mock аутентификацию на `api.users.login()`
   - Заменить регистрацию на `api.users.register()`
   - При восстановлении сессии проверять пользователя через API

2. **UsersContext** (`src/contexts/UsersContext.tsx`)
   - `users` - загружать через `api.users.getAll()`
   - `addUser` - создавать через `api.users.register()`
   - `updateUser` - обновлять через `api.users.update()`
   - Удалить все операции с localStorage

3. **WorkShiftsContext** (`src/contexts/WorkShiftsContext.tsx`)
   - `workShifts` - загружать через `api.workShifts.getAll()`
   - `addWorkShift` - создавать через `api.workShifts.create()`
   - `completeWorkShift` - обновлять через `api.workShifts.complete()`
   - `deleteWorkShift` - помечать как архивную через `api.workShifts.archive()`
   - Удалить все операции с localStorage

4. **NotificationsContext** (`src/contexts/NotificationsContext.tsx`)
   - `notifications` - загружать через `api.notifications.getAll(currentUserId)`
   - `addNotification` - создавать через `api.notifications.create()`
   - `markAsRead` - обновлять через `api.notifications.markAsRead()`
   - Удалить все операции с localStorage

5. **LogsContext** (`src/contexts/LogsContext.tsx`)
   - `logs` - загружать через `api.logs.getAll()`
   - `addLog` - создавать через `api.logs.create()`
   - Удалить все операции с localStorage

### Шаг 2: Миграция данных из localStorage

Для каждого контекста добавить функцию миграции, которая:
1. Читает данные из localStorage
2. Отправляет их в API
3. Удаляет из localStorage после успешной миграции

Пример для пользователей:
```typescript
const migrateUsers = async () => {
  const localUsers = localStorage.getItem('users');
  if (localUsers) {
    const users = JSON.parse(localUsers);
    for (const user of users) {
      await api.users.register(
        user.email,
        'defaultPassword123', // Нужно установить дефолтный пароль
        user.name,
        user.room,
        user.group
      );
    }
    localStorage.removeItem('users');
  }
};
```

### Шаг 3: Обновление компонентов

После обновления контекстов компоненты будут автоматически работать с новыми данными из базы данных.

### Шаг 4: Тестирование

1. Проверить авторизацию и регистрацию
2. Проверить создание и отображение отработок
3. Проверить уведомления
4. Проверить логи действий
5. Проверить все операции CRUD для каждой сущности

## Важные замечания

### Пароли пользователей
В новой системе используется хеширование паролей (SHA-256). При миграции старых пользователей нужно:
- Либо установить дефолтный пароль для всех
- Либо попросить пользователей зарегистрироваться заново
- Либо реализовать функцию сброса пароля

### Структура данных
Некоторые поля были переименованы для соответствия SQL конвенциям:
- `group` → `room_group` (в базе)
- В API возвращается как `group` для обратной совместимости

### Индексы
В таблицах созданы индексы для оптимизации запросов:
- По user_id
- По датам создания
- По статусам

### Ограничения
- Максимум 100 уведомлений на пользователя при запросе
- Максимум 100 логов при запросе (можно увеличить параметром `limit`)

## Пример использования API

```typescript
import { api } from '@/lib/api';

// Получить всех пользователей
const { users } = await api.users.getAll();

// Авторизация
const { user } = await api.users.login('user@example.com', 'password123');

// Создать отработку
const { workShift } = await api.workShifts.create({
  userId: 'user-id',
  userName: 'Иван Иванов',
  days: 5,
  assignedBy: 'admin-id',
  assignedByName: 'Админ',
  reason: 'Нарушение правил'
});

// Списать отработку
await api.workShifts.complete(workShiftId, 1, 'admin-id', 'Админ');

// Создать уведомление
await api.notifications.create(
  'user-id',
  'work_shift_assigned',
  'Назначены отработки',
  'Вам назначено 5 дней отработок'
);
```

## Поддержка

При возникновении проблем проверьте:
1. Логи backend функции в консоли разработчика
2. Структуру данных в PostgreSQL через `get_db_info` и `perform_sql_query`
3. Формат запросов к API (должны соответствовать документации)
