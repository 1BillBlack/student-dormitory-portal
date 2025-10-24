# Деплой портала общежития на Reg.ru

Пошаговая инструкция по размещению проекта на хостинге Reg.ru с базой данных PostgreSQL.

---

## Что вам понадобится

- ✅ Аккаунт на [reg.ru](https://www.reg.ru/)
- ✅ Хостинг с поддержкой Python (тариф "Hosting Linux" или VPS)
- ✅ База данных PostgreSQL (можно создать в панели Reg.ru или использовать внешнюю)
- ✅ Исходный код проекта (скачайте через GitHub или билд)

---

## Шаг 1: Выбор тарифа и настройка хостинга

### 1.1 Выберите подходящий тариф

**Вариант А: Hosting Linux** (от 200₽/мес)
- ✅ Проще в настройке
- ✅ Готовая панель управления
- ⚠️ Ограниченные ресурсы
- Подходит для: небольшого общежития (до 100 пользователей)

**Вариант Б: VPS** (от 350₽/мес)
- ✅ Полный контроль
- ✅ Больше ресурсов
- ⚠️ Требует навыков администрирования
- Подходит для: среднего/большого общежития (100+ пользователей)

### 1.2 Закажите хостинг

1. Зайдите на [reg.ru](https://www.reg.ru/)
2. Выберите **"Хостинг"** → **"Hosting Linux"** (или VPS)
3. Выберите тариф с поддержкой Python
4. Оформите заказ и оплатите

---

## Шаг 2: Создание базы данных PostgreSQL

### Вариант А: База данных на Reg.ru (проще)

1. Войдите в **Личный кабинет Reg.ru**
2. Перейдите в раздел **"Базы данных"**
3. Нажмите **"Создать базу данных"**
4. Выберите тип: **PostgreSQL**
5. Заполните данные:
   - **Имя БД**: `dormitory_portal`
   - **Пользователь**: создайте нового пользователя
   - **Пароль**: придумайте надёжный пароль (сохраните!)
6. Нажмите **"Создать"**
7. Скопируйте **строку подключения**:
   ```
   postgresql://username:password@hostname:5432/dormitory_portal
   ```

### Вариант Б: Внешняя база данных Supabase (бесплатно)

Если на Reg.ru нет PostgreSQL или она платная, используйте Supabase:

1. Зайдите на [supabase.com](https://supabase.com)
2. Создайте аккаунт (через GitHub, Google или email)
3. Создайте новый проект:
   - **Name**: `dormitory-portal`
   - **Database Password**: придумайте пароль
   - **Region**: Europe West (London) для России
   - **Plan**: Free (500MB бесплатно)
4. Подождите 2-3 минуты
5. Перейдите в **Settings** → **Database**
6. Скопируйте **Connection String (URI)**:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
   ```
7. Замените `[YOUR-PASSWORD]` на ваш реальный пароль

### 2.3 Создайте таблицы в базе данных

1. Если используете **Supabase**: перейдите в **SQL Editor** → **New query**
2. Если используете **Reg.ru**: подключитесь через phpPgAdmin или psql
3. Выполните этот SQL-скрипт:

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

-- Создаём индексы для быстрого поиска
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_duty_schedule_date ON duty_schedule(date);
CREATE INDEX idx_duty_schedule_user_id ON duty_schedule(user_id);
```

4. Нажмите **"Run"** (или выполните скрипт)
5. Проверьте успешность: должно появиться "Success"

---

## Шаг 3: Загрузка файлов на хостинг

### 3.1 Скачайте проект

**Если проект на GitHub:**
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm run build
```

**Если используете poehali.dev:**
1. Нажмите **"Скачать → Скачать билд"** (для готового сайта)
2. Распакуйте архив

### 3.2 Подготовьте файлы для загрузки

После билда у вас должна быть такая структура:

```
project/
├── dist/              # Статические файлы фронтенда
│   ├── index.html
│   ├── assets/
│   └── ...
├── app.py             # Backend Flask API
├── requirements.txt   # Python зависимости
├── .htaccess         # Конфигурация Apache
└── .env              # Переменные окружения (создайте!)
```

### 3.3 Создайте файл .env

Скопируйте `.env.example` в `.env` и заполните:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:5432/dormitory_portal

# Flask Configuration
FLASK_ENV=production
SECRET_KEY=ваш_случайный_секретный_ключ_min_32_символа
```

**⚠️ ВАЖНО**: Замените `DATABASE_URL` на строку подключения из Шага 2!

Для генерации `SECRET_KEY` используйте:
```python
import secrets
print(secrets.token_hex(32))
```

### 3.4 Загрузите файлы на хостинг

**Способ 1: Через FTP/SFTP (FileZilla, WinSCP)**

1. Скачайте [FileZilla](https://filezilla-project.org/)
2. Подключитесь к хостингу:
   - **Хост**: ftp.ваш-домен.ru (смотрите в письме от Reg.ru)
   - **Пользователь**: ваш логин
   - **Пароль**: ваш пароль FTP
   - **Порт**: 21 (FTP) или 22 (SFTP)
3. Загрузите все файлы в папку `public_html/` или `www/`

**Способ 2: Через панель управления Reg.ru**

1. Войдите в **Личный кабинет Reg.ru**
2. Перейдите в **"Файловый менеджер"**
3. Перейдите в `public_html/`
4. Нажмите **"Загрузить"** и выберите файлы

**Структура на хостинге:**
```
public_html/
├── index.html         # Из dist/
├── assets/            # Из dist/
├── app.py
├── requirements.txt
├── .htaccess
└── .env
```

---

## Шаг 4: Настройка Python окружения

### 4.1 Подключитесь по SSH

1. Включите **SSH доступ** в панели Reg.ru
2. Подключитесь через терминал:
   ```bash
   ssh username@ваш-домен.ru
   ```
3. Перейдите в папку сайта:
   ```bash
   cd public_html
   ```

### 4.2 Установите зависимости Python

```bash
# Создайте виртуальное окружение
python3 -m venv venv

# Активируйте его
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

### 4.3 Настройте запуск Flask через CGI/FastCGI

**Вариант А: Через Passenger (если доступен на Reg.ru)**

Создайте файл `passenger_wsgi.py`:

```python
import sys
import os

INTERP = os.path.join(os.getcwd(), 'venv', 'bin', 'python3')
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

sys.path.insert(0, os.getcwd())

from app import app as application
```

**Вариант Б: Через gunicorn (для VPS)**

Запустите gunicorn как сервис:

```bash
gunicorn --bind 0.0.0.0:8000 app:app
```

Настройте nginx или Apache проксировать запросы на порт 8000.

---

## Шаг 5: Проверка работы

### 5.1 Проверьте API

Откройте в браузере:
```
https://ваш-домен.ru/api/health
```

Должен вернуться:
```json
{"status": "ok", "message": "API is running"}
```

### 5.2 Проверьте фронтенд

Откройте:
```
https://ваш-домен.ru
```

Должна открыться страница портала общежития.

### 5.3 Проверьте регистрацию/вход

1. Откройте сайт
2. Попробуйте зарегистрироваться
3. Попробуйте войти

Если всё работает — **поздравляю, деплой завершён!** 🎉

---

## Решение проблем

### ❌ Ошибка "500 Internal Server Error"

**Причины:**
- Не установлены Python зависимости
- Неверный DATABASE_URL в .env
- Ошибки в app.py

**Решение:**
1. Проверьте логи хостинга
2. Убедитесь что виртуальное окружение активировано
3. Проверьте `.env` файл

### ❌ API возвращает ошибки базы данных

**Причины:**
- Неверная строка подключения
- Таблицы не созданы
- Нет доступа к базе данных

**Решение:**
1. Проверьте `DATABASE_URL` в `.env`
2. Убедитесь что таблицы созданы (Шаг 2.3)
3. Проверьте доступ к БД через psql

### ❌ CORS ошибки в браузере

**Причины:**
- Flask-CORS не установлен
- Неправильная конфигурация

**Решение:**
1. Убедитесь что `Flask-CORS` в requirements.txt
2. Проверьте что `CORS(app)` добавлено в app.py

### ❌ Страница не найдена (404) для SPA роутинга

**Причины:**
- .htaccess неправильно настроен

**Решение:**
1. Проверьте что `.htaccess` загружен на хостинг
2. Убедитесь что `mod_rewrite` включен на хостинге

---

## Поддержка и обновления

### Как обновить код:

1. Загрузите новые файлы через FTP
2. Если изменились зависимости:
   ```bash
   ssh username@ваш-домен.ru
   cd public_html
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Перезапустите приложение (зависит от способа запуска)

### Как сделать бэкап базы данных:

**Для Supabase:**
1. Перейдите в **Settings** → **Database**
2. Нажмите **"Download Backup"**

**Для Reg.ru PostgreSQL:**
```bash
pg_dump -h hostname -U username -d dormitory_portal > backup.sql
```

---

## Альтернативы Reg.ru

Если возникнут сложности с Reg.ru, рассмотрите альтернативы:

- **Timeweb** (от 200₽/мес) - поддержка Python из коробки
- **Beget** (от 180₽/мес) - простая панель управления
- **DigitalOcean** ($6/мес) - VPS с полным контролом
- **Railway** ($5/мес) - автоматический деплой из GitHub
- **Render** (бесплатно) - простой деплой, встроенная PostgreSQL

---

## Заключение

Теперь ваш портал общежития работает на Reg.ru! 🚀

Если возникли вопросы — пишите в поддержку или обращайтесь к разработчику.

**Полезные ссылки:**
- [Документация Reg.ru по Python](https://www.reg.ru/support/hosting-i-servery/hosting-saytov/yazyki-programmirovaniya/kak-ispolzovat-python-na-hostinge)
- [Документация Flask](https://flask.palletsprojects.com/)
- [Документация Supabase](https://supabase.com/docs)
