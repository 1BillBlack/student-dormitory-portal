# Инструкция по деплою на Vercel

Этот проект настроен для развертывания на платформе Vercel с использованием внешней PostgreSQL базы данных.

## Требования

1. Аккаунт на [Vercel](https://vercel.com)
2. Внешняя PostgreSQL база данных (рекомендуемые варианты):
   - [Supabase](https://supabase.com) - бесплатный тариф, 500MB
   - [Neon](https://neon.tech) - бесплатный тариф, serverless PostgreSQL
   - [Railway](https://railway.app) - $5/месяц, PostgreSQL
   - [ElephantSQL](https://www.elephantsql.com) - бесплатный тариф до 20MB

## Шаг 1: Создание базы данных

### Вариант A: Supabase (рекомендуется)

1. Перейдите на [supabase.com](https://supabase.com) и создайте аккаунт
2. Создайте новый проект
3. Дождитесь создания базы данных (2-3 минуты)
4. Перейдите в Settings → Database → Connection String
5. Скопируйте **Connection string** в формате:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. В разделе SQL Editor выполните SQL-скрипт создания таблиц (см. ниже)

### Вариант B: Neon

1. Перейдите на [neon.tech](https://neon.tech) и создайте аккаунт
2. Создайте новый проект
3. Скопируйте **Connection string** из дашборда
4. В SQL Editor выполните SQL-скрипт создания таблиц

### SQL для создания таблиц

Выполните в SQL-редакторе вашей базы данных:

```sql
-- Таблица пользователей
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    room VARCHAR(50),
    room_group VARCHAR(50),
    positions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица объявлений
CREATE TABLE announcements (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица задач
CREATE TABLE tasks (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    assigned_to VARCHAR(255),
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица дежурств
CREATE TABLE duty_schedule (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    zone VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индексы
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_duty_schedule_date ON duty_schedule(date);
CREATE INDEX idx_duty_schedule_user_id ON duty_schedule(user_id);
```

## Шаг 2: Подготовка проекта

1. Убедитесь, что в проекте есть файлы:
   - `vercel.json` - конфигурация Vercel
   - `api/index.py` - бэкенд API
   - `api/requirements.txt` - Python зависимости
   - `.env.example` - пример переменных окружения

2. Отправьте код в GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

## Шаг 3: Деплой на Vercel

### Через веб-интерфейс:

1. Перейдите на [vercel.com](https://vercel.com) и войдите
2. Нажмите **Add New** → **Project**
3. Выберите ваш GitHub репозиторий
4. В разделе **Environment Variables** добавьте:
   - Ключ: `DATABASE_URL`
   - Значение: ваша connection string из Supabase/Neon
   - Нажмите **Add**

5. Нажмите **Deploy**
6. Дождитесь завершения (2-3 минуты)

### Через CLI (альтернатива):

```bash
# Установите Vercel CLI
npm install -g vercel

# Войдите в аккаунт
vercel login

# Деплой проекта
vercel

# При первом деплое ответьте на вопросы:
# Set up and deploy? Y
# Which scope? [ваш аккаунт]
# Link to existing project? N
# What's your project's name? [название]
# In which directory is your code located? ./

# Добавьте переменную окружения
vercel env add DATABASE_URL
# Вставьте вашу connection string
# Выберите: Production, Preview, Development

# Повторный деплой
vercel --prod
```

## Шаг 4: Обновление фронтенда

После деплоя получите URL вашего API (например, `https://your-project.vercel.app/api`)

Обновите файл конфигурации фронтенда для использования нового API:

```typescript
// src/config/api.ts или аналогичный файл
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-project.vercel.app/api'
  : 'http://localhost:3000/api';

export default API_BASE_URL;
```

Затем снова задеплойте:
```bash
vercel --prod
```

## Шаг 5: Проверка работы

1. Откройте URL вашего проекта (будет показан после деплоя)
2. Проверьте вход/регистрацию
3. Проверьте работу всех функций с базой данных

## Возможные проблемы и решения

### Ошибка подключения к БД

**Проблема:** `Error: Could not connect to database`

**Решение:**
- Проверьте правильность `DATABASE_URL` в Environment Variables Vercel
- Убедитесь, что IP Vercel не заблокирован в настройках БД
- В Supabase: Settings → Database → Connection Pooling → включите Pooler

### Ошибка 500 Internal Server Error

**Проблема:** API не отвечает

**Решение:**
- Проверьте логи: зайдите в проект на Vercel → Deployments → [последний деплой] → Functions
- Посмотрите логи функции `/api/index.py`
- Проверьте, что все таблицы созданы в БД

### CORS ошибки

**Проблема:** `Access-Control-Allow-Origin` ошибки

**Решение:**
- Уже настроено в `api/index.py` (заголовок `Access-Control-Allow-Origin: *`)
- Если проблема сохраняется, добавьте в `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE,OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, X-User-Id" }
      ]
    }
  ]
}
```

## Мониторинг и обслуживание

### Просмотр логов

```bash
vercel logs your-project.vercel.app
```

Или через веб-интерфейс: Projects → [ваш проект] → Logs

### Обновление проекта

После изменений в коде:

```bash
git add .
git commit -m "Update features"
git push origin main
```

Vercel автоматически задеплоит новую версию.

### Масштабирование

Бесплатный план Vercel включает:
- 100 GB трафика
- Serverless Functions (автоматическое масштабирование)
- Автоматические SSL сертификаты
- CDN по всему миру

При росте нагрузки можно перейти на платный план ($20/месяц).

## Альтернативы Vercel

Если Vercel не подходит, рассмотрите:

1. **Netlify** - похожий на Vercel, но с другими лимитами
2. **Render** - бесплатный хостинг с PostgreSQL включенной
3. **Railway** - простой деплой, встроенная БД ($5/мес)
4. **VPS** (DigitalOcean/Timeweb) - полный контроль, требует настройки

## Поддержка

- [Документация Vercel](https://vercel.com/docs)
- [Документация Supabase](https://supabase.com/docs)
- [Сообщество Vercel](https://github.com/vercel/vercel/discussions)
