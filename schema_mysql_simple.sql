-- Упрощённая схема для старых версий MySQL
-- Выполняйте команды по одной!

-- Таблица 1: Пользователи
CREATE TABLE users (
    id VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    room VARCHAR(50),
    room_group VARCHAR(50),
    positions TEXT,
    created_at DATETIME,
    updated_at DATETIME,
    PRIMARY KEY (id)
);

-- Индекс для email
CREATE UNIQUE INDEX unique_email ON users(email);

-- Таблица 2: Объявления
CREATE TABLE announcements (
    id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_id VARCHAR(255) NOT NULL,
    created_at DATETIME,
    PRIMARY KEY (id)
);

-- Индекс для даты объявлений
CREATE INDEX idx_announcements_created_at ON announcements(created_at);

-- Таблица 3: Задачи
CREATE TABLE tasks (
    id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    assigned_to VARCHAR(255),
    due_date DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    PRIMARY KEY (id)
);

-- Индексы для задач
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- Таблица 4: Дежурства
CREATE TABLE duty_schedule (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    zone VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at DATETIME,
    PRIMARY KEY (id)
);

-- Индексы для дежурств
CREATE INDEX idx_duty_schedule_date ON duty_schedule(date);
CREATE INDEX idx_duty_schedule_user_id ON duty_schedule(user_id);
